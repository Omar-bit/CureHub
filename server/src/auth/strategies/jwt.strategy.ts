import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Check for patient_token first (for patient routes)
          if (request?.cookies?.patient_token) {
            return request.cookies.patient_token;
          }
          // Fall back to access_token (for doctor routes)
          return request?.cookies?.access_token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback for API calls
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // Check if this is a patient token or user token
    if (payload.type === 'patient') {
      const patient = await this.prismaService.patient.findUnique({
        where: { id: payload.sub },
      });

      if (!patient || patient.isDeleted || patient.isBlocked) {
        throw new UnauthorizedException();
      }

      // Remove password from patient object
      const { password: _, ...patientWithoutPassword } = patient;
      return patientWithoutPassword;
    }

    // Regular user validation for doctor accounts
    const user = await this.userService.findOne(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    // Remove password from the returned user object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
