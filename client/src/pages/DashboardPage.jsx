import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <h1 className='text-3xl font-bold text-gray-900'>
              {t('dashboard.welcome')}
            </h1>
            <div className='flex items-center space-x-4'>
              <LanguageSwitcher />
              <span className='text-gray-700'>
                {t('dashboard.welcome')}, {user?.firstName || user?.email}
              </span>
              <Button onClick={handleLogout} variant='outline'>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Role:</strong> {user?.role}
                </p>
                <p>
                  <strong>Name:</strong> {user?.firstName} {user?.lastName}
                </p>
                {user?.phone && (
                  <p>
                    <strong>Phone:</strong> {user?.phone}
                  </p>
                )}
                <p>
                  <strong>Status:</strong>{' '}
                  {user?.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {user?.role === 'DOCTOR' && (
                  <>
                    <Button className='w-full' variant='outline'>
                      View Patients
                    </Button>
                    <Button className='w-full' variant='outline'>
                      Schedule Appointment
                    </Button>
                  </>
                )}
                {user?.role === 'PATIENT' && (
                  <>
                    <Button className='w-full' variant='outline'>
                      Book Consultation
                    </Button>
                    <Button className='w-full' variant='outline'>
                      View Medical History
                    </Button>
                  </>
                )}
                {user?.role === 'ASSISTANT' && (
                  <>
                    <Button className='w-full' variant='outline'>
                      Manage Appointments
                    </Button>
                    <Button className='w-full' variant='outline'>
                      Patient Check-in
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>No recent activity to show.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
