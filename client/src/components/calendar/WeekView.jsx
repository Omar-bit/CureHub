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
  Calendar,
  CalendarCheck,
  MapPin,
  Eye,
  Rabbit,
  X,
} from 'lucide-react';

const WeekView = ({
  currentDate,
  appointments = [],
  imprevus = [],
  ptos = [],
  timeplans = [],
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  onAppointmentDrop,
  workingHours = { start: 8, end: 20 },
  isTabOpen = false,
  currentView = 'week',
  onViewChange,
  mainColor = '#FFA500',
}) => {
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [currentTimePosition, setCurrentTimePosition] = React.useState(null);
  const [draggedAppointment, setDraggedAppointment] = React.useState(null);
  const [dragOverSlot, setDragOverSlot] = React.useState(null);
  const datePickerRef = React.useRef(null);

  const weekDays = CalendarUtils.getWeekDays(currentDate);
  const timeSlots = CalendarUtils.generateTimeSlots(
    workingHours.start,
    workingHours.end,
    60
  );

  // Helper to truncate long text for display in the calendar
  const truncateText = (text, n = 60) => {
    if (!text) return null;
    return text.length > n ? text.slice(0, n) + '…' : text;
  };

  // Calculate current time indicator position
  const getCurrentTimePosition = React.useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Only show if within working hours and today is in the current week
    const isThisWeek = weekDays.some(
      (day) => CalendarUtils.formatDate(day) === CalendarUtils.formatDate(now)
    );
    if (
      !isThisWeek ||
      hours < workingHours.start ||
      hours >= workingHours.end
    ) {
      setCurrentTimePosition(null);
      return null;
    }

    const minutesFromStart = (hours - workingHours.start) * 60 + minutes;
    const position = minutesFromStart;
    setCurrentTimePosition(position);
  }, [weekDays, workingHours.start, workingHours.end]);

  // Initialize and update current time position
  React.useEffect(() => {
    // Call immediately on mount and when dependencies change
    getCurrentTimePosition();

    // Update current time every minute for accuracy
    const interval = setInterval(() => {
      getCurrentTimePosition();
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, [getCurrentTimePosition]);

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

  // Drag and drop handlers
  const handleDragStart = (e, appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appointment.id);
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedAppointment(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, dayIndex, timeSlot) => {
    e.preventDefault();
    setDragOverSlot(`${dayIndex}-${timeSlot}`);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = (e, day, timeSlot) => {
    e.preventDefault();
    if (!draggedAppointment) return;

    const [hour] = timeSlot.split(':').map(Number);

    // Get the drop position relative to the time slot element
    const rect = e.currentTarget.getBoundingClientRect();
    const dropY = e.clientY - rect.top;
    const slotHeight = rect.height;

    // Calculate which 15-minute segment was dropped on (0, 15, 30, or 45)
    const segmentIndex = Math.floor((dropY / slotHeight) * 4);
    const minute = Math.min(segmentIndex, 3) * 15;

    const newStartTime = new Date(day);
    newStartTime.setHours(hour, minute, 0, 0);

    // Calculate duration of the original appointment
    const originalStart = new Date(draggedAppointment.startTime);
    const originalEnd = new Date(draggedAppointment.endTime);
    const duration = originalEnd.getTime() - originalStart.getTime();

    // Calculate new end time based on original duration
    const newEndTime = new Date(newStartTime.getTime() + duration);

    onAppointmentDrop?.(draggedAppointment, newStartTime, newEndTime);
    setDraggedAppointment(null);
    setDragOverSlot(null);
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

    // Add small gap between adjacent appointments by reducing height slightly
    const gapSize = 0.1; // pixels - creates visual spacing between appointments

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
      height: `${Math.max(15, height - gapSize)}px`, // Reduce height to create gap between adjacent appointments, with minimum height
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

  // Helper to get day of week from date (returns MONDAY, TUESDAY, etc.)
  const getDayOfWeek = (date) => {
    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()];
  };

  // Calculate availability segments from timeplans for a specific day
  const getAvailabilitySegmentsForDay = React.useCallback(
    (day) => {
      if (!timeplans || timeplans.length === 0) {
        return [];
      }

      const dayOfWeek = getDayOfWeek(day);
      const dateStr = CalendarUtils.formatDate(day, 'yyyy-MM-dd');

      // Find timeplan for this day - prioritize specific date, then general weekly
      let timeplan = timeplans.find(
        (tp) =>
          tp.dayOfWeek === dayOfWeek &&
          tp.specificDate &&
          CalendarUtils.formatDate(new Date(tp.specificDate), 'yyyy-MM-dd') ===
            dateStr &&
          tp.isActive
      );

      if (!timeplan) {
        timeplan = timeplans.find(
          (tp) => tp.dayOfWeek === dayOfWeek && !tp.specificDate && tp.isActive
        );
      }

      if (!timeplan || !timeplan.timeSlots || timeplan.timeSlots.length === 0) {
        return [];
      }

      const segments = [];
      const activeSlots = timeplan.timeSlots.filter(
        (slot) => slot.isActive && slot.isActive !== false
      );

      activeSlots.forEach((slot) => {
        if (!slot.consultationTypes || slot.consultationTypes.length === 0) {
          return;
        }

        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);

        // Calculate position and height (WeekView uses fixed 60px per hour, no zoom)
        const startTimeStr = slot.startTime;
        const startDate = new Date(day);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(day);
        endDate.setHours(endHour, endMinute, 0, 0);

        // Check if slot overlaps with working hours
        const slotEndHour = endHour + (endMinute > 0 ? 0.01 : 0);
        if (
          slotEndHour <= workingHours.start ||
          startHour >= workingHours.end
        ) {
          return;
        }

        const duration = CalendarUtils.getAppointmentDuration(
          startDate,
          endDate
        );
        const top = CalendarUtils.getTimeSlotPosition(
          startTimeStr,
          workingHours.start,
          60
        );
        const height = CalendarUtils.getTimeSlotHeight(duration, 60);

        if (height <= 0) {
          return;
        }

        // Extract consultation types with their colors
        const consultationTypesList = slot.consultationTypes
          .map((ct) => {
            // Handle both nested structure (ct.consultationType) and flat structure
            const consultationType = ct.consultationType || ct;
            return consultationType;
          })
          .filter((ct) => ct !== null);

        if (consultationTypesList.length === 0) {
          return;
        }

        // If multiple consultation types, create side-by-side thin vertical lines with gaps
        const numTypes = consultationTypesList.length;
        const gapSize = 1; // Gap size in pixels between lines
        const totalBarWidth = 3; // Total width for the bar area in pixels
        const totalGaps = numTypes > 1 ? (numTypes - 1) * gapSize : 0;
        const barWidth =
          numTypes > 1 ? (totalBarWidth - totalGaps) / numTypes : totalBarWidth;

        consultationTypesList.forEach((consultationType, index) => {
          // Calculate position: previous bars + gaps
          const leftOffset = index * (barWidth + gapSize);

          segments.push({
            top,
            height,
            left: leftOffset, // Pixel offset from start
            width: barWidth, // Pixel width of each bar
            color:
              consultationType.modeExercice?.color ||
              consultationType.color ||
              '#3B82F6',
            name: consultationType.name || 'Consultation',
            startTime: slot.startTime,
            endTime: slot.endTime,
            consultationTypeId: consultationType.id,
          });
        });
      });

      return segments;
    },
    [timeplans, workingHours.start, workingHours.end]
  );

  const getBlockingImprevuSegmentsForDay = React.useCallback(
    (day) => {
      if (!imprevus || imprevus.length === 0) {
        return [];
      }
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const windowStart = new Date(day);
      windowStart.setHours(workingHours.start, 0, 0, 0);
      const windowEnd = new Date(day);
      windowEnd.setHours(workingHours.end, 0, 0, 0);

      const segments = [];

      imprevus.forEach((imprevu) => {
        if (imprevu.blockTimeSlots === false) {
          return;
        }
        const start = new Date(imprevu.startDate);
        const end = new Date(imprevu.endDate);
        if (end <= dayStart || start >= dayEnd) {
          return;
        }

        const segmentStart = new Date(
          Math.max(start.getTime(), windowStart.getTime())
        );
        const segmentEnd = new Date(
          Math.min(end.getTime(), windowEnd.getTime())
        );
        if (segmentEnd <= segmentStart) {
          return;
        }

        const startTimeStr = CalendarUtils.formatTime(segmentStart);
        const duration = CalendarUtils.getAppointmentDuration(
          segmentStart,
          segmentEnd
        );

        // WeekView uses standard 60px height per hour (no verticalZoom)
        const top = CalendarUtils.getTimeSlotPosition(
          startTimeStr,
          workingHours.start,
          60
        );
        const height = CalendarUtils.getTimeSlotHeight(duration, 60);

        if (height > 0) {
          segments.push({
            top,
            height,
            type: 'imprevu',
            label: 'Jour fermé (imprévu)',
            imprevu,
          });
        }
      });

      // Process PTOs
      ptos.forEach((pto) => {
        const start = new Date(pto.startDate);
        start.setHours(0, 0, 0, 0); // Ensure PTO starts at beginning of day
        const end = new Date(pto.endDate);
        end.setHours(23, 59, 59, 999); // Ensure PTO ends at end of day

        if (end <= dayStart || start >= dayEnd) {
          return;
        }

        const segmentStart = new Date(
          Math.max(start.getTime(), windowStart.getTime())
        );
        const segmentEnd = new Date(
          Math.min(end.getTime(), windowEnd.getTime())
        );

        if (segmentEnd <= segmentStart) {
          return;
        }

        const startTimeStr = CalendarUtils.formatTime(segmentStart);
        const duration = CalendarUtils.getAppointmentDuration(
          segmentStart,
          segmentEnd
        );

        const top = CalendarUtils.getTimeSlotPosition(
          startTimeStr,
          workingHours.start,
          60
        );
        const height = CalendarUtils.getTimeSlotHeight(duration, 60);

        if (height > 0) {
          segments.push({
            top,
            height,
            type: 'pto',
            label: pto.label
              ? `Jour fermé (${pto.label})`
              : 'Jour fermé (Congés)',
            pto,
          });
        }
      });

      return segments;
    },
    [imprevus, ptos, workingHours.start, workingHours.end]
  );

  const hasBlockingImprevuForDay = React.useCallback(
    (day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const hasImprevu = imprevus?.some((imprevu) => {
        const start = new Date(imprevu.startDate);
        const end = new Date(imprevu.endDate);
        const blocks = imprevu.blockTimeSlots !== false;
        return blocks && end > dayStart && start < dayEnd;
      });

      if (hasImprevu) return true;

      // Check PTOs
      const hasPto = ptos?.some((pto) => {
        const start = new Date(pto.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(pto.endDate);
        end.setHours(23, 59, 59, 999);
        return end > dayStart && start < dayEnd;
      });

      return hasPto;
    },
    [imprevus, ptos]
  );

  return (
    <div className='h-full flex flex-col bg-white'>
      {/* Header */}
      <div className='border-b border-gray-200 p-4'>
        <div className='flex items-center justify-between'>
          <button
            onClick={goToToday}
            className='flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium'
          >
            <CalendarCheck className='h-4 w-4' />
            <span>Aujourd'hui</span>
          </button>
          <div className='flex items-center space-x-2'>
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
                className='flex items-center space-x-2 px-3 py-1.5 bg-white  rounded-md w-[20rem] hover:bg-gray-50 transition-colors'
              >
                <Calendar className='h-4 w-4 text-gray-600 flex-shrink-0' />
                <span className='text-sm font-medium text-gray-900 whitespace-nowrap'>
                  Du{' '}
                  {CalendarUtils.formatDate(
                    CalendarUtils.getWeekStart(currentDate),
                    'EEEE dd/MM'
                  )}{' '}
                  au{' '}
                  {CalendarUtils.formatDate(
                    CalendarUtils.getWeekEnd(currentDate),
                    'EEEE dd/MM/yyyy'
                  )}
                </span>
              </button>

              {/* Date Picker Popup */}
              {showDatePicker && (
                <DatePickerPopup
                  currentDate={currentDate}
                  onDateChange={onDateChange}
                  onClose={() => setShowDatePicker(false)}
                />
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

      {/* Week header with days */}
      <div className='border-b border-gray-200'>
        <div className='flex'>
          <div className='w-12 flex-shrink-0'></div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className='week-day flex-1 text-center py-3 border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors'
              onClick={() => {
                onDateChange(day);
                onViewChange?.('day');
              }}
            >
              <div
                className={`text-sm font-medium ${
                  CalendarUtils.isToday(day) ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {CalendarUtils.formatDate(day, isTabOpen ? 'EEE' : 'EEEE')}
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
            minHeight: '100%',
            backgroundImage: `repeating-linear-gradient(to bottom, #f3f4f6 0, #f3f4f6 1px, transparent 1px, transparent 60px)`,
          }}
        >
          {/* Time slots grid */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeSlot} className='flex border-t border-gray-100'>
              {/* Time label */}
              <div className='w-12 flex-shrink-0 text-xs text-gray-500 text-right pr-2 -mt-1'>
                {timeSlot}
              </div>
              {/* Day columns */}
              {weekDays.map((day, dayIndex) => {
                const blockingSegments = getBlockingImprevuSegmentsForDay(day);
                const isBlockedDay =
                  blockingSegments.length > 0 || hasBlockingImprevuForDay(day);
                const slotKey = `${dayIndex}-${timeSlot}`;
                const isSlotHighlighted = dragOverSlot === slotKey;
                return (
                  <div
                    key={dayIndex}
                    className={`flex-1 border-r border-gray-100 last:border-r-0 cursor-pointer transition-all duration-150 relative ${
                      isSlotHighlighted
                        ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset z-10'
                        : draggedAppointment
                        ? 'hover:bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    style={{ height: '60px' }}
                    onClick={() => handleTimeSlotClick(day, timeSlot)}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, dayIndex, timeSlot)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day, timeSlot)}
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
                        {isBlockedDay && (
                          <div className='absolute inset-0 pointer-events-none'>
                            {blockingSegments.length > 0 ? (
                              blockingSegments.map((segment, index) => (
                                <div
                                  key={index}
                                  className='absolute left-0 right-0 bg-slate-100/80 backdrop-blur-[1px]'
                                  style={{
                                    top: `${segment.top}px`,
                                    height: `${segment.height}px`,
                                  }}
                                />
                              ))
                            ) : (
                              <div className='absolute inset-0 bg-slate-100/80 backdrop-blur-[1px]' />
                            )}
                            <div
                              className='absolute left-2 right-2 flex justify-center'
                              style={{
                                top: `${
                                  blockingSegments.length > 0
                                    ? Math.max(blockingSegments[0].top, 8)
                                    : 8
                                }px`,
                              }}
                            >
                              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-700 bg-slate-200/90 border border-slate-300/70 shadow-sm'>
                                Jour fermé (imprévu)
                              </span>
                            </div>
                          </div>
                        )}
                        {currentTimePosition !== null &&
                          CalendarUtils.isToday(day) && (
                            <div
                              className='absolute left-0 right-0 z-20 pointer-events-none'
                              style={{ top: `${currentTimePosition}px` }}
                            >
                              <div className='relative flex items-center'>
                                <div
                                  className='w-2.5 h-2.5 rounded-full border-2 border-white shadow-lg'
                                  style={{ backgroundColor: mainColor }}
                                />
                                <div
                                  className='flex-1 h-0.5 shadow-sm'
                                  style={{ backgroundColor: mainColor }}
                                />
                              </div>
                            </div>
                          )}
                        {/* Availability Bars - Thin vertical lines at left edge of day column (next to time labels) */}
                        {getAvailabilitySegmentsForDay(day).map(
                          (segment, segIndex) => {
                            const segmentLeft = segment.left || 0; // Pixel offset from start of bar area
                            const segmentWidth = segment.width || 3; // Pixel width of the bar

                            return (
                              <div
                                key={`availability-${dayIndex}-${segment.consultationTypeId}-${segIndex}`}
                                className='absolute rounded-[100%] overflow-hidden shadow-md opacity-80 z-10 pointer-events-none'
                                style={{
                                  top: `${segment.top}px`,
                                  height: `${segment.height}px`,
                                  left: `${segmentLeft}px`,
                                  width: `${segmentWidth}px`,
                                  backgroundColor: segment.color,
                                  borderRadius: '1px',
                                }}
                                title={`${segment.name} - ${segment.startTime} à ${segment.endTime}`}
                              />
                            );
                          }
                        )}
                        {getDayAppointmentLayouts(day).map(
                          ({ appointment, column, totalColumns }) => {
                            const colorClasses =
                              getAppointmentColorClasses(appointment);
                            const startTime = CalendarUtils.formatTime(
                              new Date(appointment.startTime)
                            );
                            const duration =
                              CalendarUtils.getAppointmentDuration(
                                appointment.startTime,
                                appointment.endTime
                              );
                            const isShort = duration <= 15;
                            const isCancelled =
                              appointment.status === 'CANCELLED';

                            const getStatusIcon = (status) => {
                              switch (status) {
                                case 'WAITING':
                                  return (
                                    <div className='bg-purple-500 rounded-full p-0.5 flex items-center justify-center'>
                                      <MapPin className='w-2 h-2 text-white' />
                                    </div>
                                  );
                                case 'COMPLETED':
                                  return (
                                    <div className='bg-green-500 rounded-full p-0.5 flex items-center justify-center'>
                                      <Eye className='w-2 h-2 text-white' />
                                    </div>
                                  );
                                case 'ABSENT':
                                  return (
                                    <div
                                      className='rounded-full p-0.5 flex items-center justify-center'
                                      style={{ backgroundColor: '#f9516a' }}
                                    >
                                      <Rabbit className='w-2 h-2 text-white' />
                                    </div>
                                  );
                                case 'CANCELLED':
                                  return (
                                    <div className='bg-gray-500 rounded-full p-0.5 flex items-center justify-center'>
                                      <X className='w-2 h-2 text-white' />
                                    </div>
                                  );
                                default:
                                  return null;
                              }
                            };
                            const statusIcon = getStatusIcon(
                              appointment.status
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
                                flex ${
                                  isShort ? 'items-center' : 'items-start'
                                } gap-0.5 cursor-grab active:cursor-grabbing
                                ${
                                  colorClasses.darkBg
                                } transition-all rounded-lg overflow-hidden ${
                                  isShort ? 'text-[10px]' : 'text-xs'
                                }
                                ${isCancelled ? 'opacity-60' : ''}
                                ${
                                  draggedAppointment?.id === appointment.id
                                    ? 'ring-2 ring-blue-500 ring-offset-1'
                                    : ''
                                }
                              `}
                                draggable
                                onDragStart={(e) =>
                                  handleDragStart(e, appointment)
                                }
                                onDragEnd={handleDragEnd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAppointmentClick?.(appointment);
                                }}
                              >
                                <div
                                  className={`${
                                    colorClasses.bgColor
                                  } text-white px-2 ${
                                    isShort ? 'py-0' : 'py-0.5'
                                  } font-bold whitespace-nowrap flex-shrink-0 rounded-l-lg flex items-center gap-1`}
                                >
                                  <span>{startTime}</span>
                                  {statusIcon && <span>{statusIcon}</span>}
                                </div>

                                <div
                                  className={`flex-1 min-w-0 px-1 ${
                                    isShort ? 'py-0' : 'py-0.5'
                                  }`}
                                >
                                  <div
                                    className={`${
                                      isShort
                                        ? 'text-[10px] leading-3'
                                        : 'text-xs'
                                    } font-medium text-gray-900 truncate ${
                                      isCancelled ? 'line-through' : ''
                                    }`}
                                  >
                                    {getAppointmentPatientsDisplay(appointment)}
                                    {!isCancelled &&
                                      appointment.absenceCount > 0 && (
                                        <span className='ml-1 text-gray-500'>
                                          {appointment.absenceCount} abs.
                                        </span>
                                      )}
                                  </div>
                                  {isCancelled && (
                                    <div
                                      className={`${
                                        isShort ? 'text-[9px]' : 'text-xs'
                                      } text-red-600 font-semibold`}
                                    >
                                      Annulé
                                    </div>
                                  )}

                                  {(appointment.description ||
                                    appointment.notes) && (
                                    <div
                                      className={`${
                                        isShort ? 'text-[9px]' : 'text-xs'
                                      } text-white mt-0.5 truncate`}
                                    >
                                      {truncateText(appointment.description)}
                                      {appointment.description &&
                                      appointment.notes
                                        ? ' • '
                                        : ''}
                                      {truncateText(appointment.notes)}
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
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
