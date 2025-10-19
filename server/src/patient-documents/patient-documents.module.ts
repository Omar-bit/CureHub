import { Module } from '@nestjs/common';
import { PatientDocumentsService } from './patient-documents.service';
import { PatientDocumentsController } from './patient-documents.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientDocumentsController],
  providers: [PatientDocumentsService],
  exports: [PatientDocumentsService],
})
export class PatientDocumentsModule {}
