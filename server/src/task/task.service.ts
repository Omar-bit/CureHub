import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/task.dto';
import { Task, TaskPriority, TaskCategory } from '@prisma/client';

const PATIENT_SUMMARY_SELECT = {
  id: true,
  name: true,
  profileImage: true,
  email: true,
  phoneNumber: true,
};

const TASK_PATIENT_INCLUDE: any = {
  taskPatients: {
    include: {
      patient: {
        select: PATIENT_SUMMARY_SELECT,
      },
    },
  },
};

const mapTaskPatients = (task: any) => {
  if (!task) return task;
  const { taskPatients, ...rest } = task;
  const patients =
    taskPatients
      ?.map((assignment: any) => assignment.patient)
      .filter(Boolean) || [];
  return { ...rest, patients };
};

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
      const searchFilter = {
        contains: search,
        mode: 'insensitive',
      };
      where.OR = [
        { title: searchFilter },
        { description: searchFilter },
        {
          taskPatients: {
            some: {
              patient: {
                name: searchFilter,
              },
            },
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
      where.taskPatients = {
        some: {
          patientId,
        },
      };
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

    const tasks = await this.prisma.task.findMany({
      where,
      include: TASK_PATIENT_INCLUDE,
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return tasks.map(mapTaskPatients);
  }

  async findOne(id: string, doctorId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, doctorId },
      include: TASK_PATIENT_INCLUDE,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return mapTaskPatients(task);
  }

  async create(doctorId: string, createTaskDto: CreateTaskDto) {
    const { patientIds, deadline, completed, ...taskData } = createTaskDto;
    const normalizedPatientIds = await this.normalizeAndValidatePatientIds(
      doctorId,
      patientIds,
    );

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        doctorId,
        deadline: deadline ? new Date(deadline) : null,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        ...(normalizedPatientIds.length
          ? {
              taskPatients: {
                create: normalizedPatientIds.map((id) => ({ patientId: id })),
              },
            }
          : {}),
      },
      include: TASK_PATIENT_INCLUDE,
    });

    return mapTaskPatients(task);
  }

  async update(id: string, doctorId: string, updateTaskDto: UpdateTaskDto) {
    const { patientIds, deadline, completed, ...taskData } = updateTaskDto;

    // Check if task exists and belongs to doctor
    const existingTask = await this.prisma.task.findFirst({
      where: { id, doctorId },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const normalizedPatientIds = patientIds
      ? await this.normalizeAndValidatePatientIds(doctorId, patientIds)
      : null;

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

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        ...(deadline !== undefined
          ? { deadline: deadline ? new Date(deadline) : null }
          : {}),
        ...(typeof completed === 'boolean' ? { completed, completedAt } : {}),
        ...(normalizedPatientIds !== null
          ? {
              taskPatients: {
                deleteMany: {},
                create: normalizedPatientIds.map((patientId) => ({
                  patientId,
                })),
              },
            }
          : {}),
      },
      include: TASK_PATIENT_INCLUDE,
    });

    return mapTaskPatients(updatedTask);
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

  private async normalizeAndValidatePatientIds(
    doctorId: string,
    patientIds?: string[],
  ): Promise<string[]> {
    if (!patientIds || patientIds.length === 0) {
      return [];
    }

    const normalized = Array.from(
      new Set(
        patientIds.filter((id) => typeof id === 'string' && id.trim() !== ''),
      ),
    );

    if (!normalized.length) {
      return [];
    }

    const patients = await this.prisma.patient.findMany({
      where: {
        doctorId,
        id: { in: normalized },
      },
      select: { id: true },
    });

    if (patients.length !== normalized.length) {
      throw new BadRequestException(
        'One or more patients were not found or do not belong to this doctor',
      );
    }

    return normalized;
  }
}
