import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentHistoryService } from '../appointment/appointment-history.service';
import { CreateAppointmentDocumentDto } from './dto/create-appointment-document.dto';
import { UpdateAppointmentDocumentDto } from './dto/update-appointment-document.dto';
import { FilterAppointmentDocumentsDto } from './dto/filter-appointment-documents.dto';
import { DocumentCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppointmentDocumentsService {
  constructor(
    private prisma: PrismaService,
    private appointmentHistory: AppointmentHistoryService,
  ) {}

  async uploadDocument(
    file: any,
    createDocumentDto: CreateAppointmentDocumentDto,
    doctorId: string,
  ) {
    // Validate doctorId
    if (!doctorId) {
      throw new UnauthorizedException('Doctor profile not found');
    }

    // Verify appointment belongs to the doctor
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: createDocumentDto.appointmentId,
        doctorId: doctorId,
      },
    });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found or does not belong to this doctor',
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      'appointments',
      'documents',
    );
    const filePath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save document record to database
    const document = await this.prisma.appointmentDocument.create({
      data: {
        originalName: file.originalname,
        fileName: fileName,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: createDocumentDto.category || DocumentCategory.AUTRE,
        description: createDocumentDto.description,
        appointment: {
          connect: {
            id: createDocumentDto.appointmentId,
          },
        },
        doctor: {
          connect: {
            id: doctorId,
          },
        },
      },
      include: {
        appointment: {
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        },
      },
    });

    // Log document upload in history
    await this.appointmentHistory.logDocumentUpload(
      createDocumentDto.appointmentId,
      doctorId,
      file.originalname,
      createDocumentDto.category,
    );

    return document;
  }

  async getAppointmentDocuments(
    appointmentId: string,
    doctorId: string,
    filters?: FilterAppointmentDocumentsDto,
  ) {
    // Verify appointment belongs to the doctor
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorId,
      },
    });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found or does not belong to this doctor',
      );
    }

    const whereClause: any = {
      appointmentId: appointmentId,
      doctorId: doctorId,
    };

    if (filters?.category) {
      whereClause.category = filters.category;
    }

    if (filters?.search) {
      whereClause.OR = [
        { originalName: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const documents = await this.prisma.appointmentDocument.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        appointment: {
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        },
      },
    });

    return documents;
  }

  async getDocument(documentId: string, doctorId: string) {
    const document = await this.prisma.appointmentDocument.findFirst({
      where: {
        id: documentId,
        doctorId: doctorId,
      },
      include: {
        appointment: {
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async updateDocument(
    documentId: string,
    updateDocumentDto: UpdateAppointmentDocumentDto,
    doctorId: string,
  ) {
    const document = await this.prisma.appointmentDocument.findFirst({
      where: {
        id: documentId,
        doctorId: doctorId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updatedDocument = await this.prisma.appointmentDocument.update({
      where: { id: documentId },
      data: updateDocumentDto,
      include: {
        appointment: {
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        },
      },
    });

    return updatedDocument;
  }

  async deleteDocument(documentId: string, doctorId: string) {
    const document = await this.prisma.appointmentDocument.findFirst({
      where: {
        id: documentId,
        doctorId: doctorId,
      },
      include: {
        appointment: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from disk
    try {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete document record from database
    await this.prisma.appointmentDocument.delete({
      where: { id: documentId },
    });

    // Log document deletion in history
    await this.appointmentHistory.logDocumentDeletion(
      document.appointmentId,
      doctorId,
      document.originalName,
    );

    return { message: 'Document deleted successfully' };
  }

  async downloadDocument(documentId: string, doctorId: string) {
    const document = await this.prisma.appointmentDocument.findFirst({
      where: {
        id: documentId,
        doctorId: doctorId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return {
      filePath: document.filePath,
      originalName: document.originalName,
      mimeType: document.mimeType,
    };
  }

  async getDocumentCategories() {
    return Object.values(DocumentCategory).map((category) => ({
      value: category,
      label: this.getCategoryLabel(category),
    }));
  }

  private getCategoryLabel(category: DocumentCategory): string {
    const labels = {
      [DocumentCategory.PHARMACIE]: 'Pharmacie',
      [DocumentCategory.BIOLOGIE]: 'Biologie',
      [DocumentCategory.RADIOLOGIE]: 'Radiologie',
      [DocumentCategory.OPTIQUE]: 'Optique',
      [DocumentCategory.MATERIEL]: 'Matériel',
      [DocumentCategory.AUTRE]: 'Autre',
      [DocumentCategory.COMPTES_RENDUS]: 'Comptes rendus',
      [DocumentCategory.IMAGERIE]: 'Imagerie',
      [DocumentCategory.OPERATION]: 'Opération',
      [DocumentCategory.CONSULTATION]: 'Consultation',
      [DocumentCategory.HOSPITALISATION]: 'Hospitalisation',
      [DocumentCategory.SOINS_PARAMEDICAUX]: 'Soins paramédicaux',
      [DocumentCategory.KINE]: 'Kiné',
      [DocumentCategory.INFIRMIER]: 'Infirmier',
      [DocumentCategory.PODOLOGUE]: 'Podologue',
      [DocumentCategory.ORTHOPTISTE]: 'Orthoptiste',
      [DocumentCategory.ORTHOPHONISTE]: 'Orthophoniste',
      [DocumentCategory.ADMINISTRATIF]: 'Administratif',
      [DocumentCategory.COURRIER]: 'Courrier',
      [DocumentCategory.CERTIFICAT]: 'Certificat',
      [DocumentCategory.HONORAIRES]: 'Honoraires',
      [DocumentCategory.CONSENTEMENT]: 'Consentement',
      [DocumentCategory.ASSURANCE]: 'Assurance',
      [DocumentCategory.DEVIS]: 'Devis',
    };
    return labels[category] || category;
  }
}
