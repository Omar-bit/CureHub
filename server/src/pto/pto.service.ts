import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePTODto, UpdatePTODto } from './dto';

@Injectable()
export class PTOService {
  constructor(private prisma: PrismaService) {}

  async findAll(doctorId: string) {
    return this.prisma.doctorPTO.findMany({
      where: { doctorId },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string, doctorId: string) {
    const pto = await this.prisma.doctorPTO.findFirst({
      where: { id, doctorId },
    });

    if (!pto) {
      throw new NotFoundException('PTO not found');
    }

    return pto;
  }

  async create(doctorId: string, createPTODto: CreatePTODto) {
    const { label, startDate, endDate, announcements = 2 } = createPTODto;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException(
        'Start date must be before or equal to end date',
      );
    }

    // Count affected appointments
    const appointmentsCount = await this.countAffectedAppointments(
      doctorId,
      start,
      end,
    );

    return this.prisma.doctorPTO.create({
      data: {
        doctorId,
        label,
        startDate: start,
        endDate: end,
        announcements,
        appointmentsCount,
      },
    });
  }

  async update(id: string, doctorId: string, updatePTODto: UpdatePTODto) {
    await this.findOne(id, doctorId); // Ensure PTO exists and belongs to doctor

    const { label, startDate, endDate, announcements } = updatePTODto;

    // Prepare update data
    const updateData: any = {};
    if (label !== undefined) updateData.label = label;
    if (announcements !== undefined) updateData.announcements = announcements;

    // Handle date updates
    if (startDate !== undefined || endDate !== undefined) {
      const currentPTO = await this.prisma.doctorPTO.findUnique({
        where: { id },
      });

      if (!currentPTO) {
        throw new NotFoundException('PTO not found');
      }

      const start = startDate ? new Date(startDate) : currentPTO.startDate;
      const end = endDate ? new Date(endDate) : currentPTO.endDate;

      if (start > end) {
        throw new BadRequestException(
          'Start date must be before or equal to end date',
        );
      }

      if (startDate) updateData.startDate = start;
      if (endDate) updateData.endDate = end;

      // Recalculate affected appointments
      updateData.appointmentsCount = await this.countAffectedAppointments(
        doctorId,
        start,
        end,
      );
    }

    return this.prisma.doctorPTO.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, doctorId: string) {
    await this.findOne(id, doctorId); // Ensure PTO exists and belongs to doctor

    return this.prisma.doctorPTO.delete({
      where: { id },
    });
  }

  // Helper method to count appointments affected by PTO
  private async countAffectedAppointments(
    doctorId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Set time to beginning and end of day for accurate comparison
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.prisma.appointment.count({
      where: {
        doctorId,
        startTime: {
          gte: start,
          lte: end,
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
      },
    });
  }

  // Check if a specific date/time is blocked by PTO
  async isDateBlockedByPTO(doctorId: string, dateTime: Date): Promise<boolean> {
    const count = await this.prisma.doctorPTO.count({
      where: {
        doctorId,
        startDate: {
          lte: dateTime,
        },
        endDate: {
          gte: dateTime,
        },
      },
    });

    return count > 0;
  }
}
