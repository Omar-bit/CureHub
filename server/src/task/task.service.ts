import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/task.dto';
import { Task, TaskPriority, TaskCategory } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async findAll(doctorId: string, query: TaskQueryDto) {
    const {
      search,
      priority,
      category,
      completed,
      patientId,
      deadlineBefore,
      deadlineAfter,
    } = query;

    const where: any = {
      doctorId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        {
          patient: {
            name: { contains: search },
          },
        },
      ];
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (typeof completed === 'boolean') {
      where.completed = completed;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (deadlineBefore) {
      where.deadline = {
        ...where.deadline,
        lte: new Date(deadlineBefore),
      };
    }

    if (deadlineAfter) {
      where.deadline = {
        ...where.deadline,
        gte: new Date(deadlineAfter),
      };
    }

    return this.prisma.task.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string, doctorId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, doctorId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(doctorId: string, createTaskDto: CreateTaskDto) {
    const { patientId, deadline, ...taskData } = createTaskDto;

    // Verify patient belongs to doctor if patientId is provided
    if (patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: patientId, doctorId },
      });

      if (!patient) {
        throw new BadRequestException(
          'Patient not found or does not belong to this doctor',
        );
      }
    }

    return this.prisma.task.create({
      data: {
        ...taskData,
        doctorId,
        patientId,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async update(id: string, doctorId: string, updateTaskDto: UpdateTaskDto) {
    const { patientId, deadline, completed, ...taskData } = updateTaskDto;

    // Check if task exists and belongs to doctor
    const existingTask = await this.prisma.task.findFirst({
      where: { id, doctorId },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    // Verify patient belongs to doctor if patientId is provided
    if (patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: patientId, doctorId },
      });

      if (!patient) {
        throw new BadRequestException(
          'Patient not found or does not belong to this doctor',
        );
      }
    }

    // Handle completion status change
    let completedAt = existingTask.completedAt;
    if (typeof completed === 'boolean') {
      if (completed && !existingTask.completed) {
        // Task is being marked as completed
        completedAt = new Date();
      } else if (!completed && existingTask.completed) {
        // Task is being marked as incomplete
        completedAt = null;
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        patientId,
        deadline: deadline ? new Date(deadline) : undefined,
        completed,
        completedAt,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async remove(id: string, doctorId: string) {
    // Check if task exists and belongs to doctor
    const task = await this.prisma.task.findFirst({
      where: { id, doctorId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async getStats(doctorId: string) {
    const totalTasks = await this.prisma.task.count({
      where: { doctorId },
    });

    const completedTasks = await this.prisma.task.count({
      where: { doctorId, completed: true },
    });

    const pendingTasks = totalTasks - completedTasks;

    const overdueTasks = await this.prisma.task.count({
      where: {
        doctorId,
        completed: false,
        deadline: {
          lt: new Date(),
        },
      },
    });

    const urgentTasks = await this.prisma.task.count({
      where: {
        doctorId,
        completed: false,
        priority: TaskPriority.URGENT,
      },
    });

    const tasksByCategory = await this.prisma.task.groupBy({
      by: ['category'],
      where: { doctorId },
      _count: true,
    });

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      urgentTasks,
      tasksByCategory: tasksByCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {}),
    };
  }

  async toggleCompletion(id: string, doctorId: string) {
    const task = await this.findOne(id, doctorId);

    return this.update(id, doctorId, {
      completed: !task.completed,
    });
  }
}
