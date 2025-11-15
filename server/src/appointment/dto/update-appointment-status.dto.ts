import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    description: 'New status for the appointment',
    enum: AppointmentStatus,
    example: AppointmentStatus.SCHEDULED,
  })
  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  status: AppointmentStatus;
}
