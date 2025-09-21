import React, { useState, useEffect } from 'react';
import { CalendarView } from './calendar';
import { appointmentAPI } from '../services/api';
import { showError } from '../lib/toast';
import { Loader2 } from 'lucide-react';

const CalendarSection = ({ onAppointmentClick, onTimeSlotClick }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load appointments
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentAPI.getAll();
      setAppointments(data.appointments || data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  // Expose method to refresh appointments
  useEffect(() => {
    // Attach refresh method to global scope for other components to use
    window.refreshCalendarAppointments = loadAppointments;
    return () => {
      delete window.refreshCalendarAppointments;
    };
  }, []);

  if (loading) {
    return (
      <div className='h-full bg-white lg:border-r border-gray-200 flex items-center justify-center'>
        <div className='flex items-center space-x-2 text-gray-600'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full bg-white lg:border-r border-gray-200'>
      <CalendarView
        appointments={appointments}
        onAppointmentClick={onAppointmentClick}
        onTimeSlotClick={onTimeSlotClick}
        workingHours={{ start: 8, end: 20 }}
        defaultView='day'
      />
    </div>
  );
};

export default CalendarSection;
