import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  GetAppointmentsDto,
} from './dto';
import { Appointment, AppointmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  async create(
    doctorId: string,
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const {
      patientId,
      consultationTypeId,
      startTime,
      endTime,
      ...appointmentData
    } = createAppointmentDto;

    // Verify patient belongs to doctor
    await this.verifyPatientBelongsToDoctor(patientId, doctorId);

    // Verify consultation type belongs to doctor (if provided)
    if (consultationTypeId) {
      await this.verifyConsultationTypeBelongsToDoctor(
        consultationTypeId,
        doctorId,
      );
    }

    // Check for time conflicts
    await this.checkTimeConflicts(
      doctorId,
      new Date(startTime),
      new Date(endTime),
    );

    // Validate appointment times
    this.validateAppointmentTimes(new Date(startTime), new Date(endTime));

    return this.prisma.appointment.create({
      data: {
        ...appointmentData,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        doctorId,
        patientId,
        consultationTypeId,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            email: true,
            phoneNumber: true,
          },
        },
        consultationType: true,
      },
    });
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

    if (startDate && endDate) {
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
            select: {
              id: true,
              name: true,
              profileImage: true,
              email: true,
              phoneNumber: true,
            },
          },
          consultationType: true,
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
          select: {
            id: true,
            name: true,
            profileImage: true,
            email: true,
            phoneNumber: true,
            dateOfBirth: true,
            gender: true,
            address: true,
          },
        },
        consultationType: true,
        doctor: {
          select: {
            id: true,
            specialization: true,
            clinicAddress: true,
            clinicPhone: true,
          },
        },
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
      consultationTypeId,
      startTime,
      endTime,
      ...appointmentData
    } = updateAppointmentDto;

    // Verify patient belongs to doctor (if changing patient)
    if (patientId && patientId !== appointment.patientId) {
      await this.verifyPatientBelongsToDoctor(patientId, doctorId);
    }

    // Verify consultation type belongs to doctor (if provided)
    if (consultationTypeId) {
      await this.verifyConsultationTypeBelongsToDoctor(
        consultationTypeId,
        doctorId,
      );
    }

    // Check for time conflicts (if changing time)
    if (startTime || endTime) {
      const newStartTime = startTime
        ? new Date(startTime)
        : appointment.startTime;
      const newEndTime = endTime ? new Date(endTime) : appointment.endTime;

      this.validateAppointmentTimes(newStartTime, newEndTime);
      await this.checkTimeConflicts(doctorId, newStartTime, newEndTime, id);
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...appointmentData,
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(patientId && { patientId }),
        ...(consultationTypeId && { consultationTypeId }),
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            email: true,
            phoneNumber: true,
          },
        },
        consultationType: true,
      },
    });
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
        consultationType: true,
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
        consultationType: true,
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

    if (startTime < new Date()) {
      throw new BadRequestException('Cannot schedule appointment in the past');
    }

    // Maximum appointment duration: 4 hours
    const maxDurationMs = 4 * 60 * 60 * 1000;
    if (endTime.getTime() - startTime.getTime() > maxDurationMs) {
      throw new BadRequestException(
        'Appointment duration cannot exceed 4 hours',
      );
    }
  }
}
