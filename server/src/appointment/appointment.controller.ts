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
  GetAvailableSlotsDto,
  AvailableSlotsResponse,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.create(
      req.user.doctorProfile.id,
      createAppointmentDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all appointments for the doctor' })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req, @Query() query: GetAppointmentsDto) {
    return this.appointmentService.findAll(req.user.doctorProfile.id, query);
  }

  @Get('upcoming')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get upcoming appointments for the doctor' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming appointments retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
  getUpcoming(@Request() req, @Query('limit') limit?: number) {
    return this.appointmentService.getUpcomingAppointments(
      req.user.doctorProfile.id,
      limit,
    );
  }

  @Get('available-slots')
  @ApiOperation({
    summary: 'Get available time slots for booking appointments',
    description:
      "Returns available 15-minute time slots for a specific date and consultation type. Considers doctor's schedule, existing appointments, and consultation duration.",
  })
  @ApiResponse({
    status: 200,
    description: 'Available time slots retrieved successfully',
    type: 'object',
    schema: {
      properties: {
        date: { type: 'string', example: '2025-10-03' },
        consultationTypeId: { type: 'string', nullable: true },
        slots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string', example: '09:00' },
              available: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid date format or parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation type not found',
  })
  @UseGuards(JwtAuthGuard)
  getAvailableSlots(
    @Request() req,
    @Query() query: GetAvailableSlotsDto,
  ): Promise<AvailableSlotsResponse> {
    return this.appointmentService.getAvailableSlots(
      req.user.doctorProfile.id,
      new Date(query.date),
      query.consultationTypeId,
    );
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Get appointments for a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Appointments for the date retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.remove(id, req.user.doctorProfile.id);
  }
}
