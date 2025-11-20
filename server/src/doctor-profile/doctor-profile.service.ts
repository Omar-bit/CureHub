import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorProfile, Prisma } from '@prisma/client';

export interface CreateDoctorProfileDto {
  userId: string;
  specialization?: string;
  bio?: string;
  profileImageUrl?: string;
  // Professional info fields
  rppsNumber?: string;
  sirenNumber?: string;
  languagesSpoken?: string;
  diplomas?: string;
  additionalDiplomas?: string;
  publications?: string;
  signature?: string;
  absenceMessage?: string;
  tooManyAbsencesInfo?: string;
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
      rppsNumber: createDoctorProfileDto.rppsNumber,
      sirenNumber: createDoctorProfileDto.sirenNumber,
      languagesSpoken: createDoctorProfileDto.languagesSpoken,
      diplomas: createDoctorProfileDto.diplomas,
      additionalDiplomas: createDoctorProfileDto.additionalDiplomas,
      publications: createDoctorProfileDto.publications,
      signature: createDoctorProfileDto.signature,
      absenceMessage: createDoctorProfileDto.absenceMessage,
      tooManyAbsencesInfo: createDoctorProfileDto.tooManyAbsencesInfo,
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
        clinic: true,
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
        clinic: true,
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
        clinic: true,
      },
    });
  }

  async update(
    userId: string,
    updateDoctorProfileDto: UpdateDoctorProfileDto,
  ): Promise<DoctorProfile> {
    console.log('[DoctorProfile.update] Starting update for userId:', userId);
    console.log(
      '[DoctorProfile.update] Received data:',
      updateDoctorProfileDto,
    );

    const existingProfile = await this.findByUserId(userId);

    if (!existingProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Build the update data object, filtering out undefined values
    const data: Prisma.DoctorProfileUpdateInput = {};

    // Map all possible fields
    if (updateDoctorProfileDto.specialization !== undefined)
      data.specialization = updateDoctorProfileDto.specialization;
    if (updateDoctorProfileDto.bio !== undefined)
      data.bio = updateDoctorProfileDto.bio;
    if (updateDoctorProfileDto.profileImageUrl !== undefined)
      data.profileImageUrl = updateDoctorProfileDto.profileImageUrl;

    // Professional info fields
    if (updateDoctorProfileDto.rppsNumber !== undefined)
      data.rppsNumber = updateDoctorProfileDto.rppsNumber;
    if (updateDoctorProfileDto.sirenNumber !== undefined)
      data.sirenNumber = updateDoctorProfileDto.sirenNumber;
    if (updateDoctorProfileDto.languagesSpoken !== undefined)
      data.languagesSpoken = updateDoctorProfileDto.languagesSpoken;
    if (updateDoctorProfileDto.diplomas !== undefined)
      data.diplomas = updateDoctorProfileDto.diplomas;
    if (updateDoctorProfileDto.additionalDiplomas !== undefined)
      data.additionalDiplomas = updateDoctorProfileDto.additionalDiplomas;
    if (updateDoctorProfileDto.publications !== undefined)
      data.publications = updateDoctorProfileDto.publications;
    if (updateDoctorProfileDto.signature !== undefined)
      data.signature = updateDoctorProfileDto.signature;
    if (updateDoctorProfileDto.absenceMessage !== undefined)
      data.absenceMessage = updateDoctorProfileDto.absenceMessage;
    if (updateDoctorProfileDto.tooManyAbsencesInfo !== undefined)
      data.tooManyAbsencesInfo = updateDoctorProfileDto.tooManyAbsencesInfo;

    console.log('[DoctorProfile.update] Update data prepared:', data);

    const result = await this.prisma.doctorProfile.update({
      where: { userId },
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
        clinic: true,
      },
    });

    console.log('[DoctorProfile.update] Update completed successfully');
    return result;
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
        clinic: true,
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
