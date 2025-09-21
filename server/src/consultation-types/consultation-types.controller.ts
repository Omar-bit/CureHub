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
  ForbiddenException,
} from '@nestjs/common';
import { ConsultationTypesService } from './consultation-types.service';
import {
  CreateConsultationTypeDto,
  UpdateConsultationTypeDto,
  ConsultationTypeQueryDto,
} from './dto/consultation-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('consultation-types')
@UseGuards(JwtAuthGuard)
export class ConsultationTypesController {
  constructor(
    private readonly consultationTypesService: ConsultationTypesService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query() query: ConsultationTypeQueryDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can access consultation types',
      );
    }

    return this.consultationTypesService.findAll(user.doctorProfile.id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can access consultation types',
      );
    }

    return this.consultationTypesService.findOne(id, user.doctorProfile.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createConsultationTypeDto: CreateConsultationTypeDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can create consultation types',
      );
    }

    return this.consultationTypesService.create(
      user.doctorProfile.id,
      createConsultationTypeDto,
    );
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateConsultationTypeDto: UpdateConsultationTypeDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can update consultation types',
      );
    }

    return this.consultationTypesService.update(
      id,
      user.doctorProfile.id,
      updateConsultationTypeDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can delete consultation types',
      );
    }

    return this.consultationTypesService.remove(id, user.doctorProfile.id);
  }
}
