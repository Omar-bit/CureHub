import {
  IsString,
  IsBoolean,
  IsOptional,
  IsHexColor,
  MaxLength,
} from 'class-validator';

export class CreateModeExerciceDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsBoolean()
  nomDesPlages?: boolean;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateModeExerciceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsBoolean()
  nomDesPlages?: boolean;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ModeExerciceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}

