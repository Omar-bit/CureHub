import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateAppointmentDocumentDto {
  @ApiProperty({ description: 'Appointment ID to link document to' })
  @IsString()
  appointmentId: string;

  @ApiPropertyOptional({
    description: 'Document category',
    enum: DocumentCategory,
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Block patient download from client space',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  blockClientDownload?: boolean;

  @ApiPropertyOptional({
    description: 'Date until which document can be shared with patient',
  })
  @IsOptional()
  @IsDateString()
  shareUntilDate?: string;
}
