import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { CalendarView } from './calendar';
import { CalendarUtils } from './calendar/CalendarUtils';
import { appointmentAPI, agendaPreferencesAPI } from '../services/api';
import { showError } from '../lib/toast';
import { Loader2 } from 'lucide-react';

const CalendarSection = forwardRef(
  (
    {
      onAppointmentClick,
      onTimeSlotClick,
      isTabOpen = false,
      onDateChange,
      onAppointmentsChange,
    },
    ref
  ) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('day');
    const [preferences, setPreferences] = useState({
      mainColor: '#FFA500',
      startHour: 8,
      endHour: 20,
      verticalZoom: 1,
      schoolVacationZone: 'C',
    });
    const calendarRef = useRef();

    // Load appointments
    const loadAppointments = async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        const data = await appointmentAPI.getAll();
        const loadedAppointments = data.appointments || data || [];
        setAppointments(loadedAppointments);
        onAppointmentsChange?.(loadedAppointments);
        return loadedAppointments;
      } catch (error) {
        console.error('Error loading appointments:', error);
        showError('Failed to load appointments.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    };

    // Load preferences
    const loadPreferences = async () => {
      try {
        const data = await agendaPreferencesAPI.get();
        if (data) {
          setPreferences({
            mainColor: data.mainColor || '#FFA500',
            startHour: data.startHour || 8,
            endHour: data.endHour || 20,
            verticalZoom: data.verticalZoom || 1,
            schoolVacationZone: data.schoolVacationZone || 'C',
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
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
      getCurrentDate: () =>
        calendarRef.current?.getCurrentDate
          ? calendarRef.current.getCurrentDate()
          : null,
      getAppointmentsForDate: (date) => {
        const targetDate = date instanceof Date ? date : new Date(date);
        return CalendarUtils.getAppointmentsForDay(appointments, targetDate);
      },
      getAllAppointments: () => appointments,
    }));

    // Load appointments
    useEffect(() => {
      loadAppointments();
      loadPreferences();
    }, []);

    // Listen for preference updates
    useEffect(() => {
      const handlePreferencesUpdate = (event) => {
        setPreferences(event.detail);
      };

      window.addEventListener(
        'agendaPreferencesUpdated',
        handlePreferencesUpdate
      );
      return () => {
        window.removeEventListener(
          'agendaPreferencesUpdated',
          handlePreferencesUpdate
        );
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
      <div className='h-full bg-white lg:border-r border-gray-200 flex flex-col'>
        {/* Calendar View */}
        <div className='flex-1 overflow-hidden'>
          <CalendarView
            ref={calendarRef}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
            onTimeSlotClick={onTimeSlotClick}
            workingHours={{
              start: preferences.startHour,
              end: preferences.endHour,
            }}
            verticalZoom={preferences.verticalZoom}
            mainColor={preferences.mainColor}
            defaultView={currentView}
            isTabOpen={isTabOpen}
            onDateChange={onDateChange}
          />
        </div>
      </div>
    );
  }
);

CalendarSection.displayName = 'CalendarSection';

export default CalendarSection;
