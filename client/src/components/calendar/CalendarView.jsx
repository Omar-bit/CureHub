import React, { useState } from 'react';
import { Calendar, Grid3X3, MoreHorizontal } from 'lucide-react';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

const CalendarView = ({
  appointments = [],
  onAppointmentClick,
  onTimeSlotClick,
  workingHours = { start: 8, end: 20 },
  defaultView = 'day',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(defaultView);

  const viewOptions = [
    { value: 'day', label: 'Day', icon: MoreHorizontal },
    { value: 'week', label: 'Week', icon: Grid3X3 },
    { value: 'month', label: 'Month', icon: Calendar },
  ];

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendarView = () => {
    const commonProps = {
      currentDate,
      appointments,
      onDateChange: handleDateChange,
      onAppointmentClick,
      onTimeSlotClick,
      workingHours,
    };

    switch (view) {
      case 'day':
        return <DayView {...commonProps} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case 'month':
        return <MonthView {...commonProps} />;
      default:
        return <DayView {...commonProps} />;
    }
  };

  return (
    <div className='h-full flex flex-col bg-white'>
      {/* View controls */}
      <div className='border-b border-gray-200 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            {/* View selector */}
            <div className='flex bg-gray-100 rounded-lg p-1'>
              {viewOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setView(option.value)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${
                        view === option.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className='h-4 w-4' />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Today button */}
            <button
              onClick={goToToday}
              className='px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
            >
              Today
            </button>
          </div>

          {/* Legend */}
          <div className='flex items-center space-x-4 text-xs text-gray-600'>
            <div className='flex items-center space-x-1'>
              <div className='w-3 h-3 bg-blue-500 rounded'></div>
              <span>Scheduled</span>
            </div>
            <div className='flex items-center space-x-1'>
              <div className='w-3 h-3 bg-green-500 rounded'></div>
              <span>Completed</span>
            </div>
            <div className='flex items-center space-x-1'>
              <div className='w-3 h-3 bg-gray-400 rounded'></div>
              <span>Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className='flex-1 overflow-hidden'>{renderCalendarView()}</div>
    </div>
  );
};

export default CalendarView;
