import { Module } from '@nestjs/common';
import { AppointmentDocumentsService } from './appointment-documents.service';
import { AppointmentDocumentsController } from './appointment-documents.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentDocumentsController],
  providers: [AppointmentDocumentsService],
  exports: [AppointmentDocumentsService],
})
export class AppointmentDocumentsModule {}
