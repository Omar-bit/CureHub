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
  MapPin,
  Eye,
  Rabbit,
} from 'lucide-react';

const DayView = ({
  currentDate,
  appointments = [],
  imprevus = [],
  ptos = [],
  timeplans = [],
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
  const containerRef = React.useRef(null);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const [currentTimePosition, setCurrentTimePosition] = React.useState(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const datePickerRef = React.useRef(null);

  // Calculate effective zoom to fill height if needed
  const effectiveZoom = React.useMemo(() => {
    if (!containerHeight) return verticalZoom;
    const durationHours = workingHours.end - workingHours.start;
    if (durationHours <= 0) return verticalZoom;

    // Calculate zoom needed to fill the container height
    // We substract a small buffer (e.g. 1px to avoid rounding issues causing scrollbars)
    const autoZoom = (containerHeight - 1) / (durationHours * 60);

    // Use the larger of the two zooms
    return Math.max(verticalZoom, autoZoom);
  }, [containerHeight, workingHours.start, workingHours.end, verticalZoom]);

  // Observer for container height
  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate current time indicator position
  const getCurrentTimePosition = React.useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Only show if it's today and within working hours
    const isToday =
      CalendarUtils.formatDate(now) === CalendarUtils.formatDate(currentDate);
    if (!isToday || hours < workingHours.start || hours >= workingHours.end) {
      setCurrentTimePosition(null);
      return null;
    }

    const minutesFromStart = (hours - workingHours.start) * 60 + minutes;
    const position = minutesFromStart * effectiveZoom;
    setCurrentTimePosition(position);
  }, [currentDate, workingHours.start, workingHours.end, effectiveZoom]);

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

  const timeSlots = CalendarUtils.generateTimeSlots(
    workingHours.start,
    workingHours.end,
    60
  );
  const dayAppointments = CalendarUtils.getAppointmentsForDay(
    appointments,
    currentDate
  );

  // Helper to get day of week from date (returns MONDAY, TUESDAY, etc.)
  const getDayOfWeek = (date) => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  };

  // Calculate availability segments from timeplans
  const availabilitySegments = React.useMemo(() => {
    if (!timeplans || timeplans.length === 0) {
      return [];
    }

    const dayOfWeek = getDayOfWeek(currentDate);
    const dateStr = CalendarUtils.formatDate(currentDate, 'yyyy-MM-dd');

    // Find timeplan for this day - prioritize specific date, then general weekly
    let timeplan = timeplans.find(
      (tp) =>
        tp.dayOfWeek === dayOfWeek &&
        tp.specificDate &&
        CalendarUtils.formatDate(new Date(tp.specificDate), 'yyyy-MM-dd') === dateStr &&
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
    const activeSlots = timeplan.timeSlots.filter((slot) => slot.isActive && slot.isActive !== false);

    activeSlots.forEach((slot) => {
      if (!slot.consultationTypes || slot.consultationTypes.length === 0) {
        return;
      }

      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);

      // Calculate position and height
      const startTimeStr = slot.startTime;
      const startDate = new Date(currentDate);
      startDate.setHours(startHour, startMinute, 0, 0);
      const endDate = new Date(currentDate);
      endDate.setHours(endHour, endMinute, 0, 0);

      // Check if slot overlaps with working hours
      const slotEndHour = endHour + (endMinute > 0 ? 0.01 : 0);
      if (slotEndHour <= workingHours.start || startHour >= workingHours.end) {
        return;
      }

      const duration = CalendarUtils.getAppointmentDuration(startDate, endDate);
      const top = CalendarUtils.getTimeSlotPosition(
        startTimeStr,
        workingHours.start,
        60 * effectiveZoom
      );
      const height = CalendarUtils.getTimeSlotHeight(duration, 60 * effectiveZoom);

      if (height <= 0) {
        return;
      }

      // Extract consultation types with their colors
      const consultationTypesList = slot.consultationTypes
        .map((ct) => {
          // Handle both nested structure (ct.consultationType) and flat structure
          const consultationType = ct.consultationType || ct;
          return consultationType && consultationType.color ? consultationType : null;
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
      const barWidth = numTypes > 1 ? (totalBarWidth - totalGaps+5) / numTypes : totalBarWidth;

      consultationTypesList.forEach((consultationType, index) => {
        // Calculate position: previous bars + gaps
        const leftOffset = index * (barWidth + gapSize);
        
        segments.push({
          top,
          height,
          left: leftOffset, // Pixel offset from start
          width: barWidth, // Pixel width of each bar
          color: consultationType.color || '#gray',
          name: consultationType.name || 'Consultation',
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationTypeId: consultationType.id,
        });
      });
    });

    return segments;
  }, [timeplans, currentDate, workingHours.start, workingHours.end, effectiveZoom]);

  const blockingImprevuSegments = React.useMemo(() => {
    if (!imprevus || imprevus.length === 0) {
      return [];
    }
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    const windowStart = new Date(currentDate);
    windowStart.setHours(workingHours.start, 0, 0, 0);
    const windowEnd = new Date(currentDate);
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
      const segmentEnd = new Date(Math.min(end.getTime(), windowEnd.getTime()));
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
        60 * effectiveZoom
      );
      const height = CalendarUtils.getTimeSlotHeight(
        duration,
        60 * effectiveZoom
      );

      if (height > 0) {
        segments.push({ top, height, type: 'imprevu', label: 'Jour fermé (imprévu)', imprevu });
      }
    });

    // Process PTOs
    ptos.forEach((pto) => {
      const start = new Date(pto.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(pto.endDate);
      end.setHours(23, 59, 59, 999);

      if (end <= dayStart || start >= dayEnd) {
        return;
      }

      const segmentStart = new Date(
        Math.max(start.getTime(), windowStart.getTime())
      );
      const segmentEnd = new Date(Math.min(end.getTime(), windowEnd.getTime()));
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
        60 * effectiveZoom
      );
      const height = CalendarUtils.getTimeSlotHeight(
        duration,
        60 * effectiveZoom
      );

      if (height > 0) {
        segments.push({ top, height, type: 'pto', label: pto.label ? `Jour fermé (${pto.label})` : 'Jour fermé (Congés)', pto });
      }
    });

    return segments;
  }, [
    imprevus,
    currentDate,
    workingHours.start,
    workingHours.end,
    effectiveZoom,
    ptos
  ]);

  const hasBlockingImprevu = React.useMemo(() => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
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
  }, [imprevus, ptos, currentDate]);

  // Helper to truncate long text for display in the calendar
  const truncateText = (text, n = 60) => {
    if (!text) return null;
    return text.length > n ? text.slice(0, n) + '…' : text;
  };

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

  // Get status icon and background color based on appointment status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING':
        return (
          <div className='bg-purple-500 rounded-full p-0.5 flex items-center justify-center'>
            <MapPin className='w-2.5 h-2.5 text-white' />
          </div>
        );
      case 'COMPLETED':
        return (
          <div className='bg-green-500 rounded-full p-0.5 flex items-center justify-center'>
            <Eye className='w-2.5 h-2.5 text-white' />
          </div>
        );
      case 'ABSENT':
        return (
          <div
            className='rounded-full p-0.5 flex items-center justify-center'
            style={{ backgroundColor: '#f9516a' }}
          >
            <Rabbit className='w-2.5 h-2.5 text-white' />
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

  const handleTimeSlotClick = (timeSlot, event) => {
    const [hour] = timeSlot.split(':').map(Number);

    // Get the click position relative to the time slot element
    const rect = event.currentTarget.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const slotHeight = rect.height;

    // Calculate which 15-minute segment was clicked (0, 15, 30, or 45)
    const segmentIndex = Math.floor((clickY / slotHeight) * 4);
    const minute = Math.min(segmentIndex, 3) * 15; // Clamp to 0, 15, 30, or 45

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

    // Add small gap between adjacent appointments by reducing height slightly
    const gapSize = 0.3; // pixels - creates visual spacing between appointments

    // Apply vertical zoom to position and height
    const zoomedPosition = position * effectiveZoom;
    const zoomedHeight = (height - gapSize) * effectiveZoom; // Reduce height to create gap

    const leftOffset = 60; // Time label width
    const rightOffset = 10;

    // When tab is open, constrain appointments to not extend beyond visible area
    const maxWidthConstraint = isTabOpen ? 'min(100%, 50vw)' : '100%';
    const availableWidth = `calc(${maxWidthConstraint} - ${leftOffset + rightOffset
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
      height: `${Math.max(10, zoomedHeight)}px`, // Minimum height to ensure visibility without doubling short appointments
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
              {' '}
              {/* Calendar icon for date picker */}
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer'
              >
                <Calendar className='h-5 w-5 text-gray-600' />
              </button>
              <h2 className='text-lg font-semibold text-gray-900 w-64 text-center'>
                {CalendarUtils.formatDisplayDate(currentDate)}
              </h2>
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
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentView === 'day'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              Day
            </button>
            <button
              onClick={() => onViewChange?.('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentView === 'week'
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
      <div
        className='flex-1 overflow-y-auto'
        ref={containerRef}
      >
        <div
          className='relative'
          style={{
            height: `${(workingHours.end - workingHours.start) * 60 * effectiveZoom
              }px`,
            minHeight: '100%',
            backgroundImage: `linear-gradient(to right, white 3rem, transparent 3rem), repeating-linear-gradient(to bottom, #f3f4f6 0, #f3f4f6 1px, transparent 1px, transparent ${15 * effectiveZoom
              }px)`,
          }}
        >
          {/* Availability Bars - Thin vertical lines next to time labels */}
          {availabilitySegments.map((segment, index) => {
            const timeLabelWidth = 48; // w-12 = 48px (3rem)
            const segmentLeft = segment.left || 0; // Pixel offset from start of bar area
            const segmentWidth = segment.width || 3; // Pixel width of the bar
            
            return (
              <div
                key={`availability-${segment.consultationTypeId}-${index}`}
                className="absolute z-10 pointer-events-none"
                style={{
                  top: `${segment.top}px`,
                  height: `${segment.height}px`,
                  left: `${timeLabelWidth + segmentLeft}px`,
                  width: `${segmentWidth}px`,
                  backgroundColor: segment.color,
                  borderRadius: '1px',
                }}
                title={`${segment.name} - ${segment.startTime} à ${segment.endTime}`}
              />
            );
          })}

          {(blockingImprevuSegments.length > 0 || hasBlockingImprevu) && (
            <div
              className='absolute inset-y-0 right-0 pointer-events-none'
              style={{ left: '3rem' }}
            >
              {blockingImprevuSegments.length > 0 ? (
                blockingImprevuSegments.map((segment, index) => (
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
                className='absolute left-8'
                style={{
                  top: `${blockingImprevuSegments.length > 0
                    ? Math.max(blockingImprevuSegments[0].top, 8)
                    : 8
                    }px`,
                }}
              >
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-700 bg-slate-200/90 border border-slate-300/70 shadow-sm'>
                  {blockingImprevuSegments.length > 0 ? blockingImprevuSegments[0].label : 'Jour fermé (imprévu)'}
                </span>
              </div>
            </div>
          )}
          {/* Time labels and slots */}
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className='relative'>
              <div className='flex'>
                {/* Time label */}
                <div className='w-12 text-xs text-gray-500 text-right pr-2 -mt-1'>
                  {timeSlot}
                </div>
                {/* Time slot area */}
                <div
                  className='flex-1 border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors'
                  style={{ height: `${60 * effectiveZoom}px` }}
                  onClick={(e) => handleTimeSlotClick(timeSlot, e)}
                >
                  <div className='h-full w-full relative'>
                    {/* 15-minute mark */}
                    <div
                      className='absolute left-0 right-0 border-t border-gray-100'
                      style={{ top: `${15 * effectiveZoom}px` }}
                    />
                    {/* 30-minute mark */}
                    <div
                      className='absolute left-0 right-0 border-t border-gray-100'
                      style={{ top: `${30 * effectiveZoom}px` }}
                    />
                    {/* 45-minute mark */}
                    <div
                      className='absolute left-0 right-0 border-t border-gray-100'
                      style={{ top: `${45 * effectiveZoom}px` }}
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
            const duration = CalendarUtils.getAppointmentDuration(
              appointment.startTime,
              appointment.endTime
            );
            const isShort = duration <= 15;
            const isCancelled = appointment.status === 'CANCELLED';
            const statusIcon = getStatusIcon(appointment.status);
            return (
              <div
                key={appointment.id}
                style={getAppointmentStyle(appointment, column, totalColumns)}
                className={`
                  flex ${isShort ? 'items-center' : 'items-start'} gap-2 cursor-pointer
                  ${colorClasses.darkBg
                  } transition-all rounded-lg overflow-hidden
                  ${isCancelled ? 'opacity-60' : ''}
                `}
                onClick={() => onAppointmentClick?.(appointment)}
              >
                {/* Time Badge */}
                <div
                  className={`${colorClasses.bgColor} text-white px-3 ${isShort ? 'py-0' : 'py-1'} font-bold text-xs whitespace-nowrap flex-shrink-0 rounded-l-lg flex items-center gap-1.5`}
                >
                  <span className={isShort ? 'text-[10px]' : 'text-xs'}>{startTime}</span>
                  {statusIcon && <span>{statusIcon}</span>}
                </div>

                {/* Appointment Info */}
                <div className={`flex-1 min-w-0 px-2 ${isShort ? 'py-0' : 'py-0.5'}`}>
                  {/* Patient Name with Consultation Motif and Private Notes */}
                  <div className={`${isShort ? 'text-[10px] leading-3' : 'text-xs'} font-medium text-gray-900 truncate`}>
                    <span className={isCancelled ? 'line-through' : ''}>
                      {getAppointmentPatientsDisplay(appointment)}{' '}
                      {(appointment.description || appointment.notes) && (
                        <div className='inline text-slate-600'>
                          {truncateText(appointment.description) +
                            ' ' +
                            truncateText(appointment.notes)}
                        </div>
                      )}
                    </span>
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

                  {/* Description & Notes (truncated) */}
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
