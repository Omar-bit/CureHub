import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Mail, Phone, AlertCircle } from 'lucide-react';
import { patientAuthAPI } from '../services/api';
import { showSuccess, showError, TOAST_MESSAGES } from '../lib/toast';

// Validation schema for email or phone
const patientLoginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, 'Email ou téléphone requis')
    .refine((value) => {
      // Check if it's a valid email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    }, 'Veuillez entrer un email ou un numéro de téléphone valide'),
});

const PatientLoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('input'); // 'input' or 'verification'
  const [verificationMethod, setVerificationMethod] = useState(''); // 'otp' or 'password'
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [patientId, setPatientId] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(patientLoginSchema),
  });

  const handleIdentifierSubmit = async (data) => {
    setError('');
    setIsLoading(true);

    try {
      // Call API to verify email/phone and get patient info
      const response = await patientAuthAPI.verifyIdentifier({
        emailOrPhone: data.emailOrPhone,
      });

      // Store the email/phone and patient ID for next step
      setEmailOrPhone(data.emailOrPhone);
      setPatientId(response.patientId);
      setVerificationMethod(response.verificationMethod); // 'otp' or 'password'
      setStep('verification');

      if (response.verificationMethod === 'otp') {
        showSuccess('Code de vérification envoyé');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Erreur lors de la vérification';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordVerification = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await patientAuthAPI.loginWithPassword({
        patientId,
        password: passwordInput,
      });

      // Store token, patient data, and doctorId
      localStorage.setItem('patientToken', response.access_token);
      localStorage.setItem('patientUser', JSON.stringify(response.patient));
      localStorage.setItem('patientDoctorId', doctorId);

      showSuccess('Connexion réussie');
      navigate('/patient-space');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Mot de passe incorrect';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await patientAuthAPI.verifyOTP({
        patientId,
        otp: otpCode,
        emailOrPhone,
      });

      // Store token, patient data, and doctorId
      localStorage.setItem('patientToken', response.access_token);
      localStorage.setItem('patientUser', JSON.stringify(response.patient));
      localStorage.setItem('patientDoctorId', doctorId);

      showSuccess('Connexion réussie');
      navigate('/patient-space');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Code OTP invalide';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setError('');
    setPasswordInput('');
    setOtpCode('');
    reset();
  };

  return (
    <CenteredLayout maxWidth='max-w-md'>
      <div className='text-center mb-8'>
        <div className='mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
          <span className='text-blue-600 font-bold text-xl'>C</span>
        </div>
        <h1 className='text-3xl font-bold text-foreground'>Espace patient</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          {step === 'input' ? 'Connexion' : 'Vérification'}
        </p>
      </div>

      <Card className='shadow-lg'>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>
            {step === 'input'
              ? 'Accédez à votre espace'
              : 'Vérifiez votre identité'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'input' ? (
            <form onSubmit={handleSubmit(handleIdentifierSubmit)}>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='emailOrPhone' className='text-sm font-medium'>
                    Saisissez votre email ou téléphone :
                  </Label>
                  <div className='mt-2 relative'>
                    <Input
                      id='emailOrPhone'
                      placeholder='Email ou téléphone'
                      {...register('emailOrPhone')}
                      className={errors.emailOrPhone ? 'border-red-500' : ''}
                    />
                  </div>
                  {errors.emailOrPhone && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.emailOrPhone.message}
                    </p>
                  )}
                </div>

                <Button
                  type='submit'
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                  disabled={isLoading}
                >
                  {isLoading ? 'En cours...' : 'Suivant'}
                </Button>
              </div>
            </form>
          ) : verificationMethod === 'otp' ? (
            <form onSubmit={handleOTPVerification}>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600 mb-4'>
                  Un code de vérification a été envoyé à{' '}
                  <strong>{emailOrPhone}</strong>
                </p>
                <div>
                  <Label htmlFor='otp' className='text-sm font-medium'>
                    Code de vérification
                  </Label>
                  <Input
                    id='otp'
                    placeholder='000000'
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength='6'
                    className='mt-2 text-center text-lg tracking-widest'
                  />
                </div>

                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-1'
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Retour
                  </Button>
                  <Button
                    type='submit'
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                    disabled={isLoading || otpCode.length !== 6}
                  >
                    {isLoading ? 'Vérification...' : 'Vérifier'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordVerification}>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600 mb-4'>
                  Entrez votre mot de passe pour accéder à votre dossier
                </p>
                <div>
                  <Label htmlFor='password' className='text-sm font-medium'>
                    Mot de passe
                  </Label>
                  <Input
                    id='password'
                    type='password'
                    placeholder='Votre mot de passe'
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className='mt-2'
                  />
                </div>

                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-1'
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Retour
                  </Button>
                  <Button
                    type='submit'
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                    disabled={isLoading || !passwordInput}
                  >
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className='mt-6 text-center text-sm'>
            <p className='text-gray-600'>
              Vous êtes un professionnel ?{' '}
              <a
                href='/login'
                className='text-blue-600 hover:underline font-medium'
              >
                Connectez-vous ici
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </CenteredLayout>
  );
};

export default PatientLoginPage;
