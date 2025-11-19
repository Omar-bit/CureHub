import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DayOfWeek } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeplanDto, UpdateTimeplanDto } from './dto';

@Injectable()
export class TimeplanService {
  constructor(private prisma: PrismaService) {}

  async getTimeplanByDoctor(doctorId: string) {
    // Return all timeplans (both general weekly and date-specific)
    const timeplans = await this.prisma.doctorTimeplan.findMany({
      where: {
        doctorId,
      },
      include: {
        timeSlots: {
          include: {
            consultationTypes: {
              include: {
                consultationType: true,
              },
            },
          },
        },
      },
      orderBy: [
        { specificDate: 'asc' }, // null values first, then dates in ascending order
        { dayOfWeek: 'asc' },
      ],
    });

    return timeplans;
  }

  async getTimeplanByDoctorAndDay(
    doctorId: string,
    dayOfWeek: DayOfWeek,
    specificDate?: string,
  ) {
    // Use findFirst instead of findUnique because Prisma doesn't allow null in compound unique constraints
    const timeplan = await this.prisma.doctorTimeplan.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        specificDate: specificDate ? new Date(specificDate) : null,
      },
      include: {
        timeSlots: {
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

    return timeplan;
  }

  async createOrUpdateTimeplan(
    doctorId: string,
    createTimeplanDto: CreateTimeplanDto,
  ) {
    const { dayOfWeek, specificDate, isActive, timeSlots } = createTimeplanDto;

    // Check if timeplan already exists for this day (or specific date)
    // Use findFirst instead of findUnique because Prisma doesn't allow null in compound unique constraints
    const existingTimeplan = await this.prisma.doctorTimeplan.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        specificDate: specificDate ? new Date(specificDate) : null,
      },
      include: {
        timeSlots: {
          include: {
            consultationTypes: true,
          },
        },
      },
    });

    if (existingTimeplan) {
      // Update existing timeplan directly by ID
      // Delete existing time slots
      await this.prisma.doctorTimeSlot.deleteMany({
        where: { timeplanId: existingTimeplan.id },
      });

      // Create new time slots
      for (const slot of timeSlots) {
        if (slot.startTime && slot.endTime && slot.consultationTypeIds) {
          await this.prisma.doctorTimeSlot.create({
            data: {
              timeplanId: existingTimeplan.id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isActive: slot.isActive ?? true,
              consultationTypes: {
                create: slot.consultationTypeIds.map((consultationTypeId) => ({
                  consultationTypeId,
                })),
              },
            },
          });
        }
      }

      // Update timeplan basic properties
      const updatedTimeplan = await this.prisma.doctorTimeplan.update({
        where: { id: existingTimeplan.id },
        data: {
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          timeSlots: {
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

      return updatedTimeplan;
    }

    // Validate that doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Validate consultation type IDs
    await this.validateConsultationTypes(doctorId, timeSlots);

    // Create new timeplan
    const timeplan = await this.prisma.doctorTimeplan.create({
      data: {
        doctorId,
        dayOfWeek,
        specificDate: specificDate ? new Date(specificDate) : null,
        isActive,
        timeSlots: {
          create: timeSlots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive ?? true,
            consultationTypes: {
              create: slot.consultationTypeIds.map((consultationTypeId) => ({
                consultationTypeId,
              })),
            },
          })),
        },
      },
      include: {
        timeSlots: {
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

    return timeplan;
  }

  async updateTimeplan(
    doctorId: string,
    dayOfWeek: DayOfWeek,
    updateTimeplanDto: UpdateTimeplanDto,
  ) {
    const { specificDate, isActive, timeSlots } = updateTimeplanDto;

    // Check if timeplan exists - use findFirst instead of findUnique
    const existingTimeplan = await this.prisma.doctorTimeplan.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        specificDate: specificDate ? new Date(specificDate) : null,
      },
      include: {
        timeSlots: {
          include: {
            consultationTypes: true,
          },
        },
      },
    });

    if (!existingTimeplan) {
      throw new NotFoundException('Timeplan not found for this day');
    }

    // Validate consultation type IDs if timeSlots are provided
    if (timeSlots) {
      await this.validateConsultationTypes(doctorId, timeSlots);
    }

    // Delete existing time slots if we're updating them
    if (timeSlots) {
      await this.prisma.doctorTimeSlot.deleteMany({
        where: { timeplanId: existingTimeplan.id },
      });

      // Create new time slots
      for (const slot of timeSlots) {
        if (slot.startTime && slot.endTime && slot.consultationTypeIds) {
          await this.prisma.doctorTimeSlot.create({
            data: {
              timeplanId: existingTimeplan.id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isActive: slot.isActive ?? true,
              consultationTypes: {
                create: slot.consultationTypeIds.map((consultationTypeId) => ({
                  consultationTypeId,
                })),
              },
            },
          });
        }
      }
    }

    // Update timeplan basic properties
    const updatedTimeplan = await this.prisma.doctorTimeplan.update({
      where: { id: existingTimeplan.id },
      data: {
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        timeSlots: {
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

    return updatedTimeplan;
  }

  async deleteTimeplan(
    doctorId: string,
    dayOfWeek: DayOfWeek,
    specificDate?: string,
  ) {
    // Use findFirst instead of findUnique
    const timeplan = await this.prisma.doctorTimeplan.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        specificDate: specificDate ? new Date(specificDate) : null,
      },
    });

    if (!timeplan) {
      throw new NotFoundException('Timeplan not found for this day');
    }

    await this.prisma.doctorTimeplan.delete({
      where: { id: timeplan.id },
    });

    return { message: 'Timeplan deleted successfully' };
  }

  async deleteTimeSlot(doctorId: string, timeSlotId: string) {
    // Verify that the time slot belongs to the doctor
    const timeSlot = await this.prisma.doctorTimeSlot.findFirst({
      where: {
        id: timeSlotId,
        timeplan: {
          doctorId,
        },
      },
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    await this.prisma.doctorTimeSlot.delete({
      where: { id: timeSlotId },
    });

    return { message: 'Time slot deleted successfully' };
  }

  private async validateConsultationTypes(doctorId: string, timeSlots: any[]) {
    const allConsultationTypeIds = timeSlots.flatMap(
      (slot) => slot.consultationTypeIds,
    );
    const uniqueIds = [...new Set(allConsultationTypeIds)];

    if (uniqueIds.length === 0) return;

    const consultationTypes = await this.prisma.doctorConsultationType.findMany(
      {
        where: {
          id: { in: uniqueIds },
          doctorId,
        },
      },
    );

    if (consultationTypes.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more consultation types are invalid or do not belong to this doctor',
      );
    }
  }

  private validateTimeSlotOverlap(timeSlots: any[]) {
    // Sort time slots by start time
    const sortedSlots = timeSlots.sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];

      if (current.endTime > next.startTime) {
        throw new BadRequestException(
          `Time slots overlap: ${current.startTime}-${current.endTime} and ${next.startTime}-${next.endTime}`,
        );
      }
    }
  }
}
