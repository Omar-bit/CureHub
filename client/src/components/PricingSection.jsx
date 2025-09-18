import React from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from './ui/card';

const PricingSection = () => {
  const plans = [
    {
      name: 'Solo Practice',
      price: '$29',
      period: '/month',
      description: 'Perfect for individual doctors and small practices',
      features: [
        'Up to 100 patients',
        'Basic appointment scheduling',
        'Patient management',
        'Online consultations',
        'Payment processing',
        'Email support',
      ],
      popular: false,
      cta: 'Start Free Trial',
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/month',
      description: 'Ideal for growing practices and small clinics',
      features: [
        'Up to 500 patients',
        'Advanced scheduling',
        'Multi-doctor support',
        'Task management',
        'Real-time dashboard',
        'Team collaboration',
        'Priority support',
        'Custom branding',
      ],
      popular: true,
      cta: 'Start Free Trial',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large clinics and healthcare organizations',
      features: [
        'Unlimited patients',
        'Multi-location support',
        'Advanced analytics',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Training & onboarding',
        'SLA guarantee',
      ],
      popular: false,
      cta: 'Contact Sales',
    },
  ];

  return (
    <section id='pricing' className='py-20 bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            Simple, Transparent Pricing
          </h2>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            Choose the plan that fits your practice. All plans include a 14-day
            free trial with no credit card required.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.popular
                  ? 'ring-2 ring-medical-500 shadow-xl scale-105'
                  : 'shadow-lg'
              } transition-transform hover:scale-105`}
            >
              {plan.popular && (
                <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
                  <span className='bg-medical-500 text-white px-4 py-1 rounded-full text-sm font-medium'>
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className='text-center pb-6'>
                <CardTitle className='text-2xl font-bold'>
                  {plan.name}
                </CardTitle>
                <div className='mt-4'>
                  <span className='text-4xl font-bold text-gray-900'>
                    {plan.price}
                  </span>
                  <span className='text-gray-600'>{plan.period}</span>
                </div>
                <CardDescription className='mt-4 text-base'>
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className='space-y-6'>
                <Button
                  className={`w-full ${
                    plan.popular ? '' : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>

                <div className='space-y-3'>
                  <div className='font-semibold text-gray-900'>
                    What's included:
                  </div>
                  <ul className='space-y-2'>
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className='flex items-center text-sm text-gray-600'
                      >
                        <svg
                          className='h-4 w-4 text-medical-500 mr-3 flex-shrink-0'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className='mt-20'>
          <div className='text-center mb-12'>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
              Frequently Asked Questions
            </h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
            <div>
              <h4 className='font-semibold text-lg mb-2'>
                Can I change plans anytime?
              </h4>
              <p className='text-gray-600'>
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect at the next billing cycle.
              </p>
            </div>
            <div>
              <h4 className='font-semibold text-lg mb-2'>
                Is there a setup fee?
              </h4>
              <p className='text-gray-600'>
                No setup fees for any plan. You only pay the monthly
                subscription fee.
              </p>
            </div>
            <div>
              <h4 className='font-semibold text-lg mb-2'>
                What about data security?
              </h4>
              <p className='text-gray-600'>
                We're HIPAA compliant with enterprise-grade security, including
                end-to-end encryption and regular security audits.
              </p>
            </div>
            <div>
              <h4 className='font-semibold text-lg mb-2'>
                Do you offer training?
              </h4>
              <p className='text-gray-600'>
                Yes, we provide comprehensive onboarding and training for all
                plans, with dedicated support for Enterprise customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
