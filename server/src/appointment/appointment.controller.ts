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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { AppointmentHistoryService } from './appointment-history.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  GetAppointmentsDto,
  GetAvailableSlotsDto,
  AvailableSlotsResponse,
  UpdateAppointmentStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly appointmentHistoryService: AppointmentHistoryService,
  ) {}

  private getDoctorProfileId(req: any): string {
    if (!req.user?.doctorProfile?.id) {
      throw new BadRequestException('Only doctors can access appointments');
    }
    return req.user.doctorProfile.id;
  }

  // Get the location from the appointment. Prefer the database `location` field,
  // then try to derive from `consultationTypeDetails.modeExercice.name`, then legacy `consultationType.location`.
  private computeAppointmentLocation(appointment: any): string {
    // If appointment already has a location field from the database, use it
    if (appointment?.location) {
      return appointment.location;
    }

    // Otherwise, derive from modeExercice or fallback
    const modeName = (
      appointment?.consultationTypeDetails?.modeExercice?.name ||
      appointment?.consultationType?.location ||
      ''
    )
      .toString()
      .toLowerCase();

    if (
      modeName.includes('visio') ||
      modeName.includes('tele') ||
      modeName.includes('video')
    )
      return 'ONLINE';
    if (modeName.includes('domicile') || modeName.includes('home'))
      return 'ATHOME';
    return 'ONSITE';
  }

  private attachLocationToAppointment(appointment: any) {
    if (!appointment) return appointment;
    return {
      ...appointment,
      location: this.computeAppointmentLocation(appointment),
    };
  }

  private attachLocationToAppointments(list: any) {
    // If the service returned a plain array of appointments
    if (Array.isArray(list)) {
      return list.map((a) => this.attachLocationToAppointment(a));
    }

    // If the service returned a paginated object { appointments: [], total, ... }
    if (list && Array.isArray(list.appointments)) {
      return {
        ...list,
        appointments: list.appointments.map((a: any) =>
          this.attachLocationToAppointment(a),
        ),
      };
    }

    // Unknown shape - return as-is
    return list;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new appointment' })
  // Note: payload may include `consultationTypeDetailsId` to link the appointment
  // to a `DoctorConsultationType` in addition to the `Acte` (consultationTypeId).
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
    const doctorProfileId = this.getDoctorProfileId(req);
    return this.appointmentService
      .create(doctorProfileId, createAppointmentDto)
      .then((appt) => this.attachLocationToAppointment(appt));
  }
  // A3MAL KACHAA AAA
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all appointments for the doctor' })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req, @Query() query: GetAppointmentsDto) {
    // NOTE: This endpoint returns an array of appointments; attach a computed
    // `location` property to each appointment for easier client rendering.
    const doctorProfileId = this.getDoctorProfileId(req);
    const list = await this.appointmentService.findAll(doctorProfileId, query);
    return this.attachLocationToAppointments(list);
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
    const doctorProfileId = this.getDoctorProfileId(req);
    return this.appointmentService
      .getUpcomingAppointments(doctorProfileId, limit)
      .then((list) => this.attachLocationToAppointments(list));
  }

  @Get('available-slots')
  @ApiOperation({
    summary: 'Get available time slots for booking appointments',
    description:
      "Returns available time slots for a specific date based on the consultation type's duration. For example, a 45-minute consultation with 8h-12h availability will generate slots at 8:00, 8:45, 9:30, 10:15, 11:00. Considers doctor's schedule, existing appointments, and consultation duration.",
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
    const doctorProfileId = this.getDoctorProfileId(req);

    // Parse date string explicitly to avoid timezone issues
    // "2026-01-12" should always mean January 12, 2026 in local time
    const [year, month, day] = query.date.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return this.appointmentService.getAvailableSlots(
      doctorProfileId,
      date,
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
    const doctorProfileId = this.getDoctorProfileId(req);
    return this.appointmentService
      .getAppointmentsByDate(doctorProfileId, new Date(date))
      .then((list) => this.attachLocationToAppointments(list));
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
  findOne(@Request() req, @Param('id') id: string) {
    const doctorProfileId = this.getDoctorProfileId(req);
    return this.appointmentService
      .findOne(id, doctorProfileId)
      .then((a) => this.attachLocationToAppointment(a));
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
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    const doctorProfileId = this.getDoctorProfileId(req);
    return this.appointmentService
      .update(id, doctorProfileId, updateAppointmentDto)
      .then((a) => this.attachLocationToAppointment(a));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({
    status: 200,
    description: 'Appointment status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ) {
    const doctorProfileId = this.getDoctorProfileId(req);
    return this.appointmentService.updateStatus(
      id,
      doctorProfileId,
      updateStatusDto.status,
    );
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get appointment history' })
  @ApiResponse({
    status: 200,
    description: 'Appointment history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req, @Param('id') id: string) {
    // Verify ownership first
    await this.appointmentService.findOne(id, req.user.doctorProfile.id);
    return this.appointmentHistoryService.getAppointmentHistory(id);
  }

  @Post(':id/notify-absence')
  @ApiOperation({ summary: 'Send absence notification to patient' })
  @ApiResponse({
    status: 200,
    description: 'Absence notification sent successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({
    status: 400,
    description: 'No patients with email addresses found',
  })
  @UseGuards(JwtAuthGuard)
  async notifyAbsence(@Request() req, @Param('id') id: string) {
    const doctorProfileId = this.getDoctorProfileId(req);
    return this.appointmentService.sendAbsenceNotification(id, doctorProfileId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @UseGuards(JwtAuthGuard)
  remove(@Request() req, @Param('id') id: string) {
    const doctorProfileId = this.getDoctorProfileId(req);
    return this.appointmentService.remove(id, doctorProfileId);
  }
}
