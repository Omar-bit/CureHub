import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
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

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @IsBoolean()
  @IsOptional()
  locked?: boolean;

  @IsBoolean()
  @IsOptional()
  paid?: boolean;
}
