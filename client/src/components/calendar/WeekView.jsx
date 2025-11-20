import React from 'react';
import { CalendarUtils } from './CalendarUtils';
import { getAppointmentPatientsDisplay } from '../../lib/patient';
import { getAppointmentColorClasses } from '../../lib/consultationStyles';
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

  // Function to detect overlapping appointments and assign columns
  const calculateAppointmentLayout = (appointments) => {
    const sortedAppointments = [...appointments].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );

    const columns = [];
    const appointmentLayouts = [];

    sortedAppointments.forEach((appointment) => {
      const startTime = new Date(appointment.startTime).getTime();
      const endTime = new Date(appointment.endTime).getTime();

      // Find a column where this appointment doesn't overlap with any existing appointment
      let columnIndex = 0;
      let placed = false;

      while (!placed) {
        if (!columns[columnIndex]) {
          columns[columnIndex] = [];
        }

        // Check if this appointment overlaps with any appointment in this column
        const overlaps = columns[columnIndex].some((existingAppointment) => {
          const existingStart = new Date(
            existingAppointment.startTime
          ).getTime();
          const existingEnd = new Date(existingAppointment.endTime).getTime();

          return (
            (startTime >= existingStart && startTime < existingEnd) ||
            (endTime > existingStart && endTime <= existingEnd) ||
            (startTime <= existingStart && endTime >= existingEnd)
          );
        });

        if (!overlaps) {
          columns[columnIndex].push(appointment);
          appointmentLayouts.push({
            appointment,
            column: columnIndex,
            totalColumns: 0, // Will be updated later
          });
          placed = true;
        } else {
          columnIndex++;
        }
      }
    });

    // Update totalColumns for each appointment
    const maxColumns = columns.length;
    appointmentLayouts.forEach((layout) => {
      layout.totalColumns = maxColumns;
    });

    return appointmentLayouts;
  };

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

  const getAppointmentStyle = (appointment, column, totalColumns) => {
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

    const leftOffset = 2;
    const rightOffset = 2;
    const availableWidth = `calc(100% - ${leftOffset + rightOffset}px)`;
    const columnWidth =
      totalColumns > 1
        ? `calc(${availableWidth} / ${totalColumns})`
        : availableWidth;
    const leftPosition =
      totalColumns > 1
        ? `calc(${leftOffset}px + (${availableWidth} / ${totalColumns}) * ${column})`
        : `${leftOffset}px`;

    return {
      position: 'absolute',
      top: `${position}px`,
      height: `${height}px`,
      left: leftPosition,
      width: columnWidth,
      zIndex: 10,
      paddingRight: totalColumns > 1 ? '1px' : '0',
    };
  };

  const getDayAppointments = (day) => {
    return CalendarUtils.getAppointmentsForDay(appointments, day);
  };

  const getDayAppointmentLayouts = (day) => {
    const dayAppointments = getDayAppointments(day);
    return calculateAppointmentLayout(dayAppointments);
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
                      {getDayAppointmentLayouts(day).map(
                        ({ appointment, column, totalColumns }) => {
                          const colorClasses =
                            getAppointmentColorClasses(appointment);
                          const startTime = CalendarUtils.formatTime(
                            new Date(appointment.startTime)
                          );
                          return (
                            <div
                              key={appointment.id}
                              style={getAppointmentStyle(
                                appointment,
                                column,
                                totalColumns
                              )}
                              className={`
                              flex items-center gap-1.5 cursor-pointer
                              ${colorClasses.hoverBg} transition-all rounded-lg overflow-hidden text-xs
                            `}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAppointmentClick?.(appointment);
                              }}
                            >
                              {/* Time Badge */}
                              <div
                                className={`${colorClasses.bgColor} text-white px-2 py-1 font-bold whitespace-nowrap flex-shrink-0 rounded-l-lg`}
                              >
                                {startTime}
                              </div>

                              {/* Appointment Info */}
                              <div className='flex-1 min-w-0 px-1 py-0.5'>
                                <div className='text-xs font-medium text-gray-900 truncate'>
                                  {getAppointmentPatientsDisplay(appointment)}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
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
