import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskPriority, TaskCategory } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  patientIds?: string[];
  // @IsUUID(undefined, { each: true })
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  patientIds?: string[];
  // @IsUUID(undefined, { each: true })
}

export class TaskQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsDateString()
  deadlineBefore?: string;

  @IsOptional()
  @IsDateString()
  deadlineAfter?: string;
}
