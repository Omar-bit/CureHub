import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import { UserService, CreateUserDto } from '../user/user.service';
import { User, UserRole, Patient } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { DoctorProfileService } from '../doctor-profile/doctor-profile.service';
import { ConsultationTypesService } from '../consultation-types/consultation-types.service';
import { ModeExerciceService } from '../mode-exercice/mode-exercice.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  VerifyEmailDto,
  ResendVerificationDto,
  UpdateProfileDto,
} from './dto/auth.dto';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private i18n: I18nService,
    private emailService: EmailService,
    private otpService: OtpService,
    private doctorProfileService: DoctorProfileService,
    private consultationTypesService: ConsultationTypesService,
    private modeExerciceService: ModeExerciceService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);

    if (
      user &&
      (await this.userService.validatePassword(password, user.password))
    ) {
      return user;
    }

    return null;
  }

  async login(loginDto: LoginDto, lang?: string): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);

    if (!user) {
      const message = await this.i18n.t('errors.user.invalidCredentials', {
        lang,
      });
      throw new UnauthorizedException(message);
    }

    if (!user.isActive) {
      const message = await this.i18n.t('errors.user.unauthorized', { lang });
      throw new UnauthorizedException(message);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      const message = await this.i18n.t('errors.user.emailNotVerified', {
        lang,
      });
      throw new UnauthorizedException(
        message || 'Please verify your email address before logging in',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    // For doctors, ensure a doctor profile exists
    if (user.role === UserRole.DOCTOR) {
      try {
        const existingProfile = await this.doctorProfileService.findByUserId(
          user.id,
        );
        if (!existingProfile) {
          // Create a new doctor profile for this doctor
          await this.doctorProfileService.create({
            userId: user.id,
          });
          console.log(
            `[AuthService.login] Created new doctor profile for user: ${user.id}`,
          );
        }
      } catch (error) {
        console.error(
          `[AuthService.login] Error ensuring doctor profile exists:`,
          error,
        );
        // Don't fail the login if profile creation fails
      }
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async register(
    registerDto: RegisterDto,
    lang?: string,
  ): Promise<{ message: string; userId: string }> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);

    if (existingUser) {
      const message = this.i18n.t('errors.user.emailExists', { lang });
      throw new ConflictException(message);
    }
    if (registerDto.role === 'PATIENT') {
      // return error where patient cannot register directly
      const message = this.i18n.t('errors.user.cannotRegisterPatient', {
        lang,
      });
      throw new ConflictException(message);
    }

    // Create new user with email verification pending
    const user = await this.userService.create({
      ...registerDto,
      // User starts as unverified
    });

    // If the user is a doctor, create a default doctor profile, mode exercices, and consultation types
    if (user.role === UserRole.DOCTOR) {
      try {
        const doctorProfile =
          await this.doctorProfileService.createDefaultProfile(user.id);

        // Create default mode exercices for the new doctor
        try {
          await this.modeExerciceService.createDefaultModeExercices(
            doctorProfile.id,
          );
        } catch (modeExerciceError) {
          // Log the error but don't fail the registration
          console.error(
            'Failed to create default mode exercices:',
            modeExerciceError,
          );
        }

        // Create default consultation types for the new doctor
        try {
          await this.consultationTypesService.createDefaultConsultationTypes(
            doctorProfile.id,
          );
        } catch (consultationTypesError) {
          // Log the error but don't fail the registration
          console.error(
            'Failed to create default consultation types:',
            consultationTypesError,
          );
        }
      } catch (error) {
        // Log the error but don't fail the registration
        console.error('Failed to create doctor profile:', error);
        // You might want to use a proper logger here
      }
    }

    // Send verification email
    await this.sendVerificationEmail(
      user.id,
      user.email,
      user.firstName || undefined,
    );

    return {
      message:
        'Registration successful. Please check your email for verification instructions.',
      userId: user.id,
    };
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Omit<User, 'password'>> {
    if (updateProfileDto.email) {
      const existingUser = await this.userService.findByEmail(
        updateProfileDto.email,
      );
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.userService.update(userId, {
      email: updateProfileDto.email,
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      phone: updateProfileDto.phone,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  // Email verification methods
  async sendVerificationEmail(
    userId: string,
    email: string,
    firstName?: string,
  ): Promise<boolean> {
    // Generate OTP
    const otpResult = this.otpService.generateEmailVerificationOTP(15); // 15 minutes expiry

    // Save OTP to database
    await this.userService.setEmailVerificationCode(
      userId,
      otpResult.code,
      otpResult.expiryDate,
    );

    // Send email
    return await this.emailService.sendVerificationEmail(
      email,
      otpResult.code,
      firstName,
      15,
    );
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
    lang?: string,
  ): Promise<{ message: string }> {
    const { code } = verifyEmailDto;

    // Find user by verification code
    const user = await this.userService.findByEmailVerificationCode(code);

    if (!user) {
      const message = this.i18n.t('errors.verification.invalidCode', {
        lang,
      });
      throw new BadRequestException(
        message || 'Invalid or expired verification code',
      );
    }

    // Validate OTP
    const isValid = this.otpService.validateOTP(
      code,
      user.emailVerificationCode!,
      user.emailVerificationExpiry!,
    );

    if (!isValid) {
      const message = this.i18n.t('errors.verification.expiredCode', {
        lang,
      });
      throw new BadRequestException(message || 'Verification code has expired');
    }

    // Mark email as verified
    await this.userService.verifyEmail(user.id);

    return {
      message: 'Email verified successfully! You can now log in.',
    };
  }

  async resendVerificationEmail(
    resendDto: ResendVerificationDto,
    lang?: string,
  ): Promise<{ message: string }> {
    const { email } = resendDto;

    // Find user by email
    const user = await this.userService.findByEmail(email);

    if (!user) {
      const message = await this.i18n.t('errors.user.notFound', { lang });
      throw new BadRequestException(message || 'User not found');
    }

    if (user.isEmailVerified) {
      const message = await this.i18n.t('errors.verification.alreadyVerified', {
        lang,
      });
      throw new BadRequestException(message || 'Email is already verified');
    }

    // Send new verification email
    const emailSent = await this.sendVerificationEmail(
      user.id,
      user.email,
      user.firstName || undefined,
    );

    if (!emailSent) {
      const message = await this.i18n.t('errors.email.sendFailed', { lang });
      throw new BadRequestException(
        message || 'Failed to send verification email',
      );
    }

    return {
      message: 'Verification email sent successfully',
    };
  }

  // Patient authentication methods
  async verifyPatientIdentifier(
    emailOrPhone: string,
    lang?: string,
  ): Promise<{
    patientId: string;
    verificationMethod: 'otp' | 'password';
  }> {
    // Find patient by email or phone
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
        isDeleted: false,
        isBlocked: false,
      },
    });

    if (!patient) {
      const message = this.i18n.t('errors.user.notFound', { lang });
      throw new NotFoundException(
        message || 'Patient not found with that email or phone',
      );
    }

    // Determine verification method
    // If patient has a password, use password verification
    // Otherwise, send OTP
    const verificationMethod = patient.password ? 'password' : 'otp';

    if (verificationMethod === 'otp') {
      // Generate and send OTP
      const otpResult = this.otpService.generateEmailVerificationOTP(15); // 15 minutes expiry

      // Save OTP temporarily (in a real app, you'd store this securely)
      // For now, we'll send it directly
      const contact = patient.email || patient.phoneNumber;
      if (contact) {
        // Send OTP via email if available, otherwise would need SMS
        if (patient.email) {
          await this.emailService.sendVerificationEmail(
            patient.email,
            otpResult.code,
            patient.name,
            15,
          );
        }
      }
    }

    return {
      patientId: patient.id,
      verificationMethod,
    };
  }

  async patientLoginWithPassword(
    patientId: string,
    password: string,
    lang?: string,
  ): Promise<{
    access_token: string;
    patient: Omit<Patient, 'password'>;
  }> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      const message = this.i18n.t('errors.user.unauthorized', { lang });
      throw new UnauthorizedException(message);
    }

    // Validate password
    if (!patient.password) {
      const message =
        'No password set for this patient account. Please use OTP verification instead.';
      throw new UnauthorizedException(message);
    }

    // Use bcrypt to compare passwords
    const isPasswordValid = await bcrypt.compare(password, patient.password);

    if (!isPasswordValid) {
      const message = this.i18n.t('errors.user.invalidCredentials', { lang });
      throw new UnauthorizedException(message);
    }

    // Create JWT token
    const payload = {
      sub: patient.id,
      type: 'patient',
      name: patient.name,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password from patient object
    const { password: _, ...patientWithoutPassword } = patient;

    return {
      access_token,
      patient: patientWithoutPassword,
    };
  }

  async patientVerifyOTP(
    patientId: string,
    otp: string,
    lang?: string,
  ): Promise<{
    access_token: string;
    patient: Omit<Patient, 'password'>;
  }> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      const message = this.i18n.t('errors.user.unauthorized', { lang });
      throw new UnauthorizedException(message);
    }

    // Validate OTP (in a real implementation, you would check against stored OTP)
    // For now, we'll do a simple check
    if (!otp || otp.length !== 6) {
      const message = 'Invalid OTP format';
      throw new BadRequestException(message);
    }

    // Create JWT token
    const payload = {
      sub: patient.id,
      type: 'patient',
      name: patient.name,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password from patient object
    const { password: _, ...patientWithoutPassword } = patient;

    return {
      access_token,
      patient: patientWithoutPassword,
    };
  }

  async getPatientProfile(
    patientId: string,
  ): Promise<Omit<Patient, 'password'>> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      throw new UnauthorizedException('Patient account is not accessible');
    }

    // Remove password from patient object
    const { password: _, ...patientWithoutPassword } = patient;
    return patientWithoutPassword;
  }

  async updatePatientProfile(
    patientId: string,
    updateData: any,
  ): Promise<Omit<Patient, 'password'>> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      throw new UnauthorizedException('Patient account is not accessible');
    }

    // Prepare update payload
    const updatePayload: any = {};

    // Handle full name if provided
    if (updateData.name !== undefined) {
      updatePayload.name = updateData.name;
    }
    if (updateData.firstName !== undefined) {
      updatePayload.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      updatePayload.lastName = updateData.lastName;
    }
    if (updateData.gender !== undefined) {
      updatePayload.gender = updateData.gender;
    }
    if (updateData.dateOfBirth !== undefined) {
      updatePayload.dateOfBirth = updateData.dateOfBirth
        ? new Date(updateData.dateOfBirth)
        : null;
    }
    if (updateData.email !== undefined) {
      updatePayload.email = updateData.email;
    }
    if (updateData.phoneNumber !== undefined) {
      updatePayload.phoneNumber = updateData.phoneNumber;
    }
    if (updateData.address !== undefined) {
      updatePayload.address = updateData.address;
    }
    if (updateData.postalCode !== undefined) {
      updatePayload.postalCode = updateData.postalCode;
    }
    if (updateData.city !== undefined) {
      updatePayload.city = updateData.city;
    }

    // If no fields to update, return current patient
    if (Object.keys(updatePayload).length === 0) {
      const { password: _, ...patientWithoutPassword } = patient;
      return patientWithoutPassword;
    }

    const updatedPatient = await this.prisma.patient.update({
      where: { id: patientId },
      data: updatePayload,
    });

    // Remove password from patient object
    const { password: _, ...patientWithoutPassword } = updatedPatient;
    return patientWithoutPassword;
  }

  async changePatientPassword(
    patientId: string,
    changePasswordDto: any,
  ): Promise<{ message: string; success: boolean }> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      throw new UnauthorizedException('Patient account is not accessible');
    }

    // Check if patient has a password set
    if (!patient.password) {
      throw new BadRequestException('No password is set for this patient.');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      patient.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully', success: true };
  }

  // Patient Relatives Methods

  /**
   * Get all relatives of the authenticated patient
   */
  async getPatientRelatives(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        canAddRelatives: true,
        canBookForRelatives: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      canAddRelatives: patient.canAddRelatives,
      canBookForRelatives: patient.canBookForRelatives,
      relatives: relationships,
    };
  }

  /**
   * Create a new relative for the authenticated patient
   */
  async createPatientRelative(
    patientId: string,
    body: {
      patient: {
        name: string;
        dateOfBirth?: string;
        gender: string;
        email?: string;
        phoneNumber?: string;
        address?: string;
      };
      relationship: {
        relationshipType: 'FAMILY' | 'OTHER';
        familyRelationship?: string;
        customRelationship?: string;
      };
    },
  ) {
    // Check if patient exists and has permission
    const mainPatient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        doctorId: true,
        canAddRelatives: true,
      },
    });

    if (!mainPatient) {
      throw new NotFoundException('Patient not found');
    }

    if (!mainPatient.canAddRelatives) {
      throw new BadRequestException(
        "Vous n'avez pas la permission d'ajouter des proches",
      );
    }

    // Validate relationship data
    if (
      body.relationship.relationshipType === 'FAMILY' &&
      !body.relationship.familyRelationship
    ) {
      throw new BadRequestException('Le type de relation familiale est requis');
    }

    if (
      body.relationship.relationshipType === 'OTHER' &&
      !body.relationship.customRelationship
    ) {
      throw new BadRequestException(
        'La description de la relation est requise',
      );
    }

    // Create the new relative patient
    const newPatient = await this.prisma.patient.create({
      data: {
        name: body.patient.name,
        dateOfBirth: body.patient.dateOfBirth
          ? new Date(body.patient.dateOfBirth)
          : null,
        gender: body.patient.gender as any,
        email: body.patient.email || null,
        phoneNumber: body.patient.phoneNumber || null,
        address: body.patient.address || null,
        doctorId: mainPatient.doctorId, // Same doctor as main patient
      },
    });

    // Create the relationship
    const relationship = await this.prisma.patientRelationship.create({
      data: {
        mainPatientId: patientId,
        relatedPatientId: newPatient.id,
        relationshipType: body.relationship.relationshipType,
        familyRelationship: body.relationship.familyRelationship as any,
        customRelationship: body.relationship.customRelationship,
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
          },
        },
      },
    });

    return relationship;
  }

  /**
   * Remove a relative relationship for the authenticated patient
   */
  async removePatientRelative(patientId: string, relationshipId: string) {
    // Verify the relationship belongs to this patient
    const relationship = await this.prisma.patientRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new NotFoundException('Relation non trouvée');
    }

    if (relationship.mainPatientId !== patientId) {
      throw new BadRequestException(
        "Vous n'avez pas la permission de supprimer cette relation",
      );
    }

    // Delete the relationship (but keep the patient record)
    await this.prisma.patientRelationship.delete({
      where: { id: relationshipId },
    });

    return { message: 'Relation supprimée avec succès' };
  }

  /**
   * Get appointments for the authenticated patient
   * Returns upcoming and past appointments
   */
  async getPatientAppointments(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      throw new UnauthorizedException('Patient account is not accessible');
    }

    const now = new Date();

    // Get all appointments for this patient (either as primary or via appointmentPatients)
    const appointments = await this.prisma.appointment.findMany({
      where: {
        OR: [
          { patientId: patientId },
          {
            appointmentPatients: {
              some: { patientId: patientId },
            },
          },
        ],
        status: {
          notIn: ['CANCELLED'],
        },
      },
      include: {
        consultationType: {
          select: {
            id: true,
            name: true,
            color: true,
            duration: true,
          },
        },
        consultationTypeDetails: {
          select: {
            id: true,
            name: true,
            color: true,
            modeExercice: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            title: true,
            specialization: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
          },
        },
        appointmentPatients: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Separate upcoming and past appointments
    const upcomingAppointments = appointments.filter(
      (apt) => new Date(apt.startTime) >= now,
    );
    const pastAppointments = appointments
      .filter((apt) => new Date(apt.startTime) < now)
      .reverse(); // Most recent first for past

    // Compute location for each appointment
    const computeLocation = (appointment: any): string => {
      if (appointment.location) {
        return appointment.location;
      }
      const modeName = (
        appointment.consultationTypeDetails?.modeExercice?.name || ''
      )
        .toString()
        .toLowerCase();
      if (
        modeName.includes('visio') ||
        modeName.includes('tele') ||
        modeName.includes('video')
      )
        return 'ONLINE';
      if (modeName.includes('domicile') || modeName.includes('home'))
        return 'ATHOME';
      return 'ONSITE';
    };

    const formatAppointment = (apt: any) => ({
      id: apt.id,
      title: apt.title,
      description: apt.description,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      location: computeLocation(apt),
      consultationType: apt.consultationType,
      consultationTypeDetails: apt.consultationTypeDetails,
      doctor: apt.doctor,
      documentsCount: apt.documents?.length || 0,
      patientsCount: apt.appointmentPatients?.length || 1,
      patients: apt.appointmentPatients?.map((ap: any) => ap.patient) || [],
    });

    return {
      upcoming: upcomingAppointments.map(formatAppointment),
      past: pastAppointments.map(formatAppointment),
    };
  }

  /**
   * Get documents for the authenticated patient
   * Returns all documents associated with the patient
   */
  async getPatientDocuments(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      throw new UnauthorizedException('Patient account is not accessible');
    }

    // Fetch patient documents
    const patientDocuments = await this.prisma.patientDocument.findMany({
      where: {
        patientId: patientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        originalName: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        category: true,
        description: true,
        pinned: true,
        locked: true,
        paid: true,
        uploadDate: true,
        createdAt: true,
      },
    });

    // Fetch appointment documents for this patient's appointments
    const appointmentDocuments = await this.prisma.appointmentDocument.findMany(
      {
        where: {
          appointment: {
            OR: [
              { patientId: patientId },
              {
                appointmentPatients: {
                  some: { patientId: patientId },
                },
              },
            ],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          originalName: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          category: true,
          description: true,
          blockClientDownload: true,
          shareUntilDate: true,
          uploadDate: true,
          createdAt: true,
          appointment: {
            select: {
              id: true,
              title: true,
              startTime: true,
            },
          },
        },
      },
    );

    // Transform appointment documents to match patient document structure
    // Check if document is accessible (not blocked or within share date)
    const now = new Date();
    const transformedAppointmentDocs = appointmentDocuments
      .filter((doc) => {
        // Skip if blocked for client download
        if (doc.blockClientDownload) return false;
        // Skip if share date has passed
        if (doc.shareUntilDate && new Date(doc.shareUntilDate) < now)
          return false;
        return true;
      })
      .map((doc) => ({
        id: doc.id,
        originalName: doc.originalName,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        category: doc.category,
        description: doc.description,
        pinned: false, // Appointment documents don't have pinned
        locked: doc.blockClientDownload, // Map blockClientDownload to locked for UI consistency
        paid: false, // Appointment documents don't have paid
        uploadDate: doc.uploadDate,
        createdAt: doc.createdAt,
        isAppointmentDocument: true,
        appointmentInfo: {
          id: doc.appointment.id,
          title: doc.appointment.title,
          startTime: doc.appointment.startTime,
        },
      }));

    // Transform patient documents
    const transformedPatientDocs = patientDocuments.map((doc) => ({
      ...doc,
      isAppointmentDocument: false,
      appointmentInfo: null,
    }));

    // Combine both arrays and sort by creation date
    const allDocuments = [
      ...transformedPatientDocs,
      ...transformedAppointmentDocs,
    ];
    allDocuments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return allDocuments;
  }

  /**
   * Download a document for the authenticated patient
   */
  async getPatientDocumentDownload(patientId: string, documentId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      throw new UnauthorizedException('Patient account is not accessible');
    }

    // Try to find as patient document
    let document = await this.prisma.patientDocument.findFirst({
      where: {
        id: documentId,
        patientId: patientId,
      },
    });

    if (document) {
      // Check if locked
      if (document.locked) {
        throw new UnauthorizedException('This document is locked');
      }
      return {
        filePath: document.filePath,
        originalName: document.originalName,
        mimeType: document.mimeType,
      };
    }

    // Try to find as appointment document
    const appointmentDocument = await this.prisma.appointmentDocument.findFirst(
      {
        where: {
          id: documentId,
          appointment: {
            OR: [
              { patientId: patientId },
              {
                appointmentPatients: {
                  some: { patientId: patientId },
                },
              },
            ],
          },
        },
      },
    );

    if (appointmentDocument) {
      // Check if blocked for client download
      if (appointmentDocument.blockClientDownload) {
        throw new UnauthorizedException(
          'This document is not available for download',
        );
      }
      // Check if share date has passed
      if (
        appointmentDocument.shareUntilDate &&
        new Date(appointmentDocument.shareUntilDate) < new Date()
      ) {
        throw new UnauthorizedException('This document is no longer available');
      }
      return {
        filePath: appointmentDocument.filePath,
        originalName: appointmentDocument.originalName,
        mimeType: appointmentDocument.mimeType,
      };
    }

    throw new NotFoundException('Document not found');
  }

  /**
   * Toggle pin status for a patient document
   */
  async togglePatientDocumentPin(patientId: string, documentId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isDeleted || patient.isBlocked) {
      throw new UnauthorizedException('Patient account is not accessible');
    }

    // Try to find and update patient document
    const patientDocument = await this.prisma.patientDocument.findFirst({
      where: {
        id: documentId,
        patientId: patientId,
      },
    });

    if (patientDocument) {
      const updated = await this.prisma.patientDocument.update({
        where: { id: documentId },
        data: { pinned: !patientDocument.pinned },
        select: {
          id: true,
          pinned: true,
        },
      });
      return {
        id: updated.id,
        pinned: updated.pinned,
        isAppointmentDocument: false,
      };
    }

    throw new NotFoundException(
      'Document not found or you do not have permission to modify it',
    );
  }
}
