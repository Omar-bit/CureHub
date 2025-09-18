import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const RegisterPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const registerSchema = z
    .object({
      email: z.string().email(t('auth.register.errors.invalidEmail')),
      password: z.string().min(6, t('auth.register.errors.passwordMinLength')),
      confirmPassword: z
        .string()
        .min(6, t('auth.register.errors.confirmPasswordRequired')),
      firstName: z.string().min(1, t('auth.register.errors.firstNameRequired')),
      lastName: z.string().min(1, t('auth.register.errors.lastNameRequired')),
      phone: z.string().optional(),
      role: z.enum(['DOCTOR', 'ASSISTANT', 'PATIENT']).default('PATIENT'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.register.errors.passwordsMustMatch'),
      path: ['confirmPassword'],
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    const { confirmPassword, ...userData } = data;
    const result = await registerUser(userData);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className='max-h-screen overflow-hidden flex items-center justify-center bg-gray-50  px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            {t('auth.register.title')}
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            {t('auth.register.orText')}{' '}
            <Link
              to='/login'
              className='font-medium text-blue-600 hover:text-blue-500'
            >
              {t('auth.register.signInLink')}
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.register.cardTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='firstName'>
                    {t('auth.register.firstName')}
                  </Label>
                  <Input
                    id='firstName'
                    type='text'
                    autoComplete='given-name'
                    {...register('firstName')}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='lastName'>
                    {t('auth.register.lastName')}
                  </Label>
                  <Input
                    id='lastName'
                    type='text'
                    autoComplete='family-name'
                    {...register('lastName')}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor='email'>{t('auth.register.email')}</Label>
                <Input
                  id='email'
                  type='email'
                  autoComplete='email'
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='phone'>{t('auth.register.phone')}</Label>
                <Input
                  id='phone'
                  type='tel'
                  autoComplete='tel'
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='role'>{t('auth.register.accountType')}</Label>
                <select
                  id='role'
                  {...register('role')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='PATIENT'>
                    {t('auth.register.roles.PATIENT')}
                  </option>
                  <option value='DOCTOR'>
                    {t('auth.register.roles.DOCTOR')}
                  </option>
                  <option value='ASSISTANT'>
                    {t('auth.register.roles.ASSISTANT')}
                  </option>
                </select>
                {errors.role && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='password'>{t('auth.register.password')}</Label>
                <Input
                  id='password'
                  type='password'
                  autoComplete='new-password'
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='confirmPassword'>
                  {t('auth.register.confirmPassword')}
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  autoComplete='new-password'
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading
                  ? t('auth.register.buttonLoading')
                  : t('auth.register.button')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
