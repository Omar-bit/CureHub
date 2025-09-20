import React, { useState, useEffect } from 'react';
import { SheetContent, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { FormInput, FormSelect, FormTextarea } from './ui/form-field';
import { Alert } from './ui/alert';

const PatientFormSheet = ({ patient, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'MALE',
    email: '',
    phoneNumber: '',
    address: '',
    profileImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        dateOfBirth: patient.dateOfBirth
          ? patient.dateOfBirth.split('T')[0]
          : '',
        gender: patient.gender || 'MALE',
        email: patient.email || '',
        phoneNumber: patient.phoneNumber || '',
        address: patient.address || '',
        profileImage: patient.profileImage || '',
      });
    } else {
      setFormData({
        name: '',
        dateOfBirth: '',
        gender: 'MALE',
        email: '',
        phoneNumber: '',
        address: '',
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
      const payload = { ...formData };

      // Remove empty fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') {
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

  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <SheetContent
      title={patient ? 'Edit Patient' : 'Add New Patient'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className='space-y-6'>
        {errors.general && (
          <Alert variant='destructive'>{errors.general}</Alert>
        )}

        <FormInput
          label='Full Name'
          name='name'
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter patient's full name"
          error={errors.name}
        />

        <FormInput
          label='Date of Birth'
          name='dateOfBirth'
          type='date'
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
          error={errors.dateOfBirth}
        />

        <FormSelect
          label='Gender'
          name='gender'
          value={formData.gender}
          onChange={handleChange}
          required
          options={genderOptions}
          error={errors.gender}
        />

        <FormInput
          label='Email Address'
          name='email'
          type='email'
          value={formData.email}
          onChange={handleChange}
          placeholder='Enter email address'
          helperText='If provided, login credentials will be sent to this email'
          error={errors.email}
        />

        <FormInput
          label='Phone Number'
          name='phoneNumber'
          type='tel'
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder='Enter phone number'
          error={errors.phoneNumber}
        />

        <FormTextarea
          label='Address'
          name='address'
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter patient's address"
          rows={3}
          error={errors.address}
        />

        <SheetFooter>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type='submit' loading={isLoading} disabled={isLoading}>
            {patient ? 'Update Patient' : 'Add Patient'}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  );
};

export default PatientFormSheet;
