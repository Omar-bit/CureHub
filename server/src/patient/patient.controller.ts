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
import { CreatePatientRelationshipDto } from './dto/create-patient-relationship.dto';
import { UpdatePatientPermissionsDto } from './dto/update-patient-permissions.dto';

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

  // Patient Relationships Endpoints

  @Get(':id/relatives')
  async getPatientRelatives(
    @CurrentUser() user: any,
    @Param('id') patientId: string,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can access patient relatives');
    }

    return this.patientService.getPatientRelatives(
      patientId,
      user.doctorProfile.id,
    );
  }

  @Post(':id/relatives')
  @HttpCode(HttpStatus.CREATED)
  async createPatientWithRelationship(
    @CurrentUser() user: any,
    @Param('id') mainPatientId: string,
    @Body()
    body: {
      patient: CreatePatientDto;
      relationship: CreatePatientRelationshipDto;
    },
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can create patient relatives');
    }

    return this.patientService.createPatientWithRelationship(
      mainPatientId,
      user.doctorProfile.id,
      body.patient,
      body.relationship,
    );
  }

  @Post(':id/relatives/:relatedPatientId')
  @HttpCode(HttpStatus.CREATED)
  async addExistingPatientAsRelative(
    @CurrentUser() user: any,
    @Param('id') mainPatientId: string,
    @Param('relatedPatientId') relatedPatientId: string,
    @Body() relationshipDto: CreatePatientRelationshipDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can link patient relatives');
    }

    return this.patientService.addExistingPatientAsRelative(
      mainPatientId,
      relatedPatientId,
      user.doctorProfile.id,
      relationshipDto,
    );
  }

  @Delete('relationships/:relationshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePatientRelationship(
    @CurrentUser() user: any,
    @Param('relationshipId') relationshipId: string,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can remove patient relationships');
    }

    return this.patientService.removePatientRelationship(
      relationshipId,
      user.doctorProfile.id,
    );
  }

  @Patch(':id/permissions')
  async updatePatientPermissions(
    @CurrentUser() user: any,
    @Param('id') patientId: string,
    @Body() permissionsDto: UpdatePatientPermissionsDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can update patient permissions');
    }

    return this.patientService.updatePatientPermissions(
      patientId,
      user.doctorProfile.id,
      permissionsDto,
    );
  }
}
