import {
  IsString,
  IsBoolean,
  IsOptional,
  IsHexColor,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateConsultationTypeDto {
  @IsString()
  name: string;

  @IsString()
  modeExerciceId: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsArray()
  acteIds?: (string | null)[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateConsultationTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  modeExerciceId?: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsArray()
  acteIds?: (string | null)[];

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
}
