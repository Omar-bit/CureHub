import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DatePickerPopup = ({ currentDate, onDateChange, onClose }) => {
  const [pickerDate, setPickerDate] = React.useState(new Date(currentDate));

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

  const goToPreviousMonth = () => {
    const newDate = new Date(pickerDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setPickerDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(pickerDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setPickerDate(newDate);
  };

  const selectDate = (date) => {
    if (date) {
      onDateChange(date);
      onClose();
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
    <div className='absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-[280px]'>
      {/* Month Navigation */}
      <div className='flex items-center justify-between mb-4'>
        <button
          onClick={goToPreviousMonth}
          className='p-1 hover:bg-gray-100 rounded transition-colors'
        >
          <ChevronLeft className='h-5 w-5 text-gray-600' />
        </button>
        <span className='text-sm font-semibold text-gray-900'>
          {formatMonthYear(pickerDate)}
        </span>
        <button
          onClick={goToNextMonth}
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
                isSameDay(day, new Date()) && !isSameDay(day, currentDate)
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
  );
};

export default DatePickerPopup;
