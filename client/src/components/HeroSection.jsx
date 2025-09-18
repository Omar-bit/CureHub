import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className='bg-gradient-to-br from-medical-50 to-blue-50 pt-20 pb-32'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-6'>
            {t('hero.title')}
            <span className='text-medical-600 block'>
              {t('hero.titleSpan')}
            </span>
          </h1>
          <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
            {t('hero.description')}
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' className='text-lg px-8 py-4'>
              {t('hero.startFreeTrial')}
            </Button>
            <Button variant='outline' size='lg' className='text-lg px-8 py-4'>
              {t('hero.watchDemo')}
            </Button>
          </div>
          <div className='mt-12 text-sm text-gray-500'>
            ✓ {t('hero.features.noCreditCard')} ✓ {t('hero.features.freeTrial')}{' '}
            ✓ {t('hero.features.cancelAnytime')}
          </div>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className='mt-20 relative'>
          <div className='relative mx-auto max-w-6xl'>
            {/* Dashboard Preview */}
            <div className='relative rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden'>
              <div className='bg-gray-50 px-6 py-4 border-b border-gray-200'>
                <div className='flex items-center space-x-2'>
                  <div className='h-3 w-3 rounded-full bg-red-400'></div>
                  <div className='h-3 w-3 rounded-full bg-yellow-400'></div>
                  <div className='h-3 w-3 rounded-full bg-green-400'></div>
                  <div className='ml-4 text-sm text-gray-600'>
                    CureHub Dashboard
                  </div>
                </div>
              </div>
              <div className='p-8'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                  <div className='bg-gradient-to-r from-medical-500 to-medical-600 rounded-lg p-6 text-white'>
                    <div className='text-sm opacity-90'>
                      Today's Appointments
                    </div>
                    <div className='text-3xl font-bold'>12</div>
                  </div>
                  <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white'>
                    <div className='text-sm opacity-90'>Active Patients</div>
                    <div className='text-3xl font-bold'>247</div>
                  </div>
                  <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white'>
                    <div className='text-sm opacity-90'>Monthly Revenue</div>
                    <div className='text-3xl font-bold'>$12.5k</div>
                  </div>
                </div>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <div className='bg-gray-50 rounded-lg p-6'>
                    <h3 className='font-semibold mb-4'>
                      Upcoming Appointments
                    </h3>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between py-2'>
                        <div>
                          <div className='font-medium'>Sarah Johnson</div>
                          <div className='text-sm text-gray-600'>
                            10:00 AM - Consultation
                          </div>
                        </div>
                        <div className='text-sm text-medical-600'>Online</div>
                      </div>
                      <div className='flex items-center justify-between py-2'>
                        <div>
                          <div className='font-medium'>Michael Chen</div>
                          <div className='text-sm text-gray-600'>
                            11:30 AM - Follow-up
                          </div>
                        </div>
                        <div className='text-sm text-green-600'>In-person</div>
                      </div>
                    </div>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-6'>
                    <h3 className='font-semibold mb-4'>Recent Activity</h3>
                    <div className='space-y-3'>
                      <div className='text-sm'>
                        <span className='font-medium'>Dr. Smith</span> completed
                        consultation with
                        <span className='font-medium'> Emma Wilson</span>
                      </div>
                      <div className='text-sm'>
                        <span className='font-medium'>Payment received</span>{' '}
                        from John Doe - $150
                      </div>
                      <div className='text-sm'>
                        <span className='font-medium'>New appointment</span>{' '}
                        booked by Lisa Zhang
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
