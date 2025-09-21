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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  GetAppointmentsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors or time conflicts',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient or consultation type not found',
  })
  create(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(
      req.user.doctorProfile.id,
      createAppointmentDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments for the doctor' })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved successfully',
  })
  findAll(@Request() req, @Query() query: GetAppointmentsDto) {
    return this.appointmentService.findAll(req.user.doctorProfile.id, query);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments for the doctor' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming appointments retrieved successfully',
  })
  getUpcoming(@Request() req, @Query('limit') limit?: number) {
    return this.appointmentService.getUpcomingAppointments(
      req.user.doctorProfile.id,
      limit,
    );
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Get appointments for a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Appointments for the date retrieved successfully',
  })
  getByDate(@Request() req, @Param('date') date: string) {
    return this.appointmentService.getAppointmentsByDate(
      req.user.doctorProfile.id,
      new Date(date),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Appointment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.findOne(id, req.user.doctorProfile.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors or time conflicts',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.update(
      id,
      req.user.doctorProfile.id,
      updateAppointmentDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.remove(id, req.user.doctorProfile.id);
  }
}
