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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { AppointmentDocumentsService } from './appointment-documents.service';
import {
  CreateAppointmentDocumentDto,
  UpdateAppointmentDocumentDto,
  FilterAppointmentDocumentsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as fs from 'fs';

@ApiTags('appointment-documents')
@ApiBearerAuth()
@Controller('appointment-documents')
@UseGuards(JwtAuthGuard)
export class AppointmentDocumentsController {
  constructor(
    private readonly appointmentDocumentsService: AppointmentDocumentsService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document for an appointment' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async uploadDocument(
    @UploadedFile() file: any,
    @Body() createDocumentDto: CreateAppointmentDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentDocumentsService.uploadDocument(
      file,
      createDocumentDto,
      user.doctorProfile?.id,
    );
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get all documents for an appointment' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getAppointmentDocuments(
    @Param('appointmentId') appointmentId: string,
    @Query() filters: FilterAppointmentDocumentsDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentDocumentsService.getAppointmentDocuments(
      appointmentId,
      user.doctorProfile?.id,
      filters,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all document categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getDocumentCategories() {
    return this.appointmentDocumentsService.getDocumentCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentDocumentsService.getDocument(
      id,
      user.doctorProfile?.id,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateAppointmentDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentDocumentsService.updateDocument(
      id,
      updateDocumentDto,
      user.doctorProfile?.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentDocumentsService.deleteDocument(
      id,
      user.doctorProfile?.id,
    );
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document or file not found' })
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const fileInfo = await this.appointmentDocumentsService.downloadDocument(
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
