import { Module } from '@nestjs/common';
import { ActeService } from './acte.service';
import { ActeController } from './acte.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActeController],
  providers: [ActeService],
  exports: [ActeService],
})
export class ActeModule {}
