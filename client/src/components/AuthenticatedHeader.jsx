import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { agendaPreferencesAPI } from '../services/api';
import { Button } from './ui/button';
import LanguageSwitcher from './LanguageSwitcher';
import {
  Settings,
  Calendar,
  MessageCircle,
  LogOut,
  User,
  ChevronDown,
  Globe,
  Check,
} from 'lucide-react';
import Logo from '../assets/logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const AuthenticatedHeader = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mainColor, setMainColor] = useState('#FFA500');

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const data = await agendaPreferencesAPI.get();
        if (data?.mainColor) {
          setMainColor(data.mainColor);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();

    const handlePreferencesUpdate = (event) => {
      if (event.detail?.mainColor) {
        setMainColor(event.detail.mainColor);
      }
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const navigationItems = [
    // {
    //   id: 'agenda',
    //   label: 'Agenda',
    //   icon: Calendar,
    //   path: '/agenda',
    // },
    // {
    //   id: 'messagery',
    //   label: 'Messagery',
    //   icon: MessageCircle,
    //   path: '/messagery',
    // },
    // {
    //   id: 'settings',
    //   label: 'Settings',
    //   icon: Settings,
    //   path: '/settings',
    // },
  ];

  return (
    <header
      className='shadow-sm border-gray-200 sticky top-0 z-50'
      style={{ backgroundColor: mainColor }}
    >
      <div className='max-w-full mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-4'>
            {/* Logo */}
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <Link to='/dashboard' className='flex items-center'>
                  <div className='size-9  rounded-lg flex items-center justify-center'>
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
          </div>
          {/* Selected User */}
          <div className='hidden md:flex items-center'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='flex items-center space-x-2 px-20'
                >
                  <div className='h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center'>
                    <User className='h-4 w-4 text-gray-600' />
                  </div>
                  <span className='hidden lg:block'>
                    {user?.firstName || user?.email}
                  </span>
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-56'
              ></DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* User Menu */}
          <div className='hidden md:flex items-center'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='flex items-center space-x-2'
                >
                  <div className='h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center'>
                    <User className='h-4 w-4 text-gray-600' />
                  </div>
                  <span className='hidden lg:block'>
                    {user?.firstName || user?.email}
                  </span>
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel>
                  <div className='flex flex-col'>
                    <span>
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {user?.role || 'Patient'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Language Selection */}
                <DropdownMenuLabel>Language</DropdownMenuLabel>
                <DropdownMenuItem
                  className='cursor-pointer flex items-center'
                  onClick={() => {
                    i18n.changeLanguage('en');
                  }}
                >
                  <Globe className='h-4 w-4 mr-2' />
                  <span>English</span>
                  {i18n.language === 'en' && (
                    <Check className='h-4 w-4 ml-auto' />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='cursor-pointer flex items-center'
                  onClick={() => {
                    i18n.changeLanguage('fr');
                  }}
                >
                  <Globe className='h-4 w-4 mr-2' />
                  <span>Français</span>
                  {i18n.language === 'fr' && (
                    <Check className='h-4 w-4 ml-auto' />
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className='cursor-pointer text-red-600 focus:text-red-600 flex items-center'
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  {t('navigation.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <div className='flex items-center justify-between px-3 py-2'>
              <div className='flex items-center space-x-2'>
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
            </div>

            {/* Language options */}
            <div className='px-3 py-2'>
              <h4 className='text-sm font-medium text-gray-700 mb-2'>
                Language
              </h4>
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  variant={i18n.language === 'en' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => i18n.changeLanguage('en')}
                  className='flex items-center justify-center'
                >
                  <Globe className='h-4 w-4 mr-2' />
                  English
                </Button>
                <Button
                  variant={i18n.language === 'fr' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => i18n.changeLanguage('fr')}
                  className='flex items-center justify-center'
                >
                  <Globe className='h-4 w-4 mr-2' />
                  Français
                </Button>
              </div>
            </div>

            {/* Logout button */}
            <div className='px-3 py-2'>
              <Button
                onClick={handleLogout}
                variant='outline'
                size='sm'
                className='w-full flex items-center justify-center text-red-600 hover:text-red-700'
              >
                <LogOut className='h-4 w-4 mr-2' />
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
