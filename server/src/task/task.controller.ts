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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: TaskQueryDto) {
    // Ensure user is a doctor and has a doctor profile
    if (!user.doctorProfile) {
      throw new Error('User must be a doctor to access tasks');
    }
    return this.taskService.findAll(user.doctorProfile.id, query);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    if (!user.doctorProfile) {
      throw new Error('User must be a doctor to access task stats');
    }
    return this.taskService.getStats(user.doctorProfile.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user.doctorProfile) {
      throw new Error('User must be a doctor to access tasks');
    }
    return this.taskService.findOne(id, user.doctorProfile.id);
  }

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: any) {
    if (!user.doctorProfile) {
      throw new Error('User must be a doctor to create tasks');
    }
    return this.taskService.create(user.doctorProfile.id, createTaskDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    if (!user.doctorProfile) {
      throw new Error('User must be a doctor to update tasks');
    }
    return this.taskService.update(id, user.doctorProfile.id, updateTaskDto);
  }

  @Patch(':id/toggle-completion')
  @HttpCode(HttpStatus.OK)
  async toggleCompletion(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user.doctorProfile) {
      throw new Error('User must be a doctor to update tasks');
    }
    return this.taskService.toggleCompletion(id, user.doctorProfile.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user.doctorProfile) {
      throw new Error('User must be a doctor to delete tasks');
    }
    return this.taskService.remove(id, user.doctorProfile.id);
  }
}
