import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImprevuDto, UpdateImprevuDto, GetImprevusDto } from './dto';
import { Imprevu, AppointmentStatus } from '@prisma/client';

@Injectable()
export class ImprevuService {
  constructor(private prisma: PrismaService) {}

  async create(
    doctorId: string,
    createImprevuDto: CreateImprevuDto,
  ): Promise<Imprevu> {
    const {
      startDate,
      endDate,
      notifyPatients,
      blockTimeSlots,
      reason,
      message,
      consultationTypeIds,
      appointmentIds,
    } = createImprevuDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Create the imprevu
    const imprevu = await this.prisma.imprevu.create({
      data: {
        doctorId,
        startDate: start,
        endDate: end,
        notifyPatients: notifyPatients ?? true,
        blockTimeSlots: blockTimeSlots ?? true,
        reason,
        message,
      },
    });

    // Automatically cancel affected appointments if blockTimeSlots is enabled
    if (blockTimeSlots ?? true) {
      const appointments = await this.getAffectedAppointments(
        doctorId,
        startDate,
        endDate,
      );

      console.log('Total appointments found:', appointments.length);
      console.log('consultationTypeIds:', consultationTypeIds);
      console.log('appointmentIds:', appointmentIds);

      // Filter appointments based on consultation types if specified
      let appointmentsToCancel = appointments;
      if (consultationTypeIds && consultationTypeIds.length > 0) {
        appointmentsToCancel = appointments.filter(
          (apt) =>
            apt.consultationType?.id &&
            consultationTypeIds.includes(apt.consultationType.id),
        );
        console.log(
          'After consultation type filter:',
          appointmentsToCancel.length,
        );
      }

      // Further filter by specific appointment IDs if specified
      // If appointmentIds is undefined or null, don't cancel any appointments
      // If appointmentIds is an empty array, also don't cancel any appointments
      // Only cancel if appointmentIds is provided and has items
      if (appointmentIds !== undefined && appointmentIds !== null) {
        if (appointmentIds.length === 0) {
          // Empty array means user deselected all - don't cancel any
          console.log('Empty appointmentIds array - cancelling none');
          appointmentsToCancel = [];
        } else {
          // Filter to only the selected appointments
          appointmentsToCancel = appointmentsToCancel.filter((apt) =>
            appointmentIds.includes(apt.id),
          );
          console.log(
            'After appointmentIds filter:',
            appointmentsToCancel.length,
          );
        }
      } else {
        console.log(
          'appointmentIds is undefined/null - would cancel all (but we should avoid this)',
        );
      }
      // If appointmentIds is undefined/null, cancel all filtered appointments (backward compatibility)

      const appointmentIdsToCancel = appointmentsToCancel.map((apt) => apt.id);
      console.log(
        'Final appointments to cancel:',
        appointmentIdsToCancel.length,
        appointmentIdsToCancel,
      );

      // Cancel selected appointments
      if (appointmentIdsToCancel.length > 0) {
        await this.prisma.appointment.updateMany({
          where: {
            id: { in: appointmentIdsToCancel },
          },
          data: {
            status: AppointmentStatus.CANCELLED,
          },
        });

        // Update the imprevu with cancelled count
        await this.prisma.imprevu.update({
          where: { id: imprevu.id },
          data: {
            cancelledAppointmentsCount: appointmentIdsToCancel.length,
          },
        });
      } else {
        console.log('No appointments to cancel');
      }
    }

    return imprevu;
  }

  async getAffectedAppointments(
    doctorId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Find all appointments within the date range that are not already cancelled
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        status: {
          not: AppointmentStatus.CANCELLED,
        },
        OR: [
          {
            AND: [{ startTime: { gte: start } }, { startTime: { lt: end } }],
          },
          {
            AND: [{ endTime: { gt: start } }, { endTime: { lte: end } }],
          },
          {
            AND: [{ startTime: { lte: start } }, { endTime: { gte: end } }],
          },
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointmentPatients: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        consultationType: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return appointments;
  }

  async cancelAffectedAppointments(
    imprevuId: string,
    doctorId: string,
  ): Promise<{ cancelledCount: number; appointmentIds: string[] }> {
    const imprevu = await this.findOne(imprevuId, doctorId);

    // Find all appointments to cancel
    const appointments = await this.getAffectedAppointments(
      doctorId,
      imprevu.startDate.toISOString(),
      imprevu.endDate.toISOString(),
    );

    const appointmentIds = appointments.map((apt) => apt.id);

    // Cancel all affected appointments
    if (appointmentIds.length > 0) {
      await this.prisma.appointment.updateMany({
        where: {
          id: { in: appointmentIds },
        },
        data: {
          status: AppointmentStatus.CANCELLED,
        },
      });
    }

    // Update the imprevu with cancelled count
    await this.prisma.imprevu.update({
      where: { id: imprevuId },
      data: {
        cancelledAppointmentsCount: appointmentIds.length,
      },
    });

    return {
      cancelledCount: appointmentIds.length,
      appointmentIds,
    };
  }

  async findAll(
    doctorId: string,
    query: GetImprevusDto,
  ): Promise<{
    imprevus: Imprevu[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { startDate, endDate, page = '1', limit = '50' } = query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      doctorId,
    };

    if (startDate && endDate) {
      where.OR = [
        {
          AND: [
            { startDate: { gte: new Date(startDate) } },
            { startDate: { lt: new Date(endDate) } },
          ],
        },
        {
          AND: [
            { endDate: { gt: new Date(startDate) } },
            { endDate: { lte: new Date(endDate) } },
          ],
        },
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } },
          ],
        },
      ];
    } else if (startDate) {
      where.endDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.startDate = {
        lte: new Date(endDate),
      };
    }

    const [imprevus, total] = await this.prisma.$transaction([
      this.prisma.imprevu.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          startDate: 'desc',
        },
      }),
      this.prisma.imprevu.count({ where }),
    ]);

    return {
      imprevus,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string, doctorId: string): Promise<Imprevu> {
    const imprevu = await this.prisma.imprevu.findUnique({
      where: { id },
    });

    if (!imprevu) {
      throw new NotFoundException('Imprevu not found');
    }

    if (imprevu.doctorId !== doctorId) {
      throw new ForbiddenException('Access denied');
    }

    return imprevu;
  }

  async update(
    id: string,
    doctorId: string,
    updateImprevuDto: UpdateImprevuDto,
  ): Promise<Imprevu> {
    await this.findOne(id, doctorId);

    const { startDate, endDate, consultationTypeIds, appointmentIds, ...rest } = updateImprevuDto;

    const updateData: any = { ...rest };

    if (startDate) {
      updateData.startDate = new Date(startDate);
    }

    if (endDate) {
      updateData.endDate = new Date(endDate);
    }

    // Validate dates if both are provided
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    const updatedImprevu = await this.prisma.imprevu.update({
      where: { id },
      data: updateData,
    });

    return updatedImprevu;
  }

  async remove(id: string, doctorId: string): Promise<void> {
    await this.findOne(id, doctorId);

    await this.prisma.imprevu.delete({
      where: { id },
    });
  }

  async checkTimeSlotBlocked(
    doctorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<boolean> {
    const blockingImprevu = await this.prisma.imprevu.findFirst({
      where: {
        doctorId,
        blockTimeSlots: true,
        OR: [
          {
            AND: [
              { startDate: { lte: startTime } },
              { endDate: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startDate: { lt: endTime } },
              { endDate: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startTime } },
              { endDate: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return !!blockingImprevu;
  }
}
