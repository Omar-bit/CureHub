import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  PatientQueryDto,
} from './dto/patient.dto';
import { Patient, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class PatientService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll(doctorId: string, query: PatientQueryDto) {
    const { search, gender, includeDeleted = false } = query;

    const where: any = {
      doctorId,
      isDeleted: includeDeleted ? undefined : false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phoneNumber: { contains: search } },
      ];
    }

    if (gender) {
      where.gender = gender;
    }

    return this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        profileImage: true,
        gender: true,
        email: true,
        phoneNumber: true,
        address: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, doctorId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        doctorId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        profileImage: true,
        gender: true,
        email: true,
        phoneNumber: true,
        address: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async create(doctorId: string, createPatientDto: CreatePatientDto) {
    const { email, ...patientData } = createPatientDto;

    // Check if email already exists for another patient
    if (email) {
      const existingPatient = await this.prisma.patient.findFirst({
        where: {
          email,
          isDeleted: false,
        },
      });

      if (existingPatient) {
        throw new BadRequestException('Patient with this email already exists');
      }
    }

    let password: string | null = null;
    let hashedPassword: string | null = null;

    // Generate random password if email is provided
    if (email) {
      password = this.generateRandomPassword();
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const patient = await this.prisma.patient.create({
      data: {
        ...patientData,
        email,
        password: hashedPassword,
        dateOfBirth: new Date(createPatientDto.dateOfBirth),
        doctorId,
      },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        profileImage: true,
        gender: true,
        email: true,
        phoneNumber: true,
        address: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send welcome email with password if email is provided
    if (email && password) {
      try {
        await this.emailService.sendPatientWelcomeEmail(
          patient.email as string,
          patient.name,
          password,
        );
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't throw error here as patient is already created
      }
    }

    return patient;
  }

  async update(
    id: string,
    doctorId: string,
    updatePatientDto: UpdatePatientDto,
  ) {
    // Check if patient exists and belongs to doctor
    await this.findOne(id, doctorId);

    const { email, ...updateData } = updatePatientDto;

    // Check if email already exists for another patient
    if (email) {
      const existingPatient = await this.prisma.patient.findFirst({
        where: {
          email,
          id: { not: id },
          isDeleted: false,
        },
      });

      if (existingPatient) {
        throw new BadRequestException('Patient with this email already exists');
      }
    }

    const updatePayload: any = { ...updateData, email };

    if (updatePatientDto.dateOfBirth) {
      updatePayload.dateOfBirth = new Date(updatePatientDto.dateOfBirth);
    }

    return this.prisma.patient.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        profileImage: true,
        gender: true,
        email: true,
        phoneNumber: true,
        address: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, doctorId: string) {
    // Check if patient exists and belongs to doctor
    await this.findOne(id, doctorId);

    // Soft delete the patient
    return this.prisma.patient.update({
      where: { id },
      data: { isDeleted: true },
      select: {
        id: true,
        name: true,
        isDeleted: true,
      },
    });
  }

  async restore(id: string, doctorId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        doctorId,
        isDeleted: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Deleted patient not found');
    }

    return this.prisma.patient.update({
      where: { id },
      data: { isDeleted: false },
      select: {
        id: true,
        name: true,
        isDeleted: true,
      },
    });
  }

  private generateRandomPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
