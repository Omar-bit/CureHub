import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PTOService } from './pto.service';
import { CreatePTODto, UpdatePTODto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('pto')
@ApiBearerAuth()
@Controller('pto')
@UseGuards(JwtAuthGuard)
export class PTOController {
  constructor(private readonly ptoService: PTOService) {}

  @Get()
  @ApiOperation({ summary: 'Get all PTO periods for the doctor' })
  @ApiResponse({
    status: 200,
    description: 'PTO periods retrieved successfully',
  })
  async findAll(@Request() req) {
    if (req.user.role !== 'DOCTOR' || !req.user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage PTO');
    }

    const doctorId = req.user.doctorProfile.id;
    return this.ptoService.findAll(doctorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific PTO period' })
  @ApiResponse({
    status: 200,
    description: 'PTO period retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'PTO period not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'DOCTOR' || !req.user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage PTO');
    }

    const doctorId = req.user.doctorProfile.id;
    return this.ptoService.findOne(id, doctorId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new PTO period' })
  @ApiResponse({ status: 201, description: 'PTO period created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range' })
  async create(@Request() req, @Body() createPTODto: CreatePTODto) {
    if (req.user.role !== 'DOCTOR' || !req.user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage PTO');
    }

    const doctorId = req.user.doctorProfile.id;
    return this.ptoService.create(doctorId, createPTODto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a PTO period' })
  @ApiResponse({ status: 200, description: 'PTO period updated successfully' })
  @ApiResponse({ status: 404, description: 'PTO period not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePTODto: UpdatePTODto,
  ) {
    if (req.user.role !== 'DOCTOR' || !req.user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage PTO');
    }

    const doctorId = req.user.doctorProfile.id;
    return this.ptoService.update(id, doctorId, updatePTODto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a PTO period' })
  @ApiResponse({ status: 200, description: 'PTO period deleted successfully' })
  @ApiResponse({ status: 404, description: 'PTO period not found' })
  async remove(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'DOCTOR' || !req.user.doctorProfile) {
      throw new ForbiddenException('Only doctors can manage PTO');
    }

    const doctorId = req.user.doctorProfile.id;
    return this.ptoService.remove(id, doctorId);
  }
}
