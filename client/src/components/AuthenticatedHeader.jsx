import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import LanguageSwitcher from './LanguageSwitcher';
import { Settings, Calendar, MessageCircle, LogOut, User } from 'lucide-react';
import Logo from '../assets/logo.png';

const AuthenticatedHeader = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const navigationItems = [
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      path: '/agenda',
    },
    {
      id: 'messagery',
      label: 'Messagery',
      icon: MessageCircle,
      path: '/messagery',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
    },
  ];

  return (
    <header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
      <div className='max-w-full mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <Link to='/dashboard' className='flex items-center'>
                <div className='size-52  rounded-lg flex items-center justify-center'>
                  <img src={Logo} alt='curehub' />
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <div className='hidden md:block'>
            <div className='ml-10 flex items-baseline space-x-8'>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`
                      flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className='h-4 w-4 mr-2' />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className='hidden md:flex items-center space-x-4'>
            <LanguageSwitcher />

            {/* User Info */}
            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-2'>
                <div className='h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center'>
                  <User className='h-4 w-4 text-gray-600' />
                </div>
                <div className='hidden lg:block'>
                  <p className='text-sm font-medium text-gray-700'>
                    {user?.firstName || user?.email}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {user?.role || 'Patient'}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant='outline'
                size='sm'
                className='flex items-center space-x-1'
              >
                <LogOut className='h-4 w-4' />
                <span>{t('navigation.logout')}</span>
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0'
              onClick={toggleMobileMenu}
            >
              <svg
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden ${
            isMobileMenuOpen ? 'block' : 'hidden'
          } md:hidden py-4 border-t border-gray-200`}
        >
          <div className='space-y-2'>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className='h-4 w-4 mr-3' />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile User Section */}
          <div className='mt-4 pt-4 border-t border-gray-200'>
            <div className='flex items-center space-x-3 px-3 py-2'>
              <div className='h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center'>
                <User className='h-4 w-4 text-gray-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-700'>
                  {user?.firstName || user?.email}
                </p>
                <p className='text-xs text-gray-500'>
                  {user?.role || 'Patient'}
                </p>
              </div>
            </div>

            <div className='px-3 py-2 space-y-2'>
              <LanguageSwitcher />
              <Button
                onClick={handleLogout}
                variant='outline'
                size='sm'
                className='w-full flex items-center justify-center space-x-2'
              >
                <LogOut className='h-4 w-4' />
                <span>{t('navigation.logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
