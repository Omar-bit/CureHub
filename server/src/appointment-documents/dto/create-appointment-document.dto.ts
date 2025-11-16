import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';

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
}
