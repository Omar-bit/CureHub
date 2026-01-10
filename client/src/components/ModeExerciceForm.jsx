import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalFooter } from './ui/modal';
import { FormInput } from './ui/form-field';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { modeExerciceAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';
import { BookOpen, ChevronDown } from 'lucide-react';

const ModeExerciceForm = ({
  isOpen,
  onClose,
  modeExercice = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    nomDesPlages: false,
    color: '#3B82F6',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!modeExercice;

  // Initialize form data when editing
  useEffect(() => {
    if (modeExercice) {
      setFormData({
        name: modeExercice.name || '',
        nomDesPlages: modeExercice.nomDesPlages ?? false,
        color: modeExercice.color || '#3B82F6',
        description: modeExercice.description || '',
      });
    } else {
      // Reset form for new mode exercice
      setFormData({
        name: '',
        nomDesPlages: false,
        color: '#3B82F6',
        description: '',
      });
    }
    setErrors({});
  }, [modeExercice, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Mode d\'exercice is required';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Color is required';
    } else if (!/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = 'Please enter a valid hex color (e.g., #3B82F6)';
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
        nomDesPlages: formData.nomDesPlages,
        color: formData.color.trim(),
        description: formData.description.trim() || undefined,
      };

      if (isEditing) {
        await modeExerciceAPI.update(modeExercice.id, submitData);
        showSuccess('Mode d\'exercice mis à jour avec succès');
      } else {
        await modeExerciceAPI.create(submitData);
        showSuccess('Mode d\'exercice créé avec succès');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving mode exercice:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Erreur lors de la sauvegarde. Veuillez réessayer.');
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
      title={isEditing ? 'Modifier Mode d\'exercice' : 'Ajouter Mode d\'exercice'}
      size='lg'
      closeOnBackdropClick={!isLoading}
    >
      <ModalContent>
        {/* Breadcrumbs */}
        <div className='mb-4 flex items-center text-sm text-gray-600'>
          <button
            type='button'
            onClick={handleClose}
            className='hover:text-gray-900 transition-colors'
          >
            ← Types de Consultations
          </button>
          <span className='mx-2'>/</span>
          <span className='text-gray-900 font-medium'>
            {isEditing ? 'Modifier' : 'Ajouter'}
          </span>
        </div>

        {/* Title with icon */}
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center'>
            <BookOpen className='h-5 w-5 text-amber-600' />
          </div>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>Mode d'exercice</h2>
            <p className='text-sm text-gray-600 mt-1'>
              Dr Nicole David | Cabinet médical du Dr DAVID
            </p>
          </div>
          <div className='ml-auto'>
            <span className='px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium'>
              Création
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Mode d'exercice field */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Mode d'exercice *
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Entrez le mode d'exercice"
              disabled={isLoading}
            />
            {errors.name && (
              <p className='mt-1 text-sm text-red-600'>{errors.name}</p>
            )}
          </div>

          {/* Nom des plages with toggle */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='block text-sm font-medium text-gray-700'>
                Nom des plages
              </label>
              <Switch
                checked={formData.nomDesPlages}
                onCheckedChange={(checked) =>
                  handleInputChange('nomDesPlages', checked)
                }
                disabled={isLoading}
              />
            </div>
            {formData.nomDesPlages && (
              <div className='mt-3'>
                <div className='relative'>
                  <input
                    type='text'
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Description succinte'
                    disabled={isLoading}
                  />
                  <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                    <ChevronDown className='h-4 w-4 text-gray-400' />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Color picker */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Couleur
            </label>
            <div className='flex items-center gap-3'>
              <input
                type='color'
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className='h-10 w-20 border border-gray-300 rounded-lg cursor-pointer'
                disabled={isLoading}
              />
              <input
                type='text'
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.color ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='#3B82F6'
                disabled={isLoading}
              />
            </div>
            {errors.color && (
              <p className='mt-1 text-sm text-red-600'>{errors.color}</p>
            )}
          </div>
        </form>
      </ModalContent>

      <ModalFooter>
        <div className='flex justify-end space-x-3'>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type='submit'
            loading={isLoading}
            disabled={isLoading}
            onClick={handleSubmit}
            className='bg-purple-600 hover:bg-purple-700 text-white'
          >
            Enregistrer
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default ModeExerciceForm;

