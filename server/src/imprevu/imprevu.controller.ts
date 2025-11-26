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
} from '@nestjs/common';
import { ImprevuService } from './imprevu.service';
import { CreateImprevuDto, UpdateImprevuDto, GetImprevusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('imprevus')
@UseGuards(JwtAuthGuard)
export class ImprevuController {
  constructor(private readonly imprevuService: ImprevuService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createImprevuDto: CreateImprevuDto,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can create imprevus');
    }
    return this.imprevuService.create(user.doctorProfile.id, createImprevuDto);
  }

  @Get('affected-appointments')
  async getAffectedAppointments(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can access this resource');
    }
    return this.imprevuService.getAffectedAppointments(
      user.doctorProfile.id,
      startDate,
      endDate,
    );
  }

  @Post(':id/cancel-appointments')
  async cancelAffectedAppointments(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can cancel appointments');
    }
    return this.imprevuService.cancelAffectedAppointments(
      id,
      user.doctorProfile.id,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: GetImprevusDto) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can access imprevus');
    }
    return this.imprevuService.findAll(user.doctorProfile.id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can access imprevus');
    }
    return this.imprevuService.findOne(id, user.doctorProfile.id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateImprevuDto: UpdateImprevuDto,
  ) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can update imprevus');
    }
    return this.imprevuService.update(
      id,
      user.doctorProfile.id,
      updateImprevuDto,
    );
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'DOCTOR' || !user.doctorProfile?.id) {
      throw new Error('Only doctors can delete imprevus');
    }
    await this.imprevuService.remove(id, user.doctorProfile.id);
    return { message: 'Imprevu deleted successfully' };
  }
}
