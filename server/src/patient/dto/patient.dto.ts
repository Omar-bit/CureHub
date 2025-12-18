import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @IsString()
  name: string;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  mobilePhoneList?: string;

  @IsOptional()
  @IsString()
  landlinePhone?: string;

  @IsOptional()
  @IsString()
  landlinePhoneList?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dejaVu?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  absenceCount?: number;

  @IsOptional()
  @IsString()
  divers?: string;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  mobilePhoneList?: string;

  @IsOptional()
  @IsString()
  landlinePhone?: string;

  @IsOptional()
  @IsString()
  landlinePhoneList?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dejaVu?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  absenceCount?: number;

  @IsOptional()
  @IsString()
  divers?: string;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

export class PatientQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  gender?: Gender;

  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;
}
