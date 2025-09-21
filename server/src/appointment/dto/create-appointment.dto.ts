import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Appointment title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Appointment description', required: false })
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

  @ApiProperty({ description: 'Location or meeting link', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Doctor notes about the appointment',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Consultation type ID', required: false })
  @IsString()
  @IsOptional()
  consultationTypeId?: string;
}
