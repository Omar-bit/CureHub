import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from '../assets/logo.png';
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  //get current pathname using router
  const location = useLocation();
  const pathname = location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className='bg-white border-b border-gray-200 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
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

          {/* Desktop Navigation */}
          {pathname === '/' && (
            <div className='hidden md:block'>
              <div className='ml-10 flex items-baseline space-x-8'>
                <a
                  href='#features'
                  className='text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium'
                >
                  {t('navigation.features')}
                </a>
                <a
                  href='#pricing'
                  className='text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium'
                >
                  {t('navigation.pricing')}
                </a>
                <a
                  href='#about'
                  className='text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium'
                >
                  About
                </a>
                <a
                  href='#contact'
                  className='text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium'
                >
                  Contact
                </a>
              </div>
            </div>
          )}

          {/* Desktop Auth Buttons */}
          <div className='hidden md:flex items-center space-x-4'>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <span className='text-gray-700'>
                  {user?.firstName || user?.email}
                </span>
                <Link to='/dashboard'>
                  <Button variant='outline' size='sm'>
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant='outline' size='sm'>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to='/login'>
                  <Button variant='outline' size='sm'>
                    {t('navigation.login')}
                  </Button>
                </Link>
                <Link to='/register'>
                  <Button size='sm'>{t('navigation.getStarted')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='bg-gray-50 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500'
            >
              <span className='sr-only'>Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className='block h-6 w-6'
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
              ) : (
                <svg
                  className='block h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className='md:hidden'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200'>
            {pathname === '/' && (
              <>
                {' '}
                <a
                  href='#features'
                  className='text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium'
                >
                  Features
                </a>
                <a
                  href='#pricing'
                  className='text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium'
                >
                  Pricing
                </a>
                <a
                  href='#about'
                  className='text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium'
                >
                  About
                </a>
                <a
                  href='#contact'
                  className='text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium'
                >
                  Contact
                </a>
              </>
            )}
            <div className='flex flex-col space-y-2 px-3 pt-4'>
              {isAuthenticated ? (
                <>
                  <span className='text-gray-700 px-3 py-2'>
                    {user?.firstName || user?.email}
                  </span>
                  <Link to='/dashboard'>
                    <Button variant='outline' size='sm' className='w-full'>
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant='outline'
                    size='sm'
                    className='w-full'
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to='/login'>
                    <Button variant='outline' size='sm' className='w-full'>
                      Sign In
                    </Button>
                  </Link>
                  <Link to='/register'>
                    <Button size='sm' className='w-full'>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
