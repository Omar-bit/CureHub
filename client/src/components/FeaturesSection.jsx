import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from './ui/card';

const FeaturesSection = () => {
  const features = [
    {
      title: 'Patient Management',
      description:
        'Comprehensive patient profiles with medical history, prescriptions, and family grouping.',
      icon: '👥',
      details: [
        'Individual patient profiles',
        'Medical history tracking',
        'Family grouping',
        'Document storage',
      ],
    },
    {
      title: 'Smart Scheduling',
      description:
        'Intelligent appointment scheduling with online booking and real-time availability.',
      icon: '📅',
      details: [
        'Online booking system',
        'Calendar integration',
        'Automated reminders',
        'Multi-doctor scheduling',
      ],
    },
    {
      title: 'Consultation Types',
      description:
        'Support for online, in-person, and home visit consultations with seamless management.',
      icon: '💻',
      details: [
        'Teleconsultations',
        'In-clinic visits',
        'Home visits',
        'Consultation records',
      ],
    },
    {
      title: 'Payment Integration',
      description:
        'Secure payment processing with automated invoicing and receipt generation.',
      icon: '💳',
      details: [
        'Stripe integration',
        'Automated invoicing',
        'Payment tracking',
        'Receipt generation',
      ],
    },
    {
      title: 'Task Management',
      description:
        'Organize and assign tasks to team members with priority levels and deadlines.',
      icon: '✅',
      details: [
        'Task assignment',
        'Priority levels',
        'Deadline tracking',
        'Team collaboration',
      ],
    },
    {
      title: 'Real-time Dashboard',
      description:
        'Live updates on appointments, patient activity, revenue, and practice performance.',
      icon: '📊',
      details: [
        'Live updates',
        'KPI tracking',
        'Performance analytics',
        'Custom widgets',
      ],
    },
  ];

  return (
    <section id='features' className='py-20 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            Everything You Need to Run Your Practice
          </h2>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            Our comprehensive platform provides all the tools modern healthcare
            providers need to deliver exceptional patient care.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <Card
              key={index}
              className='hover:shadow-lg transition-shadow duration-300'
            >
              <CardHeader>
                <div className='flex items-center mb-4'>
                  <div className='text-4xl mr-4'>{feature.icon}</div>
                  <CardTitle className='text-xl'>{feature.title}</CardTitle>
                </div>
                <CardDescription className='text-base'>
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  {feature.details.map((detail, detailIndex) => (
                    <li
                      key={detailIndex}
                      className='flex items-center text-sm text-gray-600'
                    >
                      <svg
                        className='h-4 w-4 text-medical-500 mr-2'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className='mt-20'>
          <div className='bg-gradient-to-r from-medical-50 to-blue-50 rounded-2xl p-8 md:p-12'>
            <div className='text-center mb-12'>
              <h3 className='text-2xl md:text-3xl font-bold text-gray-900 mb-4'>
                Built for Modern Healthcare
              </h3>
              <p className='text-lg text-gray-600'>
                Designed with security, scalability, and user experience in
                mind.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='text-center'>
                <div className='bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg'>
                  <span className='text-2xl'>🔒</span>
                </div>
                <h4 className='font-semibold text-lg mb-2'>HIPAA Compliant</h4>
                <p className='text-gray-600'>
                  Enterprise-grade security with end-to-end encryption
                </p>
              </div>
              <div className='text-center'>
                <div className='bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg'>
                  <span className='text-2xl'>☁️</span>
                </div>
                <h4 className='font-semibold text-lg mb-2'>Cloud-Based</h4>
                <p className='text-gray-600'>
                  Access your practice data securely from anywhere
                </p>
              </div>
              <div className='text-center'>
                <div className='bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg'>
                  <span className='text-2xl'>📱</span>
                </div>
                <h4 className='font-semibold text-lg mb-2'>Mobile Ready</h4>
                <p className='text-gray-600'>
                  Responsive design works perfectly on all devices
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
