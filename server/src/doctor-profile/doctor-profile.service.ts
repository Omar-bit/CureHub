import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorProfile, Prisma } from '@prisma/client';

export interface CreateDoctorProfileDto {
  userId: string;
  specialization?: string;
  yearsOfExperience?: number;
  bio?: string;
  profileImageUrl?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

export interface UpdateDoctorProfileDto
  extends Partial<Omit<CreateDoctorProfileDto, 'userId'>> {}

@Injectable()
export class DoctorProfileService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDoctorProfileDto: CreateDoctorProfileDto,
  ): Promise<DoctorProfile> {
    const data: Prisma.DoctorProfileCreateInput = {
      user: {
        connect: { id: createDoctorProfileDto.userId },
      },
      specialization: createDoctorProfileDto.specialization,
      bio: createDoctorProfileDto.bio,
      profileImageUrl: createDoctorProfileDto.profileImageUrl,
      clinicAddress: createDoctorProfileDto.clinicAddress,
      clinicPhone: createDoctorProfileDto.clinicPhone,
    };

    return this.prisma.doctorProfile.create({
      data,
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
    });
  }

  async findByUserId(userId: string): Promise<DoctorProfile | null> {
    return this.prisma.doctorProfile.findUnique({
      where: { userId },
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
    });
  }

  async findById(id: string): Promise<DoctorProfile | null> {
    return this.prisma.doctorProfile.findUnique({
      where: { id },
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
    });
  }

  async update(
    userId: string,
    updateDoctorProfileDto: UpdateDoctorProfileDto,
  ): Promise<DoctorProfile> {
    const existingProfile = await this.findByUserId(userId);

    if (!existingProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.prisma.doctorProfile.update({
      where: { userId },
      data: updateDoctorProfileDto,
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
    });
  }

  async delete(userId: string): Promise<DoctorProfile> {
    const existingProfile = await this.findByUserId(userId);

    if (!existingProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.prisma.doctorProfile.delete({
      where: { userId },
    });
  }

  async findAll(): Promise<DoctorProfile[]> {
    return this.prisma.doctorProfile.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Method to create default profile for a doctor
  async createDefaultProfile(userId: string): Promise<DoctorProfile> {
    return this.create({
      userId,
      // Set default values
    });
  }
}
