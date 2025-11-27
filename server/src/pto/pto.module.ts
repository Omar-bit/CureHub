import { Module } from '@nestjs/common';
import { PTOController } from './pto.controller';
import { PTOService } from './pto.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PTOController],
  providers: [PTOService],
  exports: [PTOService],
})
export class PTOModule {}
