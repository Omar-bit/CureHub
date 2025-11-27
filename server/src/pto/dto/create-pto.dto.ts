import {
  IsString,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePTODto {
  @ApiProperty({
    description: 'Label for the PTO period',
    example: 'Formation',
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Start date of the PTO period (YYYY-MM-DD)',
    example: '2025-12-22',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of the PTO period (YYYY-MM-DD)',
    example: '2026-01-03',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Number of announcements/reminders',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  announcements?: number;
}
