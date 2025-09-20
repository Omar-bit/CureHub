import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import PatientManagement from '../components/PatientManagement';
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

// Mock agenda data
const mockAgendaData = [
  {
    time: '09:00',
    patient: 'PULIN Daniel',
    type: 'douleur au niveau du dos',
    status: "renouvellement d'ordonnance",
    color: 'bg-blue-500',
  },
  {
    time: '09:15',
    patient: 'AUDBOUIN Alexandre',
    type: "renouvellement d'ordonnance",
    status: 'fièvre',
    color: 'bg-red-500',
  },
  {
    time: '09:30',
    patient: 'BLOU Patrick',
    type: 'fièvre',
    status: '',
    color: 'bg-yellow-500',
  },
  {
    time: '10:00',
    patient: 'PERALTA Patrick',
    type: 'Malaises en me réveillant avec chutes et douleurs violentes jambe droite impossible de me lever',
    status: '',
    color: 'bg-green-500',
  },
  {
    time: '10:45',
    patient: 'BEDOS Antoine',
    type: '',
    status: '',
    color: 'bg-green-600',
  },
  {
    time: '11:00',
    patient: 'JORISSEN Maxime',
    type: 'Acouphène',
    status: 'hémorroïdes',
    color: 'bg-red-500',
  },
  {
    time: '11:15',
    patient: 'PERALTA Patrick',
    type: '',
    status: '',
    color: 'bg-blue-500',
  },
  {
    time: '11:30',
    patient: 'MERCIER Elisabeth',
    type: '',
    status: '',
    color: 'bg-blue-500',
  },
];

// Agenda Component
const AgendaSection = () => {
  return (
    <div className='h-full bg-white lg:border-r border-gray-200'>
      {/* Agenda Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Mardi 3 octobre 2023
          </h2>
          <button className='text-blue-600 text-sm hover:text-blue-800 self-start sm:self-auto'>
            Choisir une date
          </button>
        </div>
      </div>

      {/* Time slots */}
      <div className='overflow-y-auto h-[calc(100%-4rem)]'>
        {/* Morning hours */}
        <div className='p-2 sm:p-4 space-y-1'>
          <div className='text-xs text-gray-500 mb-2'>8h</div>

          {mockAgendaData.map((appointment, index) => (
            <div key={index} className='flex items-start space-x-2 py-1'>
              <div className='text-xs text-gray-500 w-10 sm:w-12 flex-shrink-0'>
                {appointment.time}
              </div>
              <div className='flex-1 min-w-0'>
                <div
                  className={`p-2 rounded text-xs text-white ${appointment.color}`}
                >
                  <div className='font-medium text-sm sm:text-xs'>
                    {appointment.patient}
                  </div>
                  {appointment.type && (
                    <div className='mt-1 opacity-90 text-xs leading-tight'>
                      {appointment.type}
                    </div>
                  )}
                  {appointment.status && (
                    <div className='mt-1 opacity-90 text-xs leading-tight'>
                      {appointment.status}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Additional time slots */}
          <div className='space-y-4 mt-8'>
            {[
              '12h',
              '13h',
              '14h',
              '15h',
              '16h',
              '17h',
              '18h',
              '19h',
              '20h',
            ].map((hour) => (
              <div key={hour} className='text-xs text-gray-500'>
                {hour}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Content Component
const TabContent = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'patients':
        return <PatientManagement />;
      case 'meetings':
        return (
          <div className='p-4 sm:p-6'>
            <h3 className='text-lg font-semibold mb-4'>Meetings</h3>
            <div className='space-y-4'>
              <div className='p-4 border border-gray-200 rounded-lg'>
                <h4 className='font-medium'>Upcoming Meetings</h4>
                <p className='text-sm text-gray-600 mt-2'>
                  Schedule and manage your appointments.
                </p>
              </div>
            </div>
          </div>
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
      {renderTabContent()}
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
      <div className='hidden lg:block w-[15%] bg-gray-50 border-r border-gray-200 h-full'>
        <div className='p-4'>
          <h3 className='text-sm font-medium text-gray-700 mb-4'>Navigation</h3>
          <nav className='space-y-1'>
            {agendaSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
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

  return (
    <div className='flex h-[calc(100vh-10vh)] overflow-hidden'>
      {/* Left sidebar for agenda navigation */}
      <AgendaSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isVisible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className='flex-1 flex flex-col lg:flex-row max-h-screen overflow-y-auto'>
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

        {/* Agenda section */}
        <div
          className={`
            ${activeTab ? 'hidden lg:block lg:w-1/2' : 'flex-1'} 
            transition-all duration-300
          `}
        >
          <AgendaSection />
        </div>

        {/* Tab content section */}
        {activeTab && (
          <div className='flex-1 lg:w-1/2 transition-all duration-300'>
            <TabContent activeTab={activeTab} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaPage;
