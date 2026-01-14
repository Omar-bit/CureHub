import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  User,
  Users,
  Calendar,
  FileText,
  CreditCard,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from './ui/button';
import { patientAuthAPI } from '../services/api';

const PatientLayout = ({ children, patientData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems = [
    {
      icon: BarChart3,
      label: 'Tableau de bord',
      path: '/patient-space',
    },
    {
      icon: User,
      label: 'Mon profil',
      path: '/patient-space/profile',
    },
    {
      icon: Users,
      label: 'Mes proches',
      path: '/patient-space/relatives',
    },
    {
      icon: Calendar,
      label: 'Mes rendez-vous',
      path: '/patient-space/appointments',
    },
    {
      icon: FileText,
      label: 'Mes documents',
      path: '/patient-space/documents',
    },
    {
      icon: CreditCard,
      label: 'Mes paiements',
      path: '/patient-space/payments',
    },
  ];

  const handleLogout = async () => {
    try {
      await patientAuthAPI.logout();
      localStorage.removeItem('patientUser');
      localStorage.removeItem('patientToken');
      localStorage.removeItem('patientDoctorId');

      const doctorId = localStorage.getItem('patientDoctorId');
      navigate(`/${doctorId || 'login'}/login`);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className='h-screen bg-background flex flex-col overflow-hidden'>
      {/* Top Header */}
      <header className='border-b border-border bg-white h-20 flex items-center px-6'>
        <div className='flex items-center justify-between w-full'>
          <div className='text-xl font-semibold text-foreground'>
            Patient Space
          </div>
          <div className='flex items-center space-x-4'>
            {patientData && (
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold'>
                  {patientData.name?.charAt(0) || 'P'}
                </div>
                <div className='text-sm'>
                  <div className='font-medium text-foreground'>
                    {patientData.name}
                  </div>
                  <div className='text-xs text-muted-foreground'>Patient</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <aside className='w-64 border-r border-border bg-white overflow-y-auto'>
          <div className='p-4'>
            {/* Patient Profile Card */}
            {patientData && (
              <div className='mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg'>
                    {patientData.name?.charAt(0) || 'P'}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='font-semibold text-foreground truncate'>
                      {patientData.name}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {patientData.email}
                    </div>
                    {patientData.dateOfBirth && (
                      <div className='text-xs text-muted-foreground'>
                        {new Date(patientData.dateOfBirth).toLocaleDateString(
                          'fr-FR'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Menu */}
            <nav className='space-y-1'>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                    }`}
                  >
                    <Icon className='w-5 h-5' />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className='mt-8 pt-6 border-t border-border'>
              <button
                onClick={handleLogout}
                className='w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium'
              >
                <LogOut className='w-5 h-5' />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className='flex-1 overflow-auto bg-slate-50'>{children}</main>
      </div>
    </div>
  );
};

export default PatientLayout;
