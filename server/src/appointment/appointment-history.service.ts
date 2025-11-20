import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppointmentHistoryAction,
  Appointment,
  AppointmentHistory,
} from '@prisma/client';

export interface HistoryChangeFields {
  field: string;
  oldValue: any;
  newValue: any;
}

@Injectable()
export class AppointmentHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a history entry for appointment creation
   */
  async logCreation(
    appointmentId: string,
    doctorId: string,
    appointmentData: any,
  ): Promise<AppointmentHistory> {
    const metadata = {
      patientIds: appointmentData.patientIds || [appointmentData.patientId],
      consultationTypeId: appointmentData.consultationTypeId,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
    };

    return this.prisma.appointmentHistory.create({
      data: {
        appointmentId,
        doctorId,
        action: AppointmentHistoryAction.CREATED,
        description: 'Rendez-vous créé',
        metadata,
      },
    });
  }

  /**
   * Create a history entry for appointment updates
   */
  async logUpdate(
    appointmentId: string,
    doctorId: string,
    changes: HistoryChangeFields[],
  ): Promise<AppointmentHistory> {
    const changedFields = changes.reduce(
      (acc, change) => {
        acc[change.field] = {
          before: change.oldValue,
          after: change.newValue,
        };
        return acc;
      },
      {} as Record<string, any>,
    );

    const description = this.generateUpdateDescription(changes);

    return this.prisma.appointmentHistory.create({
      data: {
        appointmentId,
        doctorId,
        action: AppointmentHistoryAction.UPDATED,
        description,
        changedFields,
      },
    });
  }

  /**
   * Create a history entry for status changes
   */
  async logStatusChange(
    appointmentId: string,
    doctorId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<AppointmentHistory> {
    const statusLabels = {
      SCHEDULED: "En salle d'attente",
      CONFIRMED: 'Confirmé',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Patient vu',
      CANCELLED: 'Annulé',
      ABSENT: 'Patient absent',
    };

    return this.prisma.appointmentHistory.create({
      data: {
        appointmentId,
        doctorId,
        action: AppointmentHistoryAction.STATUS_CHANGED,
        description: `Statut modifié : ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}`,
        changedFields: {
          status: {
            before: oldStatus,
            after: newStatus,
          },
        },
      },
    });
  }

  /**
   * Create a history entry for document uploads
   */
  async logDocumentUpload(
    appointmentId: string,
    doctorId: string,
    documentName: string,
    documentCategory?: string,
  ): Promise<AppointmentHistory> {
    return this.prisma.appointmentHistory.create({
      data: {
        appointmentId,
        doctorId,
        action: AppointmentHistoryAction.DOCUMENT_UPLOADED,
        description: `Document ajouté : ${documentName}`,
        metadata: {
          documentName,
          category: documentCategory,
        },
      },
    });
  }

  /**
   * Create a history entry for document deletions
   */
  async logDocumentDeletion(
    appointmentId: string,
    doctorId: string,
    documentName: string,
  ): Promise<AppointmentHistory> {
    return this.prisma.appointmentHistory.create({
      data: {
        appointmentId,
        doctorId,
        action: AppointmentHistoryAction.DOCUMENT_DELETED,
        description: `Document supprimé : ${documentName}`,
        metadata: {
          documentName,
        },
      },
    });
  }

  /**
   * Create a history entry for rescheduling
   */
  async logReschedule(
    appointmentId: string,
    doctorId: string,
    oldStartTime: Date,
    oldEndTime: Date,
    newStartTime: Date,
    newEndTime: Date,
  ): Promise<AppointmentHistory> {
    return this.prisma.appointmentHistory.create({
      data: {
        appointmentId,
        doctorId,
        action: AppointmentHistoryAction.RESCHEDULED,
        description: `Horaire modifié`,
        changedFields: {
          startTime: {
            before: oldStartTime,
            after: newStartTime,
          },
          endTime: {
            before: oldEndTime,
            after: newEndTime,
          },
        },
      },
    });
  }

  /**
   * Create a history entry for consultation type changes
   */
  async logConsultationTypeChange(
    appointmentId: string,
    doctorId: string,
    oldTypeName: string | null,
    newTypeName: string | null,
  ): Promise<AppointmentHistory> {
    return this.prisma.appointmentHistory.create({
      data: {
        appointmentId,
        doctorId,
        action: AppointmentHistoryAction.CONSULTATION_TYPE_CHANGED,
        description: `Type de consultation modifié : ${oldTypeName || 'Aucun'} → ${newTypeName || 'Aucun'}`,
        changedFields: {
          consultationType: {
            before: oldTypeName,
            after: newTypeName,
          },
        },
      },
    });
  }

  /**
   * Get all history entries for an appointment
   */
  async getAppointmentHistory(
    appointmentId: string,
  ): Promise<AppointmentHistory[]> {
    return this.prisma.appointmentHistory.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Generate a human-readable description of changes
   */
  private generateUpdateDescription(changes: HistoryChangeFields[]): string {
    const fieldLabels = {
      title: 'Titre',
      description: 'Description',
      notes: 'Notes',
      startTime: 'Heure de début',
      endTime: 'Heure de fin',
    };

    const changedFieldNames = changes
      .map((c) => fieldLabels[c.field] || c.field)
      .join(', ');

    return `Rendez-vous modifié : ${changedFieldNames}`;
  }
}
