import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { AgendaPreferencesService } from './agenda-preferences.service';
import { UpdateAgendaPreferencesDto } from './dto/update-agenda-preferences.dto';

@Controller('agenda-preferences')
@UseGuards(JwtAuthGuard)
export class AgendaPreferencesController {
  constructor(
    private readonly agendaPreferencesService: AgendaPreferencesService,
  ) {}

  @Get()
  async getPreferences(@CurrentUser() user) {
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException(
        'Only doctors can access agenda preferences',
      );
    }
    if (!user.doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }
    return this.agendaPreferencesService.getPreferences(user.doctorProfile.id);
  }

  @Put()
  async updatePreferences(
    @CurrentUser() user,
    @Body() updateDto: UpdateAgendaPreferencesDto,
  ) {
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException(
        'Only doctors can update agenda preferences',
      );
    }
    if (!user.doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }
    return this.agendaPreferencesService.updatePreferences(
      user.doctorProfile.id,
      updateDto,
    );
  }
}
