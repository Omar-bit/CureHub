import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Appointment title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description:
      'Motif de consultation (consultation reason) - visible to patient',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Start date and time',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End date and time',
    example: '2024-01-15T11:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: 'Appointment status',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiProperty({
    description:
      'Note privée (private note) - visible only to doctor, not to patient',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Patient ID (optional for visitor appointments)',
    required: false,
  })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiProperty({
    description: 'Array of patient IDs for appointments with multiple patients',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  patientIds?: string[];

  @ApiProperty({ description: 'Consultation type ID', required: false })
  @IsString()
  @IsOptional()
  consultationTypeId?: string;

  @ApiProperty({
    description: 'Skip conflict checking (for manual time selection)',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  skipConflictCheck?: boolean;
}
