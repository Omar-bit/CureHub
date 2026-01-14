import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalFooter } from './ui/modal';
import { FormInput, FormSelect } from './ui/form-field';
import { Button } from './ui/button';
import {
  consultationTypesAPI,
  modeExerciceAPI,
  acteAPI,
} from './../services/api';
import { showSuccess, showError } from './../lib/toast';

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
    acteIds: [],
    enabled: 'true',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [modeExercices, setModeExercices] = useState([]);
  const [actes, setActes] = useState([]);
  const [loadingModeExercices, setLoadingModeExercices] = useState(false);
  const [loadingActes, setLoadingActes] = useState(false);

  const isEditing = !!consultationType;

  // Load mode exercices and actes when form opens
  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setLoadingModeExercices(true);
        setLoadingActes(true);
        try {
          const [modeData, actesData] = await Promise.all([
            modeExerciceAPI.getAll(),
            acteAPI.getAll(),
          ]);
          setModeExercices(modeData || []);
          setActes(actesData || []);
        } catch (error) {
          console.error('Failed to load data:', error);
          showError('Failed to load required data');
        } finally {
          setLoadingModeExercices(false);
          setLoadingActes(false);
        }
      }
    };

    loadData();
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
        acteIds: consultationType.actes
          ? consultationType.actes.map((a) => a.acte?.id)
          : [],
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
        acteIds: [],
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

    if (!formData.modeExerciceId) {
      newErrors.modeExerciceId = 'Mode exercice is required';
    }

    // Note: acteIds validation is optional, assuming a consultation type might have no actes initially,
    // but usually it should have at least one. For now keeping it optional or adding if needed.
    // if (formData.acteIds.length === 0) {
    //   newErrors.acteIds = 'At least one acte is required';
    // }

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
        acteIds: formData.acteIds,
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

  const handleActeToggle = (acteId) => {
    setFormData((prev) => {
      const currentIds = prev.acteIds;
      if (currentIds.includes(acteId)) {
        return { ...prev, acteIds: currentIds.filter((id) => id !== acteId) };
      } else {
        return { ...prev, acteIds: [...currentIds, acteId] };
      }
    });
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
              disabled={isLoading}
              className='h-10 w-full p-1 cursor-pointer'
            />

            <FormSelect
              required
              label="Mode d'exercice"
              error={errors.modeExerciceId}
              value={formData.modeExerciceId}
              onChange={(e) =>
                handleInputChange('modeExerciceId', e.target.value)
              }
              options={modeExercices.map((me) => ({
                value: me.id,
                label: me.name,
              }))}
              placeholder="Sélectionner un mode d'exercice"
              disabled={isLoading || loadingModeExercices || isEditing}
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

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Associated Actes</label>
            <div className='border rounded-md p-4 max-h-60 overflow-y-auto space-y-2'>
              {loadingActes ? (
                <div className='text-center text-gray-500 py-4'>
                  Loading actes...
                </div>
              ) : actes.length === 0 ? (
                <div className='text-center text-gray-500 py-4'>
                  No actes available. Please create actes first.
                </div>
              ) : (
                actes.map((acte) => (
                  <div key={acte.id} className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id={`acte-${acte.id}`}
                      checked={formData.acteIds.includes(acte.id)}
                      onChange={() => handleActeToggle(acte.id)}
                      className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                    <label
                      htmlFor={`acte-${acte.id}`}
                      className='text-sm text-gray-700 flex items-center gap-2 cursor-pointer select-none'
                    >
                      <span
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: acte.color }}
                      ></span>
                      {acte.name} ({acte.duration} min - {acte.regularPrice}€)
                    </label>
                  </div>
                ))
              )}
            </div>
            {errors.acteIds && (
              <p className='text-sm text-red-500'>{errors.acteIds}</p>
            )}
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
