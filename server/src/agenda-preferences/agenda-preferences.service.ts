import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAgendaPreferencesDto } from './dto/update-agenda-preferences.dto';
import { SchoolVacationZone } from '@prisma/client';

@Injectable()
export class AgendaPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(doctorId: string) {
    const preferences = await this.prisma.agendaPreferences.findUnique({
      where: { doctorProfileId: doctorId },
    });

    // Return default preferences if none exist
    if (!preferences) {
      return {
        mainColor: '#FFA500',
        startHour: 8,
        endHour: 20,
        verticalZoom: 1.0,
        schoolVacationZone: 'C',
      };
    }

    return preferences;
  }

  async updatePreferences(
    doctorId: string,
    updateDto: UpdateAgendaPreferencesDto,
  ) {
    const data: any = {
      mainColor: updateDto.mainColor,
      startHour: updateDto.startHour,
      endHour: updateDto.endHour,
      verticalZoom: updateDto.verticalZoom,
      schoolVacationZone: updateDto.schoolVacationZone as SchoolVacationZone,
    };

    const preferences = await this.prisma.agendaPreferences.upsert({
      where: { doctorProfileId: doctorId },
      update: data,
      create: {
        ...data,
        doctorProfileId: doctorId,
      },
    });

    return preferences;
  }
}
