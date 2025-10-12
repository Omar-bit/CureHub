import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTimeplanDto, CreateTimeSlotDto } from './create-timeplan.dto';
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTimeSlotDto {
  @IsOptional()
  @IsString()
  id?: string; // Include ID for updating existing time slots

  @IsOptional()
  @IsString()
  startTime?: string; // Format: "HH:mm"

  @IsOptional()
  @IsString()
  endTime?: string; // Format: "HH:mm"

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  consultationTypeIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTimeplanDto extends OmitType(
  PartialType(CreateTimeplanDto),
  ['timeSlots'] as const,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTimeSlotDto)
  timeSlots?: UpdateTimeSlotDto[];
}
