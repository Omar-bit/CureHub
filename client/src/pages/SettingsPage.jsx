import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { ContentContainer, PageHeader, Section } from '../components/Layout';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { User, Bell, Lock, Globe, Palette, Database } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const settingsCategories = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Manage your personal information and preferences',
      icon: User,
      items: [
        'Personal Information',
        'Professional Details',
        'Profile Picture',
        'Contact Information',
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure how you receive notifications',
      icon: Bell,
      items: [
        'Email Notifications',
        'SMS Alerts',
        'Push Notifications',
        'Appointment Reminders',
      ],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Manage your account security and privacy settings',
      icon: Lock,
      items: [
        'Change Password',
        'Two-Factor Authentication',
        'Login Sessions',
        'Privacy Settings',
      ],
    },
    {
      id: 'language',
      title: 'Language & Region',
      description: 'Set your preferred language and regional settings',
      icon: Globe,
      items: ['Interface Language', 'Date Format', 'Time Zone', 'Currency'],
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the look and feel of your workspace',
      icon: Palette,
      items: [
        'Theme Selection',
        'Color Scheme',
        'Font Size',
        'Layout Preferences',
      ],
    },
    {
      id: 'data',
      title: 'Data Management',
      description: 'Manage your data backup and export options',
      icon: Database,
      items: [
        'Data Export',
        'Backup Settings',
        'Data Retention',
        'Account Deletion',
      ],
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <PageHeader
        title='Settings'
        subtitle='Manage your account settings and preferences'
      />

      <ContentContainer className='py-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {settingsCategories.map((category) => {
            const Icon = category.icon;

            return (
              <Card
                key={category.id}
                className='hover:shadow-lg transition-shadow cursor-pointer'
              >
                <CardHeader>
                  <CardTitle className='flex items-center space-x-3'>
                    <div className='p-2 bg-blue-100 rounded-lg'>
                      <Icon className='h-5 w-5 text-blue-600' />
                    </div>
                    <span>{category.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-gray-600 mb-4'>
                    {category.description}
                  </p>
                  <ul className='space-y-2'>
                    {category.items.map((item, index) => (
                      <li
                        key={index}
                        className='text-sm text-gray-500 flex items-center'
                      >
                        <span className='w-1 h-1 bg-gray-400 rounded-full mr-2'></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant='outline' size='sm' className='mt-4 w-full'>
                    Configure
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <Section title='Quick Actions' className='mt-12'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Button variant='outline' className='h-16 flex-col'>
              <User className='h-5 w-5 mb-1' />
              <span>Edit Profile</span>
            </Button>
            <Button variant='outline' className='h-16 flex-col'>
              <Lock className='h-5 w-5 mb-1' />
              <span>Change Password</span>
            </Button>
            <Button variant='outline' className='h-16 flex-col'>
              <Database className='h-5 w-5 mb-1' />
              <span>Export Data</span>
            </Button>
          </div>
        </Section>
      </ContentContainer>
    </div>
  );
};

export default SettingsPage;
