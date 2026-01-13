import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActeDto } from './dto/create-acte.dto';
import { UpdateActeDto } from './dto/update-acte.dto';

@Injectable()
export class ActeService {
  constructor(private prisma: PrismaService) {}

  async create(doctorId: string, createActeDto: CreateActeDto) {
    const {
      consultationTypeIds = [],
      canals = [],
      ...acteData
    } = createActeDto;

    const acte = await this.prisma.acte.create({
      data: {
        ...acteData,
        doctorId,
        canals: JSON.stringify(canals),
        consultationTypes: {
          create: consultationTypeIds.map((consultationTypeId) => ({
            consultationTypeId,
          })),
        },
      },
      include: {
        consultationTypes: {
          include: {
            consultationType: true,
          },
        },
      },
    });

    return this.formatActeResponse(acte);
  }

  async findAll(doctorId: string) {
    const actes = await this.prisma.acte.findMany({
      where: { doctorId },
      include: {
        consultationTypes: {
          include: {
            consultationType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return actes.map((acte) => this.formatActeResponse(acte));
  }

  async findOne(doctorId: string, id: string) {
    const acte = await this.prisma.acte.findUnique({
      where: { id },
      include: {
        consultationTypes: {
          include: {
            consultationType: true,
          },
        },
      },
    });

    if (!acte || acte.doctorId !== doctorId) {
      throw new Error(`Acte with id ${id} not found`);
    }

    return this.formatActeResponse(acte);
  }

  async update(doctorId: string, id: string, updateActeDto: UpdateActeDto) {
    const { consultationTypeIds = [], canals, ...acteData } = updateActeDto;

    // Verify ownership
    const existing = await this.prisma.acte.findUnique({
      where: { id },
    });

    if (!existing || existing.doctorId !== doctorId) {
      throw new Error(`Acte with id ${id} not found`);
    }

    // Update consultation types if provided
    if (consultationTypeIds && consultationTypeIds.length > 0) {
      // Delete existing associations
      await this.prisma.acteConsultationType.deleteMany({
        where: { acteId: id },
      });

      // Create new associations
      await this.prisma.acteConsultationType.createMany({
        data: consultationTypeIds.map((consultationTypeId) => ({
          acteId: id,
          consultationTypeId,
        })),
      });
    }

    const acte = await this.prisma.acte.update({
      where: { id },
      data: {
        ...acteData,
        canals: canals ? JSON.stringify(canals) : undefined,
      },
      include: {
        consultationTypes: {
          include: {
            consultationType: true,
          },
        },
      },
    });

    return this.formatActeResponse(acte);
  }

  async remove(doctorId: string, id: string) {
    // Verify ownership
    const existing = await this.prisma.acte.findUnique({
      where: { id },
    });

    if (!existing || existing.doctorId !== doctorId) {
      throw new Error(`Acte with id ${id} not found`);
    }

    await this.prisma.acte.delete({
      where: { id },
    });

    return { success: true };
  }

  private formatActeResponse(acte: any) {
    return {
      ...acte,
      canals:
        typeof acte.canals === 'string' ? JSON.parse(acte.canals) : acte.canals,
      consultationTypeIds: acte.consultationTypes.map(
        (ct) => ct.consultationTypeId,
      ),
      consultationTypes: acte.consultationTypes.map((ct) => ({
        id: ct.consultationType.id,
        name: ct.consultationType.name,
        duration: ct.consultationType.duration,
      })),
    };
  }
}
