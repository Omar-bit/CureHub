import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalFooter } from '../ui/modal';
import { FormInput, FormSelect, FormTextarea } from '../ui/form-field';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import {
  FileText,
  Clock,
  Users,
  Calendar,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { consultationTypesAPI, acteAPI } from '../../services/api';
import { showSuccess, showError } from '../../lib/toast';

const ELIGIBILITY_OPTIONS = [
  { value: 'ALL', label: 'Tout le monde' },
  { value: 'KNOWN', label: 'Déjà venus' },
  { value: 'NEW', label: 'Nouveaux patients' },
];

const REMINDER_OPTIONS = [
  { value: 'STANDARD', label: 'Date + Heure + Adresse' },
  { value: 'CUSTOM', label: 'Personnalisé' },
];

const ActeForm = ({ isOpen, onClose, acte = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    displayedElsewhere: '',
    color: '#00ddff',
    regularPrice: '',
    duration: '15',
    placementDuration: '', // "Venir à plusieurs"
    minReservationGap: '', // "Réserver entre X"
    stopUntilNextAppt: '', // "et Y"
    eligibilityRule: 'ALL',
    blockReservationAfter: '',
    canals: ['INTERNET', 'TELEPHONE'],
    instructions: '',
    reminderType: 'STANDARD',
    reminderMessage: 'Apportez votre carte vitale',
    notifyConfirmation: true,
    notifyReminder: true,
    consultationTypeIds: [],
    enabled: true,
  });

  const [consultationTypes, setConsultationTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadConsultationTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (acte) {
      setFormData({
        name: acte.name || '',
        displayedElsewhere: acte.displayedElsewhere || '',
        color: acte.color || '#00ddff',
        regularPrice: acte.regularPrice || '',
        duration: acte.duration?.toString() || '15',
        placementDuration: acte.placementDuration?.toString() || '',
        minReservationGap: acte.minReservationGap?.toString() || '',
        stopUntilNextAppt: acte.stopUntilNextAppt?.toString() || '',
        eligibilityRule: acte.eligibilityRule || 'ALL',
        blockReservationAfter: acte.blockReservationAfter?.toString() || '',
        canals: acte.canals
          ? Array.isArray(acte.canals)
            ? acte.canals
            : JSON.parse(acte.canals)
          : ['INTERNET', 'TELEPHONE'],
        instructions: acte.instructions || '',
        reminderType: acte.reminderType || 'STANDARD',
        reminderMessage: acte.reminderMessage || 'Apportez votre carte vitale',
        notifyConfirmation: acte.notifyConfirmation !== false,
        notifyReminder: acte.notifyReminder !== false,
        consultationTypeIds: acte.consultationTypes
          ? acte.consultationTypes.map((ct) => ct.consultationTypeId || ct.id)
          : [],
        enabled: acte.enabled !== false,
      });
    } else {
      // Reset form
      setFormData({
        name: '',
        displayedElsewhere: '',
        color: '#00ddff',
        regularPrice: '',
        duration: '15',
        placementDuration: '',
        minReservationGap: '',
        stopUntilNextAppt: '',
        eligibilityRule: 'ALL',
        blockReservationAfter: '',
        canals: ['INTERNET', 'TELEPHONE'],
        instructions: '',
        reminderType: 'STANDARD',
        reminderMessage: 'Apportez votre carte vitale',
        notifyConfirmation: true,
        notifyReminder: true,
        consultationTypeIds: [],
        enabled: true,
      });
    }
    setErrors({});
  }, [acte, isOpen]);

  const loadConsultationTypes = async () => {
    try {
      setLoadingTypes(true);
      const types = await consultationTypesAPI.getAll();
      setConsultationTypes(types);
    } catch (error) {
      console.error('Failed to load consultation types', error);
      showError('Failed to load consultation types');
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCheckboxGroupChange = (field, value, checked) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      if (checked) {
        return { ...prev, [field]: [...current, value] };
      } else {
        return { ...prev, [field]: current.filter((item) => item !== value) };
      }
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        regularPrice: formData.regularPrice
          ? parseFloat(formData.regularPrice)
          : undefined,
        duration: parseInt(formData.duration),
        placementDuration: formData.placementDuration
          ? parseInt(formData.placementDuration)
          : 0,
        minReservationGap: formData.minReservationGap
          ? parseInt(formData.minReservationGap)
          : 0,
        stopUntilNextAppt: formData.stopUntilNextAppt
          ? parseInt(formData.stopUntilNextAppt)
          : 0,
        blockReservationAfter: formData.blockReservationAfter
          ? parseInt(formData.blockReservationAfter)
          : undefined,
        // canals is already array
      };

      if (acte) {
        await acteAPI.update(acte.id, payload);
        showSuccess('Acte updated successfully');
      } else {
        await acteAPI.create(payload);
        showSuccess('Acte created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving acte:', error);
      showError('Failed to save acte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={acte ? 'Acte Édition' : 'Nouvel Acte'}
      size='xl'
    >
      <ModalContent className='max-h-[80vh] overflow-y-auto'>
        <form
          id='acte-form'
          onSubmit={handleSubmit}
          className='space-y-8 p-1 max-h-[60vh]'
        >
          {/* Description */}
          <section className='space-y-4'>
            <h3 className='flex items-center text-sm font-semibold text-orange-500 uppercase tracking-wider'>
              <span className='bg-orange-100 p-1 rounded mr-2'>
                <FileText className='w-4 h-4' />
              </span>{' '}
              Description
            </h3>
            <div className='space-y-4 pl-8'>
              <FormInput
                label='Nom dans votre agenda'
                name='name'
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />
              <FormInput
                label='Nom affiché sur internet'
                name='displayedElsewhere'
                value={formData.displayedElsewhere}
                onChange={handleChange}
              />
              <div className='flex items-center space-x-2'>
                <Label>Pastille de couleur</Label>
                <input
                  type='color'
                  name='color'
                  value={formData.color}
                  onChange={handleChange}
                  className='h-8 w-16 p-0 border-0 rounded cursor-pointer'
                />
                <span className='text-sm text-gray-500'>{formData.color}</span>
              </div>
              <FormInput
                label='Tarif habituel'
                name='regularPrice'
                type='number'
                value={formData.regularPrice}
                onChange={handleChange}
                placeholder='Ex: 30.00'
                step='0.01'
              />
            </div>
          </section>

          {/* Durées */}
          <section className='space-y-4'>
            <h3 className='flex items-center text-sm font-semibold text-orange-500 uppercase tracking-wider'>
              <span className='bg-orange-100 p-1 rounded mr-2'>
                <Clock className='w-4 h-4' />
              </span>{' '}
              Durées
            </h3>
            <div className='space-y-4 pl-8'>
              <div className='flex items-center space-x-4'>
                <div className='flex-1'>
                  <FormInput
                    label='Durée / personne'
                    name='duration'
                    type='number'
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    error={errors.duration}
                  />
                </div>
                <span className='mt-6 text-sm text-gray-500'>minutes</span>
              </div>

              <div className='flex items-center space-x-4'>
                <div className='flex-1'>
                  <FormInput
                    label='Venir à plusieurs'
                    name='placementDuration'
                    type='number'
                    value={formData.placementDuration}
                    onChange={handleChange}
                  />
                </div>
                <span className='mt-6 text-sm text-gray-500'>
                  créneaux consécutifs max.
                </span>
              </div>

              <div className='flex items-center space-x-2'>
                <Label className='w-32'>Réserver entre</Label>
                <FormInput
                  name='minReservationGap'
                  type='number'
                  value={formData.minReservationGap}
                  onChange={handleChange}
                  className='w-24'
                  placeholder='2'
                />
                <span className='text-sm'>semaines et</span>
                <FormInput
                  name='stopUntilNextAppt'
                  type='number'
                  value={formData.stopUntilNextAppt}
                  onChange={handleChange}
                  className='w-24'
                  placeholder='3'
                />
                <span className='text-sm'>mois à l'avance</span>
              </div>
            </div>
          </section>

          {/* Patients éligibles */}
          <section className='space-y-4'>
            <h3 className='flex items-center text-sm font-semibold text-orange-500 uppercase tracking-wider'>
              <span className='bg-orange-100 p-1 rounded mr-2'>
                <Users className='w-4 h-4' />
              </span>{' '}
              Patients éligibles
            </h3>
            <div className='space-y-4 pl-8'>
              <FormSelect
                label='Qui peut réserver cet acte ?'
                name='eligibilityRule'
                value={formData.eligibilityRule}
                onChange={handleChange}
                options={ELIGIBILITY_OPTIONS}
              />
              <div className='flex items-center space-x-4'>
                <div className='flex-1'>
                  <FormInput
                    label='Bloquer la réservation après'
                    name='blockReservationAfter'
                    type='number'
                    value={formData.blockReservationAfter}
                    onChange={handleChange}
                  />
                </div>
                <span className='mt-6 text-sm text-gray-500'>absence(s)</span>
              </div>
            </div>
          </section>

          {/* Réservation */}
          <section className='space-y-4'>
            <h3 className='flex items-center text-sm font-semibold text-orange-500 uppercase tracking-wider'>
              <span className='bg-orange-100 p-1 rounded mr-2'>
                <Calendar className='w-4 h-4' />
              </span>{' '}
              Réservation
            </h3>
            <div className='space-y-4 pl-8'>
              <div className='space-y-2'>
                <Label>Sur vos plages</Label>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                  {loadingTypes ? (
                    <p className='text-sm text-gray-500'>Loading...</p>
                  ) : (
                    consultationTypes.map((type) => (
                      <div
                        key={type.id}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`ct-${type.id}`}
                          checked={formData.consultationTypeIds.includes(
                            type.id
                          )}
                          onCheckedChange={(checked) =>
                            handleCheckboxGroupChange(
                              'consultationTypeIds',
                              type.id,
                              checked
                            )
                          }
                        />
                        <label
                          htmlFor={`ct-${type.id}`}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                        >
                          {type.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Canaux ouverts</Label>
                <div className='flex space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='canal-internet'
                      checked={formData.canals.includes('INTERNET')}
                      onCheckedChange={(checked) =>
                        handleCheckboxGroupChange('canals', 'INTERNET', checked)
                      }
                    />
                    <label htmlFor='canal-internet' className='text-sm'>
                      par internet
                    </label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='canal-telephone'
                      checked={formData.canals.includes('TELEPHONE')}
                      onCheckedChange={(checked) =>
                        handleCheckboxGroupChange(
                          'canals',
                          'TELEPHONE',
                          checked
                        )
                      }
                    />
                    <label htmlFor='canal-telephone' className='text-sm'>
                      par téléphone
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Consignes */}
          <section className='space-y-4'>
            <h3 className='flex items-center text-sm font-semibold text-orange-500 uppercase tracking-wider'>
              <span className='bg-orange-100 p-1 rounded mr-2'>
                <MessageSquare className='w-4 h-4' />
              </span>{' '}
              Consignes
            </h3>
            <div className='pl-8'>
              <FormTextarea
                label='Donner une consigne au patient (sur internet)'
                name='instructions'
                value={formData.instructions}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Confirmation & rappel */}
          <section className='space-y-4'>
            <h3 className='flex items-center text-sm font-semibold text-orange-500 uppercase tracking-wider'>
              <span className='bg-orange-100 p-1 rounded mr-2'>
                <Bell className='w-4 h-4' />
              </span>{' '}
              Confirmation & rappel
            </h3>
            <div className='space-y-4 pl-8'>
              <FormSelect
                label='Informations de base'
                name='reminderType'
                value={formData.reminderType}
                onChange={handleChange}
                options={REMINDER_OPTIONS}
              />
              <FormInput
                label='Personnalisation du message'
                name='reminderMessage'
                value={formData.reminderMessage}
                onChange={handleChange}
              />

              <div className='space-y-2'>
                <Label>Notifications actives</Label>
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='notify-confirmation'
                      checked={formData.notifyConfirmation}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          notifyConfirmation: checked,
                        }))
                      }
                    />
                    <label htmlFor='notify-confirmation' className='text-sm'>
                      Confirmation du RDV - pris par vous
                    </label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='notify-reminder'
                      checked={formData.notifyReminder}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          notifyReminder: checked,
                        }))
                      }
                    />
                    <label htmlFor='notify-reminder' className='text-sm'>
                      Rappel du RDV
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </form>
      </ModalContent>
      <ModalFooter className='flex justify-between items-center bg-gray-50 p-4 rounded-b-lg'>
        <div className='text-xs text-gray-500'>
          Politique d'envoi des notifications
        </div>
        <div className='space-x-2'>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='bg-purple-600 hover:bg-purple-700 text-white'
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default ActeForm;
