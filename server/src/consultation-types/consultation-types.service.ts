import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConsultationTypeDto,
  UpdateConsultationTypeDto,
  ConsultationTypeQueryDto,
} from './dto/consultation-type.dto';
import { DoctorConsultationType } from '@prisma/client';

@Injectable()
export class ConsultationTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll(doctorId: string, query: ConsultationTypeQueryDto = {}) {
    const { enabledOnly, modeExerciceId } = query;

    const where: any = {
      doctorId,
    };

    if (enabledOnly) {
      where.enabled = true;
    }

    if (modeExerciceId) {
      where.modeExerciceId = modeExerciceId;
    }

    return this.prisma.doctorConsultationType.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        color: true,
        modeExercice: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
        enabled: true,
        createdAt: true,
        updatedAt: true,
        actes: {
          select: {
            acte: {
              select: {
                id: true,
                name: true,
                color: true,
                duration: true,
                regularPrice: true,
              },
            },
          },
        },
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
          modeExercice: {
            select: {
              id: true,
              name: true,
              color: true,
              description: true,
            },
          },
          enabled: true,
          createdAt: true,
          updatedAt: true,
          actes: {
            select: {
              acte: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  duration: true,
                  regularPrice: true,
                },
              },
            },
          },
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

    const { acteIds, ...rest } = createDto;

    // Filter out null values from acteIds
    const validActeIds = acteIds?.filter((id) => id !== null) ?? [];

    return this.prisma.doctorConsultationType.create({
      data: {
        ...rest,
        doctorId,
        actes: {
          create: validActeIds?.map((acteId) => ({
            acte: { connect: { id: acteId } },
          })),
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
        modeExercice: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
        enabled: true,
        createdAt: true,
        updatedAt: true,
        actes: {
          select: {
            acte: {
              select: {
                id: true,
                name: true,
                color: true,
                duration: true,
                regularPrice: true,
              },
            },
          },
        },
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

    const { acteIds, ...rest } = updateDto;

    const data: any = { ...rest };

    if (acteIds) {
      // Filter out null values from acteIds
      const validActeIds = acteIds.filter((id) => id !== null);
      data.actes = {
        deleteMany: {},
        create: validActeIds.map((acteId) => ({
          acte: { connect: { id: acteId } },
        })),
      };
    }

    return this.prisma.doctorConsultationType.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        color: true,
        modeExercice: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
        enabled: true,
        createdAt: true,
        updatedAt: true,
        actes: {
          select: {
            acte: {
              select: {
                id: true,
                name: true,
                color: true,
                duration: true,
                regularPrice: true,
              },
            },
          },
        },
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
    // Get the default mode exercices for this doctor
    const modeExercices = await this.prisma.modeExercice.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'asc' },
    });

    // Map mode exercices by name for easier lookup
    const modeExerciceMap = new Map(
      modeExercices.map((me) => [me.name.toLowerCase(), me.id]),
    );

    const defaultTypes = [
      {
        name: 'Consultation générale',
        modeExerciceId: modeExerciceMap.get('au cabinet'),
        enabled: true,
      },
      {
        name: 'Téléconsultation',
        modeExerciceId: modeExerciceMap.get('en visio'),
        enabled: true,
      },
      {
        name: 'Visite à domicile',
        modeExerciceId: modeExerciceMap.get('à domicile'),
        enabled: true,
      },
    ];

    const createdTypes: DoctorConsultationType[] = [];
    for (const typeData of defaultTypes) {
      if (!typeData.modeExerciceId) continue;

      const created = await this.prisma.doctorConsultationType.create({
        data: {
          ...typeData,
          modeExerciceId: typeData.modeExerciceId, // Explicitly set to satisfy TS
          doctorId,
        },
      });
      createdTypes.push(created);
    }

    return createdTypes;
  }
}
