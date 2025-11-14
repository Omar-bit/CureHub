import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { CalendarView } from './calendar';
import { appointmentAPI } from '../services/api';
import { showError } from '../lib/toast';
import { Loader2 } from 'lucide-react';

const CalendarSection = forwardRef(
  ({ onAppointmentClick, onTimeSlotClick }, ref) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const calendarRef = useRef();

    // Load appointments
    const loadAppointments = async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        const data = await appointmentAPI.getAll();
        setAppointments(data.appointments || data || []);
      } catch (error) {
        console.error('Error loading appointments:', error);
        showError('Failed to load appointments.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };

    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
      navigateToDate: (date) => {
        if (calendarRef.current) {
          calendarRef.current.navigateToDate(date);
        }
      },
      refreshAppointments: () => loadAppointments({ showLoader: false }),
    }));

    // Load appointments
    useEffect(() => {
      loadAppointments();
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
      <div className='h-full bg-white lg:border-r border-gray-200 '>
        <CalendarView
          ref={calendarRef}
          appointments={appointments}
          onAppointmentClick={onAppointmentClick}
          onTimeSlotClick={onTimeSlotClick}
          workingHours={{ start: 8, end: 20 }}
          defaultView='day'
        />
      </div>
    );
  }
);

CalendarSection.displayName = 'CalendarSection';

export default CalendarSection;
