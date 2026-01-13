import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalFooter } from './ui/modal';
import { FormInput, FormSelect } from './ui/form-field';
import { Button } from './ui/button';
import { consultationTypesAPI, modeExerciceAPI } from './../services/api';
import { showSuccess, showError } from './../lib/toast';

const TYPE_OPTIONS = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'URGENT', label: 'Urgent' },
];

const ENABLED_OPTIONS = [
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
];

const ConsultationTypeForm = ({
  isOpen,
  onClose,
  consultationType = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    modeExerciceId: '',
    duration: '',
    restAfter: '',
    type: '',
    canBookBefore: '',
    price: '',
    enabled: 'true',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [modeExercices, setModeExercices] = useState([]);
  const [loadingModeExercices, setLoadingModeExercices] = useState(false);

  const isEditing = !!consultationType;

  // Load mode exercices when form opens
  useEffect(() => {
    const loadModeExercices = async () => {
      if (isOpen) {
        setLoadingModeExercices(true);
        try {
          const data = await modeExerciceAPI.getAll();
          setModeExercices(data || []);
        } catch (error) {
          console.error('Failed to load mode exercices:', error);
          showError('Failed to load mode exercices');
        } finally {
          setLoadingModeExercices(false);
        }
      }
    };

    loadModeExercices();
  }, [isOpen]);

  // Initialize form data when editing
  useEffect(() => {
    if (consultationType) {
      setFormData({
        name: consultationType.name || '',
        color: consultationType.color || '#3B82F6',
        modeExerciceId:
          consultationType.modeExerciceId ||
          consultationType.modeExercice?.id ||
          '',
        duration: consultationType.duration?.toString() || '',
        restAfter: consultationType.restAfter?.toString() || '',
        type: consultationType.type || '',
        canBookBefore: consultationType.canBookBefore?.toString() || '',
        price: consultationType.price?.toString() || '',
        enabled:
          consultationType.enabled !== undefined
            ? consultationType.enabled.toString()
            : 'true',
      });
    } else {
      // Reset form for new consultation type
      setFormData({
        name: '',
        color: '#3B82F6',
        modeExerciceId: '',
        duration: '',
        restAfter: '',
        type: '',
        canBookBefore: '',
        price: '',
        enabled: 'true',
      });
    }
    setErrors({});
  }, [consultationType, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Color is required';
    } else if (!/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = 'Please enter a valid hex color (e.g., #3B82F6)';
    }

    // Mode exercice is optional, no validation needed

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    } else if (parseInt(formData.duration) < 1) {
      newErrors.duration = 'Duration must be at least 1 minute';
    }

    if (formData.restAfter !== '' && parseInt(formData.restAfter) < 0) {
      newErrors.restAfter = 'Rest after must be 0 or more minutes';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (formData.canBookBefore !== '' && parseInt(formData.canBookBefore) < 0) {
      newErrors.canBookBefore = 'Can book before must be 0 or more minutes';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be 0 or more';
    }
    if (!formData.modeExerciceId) {
      newErrors.modeExerciceId = 'Mode exercice is required';
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
      const submitData = {
        name: formData.name.trim(),
        color: formData.color.trim(),
        modeExerciceId: formData.modeExerciceId,
        duration: parseInt(formData.duration),
        restAfter: parseInt(formData.restAfter) || 0,
        type: formData.type,
        canBookBefore: parseInt(formData.canBookBefore) || 0,
        price: parseFloat(formData.price),
        enabled: formData.enabled === 'true',
      };

      if (isEditing) {
        await consultationTypesAPI.update(consultationType.id, submitData);
        showSuccess('Consultation type updated successfully');
      } else {
        await consultationTypesAPI.create(submitData);
        showSuccess('Consultation type created successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving consultation type:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to save consultation type. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Consultation Type' : 'Add Consultation Type'}
      size='lg'
      closeOnBackdropClick={!isLoading}
    >
      <ModalContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormInput
              label='Name'
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder='e.g., General Consultation'
              disabled={isLoading}
            />

            <FormInput
              label='Color'
              required
              type='color'
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              error={errors.color}
              helperText='Choose a color to identify this consultation type'
              disabled={isLoading}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormSelect
              required
              label="Mode d'exercice"
              error={errors.modeExerciceId}
              value={formData.modeExerciceId}
              onChange={(e) =>
                handleInputChange('modeExerciceId', e.target.value)
              }
              // error={errors.modeExerciceId}
              options={modeExercices.map((me) => ({
                value: me.id,
                label: me.name,
              }))}
              placeholder="Sélectionner un mode d'exercice"
              disabled={isLoading || loadingModeExercices}
            />

            <FormSelect
              label='Type'
              required
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              error={errors.type}
              options={TYPE_OPTIONS}
              placeholder='Select type'
              disabled={isLoading}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <FormInput
              label='Duration (minutes)'
              required
              type='number'
              min='1'
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              error={errors.duration}
              placeholder='30'
              disabled={isLoading}
            />

            <FormInput
              label='Rest After (minutes)'
              type='number'
              min='0'
              value={formData.restAfter}
              onChange={(e) => handleInputChange('restAfter', e.target.value)}
              error={errors.restAfter}
              placeholder='0'
              helperText='Time to rest after consultation'
              disabled={isLoading}
            />

            <FormInput
              label='Can Book Before (minutes)'
              type='number'
              min='0'
              value={formData.canBookBefore}
              onChange={(e) =>
                handleInputChange('canBookBefore', e.target.value)
              }
              error={errors.canBookBefore}
              placeholder='30'
              helperText='How long before consultation can be booked'
              disabled={isLoading}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormInput
              label='Price'
              required
              type='number'
              min='0'
              step='0.01'
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              error={errors.price}
              placeholder='50.00'
              disabled={isLoading}
            />

            <FormSelect
              label='Status'
              required
              value={formData.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.value)}
              error={errors.enabled}
              options={ENABLED_OPTIONS}
              disabled={isLoading}
            />
          </div>
        </form>
      </ModalContent>

      <ModalFooter>
        <div className='flex justify-end space-x-2'>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            loading={isLoading}
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default ConsultationTypeForm;
