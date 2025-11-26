import { Module } from '@nestjs/common';
import { ImprevuService } from './imprevu.service';
import { ImprevuController } from './imprevu.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImprevuController],
  providers: [ImprevuService],
  exports: [ImprevuService],
})
export class ImprevuModule {}
