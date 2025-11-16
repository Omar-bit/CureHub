import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';

export class FilterAppointmentDocumentsDto {
  @ApiPropertyOptional({
    description: 'Filter by document category',
    enum: DocumentCategory,
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({
    description: 'Search in document name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
