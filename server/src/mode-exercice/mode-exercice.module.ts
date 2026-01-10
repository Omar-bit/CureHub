import { Module } from '@nestjs/common';
import { ModeExerciceService } from './mode-exercice.service';
import { ModeExerciceController } from './mode-exercice.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ModeExerciceController],
  providers: [ModeExerciceService],
  exports: [ModeExerciceService],
})
export class ModeExerciceModule {}

