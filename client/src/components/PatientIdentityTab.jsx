import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../lib/toast';
import { patientAuthAPI } from '../services/api';
import { splitPatientName, buildPatientName } from '../lib/patient';

const PatientIdentityTab = ({ patientData, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use imported patient name utilities
  const { firstName: initialFirstName, lastName: initialLastName } =
    splitPatientName(patientData?.name);

  // Format phone number as XX.XX.XX.XX.XX (max 10 digits)
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    if (limitedDigits.length === 0) return '';

    let formatted = '';
    for (let i = 0; i < limitedDigits.length; i += 2) {
      if (i > 0) formatted += '.';
      formatted += limitedDigits.slice(i, i + 2);
    }
    return formatted;
  };

  const [formData, setFormData] = useState({
    firstName: initialFirstName || '',
    lastName: initialLastName || '',
    gender: patientData?.gender || 'FEMALE',
    dateOfBirth: patientData?.dateOfBirth
      ? new Date(patientData.dateOfBirth).toISOString().split('T')[0]
      : '',
    email: patientData?.email || '',
    phoneNumber: patientData?.phoneNumber || '',
    address: patientData?.address || '',
    postalCode: patientData?.postalCode || '',
    city: patientData?.city || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Format phone number on change
    let finalValue = value;
    if (name === 'phoneNumber') {
      finalValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Build the full name from first and last name
      const fullName = buildPatientName(formData.firstName, formData.lastName);

      // Prepare data for API
      const updateData = {
        name: fullName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        postalCode: formData.postalCode,
        city: formData.city,
      };

      // Call API to update patient data
      const response = await patientAuthAPI.updateProfile(updateData);

      // Update localStorage with new patient data
      if (response) {
        localStorage.setItem('patientUser', JSON.stringify(response));

        // Also update form data with the response to ensure UI is in sync
        const { firstName: newFirstName, lastName: newLastName } =
          splitPatientName(response.name);
        setFormData({
          firstName: newFirstName || '',
          lastName: newLastName || '',
          gender: response.gender || 'FEMALE',
          dateOfBirth: response.dateOfBirth
            ? new Date(response.dateOfBirth).toISOString().split('T')[0]
            : '',
          email: response.email || '',
          phoneNumber: response.phoneNumber || '',
          address: response.address || '',
          postalCode: response.postalCode || '',
          city: response.city || '',
        });
      }

      showSuccess('Profil mis à jour avec succès');
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(response);
      }
    } catch (error) {
      showError('Erreur lors de la mise à jour du profil');
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    setFormData({
      firstName: initialFirstName || '',
      lastName: initialLastName || '',
      gender: patientData?.gender || 'FEMALE',
      dateOfBirth: patientData?.dateOfBirth
        ? new Date(patientData.dateOfBirth).toISOString().split('T')[0]
        : '',
      email: patientData?.email || '',
      phoneNumber: patientData?.phoneNumber || '',
      address: patientData?.address || '',
      postalCode: patientData?.postalCode || '',
      city: patientData?.city || '',
    });
  };

  if (!isEditing) {
    return (
      <div className='space-y-6'>
        {/* Identité Section */}
        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-xs font-medium text-muted-foreground uppercase'>
                  Civilitè *
                </label>
                <p className='text-foreground font-medium mt-1'>
                  {formData.gender === 'FEMALE' ? 'Madame' : 'Monsieur'}
                </p>
              </div>
              <div>
                <label className='text-xs font-medium text-muted-foreground uppercase'>
                  Prénom *
                </label>
                <p className='text-foreground font-medium mt-1'>
                  {formData.firstName || '-'}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-xs font-medium text-muted-foreground uppercase'>
                  Nom *
                </label>
                <p className='text-foreground font-medium mt-1'>
                  {formData.lastName || '-'}
                </p>
              </div>
              <div>
                <label className='text-xs font-medium text-muted-foreground uppercase'>
                  Date de naissance *
                </label>
                <p className='text-foreground font-medium mt-1'>
                  {formData.dateOfBirth
                    ? new Date(formData.dateOfBirth).toLocaleDateString('fr-FR')
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coordonnées Section */}
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase'>
                Tél. Portable
              </label>
              <p className='text-foreground font-medium mt-1'>
                {formData.phoneNumber || '-'}
              </p>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase'>
                Email
              </label>
              <p className='text-foreground font-medium mt-1'>
                {formData.email || '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Adresse Section */}
        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase'>
                N° et Nom de rue
              </label>
              <p className='text-foreground font-medium mt-1'>
                {formData.address || '-'}
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-xs font-medium text-muted-foreground uppercase'>
                  Code postal
                </label>
                <p className='text-foreground font-medium mt-1'>
                  {formData.postalCode || '-'}
                </p>
              </div>
              <div>
                <label className='text-xs font-medium text-muted-foreground uppercase'>
                  Ville
                </label>
                <p className='text-foreground font-medium mt-1'>
                  {formData.city || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => setIsEditing(true)} className='w-full'>
          Modifier
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Identité Section */}
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Civilitè *
              </label>
              <select
                name='gender'
                value={formData.gender}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-200 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='FEMALE'>Madame</option>
                <option value='MALE'>Monsieur</option>
                {/* <option value='OTHER'>Autre</option> */}
              </select>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Prénom *
              </label>
              <Input
                type='text'
                name='firstName'
                value={formData.firstName}
                onChange={handleChange}
                placeholder='Nicole'
                required
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Nom *
              </label>
              <Input
                type='text'
                name='lastName'
                value={formData.lastName}
                onChange={handleChange}
                placeholder='DAVID-TEST-A'
                required
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Date de naissance *
              </label>
              <Input
                type='date'
                name='dateOfBirth'
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées Section */}
      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground'>
              Tél. Portable
            </label>
            <Input
              type='tel'
              name='phoneNumber'
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder='06.75.45.42.38'
              maxLength='14'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground'>Email</label>
            <Input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='dr.david53@yahoo.com'
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Adresse Section */}
      <Card>
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-foreground'>
              N° et Nom de rue
            </label>
            <Input
              type='text'
              name='address'
              value={formData.address}
              onChange={handleChange}
              placeholder='12 Rue Nationale'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Code postal
              </label>
              <Input
                type='text'
                name='postalCode'
                value={formData.postalCode}
                onChange={handleChange}
                placeholder='32130'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-foreground'>
                Ville
              </label>
              <Input
                type='text'
                name='city'
                value={formData.city}
                onChange={handleChange}
                placeholder='MONTESQUIOU'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex gap-3 pt-4'>
        <Button type='submit' disabled={isLoading} className='flex-1'>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
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

export default PatientIdentityTab;
