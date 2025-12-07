import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TimePickerInput = ({ value, onChange, error, className = '' }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const pickerRef = useRef(null);

  // Parse the value when it changes
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour || '08');
      setSelectedMinute(minute || '00');
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  // Generate minutes (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  const minutes = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, '0')
  );

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    const newTime = `${hour}:${selectedMinute}`;
    onChange(newTime);
  };

  const handleMinuteSelect = (minute) => {
    setSelectedMinute(minute);
    const newTime = `${selectedHour}:${minute}`;
    onChange(newTime);
  };

  const displayValue = value || `${selectedHour}:${selectedMinute}`;

  return (
    <div className='relative' ref={pickerRef}>
      <div
        onClick={() => setShowPicker(!showPicker)}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${className}`}
      >
        <span className='text-gray-900'>{displayValue}</span>
        <Clock className='h-4 w-4 text-gray-400' />
      </div>

      {showPicker && (
        <div className='absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-full'>
          <div className='flex'>
            {/* Hours Column */}
            <div className='flex-1 border-r border-gray-200'>
              <div className='p-2 bg-gray-50 border-b border-gray-200 text-center'>
                <span className='text-xs font-semibold text-gray-700'>
                  Heures
                </span>
              </div>
              <div className='max-h-60 overflow-y-auto'>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => handleHourSelect(hour)}
                    className={`px-4 py-2 cursor-pointer text-center hover:bg-blue-50 transition-colors ${
                      selectedHour === hour
                        ? 'bg-blue-500 text-white font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className='flex-1'>
              <div className='p-2 bg-gray-50 border-b border-gray-200 text-center'>
                <span className='text-xs font-semibold text-gray-700'>
                  Minutes
                </span>
              </div>
              <div className='max-h-60 overflow-y-auto'>
                {minutes.map((minute) => (
                  <div
                    key={minute}
                    onClick={() => handleMinuteSelect(minute)}
                    className={`px-4 py-2 cursor-pointer text-center hover:bg-blue-50 transition-colors ${
                      selectedMinute === minute
                        ? 'bg-blue-500 text-white font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    {minute}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className='p-2 border-t border-gray-200 bg-gray-50'>
            <button
              type='button'
              onClick={() => setShowPicker(false)}
              className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePickerInput;
