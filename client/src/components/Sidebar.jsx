import React, { useState, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import LanguageSwitcher from './LanguageSwitcher';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Stethoscope,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';

// Context for sidebar state
const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Sidebar Provider Component
export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleCollapsed,
        toggleMobile,
        closeMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

// Navigation items configuration
const navigationItems = [
  {
    id: 'dashboard',
    label: 'navigation.dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['doctor', 'assistant', 'patient'],
  },
  {
    id: 'agenda',
    label: 'navigation.agenda',
    icon: Calendar,
    path: '/agenda',
    roles: ['doctor', 'assistant'],
  },
  {
    id: 'patients',
    label: 'navigation.patients',
    icon: Users,
    path: '/patients',
    roles: ['doctor', 'assistant'],
  },
  {
    id: 'tasks',
    label: 'navigation.tasks',
    icon: ClipboardList,
    path: '/tasks',
    roles: ['doctor', 'assistant'],
  },
  {
    id: 'consultations',
    label: 'navigation.consultations',
    icon: Stethoscope,
    path: '/consultations',
    roles: ['doctor', 'assistant', 'patient'],
  },
  {
    id: 'payments',
    label: 'navigation.payments',
    icon: CreditCard,
    path: '/payments',
    roles: ['doctor', 'assistant', 'patient'],
  },
  {
    id: 'settings',
    label: 'navigation.settings',
    icon: Settings,
    path: '/settings',
    roles: ['doctor', 'assistant', 'patient'],
  },
];

// Individual Navigation Item Component
const NavItem = ({ item, isActive, isCollapsed }) => {
  const { t } = useTranslation();
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={`
        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }
        ${isCollapsed ? 'justify-center' : 'justify-start'}
      `}
      title={isCollapsed ? t(item.label) : undefined}
    >
      <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
      {!isCollapsed && <span className='truncate'>{t(item.label)}</span>}
    </Link>
  );
};

// Main Sidebar Component
export const Sidebar = () => {
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } =
    useSidebar();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role || 'patient')
  );

  const sidebarContent = (
    <>
      {/* Logo/Brand */}
      <div
        className={`flex items-center px-4 py-6 ${
          isCollapsed ? 'justify-center' : 'justify-start'
        }`}
      >
        <Link to='/dashboard' className='flex items-center'>
          <div className='h-8 w-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0'>
            <span className='text-sidebar-primary-foreground font-bold text-lg'>
              C
            </span>
          </div>
          {!isCollapsed && (
            <span className='ml-2 text-xl font-bold text-sidebar-foreground truncate'>
              CureHub
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-4 pb-4 space-y-1'>
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={location.pathname === item.path}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* User section */}
      <div className='border-t border-sidebar-border p-4'>
        {!isCollapsed && (
          <div className='flex items-center mb-4'>
            <div className='h-8 w-8 bg-sidebar-accent rounded-full flex items-center justify-center flex-shrink-0'>
              <User className='h-4 w-4 text-sidebar-accent-foreground' />
            </div>
            <div className='ml-3 flex-1 min-w-0'>
              <p className='text-sm font-medium text-sidebar-foreground truncate'>
                {user?.firstName || user?.email}
              </p>
              <p className='text-xs text-sidebar-foreground/60 truncate'>
                {user?.role || 'Patient'}
              </p>
            </div>
          </div>
        )}

        <div className='space-y-2'>
          {!isCollapsed && <LanguageSwitcher />}
          <Button
            onClick={handleLogout}
            variant='outline'
            size='sm'
            className={`w-full ${isCollapsed ? 'px-2' : ''}`}
            title={isCollapsed ? t('navigation.logout') : undefined}
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
            {!isCollapsed && t('navigation.logout')}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={closeMobile}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`
        hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-in-out relative z-sidebar
        ${isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar'}
      `}
      >
        {sidebarContent}

        {/* Collapse toggle */}
        <Button
          onClick={toggleCollapsed}
          variant='outline'
          size='sm'
          className='absolute -right-3 top-6 h-6 w-6 p-0 border-sidebar-border bg-sidebar shadow-md'
        >
          {isCollapsed ? (
            <ChevronRight className='h-3 w-3' />
          ) : (
            <ChevronLeft className='h-3 w-3' />
          )}
        </Button>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-sidebar bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className='flex flex-col h-full'>
          {/* Mobile header with close button */}
          <div className='flex items-center justify-between px-4 py-6'>
            <Link to='/dashboard' className='flex items-center'>
              <div className='h-8 w-8 bg-sidebar-primary rounded-lg flex items-center justify-center'>
                <span className='text-sidebar-primary-foreground font-bold text-lg'>
                  C
                </span>
              </div>
              <span className='ml-2 text-xl font-bold text-sidebar-foreground'>
                CureHub
              </span>
            </Link>
            <Button
              onClick={closeMobile}
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

          {/* Mobile navigation */}
          <nav className='flex-1 px-4 pb-4 space-y-1'>
            {filteredNavItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={closeMobile}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    location.pathname === item.path
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <item.icon className='h-5 w-5 mr-3 flex-shrink-0' />
                <span>{t(item.label)}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile user section */}
          <div className='border-t border-sidebar-border p-4'>
            <div className='flex items-center mb-4'>
              <div className='h-8 w-8 bg-sidebar-accent rounded-full flex items-center justify-center'>
                <User className='h-4 w-4 text-sidebar-accent-foreground' />
              </div>
              <div className='ml-3'>
                <p className='text-sm font-medium text-sidebar-foreground'>
                  {user?.firstName || user?.email}
                </p>
                <p className='text-xs text-sidebar-foreground/60'>
                  {user?.role || 'Patient'}
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              <LanguageSwitcher />
              <Button
                onClick={handleLogout}
                variant='outline'
                size='sm'
                className='w-full'
              >
                <LogOut className='h-4 w-4 mr-2' />
                {t('navigation.logout')}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// Mobile Header Component (for mobile menu toggle)
export const MobileHeader = () => {
  const { toggleMobile } = useSidebar();

  return (
    <header className='lg:hidden bg-background border-b border-border px-4 py-3 flex items-center justify-between'>
      <Button
        onClick={toggleMobile}
        variant='ghost'
        size='sm'
        className='h-8 w-8 p-0'
      >
        <Menu className='h-5 w-5' />
      </Button>
      <Link to='/dashboard' className='flex items-center'>
        <div className='h-6 w-6 bg-primary rounded-md flex items-center justify-center'>
          <span className='text-primary-foreground font-bold text-sm'>C</span>
        </div>
        <span className='ml-2 text-lg font-bold text-foreground'>CureHub</span>
      </Link>
      <div className='w-8' /> {/* Spacer for centering */}
    </header>
  );
};

export default Sidebar;
