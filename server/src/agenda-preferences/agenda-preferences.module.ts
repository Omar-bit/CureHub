import { Module } from '@nestjs/common';
import { AgendaPreferencesController } from './agenda-preferences.controller';
import { AgendaPreferencesService } from './agenda-preferences.service';

@Module({
  controllers: [AgendaPreferencesController],
  providers: [AgendaPreferencesService],
  exports: [AgendaPreferencesService],
})
export class AgendaPreferencesModule {}
