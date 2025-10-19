import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDocumentDto } from './dto/create-patient-document.dto';
import { UpdatePatientDocumentDto } from './dto/update-patient-document.dto';
import { FilterDocumentsDto } from './dto/filter-documents.dto';
import { DocumentCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PatientDocumentsService {
  constructor(private prisma: PrismaService) {}

  async uploadDocument(
    file: any,
    createDocumentDto: CreatePatientDocumentDto,
    doctorId: string,
  ) {
    // Validate doctorId
    if (!doctorId) {
      throw new UnauthorizedException('Doctor profile not found');
    }

    // Verify patient belongs to the doctor
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: createDocumentDto.patientId,
        doctorId: doctorId,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        'Patient not found or does not belong to this doctor',
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    const filePath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save document record to database
    const document = await this.prisma.patientDocument.create({
      data: {
        originalName: file.originalname,
        fileName: fileName,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: createDocumentDto.category || DocumentCategory.AUTRE,
        description: createDocumentDto.description,
        patient: {
          connect: {
            id: createDocumentDto.patientId,
          },
        },
        doctor: {
          connect: {
            id: doctorId,
          },
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return document;
  }

  async getPatientDocuments(
    patientId: string,
    doctorId: string,
    filters?: FilterDocumentsDto,
  ) {
    // Verify patient belongs to the doctor
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId: doctorId,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        'Patient not found or does not belong to this doctor',
      );
    }

    const whereClause: any = {
      patientId: patientId,
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

    const documents = await this.prisma.patientDocument.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return documents;
  }

  async getDocument(documentId: string, doctorId: string) {
    const document = await this.prisma.patientDocument.findFirst({
      where: {
        id: documentId,
        doctorId: doctorId,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
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
    updateDocumentDto: UpdatePatientDocumentDto,
    doctorId: string,
  ) {
    const document = await this.prisma.patientDocument.findFirst({
      where: {
        id: documentId,
        doctorId: doctorId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updatedDocument = await this.prisma.patientDocument.update({
      where: { id: documentId },
      data: updateDocumentDto,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedDocument;
  }

  async deleteDocument(documentId: string, doctorId: string) {
    const document = await this.prisma.patientDocument.findFirst({
      where: {
        id: documentId,
        doctorId: doctorId,
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
    await this.prisma.patientDocument.delete({
      where: { id: documentId },
    });

    return { message: 'Document deleted successfully' };
  }

  async downloadDocument(documentId: string, doctorId: string) {
    const document = await this.prisma.patientDocument.findFirst({
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
