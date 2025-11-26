import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentHistoryService } from './appointment-history.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ImprevuModule } from '../imprevu/imprevu.module';

@Module({
  imports: [PrismaModule, ImprevuModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentHistoryService],
  exports: [AppointmentService, AppointmentHistoryService],
})
export class AppointmentModule {}
