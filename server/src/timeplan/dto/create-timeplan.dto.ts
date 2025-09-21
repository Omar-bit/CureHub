import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

export class CreateTimeSlotDto {
  @IsString()
  startTime: string; // Format: "HH:mm"

  @IsString()
  endTime: string; // Format: "HH:mm"

  @IsArray()
  @IsString({ each: true })
  consultationTypeIds: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class CreateTimeplanDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimeSlotDto)
  timeSlots: CreateTimeSlotDto[];
}
