import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
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
import {
  Users,
  Calendar,
  ClipboardList,
  Stethoscope,
  CreditCard,
  ChevronRight,
  Menu,
  X,
  CalendarDays,
  AlertTriangle,
  Settings,
  Printer,
} from 'lucide-react';

// Agenda sidebar navigation items
const agendaSidebarItems = [
  {
    id: 'patients',
    label: 'Patients',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    id: 'meetings',
    label: 'Meetings',
    icon: Calendar,
    color: 'bg-green-500',
  },
  {
    id: 'events',
    label: 'Events',
    icon: CalendarDays,
    color: 'bg-indigo-500',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: ClipboardList,
    color: 'bg-orange-500',
  },
  {
    id: 'imprevus',
    label: 'Imprevus',
    icon: AlertTriangle,
    color: 'bg-purple-500',
  },
  {
    id: 'vue',
    label: 'Vue',
    icon: Settings,
    color: 'bg-yellow-500',
  },
  {
    id: 'imprimer',
    label: 'Imprimer',
    icon: Printer,
    color: 'bg-black',
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    color: 'bg-red-500',
  },
];

// Tab Content Component
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

// Agenda Sidebar Component
const AgendaSidebar = ({ activeTab, setActiveTab, isVisible, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isVisible && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={onClose}
        />
      )}

      {/* Desktop sidebar */}
      <div className='hidden lg:block  bg-gray-50 border-r border-gray-200 h-full'>
        <div className='p-2 pt-7'>
          {/* <h3 className='text-sm font-medium text-gray-700 mb-4'>Navigation</h3> */}
          <nav className='space-y-6'>
            {agendaSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={` cursor-pointer
                    p-2
                    w-full flex flex-col gap-1  justify-center items-center text-sm font-medium rounded-md transition-colors
                    ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className='h-4 w-4 ' />
                  <p className='text-xs'>{item.label}</p>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-gray-50 border-r border-gray-200
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${isVisible ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className='flex flex-col h-full'>
          {/* Mobile header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900'>Navigation</h3>
            <button
              onClick={onClose}
              className='p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Mobile navigation */}
          <nav className='flex-1 p-4 space-y-1'>
            {agendaSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className='h-4 w-4 mr-3 flex-shrink-0' />
                  {item.label}
                  {isActive && <ChevronRight className='h-4 w-4 ml-auto' />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

// Main Agenda Page Component
const AgendaPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { profile: doctorProfile, loading: doctorProfileLoading } =
    useDoctorProfile();
  const [activeTab, setActiveTab] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      await calendarRef.current.refreshAppointments();
    }
  };

  // When meetings tab is clicked, show create form
  const handleTabClick = (tabId) => {
    if (tabId === 'meetings') {
      setAppointmentPanelMode('create');
      setSelectedAppointment(null);
      setSelectedDateTime(null);
    }
    setActiveTab(tabId);
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
    <div className='flex h-[calc(100vh-10vh)] overflow-hidden'>
      {/* Left sidebar for agenda navigation */}
      <AgendaSidebar
        activeTab={activeTab}
        setActiveTab={handleTabClick}
        isVisible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

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
