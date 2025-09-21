import {
  IsString,
  IsEnum,
  IsInt,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsHexColor,
  Min,
} from 'class-validator';
import { ConsultationLocation, ConsultationType } from '@prisma/client';

export class CreateConsultationTypeDto {
  @IsString()
  name: string;

  @IsHexColor()
  color: string;

  @IsEnum(ConsultationLocation)
  location: ConsultationLocation;

  @IsInt()
  @Min(1)
  duration: number;

  @IsInt()
  @Min(0)
  restAfter: number;

  @IsEnum(ConsultationType)
  type: ConsultationType;

  @IsInt()
  @Min(0)
  canBookBefore: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateConsultationTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsEnum(ConsultationLocation)
  location?: ConsultationLocation;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restAfter?: number;

  @IsOptional()
  @IsEnum(ConsultationType)
  type?: ConsultationType;

  @IsOptional()
  @IsInt()
  @Min(0)
  canBookBefore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class ConsultationTypeQueryDto {
  @IsOptional()
  @IsBoolean()
  enabledOnly?: boolean;

  @IsOptional()
  @IsEnum(ConsultationLocation)
  location?: ConsultationLocation;

  @IsOptional()
  @IsEnum(ConsultationType)
  type?: ConsultationType;
}
