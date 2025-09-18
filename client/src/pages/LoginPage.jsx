import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const loginSchema = z.object({
    email: z.string().email(t('auth.login.errors.invalidEmail')),
    password: z.string().min(6, t('auth.login.errors.passwordMinLength')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    const result = await login(data.email, data.password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <CenteredLayout maxWidth='max-w-md'>
      <div className='text-center mb-8'>
        <div className='mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4'>
          <span className='text-primary-foreground font-bold text-xl'>C</span>
        </div>
        <h2 className='text-3xl font-bold text-foreground'>
          {t('auth.login.title')}
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {t('auth.login.noAccount')}{' '}
          <Link
            to='/register'
            className='font-medium text-primary hover:text-primary/80 transition-colors'
          >
            {t('auth.login.signUp')}
          </Link>
        </p>
      </div>

      <Card className='shadow-lg'>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>
            {t('auth.login.welcomeBack')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor='email'>{t('auth.login.email')}</Label>
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
              <Label htmlFor='password'>{t('auth.login.password')}</Label>
              <div className='mt-1'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  placeholder='Enter your password'
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

            <Button
              type='submit'
              className='w-full'
              loading={isLoading}
              loadingText={t('common.loading')}
              size='lg'
            >
              {t('auth.login.button')}
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

export default LoginPage;
