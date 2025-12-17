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
import { CreatePatientRelationshipDto } from './dto/create-patient-relationship.dto';
import { UpdatePatientPermissionsDto } from './dto/update-patient-permissions.dto';
import { UpdatePatientConsultationTypeAccessDto } from './dto/patient-consultation-type-access.dto';

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
        landlinePhone: true,
        address: true,
        postalCode: true,
        city: true,
        dejaVu: true,
        absenceCount: true,
        divers: true,
        isDeleted: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        canAddRelatives: true,
        canBookForRelatives: true,
        relatedPatients: {
          select: {
            id: true,
            relatedPatientId: true,
          },
        },
        relationshipsAsRelated: {
          select: {
            id: true,
            mainPatientId: true,
          },
        },
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
        landlinePhone: true,
        address: true,
        postalCode: true,
        city: true,
        dejaVu: true,
        absenceCount: true,
        divers: true,
        isDeleted: true,
        isBlocked: true,
        canAddRelatives: true,
        canBookForRelatives: true,
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
    const { email, dejaVu, ...patientData } = createPatientDto;

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

    // Handle dejaVu: if provided as a truthy value (1 or true from frontend), set to 1
    // Otherwise default to 0
    const dejaVuValue = dejaVu && dejaVu > 0 ? dejaVu : 0;

    const patient = await this.prisma.patient.create({
      data: {
        ...patientData,
        email,
        password: hashedPassword,
        dateOfBirth: new Date(createPatientDto.dateOfBirth),
        doctorId,
        dejaVu: dejaVuValue,
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
    const existingPatient = await this.findOne(id, doctorId);

    const { email, dejaVu, ...updateData } = updatePatientDto;

    // Check if email already exists for another patient
    if (email) {
      const existingPatientWithEmail = await this.prisma.patient.findFirst({
        where: {
          email,
          id: { not: id },
          isDeleted: false,
        },
      });

      if (existingPatientWithEmail) {
        throw new BadRequestException('Patient with this email already exists');
      }
    }

    const updatePayload: any = { ...updateData, email };

    if (updatePatientDto.dateOfBirth) {
      updatePayload.dateOfBirth = new Date(updatePatientDto.dateOfBirth);
    }

    // Handle dejaVu update:
    // If dejaVu is explicitly set to 0 (user set it to "non"), reset to 0
    // If dejaVu is set to a value > 0, use that value
    // If dejaVu is not provided (undefined), don't change it
    if (dejaVu !== undefined) {
      if (dejaVu === 0) {
        // User explicitly set dejaVu to "non" (0), reset the count
        updatePayload.dejaVu = 0;
      } else if (dejaVu > 0) {
        // User set dejaVu to a positive value
        // If the existing value is 0, set to the new value (minimum 1)
        if (existingPatient.dejaVu === 0) {
          updatePayload.dejaVu = dejaVu;
        }
        // Otherwise, keep the existing count (don't overwrite from UI)
      }
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

  /**
   * Increment absence count for a patient
   */
  async incrementAbsenceCount(id: string, doctorId: string) {
    // Check if patient exists and belongs to doctor
    await this.findOne(id, doctorId);

    return this.prisma.patient.update({
      where: { id },
      data: {
        absenceCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        name: true,
        absenceCount: true,
      },
    });
  }

  /**
   * Decrement absence count for a patient (minimum 0)
   */
  async decrementAbsenceCount(id: string, doctorId: string) {
    // Check if patient exists and belongs to doctor
    const patient = await this.findOne(id, doctorId);

    // Only decrement if absenceCount is greater than 0
    if (patient.absenceCount <= 0) {
      return {
        id: patient.id,
        name: patient.name,
        absenceCount: 0,
      };
    }

    return this.prisma.patient.update({
      where: { id },
      data: {
        absenceCount: {
          decrement: 1,
        },
      },
      select: {
        id: true,
        name: true,
        absenceCount: true,
      },
    });
  }

  // Patient Relationships Methods

  /**
   * Get all relatives (proches) of a patient
   */
  async getPatientRelatives(patientId: string, doctorId: string) {
    // Verify patient belongs to doctor
    await this.findOne(patientId, doctorId);

    const relationships = await this.prisma.patientRelationship.findMany({
      where: {
        mainPatientId: patientId,
      },
      include: {
        relatedPatient: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            profileImage: true,
            gender: true,
            email: true,
            phoneNumber: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return relationships;
  }

  /**
   * Create a new patient and link them as a relative
   */
  async createPatientWithRelationship(
    mainPatientId: string,
    doctorId: string,
    createPatientDto: CreatePatientDto,
    relationshipDto: CreatePatientRelationshipDto,
  ) {
    // Verify main patient belongs to doctor
    await this.findOne(mainPatientId, doctorId);

    // Validate relationship data
    if (
      relationshipDto.relationshipType === 'FAMILY' &&
      !relationshipDto.familyRelationship
    ) {
      throw new BadRequestException(
        'Family relationship type is required for FAMILY relationship',
      );
    }

    if (
      relationshipDto.relationshipType === 'OTHER' &&
      !relationshipDto.customRelationship
    ) {
      throw new BadRequestException(
        'Custom relationship description is required for OTHER relationship',
      );
    }

    // Create the new patient
    const newPatient = await this.create(doctorId, createPatientDto);

    // Create the relationship
    const relationship = await this.prisma.patientRelationship.create({
      data: {
        mainPatientId,
        relatedPatientId: newPatient.id,
        relationshipType: relationshipDto.relationshipType,
        familyRelationship: relationshipDto.familyRelationship,
        customRelationship: relationshipDto.customRelationship,
      },
      include: {
        relatedPatient: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            profileImage: true,
            gender: true,
            email: true,
            phoneNumber: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return relationship;
  }

  /**
   * Add an existing patient as a relative
   */
  async addExistingPatientAsRelative(
    mainPatientId: string,
    relatedPatientId: string,
    doctorId: string,
    relationshipDto: CreatePatientRelationshipDto,
  ) {
    // Verify both patients belong to doctor
    await this.findOne(mainPatientId, doctorId);
    await this.findOne(relatedPatientId, doctorId);

    // Check if they are the same patient
    if (mainPatientId === relatedPatientId) {
      throw new BadRequestException('Cannot add patient as their own relative');
    }

    // Check if relationship already exists
    const existingRelationship =
      await this.prisma.patientRelationship.findUnique({
        where: {
          mainPatientId_relatedPatientId: {
            mainPatientId,
            relatedPatientId,
          },
        },
      });

    if (existingRelationship) {
      throw new BadRequestException('Relationship already exists');
    }

    // Validate relationship data
    if (
      relationshipDto.relationshipType === 'FAMILY' &&
      !relationshipDto.familyRelationship
    ) {
      throw new BadRequestException(
        'Family relationship type is required for FAMILY relationship',
      );
    }

    if (
      relationshipDto.relationshipType === 'OTHER' &&
      !relationshipDto.customRelationship
    ) {
      throw new BadRequestException(
        'Custom relationship description is required for OTHER relationship',
      );
    }

    // Create the relationship
    const relationship = await this.prisma.patientRelationship.create({
      data: {
        mainPatientId,
        relatedPatientId,
        relationshipType: relationshipDto.relationshipType,
        familyRelationship: relationshipDto.familyRelationship,
        customRelationship: relationshipDto.customRelationship,
      },
      include: {
        relatedPatient: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            profileImage: true,
            gender: true,
            email: true,
            phoneNumber: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return relationship;
  }

  /**
   * Remove a patient relationship
   */
  async removePatientRelationship(relationshipId: string, doctorId: string) {
    const relationship = await this.prisma.patientRelationship.findUnique({
      where: { id: relationshipId },
      include: {
        mainPatient: true,
      },
    });

    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    // Verify main patient belongs to doctor
    if (relationship.mainPatient.doctorId !== doctorId) {
      throw new ForbiddenException('Unauthorized access to this relationship');
    }

    await this.prisma.patientRelationship.delete({
      where: { id: relationshipId },
    });

    return { message: 'Relationship removed successfully' };
  }

  /**
   * Update patient permissions for relatives
   */
  async updatePatientPermissions(
    patientId: string,
    doctorId: string,
    permissionsDto: UpdatePatientPermissionsDto,
  ) {
    // Verify patient belongs to doctor
    await this.findOne(patientId, doctorId);

    const updatedPatient = await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        canAddRelatives: permissionsDto.canAddRelatives,
        canBookForRelatives: permissionsDto.canBookForRelatives,
      },
      select: {
        id: true,
        name: true,
        canAddRelatives: true,
        canBookForRelatives: true,
      },
    });

    return updatedPatient;
  }

  /**
   * Get all consultation types with their access status for a patient
   */
  async getPatientConsultationTypeAccess(patientId: string, doctorId: string) {
    // Verify patient belongs to doctor
    await this.findOne(patientId, doctorId);

    // Get all consultation types for the doctor
    const consultationTypes = await this.prisma.doctorConsultationType.findMany(
      {
        where: {
          doctorId,
          enabled: true, // Only show enabled consultation types
        },
        select: {
          id: true,
          name: true,
          color: true,
          location: true,
          duration: true,
          price: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
    );

    // Get patient-specific access settings
    const accessSettings =
      await this.prisma.patientConsultationTypeAccess.findMany({
        where: {
          patientId,
        },
        select: {
          consultationTypeId: true,
          isEnabled: true,
        },
      });

    // Create a map for quick lookup
    const accessMap = new Map(
      accessSettings.map((access) => [
        access.consultationTypeId,
        access.isEnabled,
      ]),
    );

    // Combine consultation types with their access status
    return consultationTypes.map((ct) => ({
      ...ct,
      isEnabled: accessMap.has(ct.id) ? accessMap.get(ct.id) : true, // Default to enabled
    }));
  }

  /**
   * Update consultation type access for a patient
   */
  async updatePatientConsultationTypeAccess(
    patientId: string,
    doctorId: string,
    accessDto: UpdatePatientConsultationTypeAccessDto,
  ) {
    // Verify patient belongs to doctor
    await this.findOne(patientId, doctorId);

    // Verify consultation type belongs to doctor
    const consultationType = await this.prisma.doctorConsultationType.findFirst(
      {
        where: {
          id: accessDto.consultationTypeId,
          doctorId,
        },
      },
    );

    if (!consultationType) {
      throw new NotFoundException('Consultation type not found');
    }

    // Upsert the access record
    const access = await this.prisma.patientConsultationTypeAccess.upsert({
      where: {
        patientId_consultationTypeId: {
          patientId,
          consultationTypeId: accessDto.consultationTypeId,
        },
      },
      create: {
        patientId,
        consultationTypeId: accessDto.consultationTypeId,
        isEnabled: accessDto.isEnabled,
      },
      update: {
        isEnabled: accessDto.isEnabled,
      },
      include: {
        consultationType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      consultationTypeId: access.consultationTypeId,
      consultationTypeName: access.consultationType.name,
      isEnabled: access.isEnabled,
    };
  }

  /**
   * Check if a consultation type is enabled for a patient
   */
  async isConsultationTypeEnabledForPatient(
    patientId: string,
    consultationTypeId: string,
  ): Promise<boolean> {
    const access = await this.prisma.patientConsultationTypeAccess.findUnique({
      where: {
        patientId_consultationTypeId: {
          patientId,
          consultationTypeId,
        },
      },
    });

    // If no record exists, default to enabled
    return access ? access.isEnabled : true;
  }

  /**
   * Send a custom email to a patient
   */
  async sendEmailToPatient(
    patientId: string,
    doctorId: string,
    subject: string,
    message: string,
    doctorName: string,
  ): Promise<{ success: boolean; message: string }> {
    // Find the patient and verify ownership
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId,
        isDeleted: false,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!patient.email) {
      throw new BadRequestException("Ce patient n'a pas d'adresse email");
    }

    // Get patient name (replace !SP! with space)
    const patientName = patient.name.replace(/!SP!/g, ' ');

    // Send the email
    const emailSent = await this.emailService.sendCustomPatientEmail(
      patient.email,
      patientName,
      doctorName,
      subject,
      message,
    );

    if (!emailSent) {
      throw new BadRequestException(
        "Échec de l'envoi de l'email. Veuillez vérifier l'adresse email et réessayer.",
      );
    }

    return {
      success: true,
      message: `Email envoyé avec succès à ${patient.email}`,
    };
  }
}
