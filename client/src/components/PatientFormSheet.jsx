import React, { useState, useEffect } from 'react';
import { SheetContent, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { FormInput, FormSelect, FormTextarea } from './ui/form-field';
import { Alert } from './ui/alert';

const PatientFormSheet = ({ patient, isOpen, onClose, onSave }) => {
  let patientFullName = ['', ''];
  let patientFirstName = '';
  let patientLastName = '';

  // Handle both full patient object and prefilled name object
  if (patient != null) {
    if (patient.name) {
      // Full patient object with name field
      patientFullName = patient.name.includes('!SP!')
        ? patient.name.split('!SP!')
        : patient.name.split(' ');
      patientFirstName = patientFullName[0] || '';
      patientLastName = patientFullName.slice(1).join(' ') || '';
    } else if (patient.firstName || patient.lastName) {
      // Pre-filled name object (from appointment form)
      patientFirstName = patient.firstName || '';
      patientLastName = patient.lastName || '';
    }
  }

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    dateOfBirth: '',
    gender: 'MALE',
    email: '',
    mobilePhone: '',
    landlinePhone: '',
    address: '',
    showProvisionalCode: false,
    profileImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (patient) {
      // Determine if this is a full patient object or just pre-filled names
      const isFullPatient = patient.name !== undefined;

      let firstName = '';
      let lastName = '';

      if (isFullPatient) {
        // Full patient object
        const fullName = patient.name.includes('!SP!')
          ? patient.name.split('!SP!')
          : patient.name.split(' ');
        firstName = fullName[0] || '';
        lastName = fullName.slice(1).join(' ') || '';
      } else {
        // Pre-filled name object
        firstName = patient.firstName || '';
        lastName = patient.lastName || '';
      }

      setFormData({
        lastName: lastName,
        firstName: firstName,
        dateOfBirth:
          isFullPatient && patient.dateOfBirth
            ? patient.dateOfBirth.split('T')[0]
            : '',
        gender: (isFullPatient && patient.gender) || 'MALE',
        email: (isFullPatient && patient.email) || '',
        mobilePhone: (isFullPatient && patient.phoneNumber) || '',
        landlinePhone: '',
        address: (isFullPatient && patient.address) || '',
        showProvisionalCode: false,
        profileImage: (isFullPatient && patient.profileImage) || '',
      });
    } else {
      setFormData({
        lastName: '',
        firstName: '',
        dateOfBirth: '',
        gender: 'MALE',
        email: '',
        mobilePhone: '',
        landlinePhone: '',
        address: '',
        showProvisionalCode: false,
        profileImage: '',
      });
    }
    setErrors({});
  }, [patient, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        // Combine first and last name for backend compatibility
        name: `${formData.firstName} !SP! ${formData.lastName}`.trim(),
        phoneNumber: formData.mobilePhone, // Map to existing backend field
      };

      // Remove empty fields and form-specific fields
      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === '' ||
          [
            'firstName',
            'lastName',
            'mobilePhone',
            'landlinePhone',
            'showProvisionalCode',
          ].includes(key)
        ) {
          delete payload[key];
        }
      });

      await onSave(payload);
      onClose();
    } catch (error) {
      // Error handling is now done in the parent component with toasts
      setErrors({ general: error.message || 'Failed to save patient' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  // Determine title based on patient type
  const isEditMode = patient && patient.name !== undefined;
  const sheetTitle = isEditMode ? 'Modifier Patient' : 'Nouveau patient';

  return (
    <SheetContent title={sheetTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {errors.general && (
          <Alert variant='destructive'>{errors.general}</Alert>
        )}
        {/* Identity Section */}
        <div className='space-y-4'>
          <h3 className='text-sm font-medium text-gray-700 border-b pb-2'>
            Identité
          </h3>

          <div className='pl-4 space-y-4'>
            <FormInput
              label='Nom'
              name='lastName'
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder='Nom'
              error={errors.lastName}
            />

            <FormInput
              label='Prénom'
              name='firstName'
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder='Prénom'
              error={errors.firstName}
            />

            <FormInput
              label='Date nais.'
              name='dateOfBirth'
              type='date'
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              placeholder='Date de nais. (JJ/MM/AAAA)'
              error={errors.dateOfBirth}
            />

            {/* Gender Radio Buttons */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Genre <span className='text-destructive ml-1'>*</span>
              </label>
              <div className='flex space-x-6'>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='gender'
                    value='MALE'
                    checked={formData.gender === 'MALE'}
                    onChange={handleChange}
                    className='w-4 h-4 text-blue-600'
                  />
                  <span className='text-sm text-gray-700'>Homme</span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='gender'
                    value='FEMALE'
                    checked={formData.gender === 'FEMALE'}
                    onChange={handleChange}
                    className='w-4 h-4 text-blue-600'
                  />
                  <span className='text-sm text-gray-700'>Femme</span>
                </label>
              </div>
              {errors.gender && (
                <p className='text-sm text-red-600'>{errors.gender}</p>
              )}
            </div>
          </div>
        </div>
        {/* Coordinates Section */}
        <div className='space-y-4'>
          <h3 className='text-sm font-medium text-gray-700 border-b pb-2'>
            Coordonnées
          </h3>

          <div className='pl-4 space-y-4'>
            <FormInput
              label='Email'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='Adresse email'
              error={errors.email}
            />

            <FormInput
              label='Tél. port.'
              name='mobilePhone'
              type='tel'
              value={formData.mobilePhone}
              onChange={handleChange}
              placeholder='N° de tél. portable'
              error={errors.mobilePhone}
            />

            <FormInput
              label='Tél. fixe'
              name='landlinePhone'
              type='tel'
              value={formData.landlinePhone}
              onChange={handleChange}
              placeholder='N° de tél. fixe'
              error={errors.landlinePhone}
            />

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='showProvisionalCode'
                name='showProvisionalCode'
                checked={formData.showProvisionalCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    showProvisionalCode: e.target.checked,
                  }))
                }
                className='w-4 h-4 text-blue-600'
              />
              <label
                htmlFor='showProvisionalCode'
                className='text-sm text-gray-700'
              >
                Afficher le code confidentiel provisoire
              </label>
            </div>
          </div>
        </div>
        {/* Address Section */}
        <div className='space-y-4'>
          <h3 className='text-sm font-medium text-gray-700 border-b pb-2'>
            Adresse
          </h3>

          <div className='pl-4'>
            <FormTextarea
              name='address'
              value={formData.address}
              onChange={handleChange}
              placeholder='Adresse complète'
              rows={3}
              error={errors.address}
            />
          </div>
        </div>{' '}
        <SheetFooter>
          <Button
            type='submit'
            loading={isLoading}
            disabled={isLoading}
            className='bg-purple-600 hover:bg-purple-700'
          >
            {isEditMode ? 'Modifier' : 'Enregistrer'}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  );
};

export default PatientFormSheet;
