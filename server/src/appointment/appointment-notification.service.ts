import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentNotificationService
  implements OnModuleInit, OnModuleDestroy
{
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly logger = new Logger(AppointmentNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  onModuleInit() {
    // Run every minute to check for upcoming appointments to rappel
    this.intervalId = setInterval(() => this.processRappels(), 60 * 1000);
    this.logger.log('AppointmentNotificationService started (rappel checker)');
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId as unknown as number);
    this.logger.log('AppointmentNotificationService stopped');
  }

  private async processRappels() {
    console.log('Running Reminder Check...');
    try {
      const now = new Date();
      const windowMinutes = 30; // remind for appointments within next 30 minutes
      const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);
      const appointments = await this.prisma.appointment.findMany({
        where: {
          notifyRappel: true,
          rappelSentAt: null,
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
          startTime: {
            gte: now,
            lte: windowEnd,
          },
        },
        include: {
          patient: true,
          appointmentPatients: { include: { patient: true } },
          doctor: { include: { user: true } },
        },
      });
      console.log('Found', appointments.length, 'appointments to rappel');
      for (const apt of appointments) {
        const recipients = new Set<string>();
        if (apt.patient?.email) recipients.add(apt.patient.email);
        if (apt.appointmentPatients && apt.appointmentPatients.length > 0) {
          for (const ap of apt.appointmentPatients) {
            if (ap.patient?.email) recipients.add(ap.patient.email);
          }
        }

        const start = new Date(apt.startTime);
        const appointmentTime = `${start.toLocaleDateString()} ${start.toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit',
          },
        )}`;

        const doctorName = apt.doctor?.user
          ? `${apt.doctor.user.firstName || ''} ${apt.doctor.user.lastName || ''}`.trim()
          : apt.doctor?.title || 'Votre médecin';

        for (const email of recipients) {
          try {
            const message = apt.rappelMessage
              ? apt.rappelMessage
              : `Rappel: votre rendez-vous est prévu le ${appointmentTime}.`;
            console.log('Sending rappel to', email, 'with message:', message);
            await this.emailService.sendCustomPatientEmail(
              email,
              apt.patient?.name || 'Patient',
              doctorName,
              'Rappel de rendez-vous',
              message,
            );
          } catch (error) {
            this.logger.error(
              'Failed to send rappel to ' + email,
              error as any,
            );
          }
        }

        // Mark rappel as sent
        await this.prisma.appointment.update({
          where: { id: apt.id },
          data: { rappelSentAt: new Date() },
        });
      }
    } catch (error) {
      this.logger.error('Error processing rappels', error as any);
    }
  }
}
