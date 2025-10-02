import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';
import { appointmentAPI } from '../../services/api';

const TimeSlotSelector = ({
  selectedDate,
  consultationTypeId,
  consultationTypes = [],
  value,
  onChange,
  error,
}) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get consultation type details
  const consultationType = consultationTypes.find(
    (ct) => ct.id === parseInt(consultationTypeId)
  );

  const duration = consultationType?.duration || 30;

  useEffect(() => {
    if (selectedDate && consultationTypeId) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, consultationTypeId]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);

      // Use the new backend endpoint to get available slots
      const response = await appointmentAPI.getAvailableSlots(
        selectedDate,
        consultationTypeId
      );

      // Transform the backend response to match the expected format
      const formattedSlots = response.slots
        .filter((slot) => slot.available)
        .map((slot) => ({
          time: slot.time,
          displayTime: format(new Date(`2000-01-01T${slot.time}`), 'h:mm a'),
          available: slot.available,
        }));

      setAvailableSlots(formattedSlots);
    } catch (error) {
      console.error('Error loading available time slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='flex items-center space-x-2 text-gray-600'>
          <Clock className='h-5 w-5 animate-spin' />
          <span>Loading available times...</span>
        </div>
      </div>
    );
  }

  if (!loading && availableSlots.length === 0) {
    return (
      <div className='text-center p-8 text-gray-500'>
        <Clock className='h-8 w-8 mx-auto mb-2' />
        <p>No available time slots for this day</p>
        <p className='text-sm mt-1'>
          Try selecting a different date or consultation type
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='text-sm text-gray-600 mb-3'>
        Available times for{' '}
        {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
      </div>

      <div className='grid grid-cols-3 gap-2 max-h-64 overflow-y-auto'>
        {availableSlots.map((slot) => (
          <button
            key={slot.time}
            type='button'
            onClick={() => onChange(slot.time)}
            className={`p-3 text-sm border rounded-lg transition-colors text-center ${
              value === slot.time
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className='font-medium'>{slot.displayTime}</div>
            <div className='text-xs text-gray-500 mt-1'>{duration} min</div>
          </button>
        ))}
      </div>

      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  );
};

export default TimeSlotSelector;
