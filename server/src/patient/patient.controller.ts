import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  PatientQueryDto,
} from './dto/patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: PatientQueryDto) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can access patient records');
    }

    return this.patientService.findAll(user.doctorProfile.id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can access patient records');
    }

    return this.patientService.findOne(id, user.doctorProfile.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createPatientDto: CreatePatientDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can create patient records');
    }

    return this.patientService.create(user.doctorProfile.id, createPatientDto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can update patient records');
    }

    return this.patientService.update(
      id,
      user.doctorProfile.id,
      updatePatientDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can delete patient records');
    }

    return this.patientService.remove(id, user.doctorProfile.id);
  }

  @Patch(':id/restore')
  async restore(@CurrentUser() user: any, @Param('id') id: string) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can restore patient records');
    }

    return this.patientService.restore(id, user.doctorProfile.id);
  }
}
