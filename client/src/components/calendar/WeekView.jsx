import React from 'react';
import { CalendarUtils } from './CalendarUtils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const WeekView = ({
  currentDate,
  appointments = [],
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  workingHours = { start: 8, end: 20 },
}) => {
  const weekDays = CalendarUtils.getWeekDays(currentDate);
  const timeSlots = CalendarUtils.generateTimeSlots(
    workingHours.start,
    workingHours.end,
    60
  );

  const goToPreviousWeek = () => {
    onDateChange(CalendarUtils.goToPreviousWeek(currentDate));
  };

  const goToNextWeek = () => {
    onDateChange(CalendarUtils.goToNextWeek(currentDate));
  };

  const handleTimeSlotClick = (day, timeSlot) => {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotDate = new Date(day);
    slotDate.setHours(hour, minute, 0, 0);
    onTimeSlotClick?.(slotDate);
  };

  const getAppointmentStyle = (appointment, dayIndex) => {
    const startTime = CalendarUtils.formatTime(new Date(appointment.startTime));
    const duration = CalendarUtils.getAppointmentDuration(
      appointment.startTime,
      appointment.endTime
    );
    const position = CalendarUtils.getTimeSlotPosition(
      startTime,
      workingHours.start
    );
    const height = CalendarUtils.getTimeSlotHeight(duration);

    return {
      position: 'absolute',
      top: `${position}px`,
      height: `${height}px`,
      left: '2px',
      right: '2px',
      zIndex: 10,
    };
  };

  const getDayAppointments = (day) => {
    return CalendarUtils.getAppointmentsForDay(appointments, day);
  };

  return (
    <div className='h-full flex flex-col bg-white'>
      {/* Header */}
      <div className='border-b border-gray-200 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={goToPreviousWeek}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <h2 className='text-lg font-semibold text-gray-900'>
              {CalendarUtils.formatDisplayDate(
                CalendarUtils.getWeekStart(currentDate)
              )}{' '}
              -{' '}
              {CalendarUtils.formatDisplayDate(
                CalendarUtils.getWeekEnd(currentDate)
              )}
            </h2>
            <button
              onClick={goToNextWeek}
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

      {/* Week header with days */}
      <div className='border-b border-gray-200'>
        <div className='flex'>
          <div className='w-12 flex-shrink-0'></div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className='flex-1 text-center py-3 border-r border-gray-100 last:border-r-0'
            >
              <div
                className={`text-sm font-medium ${
                  CalendarUtils.isToday(day) ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {CalendarUtils.formatDate(day, 'EEE')}
              </div>
              <div
                className={`text-lg ${
                  CalendarUtils.isToday(day)
                    ? 'text-blue-600 font-bold'
                    : 'text-gray-900'
                }`}
              >
                {CalendarUtils.formatDate(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time slots and appointments */}
      <div className='flex-1 overflow-y-auto'>
        <div
          className='relative'
          style={{
            height: `${(workingHours.end - workingHours.start) * 60}px`,
          }}
        >
          {/* Time slots grid */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeSlot} className='flex border-t border-gray-100'>
              {/* Time label */}
              <div className='w-12 flex-shrink-0 text-xs text-gray-500 text-right pr-2 py-2'>
                {timeSlot}
              </div>
              {/* Day columns */}
              {weekDays.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className='flex-1 border-r border-gray-100 last:border-r-0 hover:bg-gray-50 cursor-pointer transition-colors relative'
                  style={{ height: '60px' }}
                  onClick={() => handleTimeSlotClick(day, timeSlot)}
                >
                  {timeIndex === 0 && (
                    <div
                      className='absolute inset-0'
                      style={{
                        top: 0,
                        height: `${
                          (workingHours.end - workingHours.start) * 60
                        }px`,
                      }}
                    >
                      {/* Appointments for this day */}
                      {getDayAppointments(day).map((appointment) => (
                        <div
                          key={appointment.id}
                          style={getAppointmentStyle(appointment, dayIndex)}
                          className={`
                            bg-blue-500 text-white rounded p-1 cursor-pointer shadow-sm
                            hover:bg-blue-600 transition-colors text-xs
                            ${
                              appointment.status === 'CANCELLED'
                                ? 'bg-gray-400'
                                : ''
                            }
                            ${
                              appointment.status === 'COMPLETED'
                                ? 'bg-green-500'
                                : ''
                            }
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick?.(appointment);
                          }}
                        >
                          <div className='font-medium truncate text-xs'>
                            {CalendarUtils.formatTime(
                              new Date(appointment.startTime)
                            )}
                          </div>
                          <div className='truncate text-xs'>
                            {appointment.patient?.name}
                          </div>
                          {appointment.consultationType && (
                            <div className='text-xs opacity-80 truncate'>
                              {appointment.consultationType.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
