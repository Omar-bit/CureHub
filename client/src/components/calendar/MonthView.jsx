import React from 'react';
import { CalendarUtils } from './CalendarUtils';
import { splitPatientName } from '../../lib/patient';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const MonthView = ({
  currentDate,
  appointments = [],
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
}) => {
  const calendarDays = CalendarUtils.getCalendarDays(currentDate);
  const weekDayNames = CalendarUtils.getWeekDayNames(true);

  const goToPreviousMonth = () => {
    onDateChange(CalendarUtils.goToPreviousMonth(currentDate));
  };

  const goToNextMonth = () => {
    onDateChange(CalendarUtils.goToNextMonth(currentDate));
  };

  const handleDayClick = (day) => {
    onTimeSlotClick?.(day);
  };

  const getDayAppointments = (day) => {
    return CalendarUtils.getAppointmentsForDay(appointments, day);
  };

  const renderDay = (day) => {
    const dayAppointments = getDayAppointments(day);
    const isCurrentMonth = CalendarUtils.isSameMonth(day, currentDate);
    const isToday = CalendarUtils.isToday(day);

    return (
      <div
        key={day.getTime()}
        className={`
          min-h-[120px] border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors
          ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        `}
        onClick={() => handleDayClick(day)}
      >
        {/* Day number */}
        <div
          className={`text-sm font-medium mb-1 ${
            isToday ? 'text-blue-600' : 'text-gray-900'
          }`}
        >
          {CalendarUtils.formatDate(day, 'd')}
        </div>

        {/* Appointments */}
        <div className='space-y-1'>
          {dayAppointments.slice(0, 3).map((appointment) => (
            <div
              key={appointment.id}
              className={`
                text-xs p-1 rounded cursor-pointer truncate
                ${
                  appointment.status === 'CANCELLED'
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-blue-100 text-blue-800'
                }
                ${
                  appointment.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : ''
                }
                hover:opacity-80 transition-opacity
              `}
              onClick={(e) => {
                e.stopPropagation();
                onAppointmentClick?.(appointment);
              }}
            >
                <div className='font-medium'>
                {CalendarUtils.formatTime(new Date(appointment.startTime))}{' '}
                {appointment.patient
                  ? (() => {
                      if (appointment.patient.name) {
                        const { firstName, lastName } =
                          splitPatientName(appointment.patient.name);
                        return `${firstName} ${lastName}`.trim();
                      }
                      return `${appointment.patient.firstName || ''} ${
                        appointment.patient.lastName || ''
                      }`.trim();
                    })()
                  : ''}
              </div>
            </div>
          ))}

          {/* Show more indicator */}
          {dayAppointments.length > 3 && (
            <div className='text-xs text-gray-500 font-medium'>
              +{dayAppointments.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='h-full flex flex-col bg-white'>
      {/* Header */}
      <div className='border-b border-gray-200 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={goToPreviousMonth}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <h2 className='text-lg font-semibold text-gray-900'>
              {CalendarUtils.formatDate(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={goToNextMonth}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>
          <button
            onClick={() => onTimeSlotClick?.(new Date())}
            className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='h-4 w-4' />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className='flex-1 flex flex-col overflow-y-auto'>
        {/* Week day headers */}
        <div className='grid grid-cols-7 border-b border-gray-200'>
          {weekDayNames.map((dayName) => (
            <div
              key={dayName}
              className='p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0'
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className='flex-1 grid grid-cols-7 auto-rows-fr'>
          {calendarDays.map(renderDay)}
        </div>
      </div>
    </div>
  );
};

export default MonthView;
