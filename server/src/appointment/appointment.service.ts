import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentHistoryService } from './appointment-history.service';
import { ImprevuService } from '../imprevu/imprevu.service';
import { PTOService } from '../pto/pto.service';
import { EmailService } from '../email/email.service';
import { EmailTemplateService } from '../email/email-template.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  GetAppointmentsDto,
} from './dto';
import {
  Appointment,
  AppointmentStatus,
  Prisma,
  DayOfWeek,
} from '@prisma/client';

// Patient select fields to include in appointment responses
const PATIENT_SELECT_FIELDS = {
  id: true,
  name: true,
  dateOfBirth: true,
  profileImage: true,
  email: true,
  phoneNumber: true,
  address: true,
  gender: true,
};

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private appointmentHistory: AppointmentHistoryService,
    private imprevuService: ImprevuService,
    private ptoService: PTOService,
    private emailService: EmailService,
    private emailTemplateService: EmailTemplateService,
  ) {}

  async create(
    doctorId: string,
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const {
      patientId,
      patientIds,
      consultationTypeId,
      startTime,
      endTime,
      skipConflictCheck,
      ...appointmentData
    } = createAppointmentDto;

    // Determine which patients to use
    const patientsToAdd =
      patientIds && patientIds.length > 0
        ? patientIds
        : patientId
          ? [patientId]
          : [];

    // Verify all patients belong to doctor
    if (patientsToAdd.length > 0) {
      for (const pid of patientsToAdd) {
        await this.verifyPatientBelongsToDoctor(pid, doctorId);
      }
    }

    // Verify consultation type belongs to doctor (if provided)
    if (consultationTypeId) {
      await this.verifyConsultationTypeBelongsToDoctor(
        consultationTypeId,
        doctorId,
      );

      // Verify consultation type is enabled for all patients
      for (const pid of patientsToAdd) {
        const isEnabled = await this.isConsultationTypeEnabledForPatient(
          pid,
          consultationTypeId,
        );
        if (!isEnabled) {
          const patient = await this.prisma.patient.findUnique({
            where: { id: pid },
            select: { name: true },
          });
          throw new BadRequestException(
            `Consultation type is not enabled for patient ${patient?.name || pid}`,
          );
        }
      }
    }

    // Check for time conflicts (unless skipConflictCheck is true)
    if (!skipConflictCheck) {
      await this.checkTimeConflicts(
        doctorId,
        new Date(startTime),
        new Date(endTime),
      );

      // Check if time slot is blocked by an imprevu
      const isBlocked = await this.imprevuService.checkTimeSlotBlocked(
        doctorId,
        new Date(startTime),
        new Date(endTime),
      );
      if (isBlocked) {
        throw new BadRequestException(
          'Time slot is blocked due to an unforeseen event (imprevu)',
        );
      }
    }

    // Validate appointment times
    this.validateAppointmentTimes(new Date(startTime), new Date(endTime));

    // Create appointment with patients
    const appointment = await this.prisma.appointment.create({
      data: {
        ...appointmentData,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        doctorId,
        patientId: patientsToAdd.length > 0 ? patientsToAdd[0] : null, // First patient as primary for backward compatibility
        consultationTypeId,
        appointmentPatients:
          patientsToAdd.length > 0
            ? {
                create: patientsToAdd.map((pid, index) => ({
                  patientId: pid,
                  isPrimary: index === 0, // First patient is primary
                })),
              }
            : undefined,
      },
      include: {
        patient: {
          select: PATIENT_SELECT_FIELDS,
        },
        appointmentPatients: {
          include: {
            patient: {
              select: PATIENT_SELECT_FIELDS,
            },
          },
        },
        consultationType: true,
        documents: true,
      },
    });

    // Log creation in history
    await this.appointmentHistory.logCreation(
      appointment.id,
      doctorId,
      createAppointmentDto,
    );

    return appointment;
  }

  async findAll(
    doctorId: string,
    query: GetAppointmentsDto,
  ): Promise<{
    appointments: Appointment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      date,
      startDate,
      endDate,
      status,
      patientId,
      consultationTypeId,
      page = 1,
      limit = 50,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      doctorId,
    };

    // Handle the date parameter (single day)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    // Only apply startDate/endDate if date is not provided
    else if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.startTime = {
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (consultationTypeId) {
      where.consultationTypeId = consultationTypeId;
    }

    const [appointments, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          startTime: 'asc',
        },
        include: {
          patient: {
            select: PATIENT_SELECT_FIELDS,
          },
          appointmentPatients: {
            include: {
              patient: {
                select: PATIENT_SELECT_FIELDS,
              },
            },
          },
          consultationType: true,
          documents: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, doctorId: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: PATIENT_SELECT_FIELDS,
        },
        appointmentPatients: {
          include: {
            patient: {
              select: PATIENT_SELECT_FIELDS,
            },
          },
        },
        consultationType: true,
        doctor: {
          select: {
            id: true,
            specialization: true,
            clinic: true,
          },
        },
        documents: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException('Access denied');
    }

    return appointment;
  }

  async update(
    id: string,
    doctorId: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id, doctorId);

    const {
      patientId,
      patientIds,
      consultationTypeId,
      startTime,
      endTime,
      skipConflictCheck,
      ...appointmentData
    } = updateAppointmentDto;

    // Track changes for history
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    // Determine which patients to use
    const patientsToUpdate =
      patientIds && patientIds.length > 0
        ? patientIds
        : patientId
          ? [patientId]
          : null;

    // Verify all patients belong to doctor (if changing patients)
    if (patientsToUpdate && patientsToUpdate.length > 0) {
      for (const pid of patientsToUpdate) {
        await this.verifyPatientBelongsToDoctor(pid, doctorId);
      }
    }

    // Track consultation type changes
    if (
      consultationTypeId &&
      consultationTypeId !== appointment.consultationTypeId
    ) {
      await this.verifyConsultationTypeBelongsToDoctor(
        consultationTypeId,
        doctorId,
      );

      // Get old and new consultation type names
      const oldType = appointment.consultationTypeId
        ? await this.prisma.doctorConsultationType.findUnique({
            where: { id: appointment.consultationTypeId },
          })
        : null;
      const newType = await this.prisma.doctorConsultationType.findUnique({
        where: { id: consultationTypeId },
      });

      // Log consultation type change separately
      await this.appointmentHistory.logConsultationTypeChange(
        id,
        doctorId,
        oldType?.name || null,
        newType?.name || null,
      );

      // Get patients for this appointment
      const checkPatients =
        patientsToUpdate ||
        (await this.prisma.appointmentPatient
          .findMany({
            where: { appointmentId: id },
            select: { patientId: true },
          })
          .then((aps) => aps.map((ap) => ap.patientId)));

      // Verify consultation type is enabled for all patients
      if (checkPatients && checkPatients.length > 0) {
        for (const pid of checkPatients) {
          const isEnabled = await this.isConsultationTypeEnabledForPatient(
            pid,
            consultationTypeId,
          );
          if (!isEnabled) {
            const patient = await this.prisma.patient.findUnique({
              where: { id: pid },
              select: { name: true },
            });
            throw new BadRequestException(
              `Consultation type is not enabled for patient ${patient?.name || pid}`,
            );
          }
        }
      }
    }

    // Check for time conflicts (if changing time and not skipping conflict check)
    if (startTime || endTime) {
      const newStartTime = startTime
        ? new Date(startTime)
        : appointment.startTime;
      const newEndTime = endTime ? new Date(endTime) : appointment.endTime;

      this.validateAppointmentTimes(newStartTime, newEndTime);

      if (!skipConflictCheck) {
        await this.checkTimeConflicts(doctorId, newStartTime, newEndTime, id);

        // Check if time slot is blocked by an imprevu
        const isBlocked = await this.imprevuService.checkTimeSlotBlocked(
          doctorId,
          newStartTime,
          newEndTime,
        );
        if (isBlocked) {
          throw new BadRequestException(
            'Time slot is blocked due to an unforeseen event (imprevu)',
          );
        }
      }

      // Check if time actually changed
      const oldStart = appointment.startTime.getTime();
      const oldEnd = appointment.endTime.getTime();
      const newStart = newStartTime.getTime();
      const newEnd = newEndTime.getTime();

      if (oldStart !== newStart || oldEnd !== newEnd) {
        // Log reschedule separately
        await this.appointmentHistory.logReschedule(
          id,
          doctorId,
          appointment.startTime,
          appointment.endTime,
          newStartTime,
          newEndTime,
        );
      }
    }

    // Track other field changes
    if (
      appointmentData.title !== undefined &&
      appointmentData.title !== appointment.title
    ) {
      changes.push({
        field: 'title',
        oldValue: appointment.title,
        newValue: appointmentData.title,
      });
    }

    if (
      appointmentData.description !== undefined &&
      appointmentData.description !== appointment.description
    ) {
      changes.push({
        field: 'description',
        oldValue: appointment.description,
        newValue: appointmentData.description,
      });
    }

    if (
      appointmentData.notes !== undefined &&
      appointmentData.notes !== appointment.notes
    ) {
      changes.push({
        field: 'notes',
        oldValue: appointment.notes,
        newValue: appointmentData.notes,
      });
    }

    // Update appointment and patients
    const updateData: any = {
      ...appointmentData,
      ...(startTime && { startTime: new Date(startTime) }),
      ...(endTime && { endTime: new Date(endTime) }),
      ...(consultationTypeId && { consultationTypeId }),
    };

    // If patients are being updated
    if (patientsToUpdate) {
      updateData.patientId = patientsToUpdate[0]; // First patient as primary

      // Delete existing patient associations and create new ones
      await this.prisma.appointmentPatient.deleteMany({
        where: { appointmentId: id },
      });
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: PATIENT_SELECT_FIELDS,
        },
        appointmentPatients: {
          include: {
            patient: {
              select: PATIENT_SELECT_FIELDS,
            },
          },
        },
        consultationType: true,
        documents: true,
      },
    });

    // Create new patient associations if provided
    if (patientsToUpdate && patientsToUpdate.length > 0) {
      await this.prisma.appointmentPatient.createMany({
        data: patientsToUpdate.map((pid, index) => ({
          appointmentId: id,
          patientId: pid,
          isPrimary: index === 0,
        })),
      });
    }

    // Log general field changes if any
    if (changes.length > 0) {
      await this.appointmentHistory.logUpdate(id, doctorId, changes);
    }

    // Fetch updated appointment with new associations if patients were updated
    if (patientsToUpdate && patientsToUpdate.length > 0) {
      return this.findOne(id, doctorId);
    }

    return updatedAppointment;
  }

  async updateStatus(
    id: string,
    doctorId: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id, doctorId);
    const oldStatus = appointment.status;

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: {
          select: PATIENT_SELECT_FIELDS,
        },
        appointmentPatients: {
          include: {
            patient: {
              select: PATIENT_SELECT_FIELDS,
            },
          },
        },
        consultationType: true,
        documents: true,
      },
    });

    // Log status change in history
    if (oldStatus !== status) {
      await this.appointmentHistory.logStatusChange(
        id,
        doctorId,
        oldStatus,
        status,
      );
    }

    return updatedAppointment;
  }

  async remove(id: string, doctorId: string): Promise<void> {
    await this.findOne(id, doctorId); // Verify ownership

    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  async getUpcomingAppointments(
    doctorId: string,
    limit: number = 5,
  ): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: {
          gte: new Date(),
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
      },
      take: limit,
      orderBy: {
        startTime: 'asc',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        appointmentPatients: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        consultationType: true,
        documents: true,
      },
    });
  }

  async getAppointmentsByDate(
    doctorId: string,
    date: Date,
  ): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        appointmentPatients: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        consultationType: true,
        documents: true,
      },
    });
  }

  private async verifyPatientBelongsToDoctor(
    patientId: string,
    doctorId: string,
  ): Promise<void> {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId,
        isDeleted: false,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        'Patient not found or does not belong to this doctor',
      );
    }
  }

  private async verifyConsultationTypeBelongsToDoctor(
    consultationTypeId: string,
    doctorId: string,
  ): Promise<void> {
    const consultationType = await this.prisma.doctorConsultationType.findFirst(
      {
        where: {
          id: consultationTypeId,
          doctorId,
          enabled: true,
        },
      },
    );

    if (!consultationType) {
      throw new NotFoundException(
        'Consultation type not found or not available',
      );
    }
  }

  private async checkTimeConflicts(
    doctorId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<void> {
    // Check for PTO conflicts
    const isPTOBlocked = await this.ptoService.isDateBlockedByPTO(
      doctorId,
      startTime,
    );
    if (isPTOBlocked) {
      throw new BadRequestException(
        'Cannot schedule appointment during PTO period',
      );
    }

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        status: {
          not: AppointmentStatus.CANCELLED,
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException(
        'Time slot conflicts with existing appointment',
      );
    }
  }

  private validateAppointmentTimes(startTime: Date, endTime: Date): void {
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Allow scheduling appointments in the past (for historical records)

    // Maximum appointment duration: 4 hours
    const maxDurationMs = 4 * 60 * 60 * 1000;
    if (endTime.getTime() - startTime.getTime() > maxDurationMs) {
      throw new BadRequestException(
        'Appointment duration cannot exceed 4 hours',
      );
    }
  }

  async getAvailableSlots(
    doctorId: string,
    date: Date,
    consultationTypeId?: string,
  ): Promise<{
    date: string;
    consultationTypeId?: string;
    slots: { time: string; available: boolean }[];
  }> {
    // Get the day of the week for the given date
    const dayOfWeek = this.getDayOfWeek(date);

    // Get doctor's timeplan for the day
    const timeplan = await this.prisma.doctorTimeplan.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true,
      },
      include: {
        timeSlots: {
          where: {
            isActive: true,
            ...(consultationTypeId && {
              consultationTypes: {
                some: {
                  consultationTypeId,
                },
              },
            }),
          },
          include: {
            consultationTypes: {
              include: {
                consultationType: true,
              },
            },
          },
        },
      },
    });

    if (!timeplan || timeplan.timeSlots.length === 0) {
      return {
        date: date.toISOString().split('T')[0],
        consultationTypeId,
        slots: [],
      };
    }

    // Get consultation type details if specified
    let consultationType: any = null;
    if (consultationTypeId) {
      consultationType = await this.prisma.doctorConsultationType.findFirst({
        where: {
          id: consultationTypeId,
          doctorId,
          enabled: true,
        },
      });

      if (!consultationType) {
        throw new NotFoundException('Consultation type not found');
      }
    }

    // Get existing appointments for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing appointments, blocking imprevus, and PTOs for the date
    const [existingAppointments, blockingImprevus, blockingPTOs] =
      await Promise.all([
        this.prisma.appointment.findMany({
          where: {
            doctorId,
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: {
              not: 'CANCELLED',
            },
          },
        }),
        this.prisma.imprevu.findMany({
          where: {
            doctorId,
            blockTimeSlots: true,
            OR: [
              {
                AND: [
                  { startDate: { lte: startOfDay } },
                  { endDate: { gt: startOfDay } },
                ],
              },
              {
                AND: [
                  { startDate: { lt: endOfDay } },
                  { endDate: { gte: endOfDay } },
                ],
              },
              {
                AND: [
                  { startDate: { gte: startOfDay } },
                  { endDate: { lte: endOfDay } },
                ],
              },
            ],
          },
        }),
        this.prisma.doctorPTO.findMany({
          where: {
            doctorId,
            OR: [
              {
                AND: [
                  { startDate: { lte: startOfDay } },
                  { endDate: { gte: startOfDay } },
                ],
              },
              {
                AND: [
                  { startDate: { lte: endOfDay } },
                  { endDate: { gte: endOfDay } },
                ],
              },
              {
                AND: [
                  { startDate: { gte: startOfDay } },
                  { endDate: { lte: endOfDay } },
                ],
              },
            ],
          },
        }),
      ]);

    // Generate all possible 15-minute slots for each time slot
    const allSlots: { time: string; available: boolean }[] = [];

    console.log(new Date());
    for (const timeSlot of timeplan.timeSlots) {
      const slots = this.generateQuarterHourSlots(
        timeSlot.startTime,
        timeSlot.endTime,
        date,
        existingAppointments,
        blockingImprevus,
        blockingPTOs,
        consultationType,
      );
      allSlots.push(...slots);
    }

    // Sort slots by time and remove duplicates
    const uniqueSlots = allSlots
      .filter(
        (slot, index, self) =>
          index === self.findIndex((s) => s.time === slot.time),
      )
      .sort((a, b) => a.time.localeCompare(b.time));

    return {
      date: date.toISOString().split('T')[0],
      consultationTypeId,
      slots: uniqueSlots,
    };
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
  }

  private generateQuarterHourSlots(
    startTime: string,
    endTime: string,
    date: Date,
    existingAppointments: any[],
    blockingImprevus: any[],
    blockingPTOs: any[],
    consultationType?: any,
  ): { time: string; available: boolean }[] {
    const slots: { time: string; available: boolean }[] = [];

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Create start and end Date objects
    const start = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(date);
    end.setHours(endHour, endMinute, 0, 0);

    // Generate slots based on consultation type duration
    // Slots are spaced by the consultation duration to ensure back-to-back appointments
    const current = new Date(start);
    const consultationDuration = consultationType
      ? consultationType.duration
      : 15; // Default 15 minutes
    const restAfter = consultationType ? consultationType.restAfter : 0;
    const totalSlotDuration = consultationDuration + restAfter;

    while (current < end) {
      const slotEndTime = new Date(
        current.getTime() + totalSlotDuration * 60000,
      );

      // Check if this slot would fit within the time slot
      if (slotEndTime <= end) {
        const timeString = current.toTimeString().slice(0, 5); // "HH:mm" format

        // Check if this time conflicts with existing appointments
        const hasConflict = existingAppointments.some((appointment) => {
          const appointmentStart = new Date(appointment.startTime);
          const appointmentEnd = new Date(appointment.endTime);

          return (
            (current >= appointmentStart && current < appointmentEnd) ||
            (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
            (current <= appointmentStart && slotEndTime >= appointmentEnd)
          );
        });

        // Check if this time is blocked by an imprevu
        const isBlockedByImprevu = blockingImprevus.some((imprevu) => {
          const imprevuStart = new Date(imprevu.startDate);
          const imprevuEnd = new Date(imprevu.endDate);

          return (
            (current >= imprevuStart && current < imprevuEnd) ||
            (slotEndTime > imprevuStart && slotEndTime <= imprevuEnd) ||
            (current <= imprevuStart && slotEndTime >= imprevuEnd)
          );
        });

        // Check if the slot is in the past
        const now = new Date();
        const isPast = current <= now;

        // Check if this time is blocked by PTO
        const isBlockedByPTO = blockingPTOs.some((pto) => {
          const ptoStart = new Date(pto.startDate);
          ptoStart.setHours(0, 0, 0, 0);
          const ptoEnd = new Date(pto.endDate);
          ptoEnd.setHours(23, 59, 59, 999);

          return current >= ptoStart && current <= ptoEnd;
        });

        slots.push({
          time: timeString,
          available:
            !hasConflict && !isPast && !isBlockedByImprevu && !isBlockedByPTO,
        });
      }

      // Move to next slot based on consultation duration (not 5-minute interval)
      // This ensures appointments are back-to-back with no wasted time
      current.setMinutes(current.getMinutes() + consultationDuration);
    }

    return slots;
  }

  private async isConsultationTypeEnabledForPatient(
    patientId: string,
    consultationTypeId: string,
  ): Promise<boolean> {
    const access = await this.prisma.patientConsultationTypeAccess.findUnique({
      where: {
        patientId_consultationTypeId: {
          patientId,
          consultationTypeId,
        },
      },
    });

    // If no record exists, default to enabled
    return access ? access.isEnabled : true;
  }

  /**
   * Send absence notification email to patient(s) for an appointment
   */
  async sendAbsenceNotification(
    appointmentId: string,
    doctorProfileId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Get the appointment with patient and doctor info
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorProfileId,
      },
      include: {
        appointmentPatients: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Get all patients with email addresses
    const patientsWithEmail = appointment.appointmentPatients
      .filter((ap) => ap.patient?.email)
      .map((ap) => ap.patient!);

    if (patientsWithEmail.length === 0) {
      throw new BadRequestException('No patients with email addresses found');
    }

    // Format appointment date and time
    const appointmentDate = new Date(appointment.startTime).toLocaleDateString(
      'fr-FR',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    );

    const appointmentTime = new Date(appointment.startTime).toLocaleTimeString(
      'fr-FR',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    // Get doctor name
    const doctorUser = appointment.doctor?.user;
    const doctorName = doctorUser
      ? `Dr. ${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim()
      : 'Votre médecin';

    // Send email to each patient
    const sendPromises = patientsWithEmail.map(async (patient) => {
      try {
        const emailTemplate =
          this.emailTemplateService.generateAbsenceNotificationEmail({
            patientName: patient.name || 'Patient',
            doctorName,
            appointmentDate,
            appointmentTime,
          });

        await this.emailService.sendEmail({
          to: patient.email!,
          template: emailTemplate,
        });

        return { success: true, patientId: patient.id };
      } catch (error) {
        console.error(
          `Failed to send absence notification to patient ${patient.id}:`,
          error,
        );
        return { success: false, patientId: patient.id, error };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;

    return {
      success: successCount > 0,
      message: `Notification envoyée à ${successCount}/${patientsWithEmail.length} patient(s)`,
    };
  }
}
