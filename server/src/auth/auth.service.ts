import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { UserService, CreateUserDto } from '../user/user.service';
import { User, UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { DoctorProfileService } from '../doctor-profile/doctor-profile.service';
import { ConsultationTypesService } from '../consultation-types/consultation-types.service';
import { VerifyEmailDto, ResendVerificationDto } from './dto/auth.dto';

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

    // If the user is a doctor, create a default doctor profile and consultation types
    if (user.role === UserRole.DOCTOR) {
      try {
        const doctorProfile =
          await this.doctorProfileService.createDefaultProfile(user.id);

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
}
