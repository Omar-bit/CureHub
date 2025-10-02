import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import PatientManagement from '../components/PatientManagement';
import CalendarSection from '../components/CalendarSection';
import AppointmentPanel from '../components/AppointmentPanel';
import {
  Users,
  Calendar,
  ClipboardList,
  Stethoscope,
  CreditCard,
  ChevronRight,
  Menu,
  X,
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
    id: 'tasks',
    label: 'Tasks',
    icon: ClipboardList,
    color: 'bg-orange-500',
  },
  {
    id: 'consultations',
    label: 'Consultations',
    icon: Stethoscope,
    color: 'bg-purple-500',
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
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'patients':
        return <PatientManagement />;
      case 'meetings':
        return (
          <AppointmentPanel
            mode='create'
            onClose={onCloseAppointmentPanel}
            {...appointmentPanelProps}
          />
        );
      case 'tasks':
        return (
          <div className='p-4 sm:p-6'>
            <h3 className='text-lg font-semibold mb-4'>Tasks</h3>
            <div className='space-y-4'>
              <div className='p-4 border border-gray-200 rounded-lg'>
                <h4 className='font-medium'>Pending Tasks</h4>
                <p className='text-sm text-gray-600 mt-2'>
                  Track your daily tasks and deadlines.
                </p>
              </div>
            </div>
          </div>
        );
      case 'consultations':
        return (
          <div className='p-4 sm:p-6'>
            <h3 className='text-lg font-semibold mb-4'>Consultations</h3>
            <div className='space-y-4'>
              <div className='p-4 border border-gray-200 rounded-lg'>
                <h4 className='font-medium'>Recent Consultations</h4>
                <p className='text-sm text-gray-600 mt-2'>
                  Review consultation notes and patient records.
                </p>
              </div>
            </div>
          </div>
        );
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
                  className={`
                    w-full flex flex-col gap-1  justify-center items-center text-sm font-medium rounded-md transition-colors
                    ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
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
  const [activeTab, setActiveTab] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Appointment panel state
  const [appointmentPanelMode, setAppointmentPanelMode] = useState('create');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  // Handle calendar appointment click
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentPanelMode('view');
    setActiveTab('meetings'); // Show the appointment panel
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
      <div className='flex-1 flex flex-col lg:flex-row max-h-screen overflow-hidden'>
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
            ${activeTab ? 'hidden lg:block lg:w-1/2' : 'flex-1'} 
            transition-all duration-300 overflow-y-auto
          `}
        >
          <CalendarSection
            onAppointmentClick={handleAppointmentClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        </div>

        {/* Tab content section - shows on right when a tab is active */}
        {activeTab && (
          <div className='flex-1 lg:w-1/2 transition-all duration-300 overflow-hidden'>
            <TabContent
              activeTab={activeTab}
              appointmentPanelProps={appointmentPanelProps}
              onCloseAppointmentPanel={handleCloseAppointmentPanel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaPage;
