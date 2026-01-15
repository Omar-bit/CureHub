import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminLoginDto,
  AdminAuthResponseDto,
  AdminResponseDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    const { email, password } = loginDto;

    // Find admin by email
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is disabled');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: 'ADMIN',
    };

    const access_token = this.jwtService.sign(payload);

    const { password: _, ...adminWithoutPassword } = admin;

    return {
      access_token,
      admin: adminWithoutPassword,
    };
  }

  async getAdminById(id: string): Promise<AdminResponseDto> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  // Dashboard Statistics
  async getDashboardStats() {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      recentAppointments,
      usersByRole,
      appointmentsByStatus,
      appointmentsPerMonth,
    ] = await Promise.all([
      // Total users count
      this.prisma.user.count(),

      // Total doctors (users with DOCTOR role)
      this.prisma.user.count({
        where: { role: 'DOCTOR' },
      }),

      // Total patients
      this.prisma.patient.count({
        where: { isDeleted: false },
      }),

      // Total appointments
      this.prisma.appointment.count({
        where: { isDeleted: false },
      }),

      // Recent appointments (last 10)
      this.prisma.appointment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { isDeleted: false },
        include: {
          patient: {
            select: { id: true, name: true, email: true },
          },
          doctor: {
            select: {
              id: true,
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      }),

      // Users by role
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Appointments by status
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { status: true },
      }),

      // Appointments per month (last 12 months)
      this.getAppointmentsPerMonth(),
    ]);

    return {
      overview: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
      },
      usersByRole: usersByRole.map((r) => ({
        role: r.role,
        count: r._count.role,
      })),
      appointmentsByStatus: appointmentsByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      recentAppointments: recentAppointments.map((apt) => ({
        id: apt.id,
        title: apt.title,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        patientName: apt.patient?.name,
        doctorName: apt.doctor?.user
          ? `${apt.doctor.user.firstName || ''} ${apt.doctor.user.lastName || ''}`.trim()
          : 'Unknown',
      })),
      appointmentsPerMonth,
    };
  }

  private async getAppointmentsPerMonth() {
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by month
    const monthlyData: { [key: string]: number } = {};

    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
    }

    appointments.forEach((apt) => {
      const key = `${apt.createdAt.getFullYear()}-${String(apt.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] !== undefined) {
        monthlyData[key]++;
      }
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));
  }

  // User Management
  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          language: true,
          createdAt: true,
          updatedAt: true,
          doctorProfile: {
            select: {
              id: true,
              specialization: true,
              _count: {
                select: {
                  patients: true,
                  appointments: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        doctorProfile: {
          include: {
            clinic: true,
            _count: {
              select: {
                patients: true,
                appointments: true,
                tasks: true,
                events: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user (cascade will handle related records)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  // Get all patients for admin
  async getAllPatients(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phoneNumber: { contains: search } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            select: {
              id: true,
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          _count: {
            select: {
              appointments: true,
              documents: true,
            },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      patients: patients.map((p) => ({
        ...p,
        doctorName: p.doctor?.user
          ? `${p.doctor.user.firstName || ''} ${p.doctor.user.lastName || ''}`.trim()
          : 'Unknown',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
