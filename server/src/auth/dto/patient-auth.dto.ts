import { IsString, IsOptional, Length } from 'class-validator';

export class PatientVerifyIdentifierDto {
  @IsString()
  emailOrPhone: string;
}

export class PatientLoginPasswordDto {
  @IsString()
  patientId: string;

  @IsString()
  password: string;
}

export class PatientVerifyOTPDto {
  @IsString()
  patientId: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 characters long' })
  otp: string;

  @IsString()
  emailOrPhone: string;
}
