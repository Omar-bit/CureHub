import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Clinic, Prisma } from '@prisma/client';

export interface CreateClinicDto {
  doctorProfileId: string;
  name?: string;
  gender?: string;
  address?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  prmAccess?: boolean;
  videoSurveillance?: boolean;
}

export interface UpdateClinicDto
  extends Partial<Omit<CreateClinicDto, 'doctorProfileId'>> {}

@Injectable()
export class ClinicService {
  constructor(private prisma: PrismaService) {}

  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const data: Prisma.ClinicCreateInput = {
      doctorProfile: {
        connect: { id: createClinicDto.doctorProfileId },
      },
      name: createClinicDto.name,
      gender: createClinicDto.gender,
      address: createClinicDto.address,
      address2: createClinicDto.address2,
      postalCode: createClinicDto.postalCode,
      city: createClinicDto.city,
      phone: createClinicDto.phone,
      prmAccess: createClinicDto.prmAccess ?? false,
      videoSurveillance: createClinicDto.videoSurveillance ?? false,
    };

    return this.prisma.clinic.create({
      data,
      include: {
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findByDoctorProfileId(doctorProfileId: string): Promise<Clinic | null> {
    return this.prisma.clinic.findUnique({
      where: { doctorProfileId },
      include: {
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Clinic | null> {
    return this.prisma.clinic.findUnique({
      where: { id },
      include: {
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async update(
    doctorProfileId: string,
    updateClinicDto: UpdateClinicDto,
  ): Promise<Clinic> {
    console.log(
      '[Clinic.update] Starting update for doctorProfileId:',
      doctorProfileId,
    );
    console.log('[Clinic.update] Received data:', updateClinicDto);

    const existingClinic = await this.findByDoctorProfileId(doctorProfileId);

    if (!existingClinic) {
      // If clinic doesn't exist, create it
      console.log('[Clinic.update] Clinic not found, creating new one');
      return this.create({
        doctorProfileId,
        ...updateClinicDto,
      });
    }

    // Build the update data object, filtering out undefined values
    const data: Prisma.ClinicUpdateInput = {};

    if (updateClinicDto.name !== undefined) data.name = updateClinicDto.name;
    if (updateClinicDto.gender !== undefined)
      data.gender = updateClinicDto.gender;
    if (updateClinicDto.address !== undefined)
      data.address = updateClinicDto.address;
    if (updateClinicDto.address2 !== undefined)
      data.address2 = updateClinicDto.address2;
    if (updateClinicDto.postalCode !== undefined)
      data.postalCode = updateClinicDto.postalCode;
    if (updateClinicDto.city !== undefined) data.city = updateClinicDto.city;
    if (updateClinicDto.phone !== undefined) data.phone = updateClinicDto.phone;
    if (updateClinicDto.prmAccess !== undefined)
      data.prmAccess = updateClinicDto.prmAccess;
    if (updateClinicDto.videoSurveillance !== undefined)
      data.videoSurveillance = updateClinicDto.videoSurveillance;

    console.log('[Clinic.update] Update data prepared:', data);

    const result = await this.prisma.clinic.update({
      where: { doctorProfileId },
      data,
      include: {
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });

    console.log('[Clinic.update] Update completed successfully');
    return result;
  }

  async delete(doctorProfileId: string): Promise<Clinic> {
    const existingClinic = await this.findByDoctorProfileId(doctorProfileId);

    if (!existingClinic) {
      throw new NotFoundException('Clinic not found');
    }

    return this.prisma.clinic.delete({
      where: { doctorProfileId },
    });
  }

  async findAll(): Promise<Clinic[]> {
    return this.prisma.clinic.findMany({
      include: {
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
