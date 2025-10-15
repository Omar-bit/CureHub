import { Event, EventType } from '@prisma/client';

export class EventEntity implements Event {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  startDate: Date;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  blockAppointments: boolean;
  isRecurring: boolean;
  color: string | null;
  doctorId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<EventEntity>) {
    Object.assign(this, partial);
  }
}
