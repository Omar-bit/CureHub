import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';

export class UpdateAppointmentDocumentDto {
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
