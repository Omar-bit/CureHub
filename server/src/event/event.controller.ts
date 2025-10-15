import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  create(@Request() req, @Body() createEventDto: CreateEventDto) {
    return this.eventService.create(req.user.doctorProfile.id, createEventDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.eventService.findAll(req.user.doctorProfile.id);
  }

  @Get('date-range')
  findByDateRange(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.eventService.findByDateRange(
      req.user.doctorProfile.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.eventService.findOne(id, req.user.doctorProfile.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.update(
      id,
      req.user.doctorProfile.id,
      updateEventDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.eventService.remove(id, req.user.doctorProfile.id);
  }
}
