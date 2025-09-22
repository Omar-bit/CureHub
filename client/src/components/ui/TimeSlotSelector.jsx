import React, { useState, useEffect, useMemo } from 'react';
import { format, addMinutes, parseISO, isSameDay, getDay } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';
import { timeplanAPI, appointmentAPI } from '../../services/api';

const DAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const TimeSlotSelector = ({
  selectedDate,
  consultationTypeId,
  consultationTypes = [],
  value,
  onChange,
  error,
}) => {
  const [timeplan, setTimeplan] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get consultation type details
  const consultationType = consultationTypes.find(
    (ct) => ct.id === parseInt(consultationTypeId)
  );

  const duration = consultationType?.duration || 30;

  useEffect(() => {
    if (selectedDate && consultationTypeId) {
      loadAvailableSlots();
    }
  }, [selectedDate, consultationTypeId]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);

      const date = new Date(selectedDate);
      const dayOfWeek = DAY_NAMES[getDay(date)];

      // Get timeplan for the day
      const timeplanData = await timeplanAPI.getByDay(dayOfWeek);

      // Get appointments for the selected date
      const appointmentsData = await appointmentAPI.getAll({
        date: selectedDate,
      });

      setTimeplan(timeplanData);
      setAppointments(appointmentsData.appointments || appointmentsData || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setTimeplan(null);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = useMemo(() => {
    if (!timeplan || !timeplan.timeSlots || !selectedDate) return [];

    const slots = [];
    const selectedDateObj = new Date(selectedDate);

    timeplan.timeSlots.forEach((timeSlot) => {
      if (!timeSlot.isActive) return;

      // Check if this time slot supports the selected consultation type
      const supportsConsultationType = timeSlot.timeSlotConsultationTypes?.some(
        (relation) =>
          relation.consultationTypeId === parseInt(consultationTypeId)
      );

      if (!supportsConsultationType) return;

      // Generate time slots based on the duration
      const startTime = parseISO(`${selectedDate}T${timeSlot.startTime}`);
      const endTime = parseISO(`${selectedDate}T${timeSlot.endTime}`);

      let currentTime = new Date(startTime);

      while (currentTime < endTime) {
        const slotEndTime = addMinutes(currentTime, duration);

        // Check if the slot fits within the time slot window
        if (slotEndTime <= endTime) {
          // Check if this slot conflicts with existing appointments
          const isConflicting = appointments.some((appointment) => {
            const apptStart = new Date(appointment.startTime);
            const apptEnd = new Date(appointment.endTime);

            return (
              isSameDay(apptStart, selectedDateObj) &&
              ((currentTime >= apptStart && currentTime < apptEnd) ||
                (slotEndTime > apptStart && slotEndTime <= apptEnd) ||
                (currentTime <= apptStart && slotEndTime >= apptEnd))
            );
          });

          if (!isConflicting) {
            slots.push({
              time: format(currentTime, 'HH:mm'),
              displayTime: format(currentTime, 'h:mm a'),
              endTime: format(slotEndTime, 'HH:mm'),
              displayEndTime: format(slotEndTime, 'h:mm a'),
            });
          }
        }

        currentTime = addMinutes(currentTime, 15); // 15-minute intervals
      }
    });

    return slots.sort((a, b) => a.time.localeCompare(b.time));
  }, [timeplan, appointments, selectedDate, consultationTypeId, duration]);

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

  if (!timeplan || !timeplan.isActive) {
    return (
      <div className='text-center p-8 text-gray-500'>
        <Calendar className='h-8 w-8 mx-auto mb-2' />
        <p>No working hours set for this day</p>
      </div>
    );
  }

  if (availableSlots.length === 0) {
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
