import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns';

export const CalendarUtils = {
  // Date formatting
  formatDate: (date, formatStr = 'yyyy-MM-dd') => format(date, formatStr),
  formatTime: (date) => format(date, 'HH:mm'),
  formatDateTime: (date) => format(date, 'yyyy-MM-dd HH:mm'),
  formatDisplayDate: (date) => format(date, 'EEEE d MMMM yyyy'),
  formatDisplayTime: (date) => format(date, 'HH:mm'),

  // Week utilities
  getWeekStart: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday
  getWeekEnd: (date) => endOfWeek(date, { weekStartsOn: 1 }),
  getWeekDays: (date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  },

  // Month utilities
  getMonthStart: (date) => startOfMonth(date),
  getMonthEnd: (date) => endOfMonth(date),
  getMonthDays: (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  },
  getCalendarDays: (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  },

  // Date comparisons
  isSameDay,
  isSameMonth,
  isToday: (date) => isSameDay(date, new Date()),

  // Navigation
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  goToPreviousDay: (date) => subDays(date, 1),
  goToNextDay: (date) => addDays(date, 1),
  goToPreviousWeek: (date) => subWeeks(date, 1),
  goToNextWeek: (date) => addWeeks(date, 1),
  goToPreviousMonth: (date) => subMonths(date, 1),
  goToNextMonth: (date) => addMonths(date, 1),

  // Time slots
  generateTimeSlots: (startHour = 8, endHour = 20, intervalMinutes = 15) => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const time = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  },

  // Appointment utilities
  getAppointmentDuration: (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60)); // Duration in minutes
  },

  isAppointmentOnDay: (appointment, date) => {
    return isSameDay(new Date(appointment.startTime), date);
  },

  getAppointmentsForDay: (appointments, date) => {
    return appointments
      .filter((appointment) =>
        CalendarUtils.isAppointmentOnDay(appointment, date)
      )
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  },

  // Time slot calculations
  getTimeSlotHeight: (duration, hourHeight = 60) => {
    return (duration / 60) * hourHeight;
  },

  getTimeSlotPosition: (time, startHour = 8, hourHeight = 60) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = (hours - startHour) * 60 + minutes;
    return (totalMinutes / 60) * hourHeight;
  },

  // Conflict detection
  hasTimeConflict: (appointment1, appointment2) => {
    const start1 = new Date(appointment1.startTime);
    const end1 = new Date(appointment1.endTime);
    const start2 = new Date(appointment2.startTime);
    const end2 = new Date(appointment2.endTime);

    return start1 < end2 && end1 > start2;
  },

  // Week days
  getWeekDayNames: (short = false) => {
    if (short) {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
    return [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
  },

  // Time ranges
  createTimeRange: (date, startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const start = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(date);
    end.setHours(endHour, endMinute, 0, 0);

    return { start, end };
  },
};
