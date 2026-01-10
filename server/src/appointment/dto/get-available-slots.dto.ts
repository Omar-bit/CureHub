import { IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAvailableSlotsDto {
  @ApiProperty({
    description: 'Date to check for available slots (YYYY-MM-DD format)',
    example: '2025-10-03',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Consultation type ID to check availability for',
    required: false,
  })
  @IsString()
  @IsOptional()
  consultationTypeId?: string;
}

export interface AvailableSlot {
  time: string; // ISO Date string (e.g., "2026-01-10T10:00:00.000Z")
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  consultationTypeId?: string;
  slots: AvailableSlot[];
}
