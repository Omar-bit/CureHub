import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseEnumPipe,
  ForbiddenException,
} from '@nestjs/common';
import { DayOfWeek } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TimeplanService } from './timeplan.service';
import { CreateTimeplanDto, UpdateTimeplanDto } from './dto';

@Controller('timeplan')
@UseGuards(JwtAuthGuard)
export class TimeplanController {
  constructor(private readonly timeplanService: TimeplanService) {}

  @Get()
  async getDoctorTimeplan(@CurrentUser() user) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile) {
      throw new ForbiddenException('Only doctors can access timeplan');
    }

    const doctorId = user.doctorProfile.id;
    return this.timeplanService.getTimeplanByDoctor(doctorId);
  }

  @Get(':dayOfWeek')
  async getDoctorTimeplanByDay(
    @CurrentUser() user,
    @Param('dayOfWeek', new ParseEnumPipe(DayOfWeek)) dayOfWeek: DayOfWeek,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile) {
      throw new ForbiddenException('Only doctors can access timeplan');
    }

    const doctorId = user.doctorProfile.id;
    return this.timeplanService.getTimeplanByDoctorAndDay(doctorId, dayOfWeek);
  }

  @Post()
  async createOrUpdateTimeplan(
    @CurrentUser() user,
    @Body() createTimeplanDto: CreateTimeplanDto,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage timeplan');
    }

    const doctorId = user.doctorProfile.id;
    return this.timeplanService.createOrUpdateTimeplan(
      doctorId,
      createTimeplanDto,
    );
  }

  @Put(':dayOfWeek')
  async updateTimeplan(
    @CurrentUser() user,
    @Param('dayOfWeek', new ParseEnumPipe(DayOfWeek)) dayOfWeek: DayOfWeek,
    @Body() updateTimeplanDto: UpdateTimeplanDto,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage timeplan');
    }

    const doctorId = user.doctorProfile.id;
    return this.timeplanService.updateTimeplan(
      doctorId,
      dayOfWeek,
      updateTimeplanDto,
    );
  }

  @Delete(':dayOfWeek')
  async deleteTimeplan(
    @CurrentUser() user,
    @Param('dayOfWeek', new ParseEnumPipe(DayOfWeek)) dayOfWeek: DayOfWeek,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage timeplan');
    }

    const doctorId = user.doctorProfile.id;
    return this.timeplanService.deleteTimeplan(doctorId, dayOfWeek);
  }

  @Delete('time-slot/:timeSlotId')
  async deleteTimeSlot(
    @CurrentUser() user,
    @Param('timeSlotId') timeSlotId: string,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage timeplan');
    }

    const doctorId = user.doctorProfile.id;
    return this.timeplanService.deleteTimeSlot(doctorId, timeSlotId);
  }
}
