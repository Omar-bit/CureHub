import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClinicService } from './clinic.service';
import type { CreateClinicDto, UpdateClinicDto } from './clinic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { DoctorProfileService } from '../doctor-profile/doctor-profile.service';

@Controller('clinic')
@UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(
    private readonly clinicService: ClinicService,
    private readonly doctorProfileService: DoctorProfileService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createClinicDto: CreateClinicDto,
  ) {
    // Ensure only doctors can create clinics
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can create clinics');
    }

    // Get doctor profile
    const doctorProfile = await this.doctorProfileService.findByUserId(user.id);
    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }

    return this.clinicService.create({
      ...createClinicDto,
      doctorProfileId: doctorProfile.id,
    });
  }

  @Get()
  async findAll() {
    return this.clinicService.findAll();
  }

  @Get('my-clinic')
  async getMyClinic(@CurrentUser() user: User) {
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can access clinics');
    }

    const doctorProfile = await this.doctorProfileService.findByUserId(user.id);
    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }

    return this.clinicService.findByDoctorProfileId(doctorProfile.id);
  }

  @Patch('my-clinic')
  async updateMyClinic(
    @CurrentUser() user: User,
    @Body() updateClinicDto: UpdateClinicDto,
  ) {
    console.log('[ClinicController.updateMyClinic] Called');
    console.log(
      '[ClinicController.updateMyClinic] User:',
      user?.id,
      user?.email,
    );
    console.log('[ClinicController.updateMyClinic] Body:', updateClinicDto);

    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can update clinics');
    }

    const doctorProfile = await this.doctorProfileService.findByUserId(user.id);
    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }

    return this.clinicService.update(doctorProfile.id, updateClinicDto);
  }

  @Delete('my-clinic')
  async deleteMyClinic(@CurrentUser() user: User) {
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can delete clinics');
    }

    const doctorProfile = await this.doctorProfileService.findByUserId(user.id);
    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }

    return this.clinicService.delete(doctorProfile.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clinicService.findById(id);
  }
}
