import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DocumentCategory } from '@prisma/client';

export class UpdatePatientDocumentDto {
  @IsString()
  @IsOptional()
  originalName?: string;

  @IsEnum(DocumentCategory)
  @IsOptional()
  category?: DocumentCategory;

  @IsString()
  @IsOptional()
  description?: string;
}
