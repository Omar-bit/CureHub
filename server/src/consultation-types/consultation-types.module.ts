import { Module } from '@nestjs/common';
import { ConsultationTypesService } from './consultation-types.service';
import { ConsultationTypesController } from './consultation-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConsultationTypesController],
  providers: [ConsultationTypesService],
  exports: [ConsultationTypesService],
})
export class ConsultationTypesModule {}
