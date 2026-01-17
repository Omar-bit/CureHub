import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Patch,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import {
  PatientVerifyIdentifierDto,
  PatientLoginPasswordDto,
  PatientVerifyOTPDto,
} from './dto/patient-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @I18nLang() lang: string) {
    return await this.authService.register(registerDto, lang);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @I18nLang() lang: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto, lang);

    // Set HTTP-only cookie with production-friendly configuration
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'none', // isProduction ? 'none' : 'lax', // 'none' required for cross-site cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/', // Ensure cookie is available for all paths
    });

    // Return user data without the token
    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear cookie with same options as when setting it
    const isProduction = process.env.NODE_ENV === 'production';

    response.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none', //isProduction ? 'none' : 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: Omit<User, 'password'>) {
    return this.authService.getProfile(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  // Email verification endpoints
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @I18nLang() lang: string,
  ) {
    return await this.authService.verifyEmail(verifyEmailDto, lang);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(
    @Body() resendDto: ResendVerificationDto,
    @I18nLang() lang: string,
  ) {
    return await this.authService.resendVerificationEmail(resendDto, lang);
  }

  // Patient authentication endpoints
  @Public()
  @Post('patient/verify-identifier')
  @HttpCode(HttpStatus.OK)
  async verifyPatientIdentifier(
    @Body() verifyDto: PatientVerifyIdentifierDto,
    @I18nLang() lang: string,
  ) {
    return await this.authService.verifyPatientIdentifier(
      verifyDto.emailOrPhone,
      lang,
    );
  }

  @Public()
  @Post('patient/login-password')
  @HttpCode(HttpStatus.OK)
  async patientLoginWithPassword(
    @Body() loginDto: PatientLoginPasswordDto,
    @I18nLang() lang: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.patientLoginWithPassword(
      loginDto.patientId,
      loginDto.password,
      lang,
    );

    // Set HTTP-only cookie for patient
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookie('patient_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none', // isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return result;
  }

  @Public()
  @Post('patient/verify-otp')
  @HttpCode(HttpStatus.OK)
  async patientVerifyOTP(
    @Body() verifyDto: PatientVerifyOTPDto,
    @I18nLang() lang: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.patientVerifyOTP(
      verifyDto.patientId,
      verifyDto.otp,
      lang,
    );

    // Set HTTP-only cookie for patient
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookie('patient_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none', // isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return result;
  }

  @Post('patient/logout')
  @HttpCode(HttpStatus.OK)
  async patientLogout(@Res({ passthrough: true }) response: Response) {
    const isProduction = process.env.NODE_ENV === 'production';

    response.clearCookie('patient_token', {
      httpOnly: true,
      secure: isProduction,
      //!todo remove the comment later
      sameSite: 'none', //isProduction ? 'none' : 'lax',
      path: '/',
    });

    return { message: 'Patient logged out successfully' };
  }

  @Get('patient/profile')
  @UseGuards(JwtAuthGuard)
  async getPatientProfile(@CurrentUser() user: any) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }
    return await this.authService.getPatientProfile(patientId);
  }

  @Patch('patient/profile')
  @UseGuards(JwtAuthGuard)
  async updatePatientProfile(
    @CurrentUser() user: any,
    @Body() updatePatientProfileDto: any,
  ) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }
    return await this.authService.updatePatientProfile(
      patientId,
      updatePatientProfileDto,
    );
  }

  @Post('patient/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePatientPassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: any,
  ) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }
    return await this.authService.changePatientPassword(
      patientId,
      changePasswordDto,
    );
  }

  // Patient Relatives Endpoints

  @Get('patient/relatives')
  @UseGuards(JwtAuthGuard)
  async getPatientRelatives(@CurrentUser() user: any) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }
    return await this.authService.getPatientRelatives(patientId);
  }

  @Post('patient/relatives')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPatientRelative(
    @CurrentUser() user: any,
    @Body()
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
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }
    return await this.authService.createPatientRelative(patientId, body);
  }

  @Delete('patient/relatives/:relationshipId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePatientRelative(
    @CurrentUser() user: any,
    @Param('relationshipId') relationshipId: string,
  ) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }
    return await this.authService.removePatientRelative(
      patientId,
      relationshipId,
    );
  }

  @Get('patient/appointments')
  @UseGuards(JwtAuthGuard)
  async getPatientAppointments(@CurrentUser() user: any) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }
    return await this.authService.getPatientAppointments(patientId);
  }

  @Get('patient/documents')
  @UseGuards(JwtAuthGuard)
  async getPatientDocuments(@CurrentUser() user: any) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }
    return await this.authService.getPatientDocuments(patientId);
  }

  @Get('patient/documents/:documentId/download')
  @UseGuards(JwtAuthGuard)
  async downloadPatientDocument(
    @CurrentUser() user: any,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }

    const fileInfo = await this.authService.getPatientDocumentDownload(
      patientId,
      documentId,
    );

    const fs = await import('fs');
    const fileStream = fs.createReadStream(fileInfo.filePath);

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileInfo.originalName}"`,
    );

    fileStream.pipe(res);
  }

  @Patch('patient/documents/:documentId/pin')
  @UseGuards(JwtAuthGuard)
  async togglePatientDocumentPin(
    @CurrentUser() user: any,
    @Param('documentId') documentId: string,
  ) {
    const patientId = user.sub || user.id;
    if (!patientId) {
      throw new BadRequestException('Patient ID not found in token');
    }

    return await this.authService.togglePatientDocumentPin(
      patientId,
      documentId,
    );
  }
}
