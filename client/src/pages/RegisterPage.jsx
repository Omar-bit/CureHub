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
import { CenteredLayout } from '../components/Layout';
import { User, Mail, Lock, Eye, EyeOff, Phone, UserCheck } from 'lucide-react';

const RegisterPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      role: z.enum(['DOCTOR', 'ASSISTANT']).default('ASSISTANT'),
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
    defaultValues: {
      role: 'DOCTOR',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    const { confirmPassword, ...userData } = data;
    const result = await registerUser(userData);

    if (result.success) {
      if (result.requiresVerification) {
        // Redirect to email verification page
        navigate('/verify-email', {
          replace: true,
          state: {
            email: userData.email,
            message: result.message,
          },
        });
      } else {
        // Fallback: direct login (shouldn't happen with email verification)
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <CenteredLayout maxWidth='max-w-lg' className='py-8'>
      <div className='text-center mb-8'>
        <div className='mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4'>
          <span className='text-primary-foreground font-bold text-xl'>C</span>
        </div>
        <h2 className='text-3xl font-bold text-foreground'>
          {t('auth.register.title')}
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {t('auth.register.orText')}{' '}
          <Link
            to='/login'
            className='font-medium text-primary hover:text-primary/80 transition-colors'
          >
            {t('auth.register.signInLink')}
          </Link>
        </p>
      </div>

      <Card className='shadow-lg'>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>
            {t('auth.register.cardTitle')}
          </CardTitle>
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
                <div className='mt-1'>
                  <Input
                    id='firstName'
                    type='text'
                    autoComplete='given-name'
                    placeholder='First name'
                    leftIcon={<User />}
                    className={errors.firstName ? 'border-destructive' : ''}
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className='mt-1 text-sm text-destructive'>
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='lastName'>{t('auth.register.lastName')}</Label>
                <div className='mt-1'>
                  <Input
                    id='lastName'
                    type='text'
                    autoComplete='family-name'
                    placeholder='Last name'
                    leftIcon={<User />}
                    className={errors.lastName ? 'border-destructive' : ''}
                    {...register('lastName')}
                  />
                </div>
                {errors.lastName && (
                  <p className='mt-1 text-sm text-destructive'>
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor='email'>{t('auth.register.email')}</Label>
              <div className='mt-1'>
                <Input
                  id='email'
                  type='email'
                  autoComplete='email'
                  placeholder='Enter your email'
                  leftIcon={<Mail />}
                  className={errors.email ? 'border-destructive' : ''}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className='mt-1 text-sm text-destructive'>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='phone'>{t('auth.register.phone')}</Label>
              <div className='mt-1'>
                <Input
                  id='phone'
                  type='tel'
                  autoComplete='tel'
                  placeholder='Phone number (optional)'
                  leftIcon={<Phone />}
                  className={errors.phone ? 'border-destructive' : ''}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className='mt-1 text-sm text-destructive'>
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='role'>{t('auth.register.accountType')}</Label>
              <div className='relative mt-1'>
                <UserCheck className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <select
                  id='role'
                  {...register('role')}
                  className='w-full pl-10 pr-4 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground'
                >
                  <option value='DOCTOR'>
                    {t('auth.register.roles.DOCTOR')}
                  </option>
                  <option value='ASSISTANT'>
                    {t('auth.register.roles.ASSISTANT')}
                  </option>
                </select>
              </div>
              {errors.role && (
                <p className='mt-1 text-sm text-destructive'>
                  {errors.role.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='password'>{t('auth.register.password')}</Label>
              <div className='mt-1'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  placeholder='Create a password'
                  leftIcon={<Lock />}
                  rightIcon={
                    <button
                      type='button'
                      className='text-muted-foreground hover:text-foreground'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  }
                  className={errors.password ? 'border-destructive' : ''}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className='mt-1 text-sm text-destructive'>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='confirmPassword'>
                {t('auth.register.confirmPassword')}
              </Label>
              <div className='mt-1'>
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete='new-password'
                  placeholder='Confirm your password'
                  leftIcon={<Lock />}
                  rightIcon={
                    <button
                      type='button'
                      className='text-muted-foreground hover:text-foreground'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  }
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className='mt-1 text-sm text-destructive'>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full'
              loading={isLoading}
              loadingText={t('auth.register.buttonLoading')}
              size='lg'
            >
              {t('auth.register.button')}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <Link
              to='/'
              className='text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </CenteredLayout>
  );
};

export default RegisterPage;
