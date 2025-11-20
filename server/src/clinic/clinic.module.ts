import { Module } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { ClinicController } from './clinic.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DoctorProfileModule } from '../doctor-profile/doctor-profile.module';

@Module({
  imports: [PrismaModule, DoctorProfileModule],
  controllers: [ClinicController],
  providers: [ClinicService],
  exports: [ClinicService],
})
export class ClinicModule {}
