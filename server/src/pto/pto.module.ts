import { Module } from '@nestjs/common';
import { PTOController } from './pto.controller';
import { PTOService } from './pto.service';
import { HolidaysService } from './holidays.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PTOController],
  providers: [PTOService, HolidaysService],
  exports: [PTOService, HolidaysService],
})
export class PTOModule {}
