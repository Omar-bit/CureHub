import { Module } from '@nestjs/common';
import { TimeplanService } from './timeplan.service';
import { TimeplanController } from './timeplan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TimeplanController],
  providers: [TimeplanService],
  exports: [TimeplanService],
})
export class TimeplanModule {}
