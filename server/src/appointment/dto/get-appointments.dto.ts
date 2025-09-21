import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class GetAppointmentsDto {
  @ApiProperty({
    description: 'Start date for filtering appointments',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering appointments',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Filter by appointment status',
    enum: AppointmentStatus,
    required: false,
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiProperty({ description: 'Filter by patient ID', required: false })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiProperty({
    description: 'Filter by consultation type ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  consultationTypeId?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 50,
  })
  @IsOptional()
  limit?: number;
}
