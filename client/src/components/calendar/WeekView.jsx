import React from 'react';
import { CalendarUtils } from './CalendarUtils';
import { getAppointmentPatientsDisplay } from '../../lib/patient';
import { getAppointmentColorClasses } from '../../lib/consultationStyles';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  CalendarCheck,
} from 'lucide-react';

const WeekView = ({
  currentDate,
  appointments = [],
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  workingHours = { start: 8, end: 20 },
  isTabOpen = false,
  currentView = 'week',
  onViewChange,
}) => {
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [pickerDate, setPickerDate] = React.useState(new Date(currentDate));
  const datePickerRef = React.useRef(null);

  const weekDays = CalendarUtils.getWeekDays(currentDate);
  const timeSlots = CalendarUtils.generateTimeSlots(
    workingHours.start,
    workingHours.end,
    60
  );

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

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    newDate.setDate(1); // First day of previous month
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    newDate.setDate(1); // First day of next month
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
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

  // Date picker functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const goToPreviousPickerMonth = () => {
    const newDate = new Date(pickerDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setPickerDate(newDate);
  };

  const goToNextPickerMonth = () => {
    const newDate = new Date(pickerDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setPickerDate(newDate);
  };

  const selectDate = (date) => {
    if (date) {
      onDateChange(date);
      setShowDatePicker(false);
    }
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  return (
    <div className='h-full flex flex-col bg-white'>
      {/* Header */}
      <div className='border-b border-gray-200 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
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
            <button
              onClick={goToPreviousMonth}
              className='p-2 hover:bg-gray-100 rounded-md transition-colors'
              title='Previous month'
            >
              <ChevronsLeft className='h-4 w-4 text-gray-600' />
            </button>
            <button
              onClick={goToPreviousWeek}
              className='p-2 hover:bg-gray-100 rounded-md transition-colors'
              title='Previous week'
            >
              <ChevronLeft className='h-4 w-4 text-gray-600' />
            </button>
            <div className='relative' ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className='flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md w-[32rem] hover:bg-gray-50 transition-colors'
              >
                <Calendar className='h-4 w-4 text-gray-600 flex-shrink-0' />
                <span className='text-sm font-medium text-gray-900 whitespace-nowrap'>
                  Du{' '}
                  {CalendarUtils.formatDisplayDate(
                    CalendarUtils.getWeekStart(currentDate)
                  )}{' '}
                  au{' '}
                  {CalendarUtils.formatDisplayDate(
                    CalendarUtils.getWeekEnd(currentDate)
                  )}
                </span>
              </button>

              {/* Date Picker Popup */}
              {showDatePicker && (
                <div className='absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-[280px]'>
                  {/* Month Navigation */}
                  <div className='flex items-center justify-between mb-4'>
                    <button
                      onClick={goToPreviousPickerMonth}
                      className='p-1 hover:bg-gray-100 rounded transition-colors'
                    >
                      <ChevronLeft className='h-5 w-5 text-gray-600' />
                    </button>
                    <span className='text-sm font-semibold text-gray-900'>
                      {formatMonthYear(pickerDate)}
                    </span>
                    <button
                      onClick={goToNextPickerMonth}
                      className='p-1 hover:bg-gray-100 rounded transition-colors'
                    >
                      <ChevronRight className='h-5 w-5 text-gray-600' />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className='grid grid-cols-7 gap-1 mb-2'>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div
                        key={day}
                        className='text-center text-xs font-medium text-gray-500 py-1'
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className='grid grid-cols-7 gap-1'>
                    {getDaysInMonth(pickerDate).map((day, index) => (
                      <button
                        key={index}
                        onClick={() => selectDate(day)}
                        disabled={!day}
                        className={`
                          p-2 text-sm rounded transition-colors
                          ${!day ? 'invisible' : ''}
                          ${
                            isSameDay(day, currentDate)
                              ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                          ${
                            isSameDay(day, new Date()) &&
                            !isSameDay(day, currentDate)
                              ? 'font-semibold text-blue-600'
                              : ''
                          }
                        `}
                      >
                        {day ? day.getDate() : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={goToNextWeek}
              className='p-2 hover:bg-gray-100 rounded-md transition-colors'
              title='Next week'
            >
              <ChevronRight className='h-4 w-4 text-gray-600' />
            </button>
            <button
              onClick={goToNextMonth}
              className='p-2 hover:bg-gray-100 rounded-md transition-colors'
              title='Next month'
            >
              <ChevronsRight className='h-4 w-4 text-gray-600' />
            </button>
          </div>
          <button
            onClick={goToToday}
            className='flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium'
          >
            <CalendarCheck className='h-4 w-4' />
            <span>Aujourd'hui</span>
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
                          const isCancelled =
                            appointment.status === 'CANCELLED';
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
                              ${
                                colorClasses.hoverBg
                              } transition-all rounded-lg overflow-hidden text-xs
                              ${isCancelled ? 'opacity-60' : ''}
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
                                <div
                                  className={`text-xs font-medium text-gray-900 truncate ${
                                    isCancelled ? 'line-through' : ''
                                  }`}
                                >
                                  {getAppointmentPatientsDisplay(appointment)}
                                </div>
                                {isCancelled && (
                                  <div className='text-xs text-red-600 font-semibold'>
                                    Annulé
                                  </div>
                                )}
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
