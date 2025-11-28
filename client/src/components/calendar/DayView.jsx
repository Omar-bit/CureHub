import React from 'react';
import { CalendarUtils } from './CalendarUtils';
import { getAppointmentPatientsDisplay } from '../../lib/patient';
import { getAppointmentColorClasses } from '../../lib/consultationStyles';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const DayView = ({
  currentDate,
  appointments = [],
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  workingHours = { start: 8, end: 20 },
  verticalZoom = 1,
  mainColor = '#FFA500',
}) => {
  const timeSlots = CalendarUtils.generateTimeSlots(
    workingHours.start,
    workingHours.end,
    60
  );
  const dayAppointments = CalendarUtils.getAppointmentsForDay(
    appointments,
    currentDate
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

  const appointmentLayouts = calculateAppointmentLayout(dayAppointments);

  const goToPreviousDay = () => {
    onDateChange(CalendarUtils.goToPreviousDay(currentDate));
  };

  const goToNextDay = () => {
    onDateChange(CalendarUtils.goToNextDay(currentDate));
  };

  const handleTimeSlotClick = (timeSlot) => {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotDate = new Date(currentDate);
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

    // Apply vertical zoom to position and height
    const zoomedPosition = position * verticalZoom;
    const zoomedHeight = height * verticalZoom;

    const leftOffset = 60; // Time label width
    const rightOffset = 10;
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
      top: `${zoomedPosition}px`,
      height: `${zoomedHeight}px`,
      left: leftPosition,
      width: columnWidth,
      zIndex: 10,
      paddingRight: totalColumns > 1 ? '2px' : '0',
    };
  };

  return (
    <div className='h-full flex flex-col bg-white'>
      {/* Header */}
      <div className='border-b border-gray-200 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={goToPreviousDay}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <h2 className='text-lg font-semibold text-gray-900'>
              {CalendarUtils.formatDisplayDate(currentDate)}
            </h2>
            <button
              onClick={goToNextDay}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>
          {/* <button
            onClick={() => onTimeSlotClick?.(new Date())}
            className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='h-4 w-4' />
            <span>New Appointment</span>
          </button> */}
          {/* choose date */}
          <div>
            <input
              type='date'
              // value={CalendarUtils.formatDateInput(currentDate)}
              value={''}
              onChange={
                () => 'test'
                // onDateChange(new Date(e.target.value + 'T00:00:00'))
              }
              className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className='flex-1 overflow-y-auto'>
        <div
          className='relative'
          style={{
            height: `${
              (workingHours.end - workingHours.start) * 60 * verticalZoom
            }px`,
          }}
        >
          {/* Time labels and slots */}
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className='relative'>
              <div className='flex'>
                {/* Time label */}
                <div className='w-12 text-xs text-gray-500 text-right pr-2 py-2'>
                  {timeSlot}
                </div>
                {/* Time slot area */}
                <div
                  className='flex-1 border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors'
                  style={{ height: `${60 * verticalZoom}px` }}
                  onClick={() => handleTimeSlotClick(timeSlot)}
                >
                  <div className='h-full w-full'></div>
                </div>
              </div>
            </div>
          ))}

          {/* Appointments */}
          {appointmentLayouts.map(({ appointment, column, totalColumns }) => {
            const colorClasses = getAppointmentColorClasses(appointment);
            const startTime = CalendarUtils.formatTime(
              new Date(appointment.startTime)
            );
            const isCancelled = appointment.status === 'CANCELLED';
            return (
              <div
                key={appointment.id}
                style={getAppointmentStyle(appointment, column, totalColumns)}
                className={`
                  flex items-center gap-2 cursor-pointer
                  ${
                    colorClasses.hoverBg
                  } transition-all rounded-lg overflow-hidden
                  ${isCancelled ? 'opacity-60' : ''}
                `}
                onClick={() => onAppointmentClick?.(appointment)}
              >
                {/* Time Badge */}
                <div
                  className={`${colorClasses.bgColor} text-white px-3 py-2 font-bold text-xs whitespace-nowrap flex-shrink-0 rounded-l-lg`}
                >
                  {startTime}
                </div>

                {/* Appointment Info */}
                <div className='flex-1 min-w-0 px-2 py-1'>
                  <div
                    className={`text-xs font-medium text-gray-900 truncate ${
                      isCancelled ? 'line-through' : ''
                    }`}
                  >
                    {getAppointmentPatientsDisplay(appointment)}
                  </div>
                  {isCancelled && (
                    <div className='text-xs text-red-600 font-semibold'>
                      Cancelled
                    </div>
                  )}
                  {!isCancelled && appointment.absenceCount > 0 && (
                    <div className='text-xs text-gray-600'>
                      {appointment.absenceCount} abs
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;
