import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
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
import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const EmailVerificationPage = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get email from location state or search params
  const email = location.state?.email || searchParams.get('email') || '';

  const verificationSchema = z.object({
    code: z
      .string()
      .min(6, t('auth.emailVerification.errors.codeLength'))
      .max(6, t('auth.emailVerification.errors.codeLength'))
      .regex(/^\d{6}$/, t('auth.emailVerification.errors.codeInvalid')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(verificationSchema),
  });

  const codeValue = watch('code', '');

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Initial countdown
  useEffect(() => {
    setTimeLeft(60); // 60 seconds initial wait
  }, []);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (codeValue.length === 6 && /^\d{6}$/.test(codeValue)) {
      handleSubmit(onSubmit)();
    }
  }, [codeValue, handleSubmit]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.verifyEmail({
        // email,
        code: data.code,
      });

      setSuccess(t('auth.emailVerification.success.verified'));

      // Redirect to login after successful verification
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            message: t('auth.emailVerification.success.verified'),
            email,
          },
        });
      }, 2000);
    } catch (error) {
      console.error('Email verification failed:', error);
      setError(
        error.response?.data?.message ||
          t('auth.emailVerification.errors.verificationFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      await authAPI.resendVerification({ email });
      setSuccess(t('auth.emailVerification.success.codeSent'));
      setTimeLeft(60); // Reset countdown
      setCanResend(false);
    } catch (error) {
      console.error('Resend verification failed:', error);
      setError(
        error.response?.data?.message ||
          t('auth.emailVerification.errors.resendFailed')
      );
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <CenteredLayout maxWidth='max-w-md' className='py-8'>
      <div className='text-center mb-8'>
        <div className='mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4'>
          <Mail className='h-8 w-8 text-primary-foreground' />
        </div>
        <h2 className='text-3xl font-bold text-foreground'>
          {t('auth.emailVerification.title')}
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {t('auth.emailVerification.description')}
        </p>
        <p className='font-medium text-foreground'>{email}</p>
      </div>

      <Card className='shadow-lg'>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>
            {t('auth.emailVerification.codeLabel')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className='border-green-200 bg-green-50 text-green-800'>
                <CheckCircle className='h-4 w-4' />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor='code'>
                {t('auth.emailVerification.codeLabel')}
              </Label>
              <div className='mt-1'>
                <Input
                  id='code'
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]*'
                  maxLength={6}
                  placeholder={t('auth.emailVerification.codePlaceholder')}
                  className={`text-center text-2xl tracking-widest font-mono ${
                    errors.code ? 'border-destructive' : ''
                  }`}
                  {...register('code')}
                  autoComplete='one-time-code'
                  autoFocus
                />
              </div>
              {errors.code && (
                <p className='mt-1 text-sm text-destructive'>
                  {errors.code.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={isLoading || codeValue.length !== 6}
              size='lg'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                  {t('auth.emailVerification.buttonLoading')}
                </>
              ) : (
                t('auth.emailVerification.button')
              )}
            </Button>
          </form>

          <div className='mt-6 text-center space-y-4'>
            <div className='text-sm text-muted-foreground'>
              {t('auth.emailVerification.resendText')}
            </div>

            {canResend ? (
              <Button
                variant='outline'
                onClick={handleResendCode}
                disabled={isResending}
                className='w-full'
              >
                {isResending ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
                    {t('auth.emailVerification.resendButtonLoading')}
                  </>
                ) : (
                  t('auth.emailVerification.resendButton')
                )}
              </Button>
            ) : (
              <div className='flex items-center justify-center text-sm text-muted-foreground'>
                <Clock className='h-4 w-4 mr-1' />
                {t('auth.emailVerification.resendCountdown')}{' '}
                {formatTime(timeLeft)}
              </div>
            )}

            <div className='text-sm'>
              <button
                type='button'
                onClick={() => navigate('/register')}
                className='text-primary hover:text-primary/80 transition-colors'
              >
                {t('auth.emailVerification.backToRegister')}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='mt-6 text-center'>
        <div className='text-xs text-muted-foreground max-w-sm mx-auto'>
          <p className='mb-2'>
            <strong>{t('auth.emailVerification.securityTip')}</strong>
          </p>
          <p>{t('auth.emailVerification.securityNote')}</p>
        </div>
      </div>
    </CenteredLayout>
  );
};

export default EmailVerificationPage;
