import React from 'react';
import { CalendarUtils } from './CalendarUtils';
import { getAppointmentPatientsDisplay } from '../../lib/patient';
import { getAppointmentColorClasses } from '../../lib/consultationStyles';
import DatePickerPopup from './DatePickerPopup';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Calendar,
} from 'lucide-react';

const DayView = ({
  currentDate,
  appointments = [],
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  workingHours = { start: 8, end: 20 },
  verticalZoom = 1,
  mainColor = '#FFA500',
  isTabOpen = false,
  currentView = 'day',
  onViewChange,
}) => {
  const [currentTimePosition, setCurrentTimePosition] = React.useState(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const datePickerRef = React.useRef(null);

  // Update current time every 5 minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      getCurrentTimePosition();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Close date picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

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

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Only show if it's today and within working hours
    const isToday =
      CalendarUtils.formatDate(now) === CalendarUtils.formatDate(currentDate);
    if (!isToday || hours < workingHours.start || hours >= workingHours.end) {
      return null;
    }

    const minutesFromStart = (hours - workingHours.start) * 60 + minutes;
    const position = minutesFromStart * verticalZoom;
    setCurrentTimePosition(position);
  };

  // Get status icon and background color based on appointment status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <div className='bg-blue-500 rounded-full p-0.5 flex items-center justify-center'>
            <Clock className='w-2.5 h-2.5 text-white' />
          </div>
        );
      case 'COMPLETED':
        return (
          <div className='bg-green-500 rounded-full p-0.5 flex items-center justify-center'>
            <CheckCircle className='w-2.5 h-2.5 text-white' />
          </div>
        );
      case 'ABSENT':
        return (
          <div className='bg-red-500 rounded-full p-0.5 flex items-center justify-center'>
            <XCircle className='w-2.5 h-2.5 text-white' />
          </div>
        );
      case 'CANCELLED':
        return (
          <div className='bg-gray-500 rounded-full p-0.5 flex items-center justify-center'>
            <X className='w-2.5 h-2.5 text-white' />
          </div>
        );
      default:
        return null;
    }
  };

  // Single arrow navigation (1 step)
  const goToPreviousStep = () => {
    if (currentView === 'week') {
      // Week view: go to previous week
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      onDateChange(newDate);
    } else {
      // Day view: go to previous day
      onDateChange(CalendarUtils.goToPreviousDay(currentDate));
    }
  };

  const goToNextStep = () => {
    if (currentView === 'week') {
      // Week view: go to next week
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      onDateChange(newDate);
    } else {
      // Day view: go to next day
      onDateChange(CalendarUtils.goToNextDay(currentDate));
    }
  };

  // Double arrow navigation (2 steps)
  const goToPreviousBigStep = () => {
    if (currentView === 'week') {
      // Week view: go to first day of previous month
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      newDate.setDate(1);
      onDateChange(newDate);
    } else {
      // Day view: go to same day of previous week
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      onDateChange(newDate);
    }
  };

  const goToNextBigStep = () => {
    if (currentView === 'week') {
      // Week view: go to first day of next month
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      newDate.setDate(1);
      onDateChange(newDate);
    } else {
      // Day view: go to same day of next week
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      onDateChange(newDate);
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
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

    // When tab is open, constrain appointments to not extend beyond visible area
    const maxWidthConstraint = isTabOpen ? 'min(100%, 50vw)' : '100%';
    const availableWidth = `calc(${maxWidthConstraint} - ${
      leftOffset + rightOffset
    }px)`;
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
          {/* Today button */}
          <button
            onClick={goToToday}
            className='px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-300'
          >
            Aujourd'hui
          </button>
          <div className='flex items-center space-x-4'>
            {/* Double arrow - 2 steps */}
            <button
              onClick={goToPreviousBigStep}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title={
                currentView === 'week'
                  ? 'Premier jour du mois précédent'
                  : 'Même jour de la semaine précédente'
              }
            >
              <ChevronsLeft className='h-5 w-5' />
            </button>

            {/* Single arrow - 1 step */}
            <button
              onClick={goToPreviousStep}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title={
                currentView === 'week' ? 'Semaine précédente' : 'Jour précédent'
              }
            >
              <ChevronLeft className='h-5 w-5' />
            </button>

            {/* Current date display */}
            <div
              className='flex items-center gap-2 relative'
              ref={datePickerRef}
            >
              <Calendar className='h-5 w-5 text-gray-600' />

              <h2 className='text-lg font-semibold text-gray-900 w-64 text-center'>
                {CalendarUtils.formatDisplayDate(currentDate)}
              </h2>
              {/* Calendar icon for date picker */}
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer'
              ></button>

              {/* Date Picker Popup */}
              {showDatePicker && (
                <DatePickerPopup
                  currentDate={currentDate}
                  onDateChange={onDateChange}
                  onClose={() => setShowDatePicker(false)}
                />
              )}
            </div>

            {/* Single arrow - 1 step */}
            <button
              onClick={goToNextStep}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title={
                currentView === 'week' ? 'Semaine suivante' : 'Jour suivant'
              }
            >
              <ChevronRight className='h-5 w-5' />
            </button>

            {/* Double arrow - 2 steps */}
            <button
              onClick={goToNextBigStep}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title={
                currentView === 'week'
                  ? 'Premier jour du mois suivant'
                  : 'Même jour de la semaine suivante'
              }
            >
              <ChevronsRight className='h-5 w-5' />
            </button>
          </div>
          {/* View Toggle */}
          <div className='inline-flex rounded-lg border border-gray-300 p-1'>
            <button
              onClick={() => onViewChange?.('day')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                currentView === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => onViewChange?.('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                currentView === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
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
                  <div className='h-full w-full relative'>
                    {/* 15-minute mark */}
                    <div
                      className='absolute left-0 right-0 border-t border-gray-100'
                      style={{ top: `${15 * verticalZoom}px` }}
                    />
                    {/* 30-minute mark */}
                    <div
                      className='absolute left-0 right-0 border-t border-gray-100'
                      style={{ top: `${30 * verticalZoom}px` }}
                    />
                    {/* 45-minute mark */}
                    <div
                      className='absolute left-0 right-0 border-t border-gray-100'
                      style={{ top: `${45 * verticalZoom}px` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Current Time Indicator */}
          {currentTimePosition !== null && (
            <div
              className='absolute left-0 right-0 z-20 pointer-events-none'
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className='relative flex items-center'>
                {/* Circle */}
                <div
                  className='w-3 h-3 rounded-full border-2 border-white shadow-lg ml-12'
                  style={{ backgroundColor: mainColor }}
                />
                {/* Line */}
                <div
                  className='flex-1 h-0.5 shadow-sm'
                  style={{ backgroundColor: mainColor }}
                />
              </div>
            </div>
          )}

          {/* Appointments */}
          {appointmentLayouts.map(({ appointment, column, totalColumns }) => {
            const colorClasses = getAppointmentColorClasses(appointment);
            const startTime = CalendarUtils.formatTime(
              new Date(appointment.startTime)
            );
            const isCancelled = appointment.status === 'CANCELLED';
            const statusIcon = getStatusIcon(appointment.status);
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
                  className={`${colorClasses.bgColor} text-white px-3 py-2 font-bold text-xs whitespace-nowrap flex-shrink-0 rounded-l-lg flex items-center gap-1.5`}
                >
                  <span>{startTime}</span>
                  {statusIcon && <span>{statusIcon}</span>}
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
