import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PatientDocumentsService } from './patient-documents.service';
import { CreatePatientDocumentDto } from './dto/create-patient-document.dto';
import { UpdatePatientDocumentDto } from './dto/update-patient-document.dto';
import { FilterDocumentsDto } from './dto/filter-documents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import * as fs from 'fs';

@Controller('patient-documents')
@UseGuards(JwtAuthGuard)
export class PatientDocumentsController {
  constructor(
    private readonly patientDocumentsService: PatientDocumentsService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: any,
    @Body() createDocumentDto: CreatePatientDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.patientDocumentsService.uploadDocument(
      file,
      createDocumentDto,
      user.doctorProfile?.id,
    );
  }

  @Get('patient/:patientId')
  async getPatientDocuments(
    @Param('patientId') patientId: string,
    @Query() filters: FilterDocumentsDto,
    @CurrentUser() user: any,
  ) {
    return this.patientDocumentsService.getPatientDocuments(
      patientId,
      user.doctorProfile?.id,
      filters,
    );
  }

  @Get('categories')
  async getDocumentCategories() {
    return this.patientDocumentsService.getDocumentCategories();
  }

  @Get(':id')
  async getDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.patientDocumentsService.getDocument(id, user.doctorProfile?.id);
  }

  @Put(':id')
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdatePatientDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.patientDocumentsService.updateDocument(
      id,
      updateDocumentDto,
      user.doctorProfile?.id,
    );
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.patientDocumentsService.deleteDocument(
      id,
      user.doctorProfile?.id,
    );
  }

  @Get(':id/download')
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const fileInfo = await this.patientDocumentsService.downloadDocument(
      id,
      user.doctorProfile?.id,
    );

    const fileStream = fs.createReadStream(fileInfo.filePath);

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileInfo.originalName}"`,
    );

    fileStream.pipe(res);
  }
}
