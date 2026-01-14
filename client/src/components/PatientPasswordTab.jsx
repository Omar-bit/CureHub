import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../lib/toast';
import { patientAuthAPI } from '../services/api';

const PatientPasswordTab = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword =
        'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le nouveau mot de passe';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword =
        "Le nouveau mot de passe doit être différent de l'ancien";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await patientAuthAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        showSuccess('Mot de passe mis à jour avec succès');
        setIsEditing(false);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        showError(
          response.message || 'Erreur lors de la mise à jour du mot de passe'
        );
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour du mot de passe');
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  if (!isEditing) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Mot de passe</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              Sécurisez l'accès à votre compte. Ne le communiquez jamais.
            </p>

            <div className='bg-slate-50 p-4 rounded-lg border border-slate-200'>
              <p className='text-sm text-muted-foreground mb-2'>
                Dernier changement
              </p>
              <p className='text-foreground font-medium'>Non disponible</p>
            </div>

            <Button onClick={() => setIsEditing(true)} className='w-full'>
              Modifier
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-muted-foreground mb-4'>
            Pour des raisons de sécurité, veuillez entrer votre mot de passe
            actuel, puis saisir votre nouveau mot de passe.
          </p>

          {/* Current Password */}
          <div className='space-y-2'>
            <label
              htmlFor='currentPassword'
              className='text-sm font-medium text-foreground'
            >
              Mot de passe actuel *
            </label>
            <Input
              id='currentPassword'
              type='password'
              name='currentPassword'
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder='Entrez votre mot de passe actuel'
              className={errors.currentPassword ? 'border-red-500' : ''}
            />
            {errors.currentPassword && (
              <p className='text-sm text-red-500'>{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className='space-y-2'>
            <label
              htmlFor='newPassword'
              className='text-sm font-medium text-foreground'
            >
              Nouveau mot de passe *
            </label>
            <Input
              id='newPassword'
              type='password'
              name='newPassword'
              value={formData.newPassword}
              onChange={handleChange}
              placeholder='Entrez votre nouveau mot de passe'
              className={errors.newPassword ? 'border-red-500' : ''}
            />
            {errors.newPassword && (
              <p className='text-sm text-red-500'>{errors.newPassword}</p>
            )}
            <p className='text-xs text-muted-foreground mt-1'>
              Minimum 8 caractères
            </p>
          </div>

          {/* Confirm Password */}
          <div className='space-y-2'>
            <label
              htmlFor='confirmPassword'
              className='text-sm font-medium text-foreground'
            >
              Confirmer le mot de passe *
            </label>
            <Input
              id='confirmPassword'
              type='password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder='Confirmez votre nouveau mot de passe'
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className='text-sm text-red-500'>{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex gap-3 pt-4'>
        <Button type='submit' disabled={isLoading} className='flex-1'>
          {isLoading ? 'Mise à jour...' : 'Modifier'}
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={handleCancel}
          className='flex-1'
        >
          Annuler
        </Button>
      </div>
    </form>
  );
};

export default PatientPasswordTab;
