import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateModeExerciceDto,
  UpdateModeExerciceDto,
  ModeExerciceQueryDto,
} from './dto/mode-exercice.dto';

@Injectable()
export class ModeExerciceService {
  constructor(private prisma: PrismaService) {}

  async findAll(doctorId: string, query: ModeExerciceQueryDto = {}) {
    const { search } = query;

    const where: any = {
      doctorId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.modeExercice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        nomDesPlages: true,
        color: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, doctorId: string) {
    const modeExercice = await this.prisma.modeExercice.findFirst({
      where: {
        id,
        doctorId,
      },
      select: {
        id: true,
        name: true,
        nomDesPlages: true,
        color: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!modeExercice) {
      throw new NotFoundException('Mode exercice not found');
    }

    return modeExercice;
  }

  async create(doctorId: string, createDto: CreateModeExerciceDto) {
    // Check if mode exercice name already exists for this doctor
    const existingMode = await this.prisma.modeExercice.findFirst({
      where: {
        doctorId,
        name: createDto.name,
      },
    });

    if (existingMode) {
      throw new BadRequestException(
        'Mode exercice with this name already exists',
      );
    }

    return this.prisma.modeExercice.create({
      data: {
        name: createDto.name,
        nomDesPlages: createDto.nomDesPlages ?? false,
        color: createDto.color ?? '#3B82F6',
        description: createDto.description,
        doctorId,
      },
      select: {
        id: true,
        name: true,
        nomDesPlages: true,
        color: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    doctorId: string,
    updateDto: UpdateModeExerciceDto,
  ) {
    // First check if the mode exercice exists and belongs to the doctor
    const existingMode = await this.findOne(id, doctorId);

    // If updating name, check for duplicates
    if (updateDto.name && updateDto.name !== existingMode.name) {
      const duplicateMode = await this.prisma.modeExercice.findFirst({
        where: {
          doctorId,
          name: updateDto.name,
          id: { not: id },
        },
      });

      if (duplicateMode) {
        throw new BadRequestException(
          'Mode exercice with this name already exists',
        );
      }
    }

    return this.prisma.modeExercice.update({
      where: { id },
      data: updateDto,
      select: {
        id: true,
        name: true,
        nomDesPlages: true,
        color: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, doctorId: string) {
    // First check if the mode exercice exists and belongs to the doctor
    await this.findOne(id, doctorId);

    return this.prisma.modeExercice.delete({
      where: { id },
    });
  }

  async createDefaultModeExercices(doctorId: string) {
    const defaultModes = [
      {
        name: 'Au cabinet',
        nomDesPlages: false,
        color: '#10B981', // Green
        description: 'Consultation au cabinet médical',
      },
      {
        name: 'À domicile',
        nomDesPlages: false,
        color: '#EF4444', // Red
        description: 'Visite à domicile',
      },
      {
        name: 'En visio',
        nomDesPlages: false,
        color: '#3B82F6', // Blue
        description: 'Téléconsultation en ligne',
      },
    ];

    const createdModes: any[] = [];
    for (const modeData of defaultModes) {
      // Check if mode already exists to avoid duplicates
      const existing = await this.prisma.modeExercice.findFirst({
        where: {
          doctorId,
          name: modeData.name,
        },
      });

      if (!existing) {
        const created = await this.prisma.modeExercice.create({
          data: {
            ...modeData,
            doctorId,
          },
        });
        createdModes.push(created);
      } else {
        createdModes.push(existing);
      }
    }

    return createdModes;
  }
}

