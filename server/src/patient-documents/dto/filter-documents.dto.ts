import { IsEnum, IsOptional } from 'class-validator';
import { DocumentCategory } from '@prisma/client';

export class FilterDocumentsDto {
  @IsEnum(DocumentCategory)
  @IsOptional()
  category?: DocumentCategory;

  @IsOptional()
  search?: string;
}
