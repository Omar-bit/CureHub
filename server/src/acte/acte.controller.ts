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
  BadRequestException,
} from '@nestjs/common';
import { ActeService } from './acte.service';
import { CreateActeDto } from './dto/create-acte.dto';
import { UpdateActeDto } from './dto/update-acte.dto';
import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';

@Controller('api/actes')
@UseGuards(JwtAuthGuard)
export class ActeController {
  constructor(private readonly acteService: ActeService) {}

  private getDoctorId(req: any): string {
    if (!req.user?.doctorProfile?.id) {
      throw new BadRequestException(
        'User is not a doctor or doctor profile is missing',
      );
    }
    return req.user.doctorProfile.id;
  }

  @Post()
  async create(@Request() req, @Body() createActeDto: CreateActeDto) {
    const doctorId = this.getDoctorId(req);
    return this.acteService.create(doctorId, createActeDto);
  }

  @Get()
  async findAll(@Request() req) {
    const doctorId = this.getDoctorId(req);
    return this.acteService.findAll(doctorId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const doctorId = this.getDoctorId(req);
    return this.acteService.findOne(doctorId, id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateActeDto: UpdateActeDto,
  ) {
    const doctorId = this.getDoctorId(req);
    return this.acteService.update(doctorId, id, updateActeDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const doctorId = this.getDoctorId(req);
    return this.acteService.remove(doctorId, id);
  }
}
