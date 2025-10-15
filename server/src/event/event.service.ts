import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventEntity } from './entities/event.entity';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    doctorId: string,
    createEventDto: CreateEventDto,
  ): Promise<EventEntity> {
    const event = await this.prisma.event.create({
      data: {
        ...createEventDto,
        startDate: new Date(createEventDto.startDate),
        endDate: createEventDto.endDate
          ? new Date(createEventDto.endDate)
          : null,
        doctorId,
      },
    });

    return new EventEntity(event);
  }

  async findAll(doctorId: string): Promise<EventEntity[]> {
    const events = await this.prisma.event.findMany({
      where: { doctorId },
      orderBy: { startDate: 'asc' },
    });

    return events.map((event) => new EventEntity(event));
  }

  async findOne(id: string, doctorId: string): Promise<EventEntity> {
    const event = await this.prisma.event.findFirst({
      where: { id, doctorId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return new EventEntity(event);
  }

  async update(
    id: string,
    doctorId: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventEntity> {
    const existingEvent = await this.findOne(id, doctorId);

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        startDate: updateEventDto.startDate
          ? new Date(updateEventDto.startDate)
          : undefined,
        endDate: updateEventDto.endDate
          ? new Date(updateEventDto.endDate)
          : undefined,
      },
    });

    return new EventEntity(event);
  }

  async remove(id: string, doctorId: string): Promise<void> {
    const existingEvent = await this.findOne(id, doctorId);

    await this.prisma.event.delete({
      where: { id },
    });
  }

  async findByDateRange(
    doctorId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EventEntity[]> {
    const events = await this.prisma.event.findMany({
      where: {
        doctorId,
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            AND: [
              {
                startDate: {
                  lte: startDate,
                },
              },
              {
                OR: [
                  {
                    endDate: {
                      gte: endDate,
                    },
                  },
                  {
                    endDate: null,
                    eventType: 'JOUR',
                  },
                ],
              },
            ],
          },
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    return events.map((event) => new EventEntity(event));
  }
}
