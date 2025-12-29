import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAgenda } from '../contexts/AgendaContext';
import {
  Users,
  Calendar,
  ClipboardList,
  CreditCard,
  ChevronDown,
  ChevronUp,
  X,
  CalendarDays,
  AlertTriangle,
  Settings,
  Printer,
  MessageSquare,
  Layout as LayoutIcon,
} from 'lucide-react';
import { agendaPreferencesAPI } from '../services/api';

const navItems = [
  {
    id: 'agenda',
    label: 'Agenda',
    icon: LayoutIcon,
    path: '/agenda',
  },
  {
    id: 'messagery',
    label: 'Messagery',
    icon: MessageSquare,
    path: '/messagery',
  },
];

const agendaTools = [
  {
    id: 'patients',
    label: 'Patients',
    icon: Users,
  },
  {
    id: 'meetings',
    label: 'Meetings',
    icon: Calendar,
  },
  {
    id: 'events',
    label: 'Events',
    icon: CalendarDays,
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: ClipboardList,
  },
  {
    id: 'imprevus',
    label: 'Imprevus',
    icon: AlertTriangle,
  },
  {
    id: 'vue',
    label: 'Vue',
    icon: Settings,
  },
  {
    id: 'imprimer',
    label: 'Imprimer',
    icon: Printer,
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
  },
];

const bottomItems = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

const AgendaSidebar = () => {
  const { activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen } =
    useAgenda();
  const location = useLocation();
  const navigate = useNavigate();
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  const isAgendaPage = location.pathname === '/agenda';

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else {
      setActiveTab(item.id);
    }
    // Close sidebar on mobile after selection
    setIsSidebarOpen(false);
  };

  const renderItem = (item, isActive) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={`cursor-pointer
          p-2
          w-full flex flex-col gap-1 justify-center items-center text-sm font-medium rounded-md transition-colors
          ${
            isActive
              ? 'bg-white text-gray-900 shadow-lg'
              : 'text-gray-600 hover:bg-white hover:text-gray-900'
          }
        `}
        title={item.label}
      >
        <Icon className='h-5 w-5' />
        <p className='text-[10px] truncate w-full text-center'>{item.label}</p>
      </button>
    );
  };

  const renderMobileItem = (item, isActive) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={`
          w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
          ${
            isActive
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:bg-white hover:text-gray-900'
          }
        `}
      >
        <Icon className='h-5 w-5 mr-3' />
        {item.label}
      </button>
    );
  };

  const visibleTools = isToolsExpanded ? agendaTools : agendaTools.slice(0, 5);

  const SidebarContent = ({ isMobile = false }) => {
    const ItemRenderer = isMobile ? renderMobileItem : renderItem;
    const [mainColor, setMainColor] = useState('#6baf8d');
    async function getMainColor() {
      const mainColorRes = await agendaPreferencesAPI.get();
      const mainColor = mainColorRes.mainColor;
      if (mainColor) {
        setMainColor(mainColor);
      }
    }
    useEffect(() => {
      getMainColor();
    }, []);
    return (
      <div className='flex flex-col h-full overflow-hidden'>
        {/* Main Navigation (Fixed Top) */}
        <div className={`flex-shrink-0 space-y-2 ${isMobile ? 'p-4' : 'p-2'}`}>
          {navItems.map((item) =>
            ItemRenderer(item, location.pathname.startsWith(item.path))
          )}
        </div>

        {/* Agenda Tools (Flexible Middle - Scrollable) */}
        <div
          className={`flex-1 overflow-y-auto agenda-tools min-h-0 ${
            isMobile ? 'px-4' : 'px-2'
          }`}
          style={{
            '--sb-thumb-color': mainColor,
          }}
        >
          {isAgendaPage && (
            <div className='space-y-2 pb-2'>
              <div className='my-2 border-t border-gray-200' />
              {visibleTools.map((item) =>
                ItemRenderer(item, activeTab === item.id)
              )}

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                className={`
                  ${
                    isMobile
                      ? 'w-full flex items-center px-3 py-2'
                      : 'w-full flex flex-col items-center justify-center p-2'
                  }
                  text-gray-600 hover:bg-white hover:text-gray-900 rounded-md transition-colors
                `}
              >
                {isToolsExpanded ? (
                  <ChevronUp className='h-5 w-5' />
                ) : (
                  <ChevronDown className='h-5 w-5' />
                )}
                {isMobile && (
                  <span className='ml-3 text-sm font-medium'>
                    {isToolsExpanded ? 'Less' : 'More'}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Settings (Fixed Bottom) */}
        <div className={`flex-shrink-0 mt-auto ${isMobile ? 'p-4' : 'p-2'}`}>
          <div className='my-2 border-t border-gray-200' />
          {bottomItems.map((item) =>
            ItemRenderer(item, location.pathname.startsWith(item.path))
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className='hidden lg:block bg-gray-50 border-r border-gray-200 h-full w-[88px] flex-shrink-0'>
        <div className='pt-7 h-full'>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-gray-50 border-r border-gray-200
          transform transition-transform duration-300 ease-in-out lg:hidden 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className='flex flex-col h-full '>
          {/* Mobile header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900'>Navigation</h3>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className='p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          <div className='flex-1 overflow-y-auto'>
            <SidebarContent isMobile={true} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AgendaSidebar;
