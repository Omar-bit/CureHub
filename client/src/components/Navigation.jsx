import React, { useState } from 'react';
import { Button } from './ui/button';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className='bg-white border-b border-gray-200 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='flex items-center'>
                <div className='h-8 w-8 bg-medical-500 rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-lg'>C</span>
                </div>
                <span className='ml-2 text-xl font-bold text-gray-900'>
                  CureHub
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:block'>
            <div className='ml-10 flex items-baseline space-x-8'>
              <a
                href='#features'
                className='text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium'
              >
                Features
              </a>
              <a
                href='#pricing'
                className='text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium'
              >
                Pricing
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

          {/* Desktop Auth Buttons */}
          <div className='hidden md:flex items-center space-x-4'>
            <Button variant='outline' size='sm'>
              Sign In
            </Button>
            <Button size='sm'>Get Started</Button>
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
            <div className='flex flex-col space-y-2 px-3 pt-4'>
              <Button variant='outline' size='sm'>
                Sign In
              </Button>
              <Button size='sm'>Get Started</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
