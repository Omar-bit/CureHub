import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  PageHeader,
  ContentContainer,
  Section,
  GridLayout,
} from '../components/Layout';
import {
  Users,
  Calendar,
  CreditCard,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Mock data for dashboard metrics
  const stats = [
    {
      title: 'Total Patients',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Appointments Today',
      value: '8',
      change: '+2',
      changeType: 'positive',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Revenue This Month',
      value: '$12,840',
      change: '+8%',
      changeType: 'positive',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Tasks',
      value: '5',
      change: '-2',
      changeType: 'neutral',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const recentAppointments = [
    {
      id: 1,
      patient: 'Sarah Johnson',
      time: '09:00 AM',
      type: 'Online Consultation',
      status: 'confirmed',
    },
    {
      id: 2,
      patient: 'Michael Chen',
      time: '10:30 AM',
      type: 'In-Person Visit',
      status: 'confirmed',
    },
    {
      id: 3,
      patient: 'Emma Wilson',
      time: '02:00 PM',
      type: 'Follow-up',
      status: 'pending',
    },
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: 'Review lab results for John Doe',
      priority: 'high',
      dueDate: 'Today',
    },
    {
      id: 2,
      title: 'Call pharmacy for prescription refill',
      priority: 'medium',
      dueDate: 'Tomorrow',
    },
    {
      id: 3,
      title: 'Update patient treatment plan',
      priority: 'low',
      dueDate: 'This week',
    },
  ];

  const StatCard = ({ stat }) => {
    const Icon = stat.icon;

    return (
      <Card className='relative overflow-hidden'>
        <CardContent className='p-6'>
          <div className='flex items-center'>
            <div className={`p-2 rounded-lg ${stat.bgColor} mr-4`}>
              <Icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-muted-foreground'>
                {stat.title}
              </p>
              <div className='flex items-center mt-1'>
                <p className='text-2xl font-bold text-foreground'>
                  {stat.value}
                </p>
                <span
                  className={`
                  ml-2 text-sm flex items-center
                  ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }
                `}
                >
                  {stat.changeType === 'positive' && (
                    <TrendingUp className='h-3 w-3 mr-1' />
                  )}
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader
        title={`${t('dashboard.welcome')}, ${user?.firstName || user?.email}!`}
        subtitle="Here's what's happening with your practice today"
        actions={
          <Button>
            <Calendar className='h-4 w-4 mr-2' />
            Schedule Appointment
          </Button>
        }
      />

      <ContentContainer>
        {/* Stats Overview */}
        <Section title='Overview' className='mb-8'>
          <GridLayout columns='grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </GridLayout>
        </Section>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Recent Appointments */}
          <Section title="Today's Appointments">
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Calendar className='h-5 w-5 mr-2' />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
                    >
                      <div>
                        <p className='font-medium text-foreground'>
                          {appointment.patient}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {appointment.type}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium text-foreground'>
                          {appointment.time}
                        </p>
                        <div className='flex items-center'>
                          {appointment.status === 'confirmed' ? (
                            <CheckCircle className='h-4 w-4 text-green-500 mr-1' />
                          ) : (
                            <Clock className='h-4 w-4 text-orange-500 mr-1' />
                          )}
                          <span
                            className={`text-xs capitalize ${
                              appointment.status === 'confirmed'
                                ? 'text-green-600'
                                : 'text-orange-600'
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant='outline' className='w-full mt-4'>
                  View All Appointments
                </Button>
              </CardContent>
            </Card>
          </Section>

          {/* Tasks */}
          <Section title='Pending Tasks'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <CheckCircle className='h-5 w-5 mr-2' />
                  To Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className='flex items-start p-3 bg-muted/50 rounded-lg'
                    >
                      <div className='flex-1'>
                        <p className='font-medium text-foreground'>
                          {task.title}
                        </p>
                        <div className='flex items-center mt-1'>
                          <span
                            className={`
                            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2
                            ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }
                          `}
                          >
                            {task.priority === 'high' && (
                              <AlertCircle className='h-3 w-3 mr-1' />
                            )}
                            {task.priority}
                          </span>
                          <span className='text-sm text-muted-foreground'>
                            Due: {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant='outline' className='w-full mt-4'>
                  View All Tasks
                </Button>
              </CardContent>
            </Card>
          </Section>
        </div>

        {/* User Profile Section */}
        <Section title='Profile Information' className='mt-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='font-medium text-foreground mb-4'>
                    Account Details
                  </h3>
                  <div className='space-y-2'>
                    <p className='text-sm'>
                      <span className='font-medium'>Name:</span>{' '}
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className='text-sm'>
                      <span className='font-medium'>Email:</span> {user?.email}
                    </p>
                    <p className='text-sm'>
                      <span className='font-medium'>Role:</span>{' '}
                      {user?.role || 'Patient'}
                    </p>
                    <p className='text-sm'>
                      <span className='font-medium'>Member since:</span>{' '}
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className='font-medium text-foreground mb-4'>
                    Quick Actions
                  </h3>
                  <div className='space-y-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start'
                    >
                      <Users className='h-4 w-4 mr-2' />
                      Manage Patients
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start'
                    >
                      <Calendar className='h-4 w-4 mr-2' />
                      View Schedule
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-start'
                    >
                      <CreditCard className='h-4 w-4 mr-2' />
                      Payment Reports
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      </ContentContainer>
    </div>
  );
};

export default DashboardPage;
