import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useAgenda } from '../contexts/AgendaContext';
import PatientManagement from '../components/PatientManagement';
import CalendarSection from '../components/CalendarSection';
import AppointmentPanel from '../components/AppointmentPanel';
import TaskManagement from '../components/tasks/TaskManagement';
import EventManagement from '../components/EventManagement';
import ImprevusManagement from '../components/ImprevusManagement';
import AgendaPreferences from '../components/AgendaPreferences';
import AgendaPrintTab from '../components/AgendaPrintTab';
import { useDoctorProfile } from '../hooks/useDoctorProfile';
import { appointmentAPI } from '../services/api';
import { Menu, X } from 'lucide-react';
const TabContent = ({
  activeTab,
  appointmentPanelProps,
  onCloseAppointmentPanel,
  onAppointmentCreated,
  onAppointmentDeleted,
  onAppointmentUpdated,
  onImprevuChanged,
  printTabProps,
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'patients':
        return (
          <PatientManagement onAppointmentCreated={onAppointmentCreated} />
        );
      case 'meetings':
        return (
          <AppointmentPanel
            mode='create'
            onClose={onCloseAppointmentPanel}
            onAppointmentCreated={onAppointmentCreated}
            onAppointmentDeleted={onAppointmentDeleted}
            onAppointmentUpdated={onAppointmentUpdated}
            {...appointmentPanelProps}
          />
        );
      case 'events':
        return <EventManagement />;
      case 'tasks':
        return <TaskManagement />;
      case 'imprevus':
        return <ImprevusManagement onImprevuChanged={onImprevuChanged} />;
      case 'vue':
        return <AgendaPreferences />;
      case 'imprimer':
        return <AgendaPrintTab {...printTabProps} />;
      case 'payments':
        return (
          <div className='p-4 sm:p-6'>
            <h3 className='text-lg font-semibold mb-4'>Payments</h3>
            <div className='space-y-4'>
              <div className='p-4 border border-gray-200 rounded-lg'>
                <h4 className='font-medium'>Payment History</h4>
                <p className='text-sm text-gray-600 mt-2'>
                  Track payments and billing information.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='h-full bg-white overflow-y-auto border-l lg:border-l-0 border-gray-200'>
      {/* Mobile header for tab content */}
      <div className='lg:hidden bg-gray-50 border-b border-gray-200 p-4'>
        <h2 className='text-lg font-semibold text-gray-900 capitalize'>
          {activeTab}
        </h2>
      </div>
      <div className='relative h-full '>{renderTabContent()}</div>
    </div>
  );
};

// Main Agenda Page Component
const AgendaPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { profile: doctorProfile, loading: doctorProfileLoading } =
    useDoctorProfile();
  const { activeTab, setActiveTab, setIsSidebarOpen } = useAgenda();
  const calendarRef = useRef();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyAppointments, setDailyAppointments] = useState([]);
  const [isAppointmentsReady, setIsAppointmentsReady] = useState(false);

  // Appointment panel state
  const [appointmentPanelMode, setAppointmentPanelMode] = useState('create');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const syncDailyAppointments = useCallback(
    (dateOverride) => {
      if (!calendarRef.current?.getAppointmentsForDate) {
        return;
      }

      const targetDateRaw =
        dateOverride !== undefined && dateOverride !== null
          ? dateOverride
          : selectedDate;
      const targetDate =
        targetDateRaw instanceof Date
          ? new Date(targetDateRaw)
          : new Date(targetDateRaw);

      if (Number.isNaN(targetDate.getTime())) {
        return;
      }

      const appointmentsForDay =
        calendarRef.current.getAppointmentsForDate(targetDate) || [];
      setDailyAppointments(appointmentsForDay);
    },
    [selectedDate]
  );

  // Handle appointment creation
  const handleAppointmentCreated = async (appointmentDate) => {
    if (calendarRef.current) {
      // Refresh appointments to show the new one
      setIsAppointmentsReady(false);
      await calendarRef.current.refreshAppointments();

      // Navigate to the appointment's date
      if (appointmentDate) {
        calendarRef.current.navigateToDate(appointmentDate);
      }
    }
  };

  const handleAppointmentDeleted = async () => {
    if (calendarRef.current) {
      setIsAppointmentsReady(false);
      await calendarRef.current.refreshAppointments();
    }
    setSelectedAppointment(null);
    setAppointmentPanelMode('create');
  };

  const handleAppointmentUpdated = async (updatedAppointment) => {
    if (calendarRef.current) {
      setIsAppointmentsReady(false);
      await calendarRef.current.refreshAppointments();
      if (updatedAppointment?.startTime) {
        calendarRef.current.navigateToDate(updatedAppointment.startTime);
      }
    }

    if (updatedAppointment) {
      setSelectedAppointment(updatedAppointment);
    }
  };

  // Handle calendar appointment click
  const handleAppointmentClick = async (appointment) => {
    try {
      // Fetch full appointment details to ensure we have all patient data
      const fullAppointment = await appointmentAPI.getById(appointment.id);
      setSelectedAppointment(fullAppointment);
      setAppointmentPanelMode('view');
      setActiveTab('meetings'); // Show the appointment panel
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      // Fallback to the appointment data we have
      setSelectedAppointment(appointment);
      setAppointmentPanelMode('view');
      setActiveTab('meetings');
    }
  };

  // Handle calendar time slot click
  const handleTimeSlotClick = (dateTime) => {
    setSelectedDateTime(dateTime);
    setSelectedAppointment(null);
    setAppointmentPanelMode('create');
    setActiveTab('meetings'); // Show the appointment panel
  };

  // Handle closing appointment panel
  const handleCloseAppointmentPanel = () => {
    setActiveTab(null);
    setSelectedAppointment(null);
    setSelectedDateTime(null);
  };

  // Handle imprevu changes (create/update/delete)
  const handleImprevuChanged = async () => {
    if (calendarRef.current) {
      setIsAppointmentsReady(false);
      if (calendarRef.current.refreshAll) {
        await calendarRef.current.refreshAll();
      } else {
        await calendarRef.current.refreshAppointments();
      }
    }
  };

  const appointmentPanelProps = {
    mode: appointmentPanelMode,
    appointment: selectedAppointment,
    selectedDateTime: selectedDateTime,
  };

  const handleCalendarDateChange = useCallback(
    (date) => {
      if (!date) return;
      const normalizedDate =
        date instanceof Date ? new Date(date) : new Date(date);
      if (Number.isNaN(normalizedDate.getTime())) return;
      setSelectedDate(normalizedDate);
      syncDailyAppointments(normalizedDate);
    },
    [syncDailyAppointments]
  );

  const handleAppointmentsChange = useCallback(() => {
    syncDailyAppointments();
    setIsAppointmentsReady(true);
  }, [syncDailyAppointments]);

  const handlePrintRefresh = useCallback(async () => {
    if (!calendarRef.current) return;
    setIsAppointmentsReady(false);
    await calendarRef.current.refreshAppointments();
  }, []);

  // Reset appointment panel state when switching away from meetings tab
  useEffect(() => {
    if (activeTab !== 'meetings') {
      setAppointmentPanelMode('create');
      setSelectedAppointment(null);
      setSelectedDateTime(null);
    }
  }, [activeTab]);

  // Set default tab on mount if none selected
  useEffect(() => {
    if (!activeTab) {
      setActiveTab('patients');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'imprimer') {
      syncDailyAppointments();
    }
  }, [activeTab, syncDailyAppointments]);

  const printTabProps = {
    selectedDate,
    appointments: dailyAppointments,
    doctorUser: user,
    doctorProfile,
    isLoading: doctorProfileLoading || !isAppointmentsReady,
    onRefresh: handlePrintRefresh,
  };

  return (
    <div className='flex h-full overflow-hidden'>
      {/* Main content area */}
      <div className='flex-1 flex flex-col lg:flex-row max-h-screen overflow-hidden relative'>
        {/* Mobile header with navigation toggle */}
        <div className='lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between'>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className='p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          >
            <Menu className='h-5 w-5' />
          </button>
          <h1 className='text-lg font-semibold text-gray-900'>Agenda</h1>
          {activeTab && (
            <button
              onClick={() => setActiveTab(null)}
              className='p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            >
              <X className='h-5 w-5' />
            </button>
          )}
        </div>

        {/* Calendar section - always visible on left */}
        <div
          className={`
            ${activeTab ? 'lg:w-1/2' : 'flex-1'} 
            transition-all duration-300 overflow-y-auto
          `}
        >
          <CalendarSection
            ref={calendarRef}
            onAppointmentClick={handleAppointmentClick}
            onTimeSlotClick={handleTimeSlotClick}
            isTabOpen={!!activeTab}
            onDateChange={handleCalendarDateChange}
            onAppointmentsChange={handleAppointmentsChange}
          />
        </div>

        {/* Tab content section - shows on right when a tab is active */}
        {activeTab && (
          <div className='flex-1 lg:w-1/2 transition-all duration-300 overflow-hidden static lg:absolute  top-0 right-0 h-full bg-white z-10 shadoww rounded-l-[5%]'>
            <X
              onClick={() => setActiveTab(null)}
              className='absolute bg-gray-500 rounded-full p-1 text-white top-3 right-4  hover:text-gray-900 z-50 cursor-pointer hover:bg-gray-300 opacity-90'
            />
            <TabContent
              activeTab={activeTab}
              appointmentPanelProps={appointmentPanelProps}
              onCloseAppointmentPanel={handleCloseAppointmentPanel}
              onAppointmentCreated={handleAppointmentCreated}
              onAppointmentDeleted={handleAppointmentDeleted}
              onAppointmentUpdated={handleAppointmentUpdated}
              onImprevuChanged={handleImprevuChanged}
              printTabProps={printTabProps}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaPage;
