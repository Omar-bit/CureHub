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
import { DoctorProfileService } from './doctor-profile.service';
import type {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './doctor-profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';

@Controller('doctor-profile')
@UseGuards(JwtAuthGuard)
export class DoctorProfileController {
  constructor(private readonly doctorProfileService: DoctorProfileService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createDoctorProfileDto: CreateDoctorProfileDto,
  ) {
    // Ensure only doctors can create doctor profiles
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can create doctor profiles');
    }

    // Ensure doctor is creating their own profile
    if (
      createDoctorProfileDto.userId &&
      createDoctorProfileDto.userId !== user.id
    ) {
      throw new BadRequestException(
        'You can only create your own doctor profile',
      );
    }

    return this.doctorProfileService.create({
      ...createDoctorProfileDto,
      userId: user.id, // Always use the authenticated user's ID
    });
  }

  @Get()
  async findAll() {
    return this.doctorProfileService.findAll();
  }

  @Get('my-profile')
  async getMyProfile(@CurrentUser() user: User) {
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can access doctor profiles');
    }

    return this.doctorProfileService.findByUserId(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.doctorProfileService.findById(id);
  }

  @Patch('my-profile')
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() updateDoctorProfileDto: UpdateDoctorProfileDto,
  ) {
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can update doctor profiles');
    }

    return this.doctorProfileService.update(user.id, updateDoctorProfileDto);
  }

  @Delete('my-profile')
  async deleteMyProfile(@CurrentUser() user: User) {
    if (user.role !== UserRole.DOCTOR) {
      throw new BadRequestException('Only doctors can delete doctor profiles');
    }

    return this.doctorProfileService.delete(user.id);
  }
}
