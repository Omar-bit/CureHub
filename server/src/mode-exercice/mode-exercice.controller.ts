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
import { ModeExerciceService } from './mode-exercice.service';
import {
  CreateModeExerciceDto,
  UpdateModeExerciceDto,
  ModeExerciceQueryDto,
} from './dto/mode-exercice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('mode-exercice')
@UseGuards(JwtAuthGuard)
export class ModeExerciceController {
  constructor(private readonly modeExerciceService: ModeExerciceService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query() query: ModeExerciceQueryDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can access mode exercice',
      );
    }

    return this.modeExerciceService.findAll(user.doctorProfile.id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can access mode exercice',
      );
    }

    return this.modeExerciceService.findOne(id, user.doctorProfile.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createModeExerciceDto: CreateModeExerciceDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can create mode exercice',
      );
    }

    return this.modeExerciceService.create(
      user.doctorProfile.id,
      createModeExerciceDto,
    );
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateModeExerciceDto: UpdateModeExerciceDto,
  ) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can update mode exercice',
      );
    }

    return this.modeExerciceService.update(
      id,
      user.doctorProfile.id,
      updateModeExerciceDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    // Ensure user is a doctor and has a doctor profile
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new ForbiddenException(
        'Only doctors can delete mode exercice',
      );
    }

    return this.modeExerciceService.remove(id, user.doctorProfile.id);
  }
}

