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
import { ConsultationType } from '@prisma/client';

export class CreateConsultationTypeDto {
  @IsString()
  name: string;

  @IsHexColor()
  color: string;

  @IsString()
  modeExerciceId: string;

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
  @IsString()
  modeExerciceId?: string;

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
  @IsString()
  modeExerciceId?: string;

  @IsOptional()
  @IsEnum(ConsultationType)
  type?: ConsultationType;
}
