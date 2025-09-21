import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConsultationTypeDto,
  UpdateConsultationTypeDto,
  ConsultationTypeQueryDto,
} from './dto/consultation-type.dto';
import {
  DoctorConsultationType,
  ConsultationLocation,
  ConsultationType,
} from '@prisma/client';

@Injectable()
export class ConsultationTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll(doctorId: string, query: ConsultationTypeQueryDto = {}) {
    const { enabledOnly, location, type } = query;

    const where: any = {
      doctorId,
    };

    if (enabledOnly) {
      where.enabled = true;
    }

    if (location) {
      where.location = location;
    }

    if (type) {
      where.type = type;
    }

    return this.prisma.doctorConsultationType.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        color: true,
        location: true,
        duration: true,
        restAfter: true,
        type: true,
        canBookBefore: true,
        price: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, doctorId: string) {
    const consultationType = await this.prisma.doctorConsultationType.findFirst(
      {
        where: {
          id,
          doctorId,
        },
        select: {
          id: true,
          name: true,
          color: true,
          location: true,
          duration: true,
          restAfter: true,
          type: true,
          canBookBefore: true,
          price: true,
          enabled: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    );

    if (!consultationType) {
      throw new NotFoundException('Consultation type not found');
    }

    return consultationType;
  }

  async create(doctorId: string, createDto: CreateConsultationTypeDto) {
    // Check if consultation type name already exists for this doctor
    const existingType = await this.prisma.doctorConsultationType.findFirst({
      where: {
        doctorId,
        name: createDto.name,
      },
    });

    if (existingType) {
      throw new BadRequestException(
        'Consultation type with this name already exists',
      );
    }

    return this.prisma.doctorConsultationType.create({
      data: {
        ...createDto,
        doctorId,
        enabled: createDto.enabled ?? true,
      },
      select: {
        id: true,
        name: true,
        color: true,
        location: true,
        duration: true,
        restAfter: true,
        type: true,
        canBookBefore: true,
        price: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    doctorId: string,
    updateDto: UpdateConsultationTypeDto,
  ) {
    // First check if the consultation type exists and belongs to the doctor
    const existingType = await this.findOne(id, doctorId);

    // If updating name, check for duplicates
    if (updateDto.name && updateDto.name !== existingType.name) {
      const duplicateType = await this.prisma.doctorConsultationType.findFirst({
        where: {
          doctorId,
          name: updateDto.name,
          id: { not: id },
        },
      });

      if (duplicateType) {
        throw new BadRequestException(
          'Consultation type with this name already exists',
        );
      }
    }

    return this.prisma.doctorConsultationType.update({
      where: { id },
      data: updateDto,
      select: {
        id: true,
        name: true,
        color: true,
        location: true,
        duration: true,
        restAfter: true,
        type: true,
        canBookBefore: true,
        price: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, doctorId: string) {
    // First check if the consultation type exists and belongs to the doctor
    await this.findOne(id, doctorId);

    return this.prisma.doctorConsultationType.delete({
      where: { id },
    });
  }

  async createDefaultConsultationTypes(doctorId: string) {
    const defaultTypes = [
      {
        name: 'General Consultation',
        color: '#3B82F6', // Blue
        location: ConsultationLocation.ONSITE,
        duration: 30,
        restAfter: 10,
        type: ConsultationType.REGULAR,
        canBookBefore: 1440, // 24 hours
        price: 50.0,
        enabled: true,
      },
      {
        name: 'Online Consultation',
        color: '#10B981', // Green
        location: ConsultationLocation.ONLINE,
        duration: 20,
        restAfter: 5,
        type: ConsultationType.REGULAR,
        canBookBefore: 720, // 12 hours
        price: 30.0,
        enabled: true,
      },
      {
        name: 'Emergency Visit',
        color: '#EF4444', // Red
        location: ConsultationLocation.ATHOME,
        duration: 45,
        restAfter: 15,
        type: ConsultationType.URGENT,
        canBookBefore: 60, // 1 hour
        price: 100.0,
        enabled: true,
      },
    ];

    const createdTypes: DoctorConsultationType[] = [];
    for (const typeData of defaultTypes) {
      const created = await this.prisma.doctorConsultationType.create({
        data: {
          ...typeData,
          doctorId,
        },
      });
      createdTypes.push(created);
    }

    return createdTypes;
  }
}
