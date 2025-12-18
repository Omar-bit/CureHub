import React, { useState, useEffect } from 'react';
import { SheetContent, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { FormInput, FormSelect, FormTextarea } from './ui/form-field';
import { Alert } from './ui/alert';
import { ConfirmDialog } from './ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import {
  splitPatientName,
  buildPatientName,
  getPatientDisplayName,
} from '../lib/patient';
import { ChevronDown, ChevronRight, Ban, Trash2, Unlock } from 'lucide-react';

// Phone list options
const PHONE_LIST_OPTIONS = [
  // { value: '', label: 'Aucune liste' },
  { value: 'contact_24h', label: 'Contacter 24h/24' },
  { value: 'contact_priority', label: 'Contacter Prioritaires' },
  { value: 'health_professionals', label: 'Professionnels de santé' },
  { value: 'assisted_appointment', label: 'RDV assistés' },
  { value: 'blocked_numbers', label: 'Numéros bloqués' },
];

// Accordion Section Component
const AccordionSection = ({
  title,
  isOpen,
  onToggle,
  children,
  showSaveButton,
  isLoading,
  isEditMode,
}) => {
  return (
    <div className='border border-gray-200 rounded-lg overflow-hidden'>
      <button
        type='button'
        onClick={onToggle}
        className='w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors'
      >
        <span className='text-sm font-medium text-gray-700'>{title}</span>
        {isOpen ? (
          <ChevronDown className='w-4 h-4 text-gray-500' />
        ) : (
          <ChevronRight className='w-4 h-4 text-gray-500' />
        )}
      </button>
      {isOpen && (
        <div className='p-4 space-y-4'>
          {children}
          {showSaveButton && (
            <div className='pt-4 border-t'>
              <Button
                type='submit'
                loading={isLoading}
                disabled={isLoading}
                className='w-full bg-purple-600 hover:bg-purple-700'
              >
                {isEditMode ? 'Modifier' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PatientFormSheet = ({
  patient,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onBlock,
  inline = false,
}) => {
  // initial parsing is done when the sheet opens (see useEffect)

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    dateOfBirth: '',
    gender: 'MALE',
    email: '',
    mobilePhone: '',
    mobilePhoneList: '',
    landlinePhone: '',
    landlinePhoneList: '',
    address: '',
    postalCode: '',
    city: '',
    showProvisionalCode: false,
    profileImage: '',
    dejaVu: false,
    absenceCount: 0,
    divers: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [openSection, setOpenSection] = useState(null); // null = all closed, or section name
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleSection = (sectionName) => {
    setOpenSection(openSection === sectionName ? null : sectionName);
  };

  useEffect(() => {
    if (patient) {
      // Determine if this is a full patient object or just pre-filled names
      const isFullPatient = patient.name !== undefined;

      let firstName = '';
      let lastName = '';

      if (isFullPatient) {
        // Full patient object -> use helper to parse
        const parsed = splitPatientName(patient.name);
        firstName = parsed.firstName || '';
        lastName = parsed.lastName || '';
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
        mobilePhoneList: (isFullPatient && patient.mobilePhoneList) || '',
        landlinePhone: (isFullPatient && patient.landlinePhone) || '',
        landlinePhoneList: (isFullPatient && patient.landlinePhoneList) || '',
        address: (isFullPatient && patient.address) || '',
        postalCode: (isFullPatient && patient.postalCode) || '',
        city: (isFullPatient && patient.city) || '',
        showProvisionalCode: false,
        profileImage: (isFullPatient && patient.profileImage) || '',
        dejaVu: (isFullPatient && patient.dejaVu > 0) || false,
        absenceCount: (isFullPatient && patient.absenceCount) || 0,
        divers: (isFullPatient && patient.divers) || '',
      });
    } else {
      setFormData({
        lastName: '',
        firstName: '',
        dateOfBirth: '',
        gender: 'MALE',
        email: '',
        mobilePhone: '',
        mobilePhoneList: '',
        landlinePhone: '',
        landlinePhoneList: '',
        address: '',
        postalCode: '',
        city: '',
        showProvisionalCode: false,
        profileImage: '',
        dejaVu: false,
        absenceCount: 0,
        divers: '',
      });
    }
    setErrors({});
    setOpenSection(null); // Reset accordion state when sheet opens
  }, [patient, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        // Combine first and last name for backend compatibility
        name: buildPatientName(formData.firstName, formData.lastName),
        phoneNumber: formData.mobilePhone, // Map to existing backend field
        // Convert dejaVu boolean to integer (1 = seen, 0 = not seen)
        dejaVu: formData.dejaVu ? 1 : 0,
      };

      // Remove empty fields and form-specific fields
      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === '' ||
          [
            'firstName',
            'lastName',
            'mobilePhone',
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

  // Format phone number as XX.XX.XX.XX.XX
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    // Format with dots every 2 digits
    const formatted = limitedDigits.replace(/(\d{2})(?=\d)/g, '$1.');
    return formatted;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatPhoneNumber(value);
    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  if (!isOpen) return null;

  // Determine title based on patient type
  const isEditMode = patient && patient.name !== undefined;
  const sheetTitle = isEditMode ? 'Modifier Patient' : 'Nouveau patient';

  const formContent = (
    <>
      <form onSubmit={handleSubmit} className='space-y-3'>
        {errors.general && (
          <Alert variant='destructive'>{errors.general}</Alert>
        )}

        {/* Identity Section */}
        <AccordionSection
          title='Identité'
          isOpen={openSection === 'identity'}
          onToggle={() => toggleSection('identity')}
          showSaveButton={isEditMode}
          isLoading={isLoading}
          isEditMode={isEditMode}
        >
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
        </AccordionSection>

        {/* Coordinates Section */}
        <AccordionSection
          title='Coordonnées'
          isOpen={openSection === 'coordinates'}
          onToggle={() => toggleSection('coordinates')}
          showSaveButton={isEditMode}
          isLoading={isLoading}
          isEditMode={isEditMode}
        >
          <FormInput
            label='Email'
            name='email'
            type='email'
            value={formData.email}
            onChange={handleChange}
            placeholder='Adresse email'
            error={errors.email}
          />
          {/* Mobile Phone with List Dropdown */}
          <div className='flex items-start gap-2'>
            <div className='flex-1'>
              <FormInput
                label='Tél. port.'
                name='mobilePhone'
                type='tel'
                value={formData.mobilePhone}
                onChange={handlePhoneChange}
                placeholder='06.12.34.56.78'
                error={errors.mobilePhone}
              />
            </div>
            <div className='pt-6'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-10 px-3 text-sm whitespace-nowrap'
                  >
                    {PHONE_LIST_OPTIONS.find(
                      (o) => o.value === formData.mobilePhoneList
                    )?.label || 'Ajouter à une liste'}
                    <ChevronDown className='ml-2 h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>Liste</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={formData.mobilePhoneList}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        mobilePhoneList: value,
                      }))
                    }
                  >
                    {PHONE_LIST_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Landline Phone with List Dropdown */}
          <div className='flex items-start gap-2'>
            <div className='flex-1'>
              <FormInput
                label='Tél. fixe'
                name='landlinePhone'
                type='tel'
                value={formData.landlinePhone}
                onChange={handlePhoneChange}
                placeholder='01.23.45.67.89'
                error={errors.landlinePhone}
              />
            </div>
            <div className='pt-6'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-10 px-3 text-sm whitespace-nowrap'
                  >
                    {PHONE_LIST_OPTIONS.find(
                      (o) => o.value === formData.landlinePhoneList
                    )?.label || 'Ajouter à une liste'}
                    <ChevronDown className='ml-2 h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>Liste</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={formData.landlinePhoneList}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        landlinePhoneList: value,
                      }))
                    }
                  >
                    {PHONE_LIST_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <FormInput
            label='Adresse'
            name='address'
            value={formData.address}
            onChange={handleChange}
            placeholder='Adresse'
            error={errors.address}
          />
          <div className='grid grid-cols-2 gap-3'>
            <FormInput
              label='Code postal'
              name='postalCode'
              value={formData.postalCode}
              onChange={handleChange}
              placeholder='Code postal'
              error={errors.postalCode}
            />

            <FormInput
              label='Ville'
              name='city'
              value={formData.city}
              onChange={handleChange}
              placeholder='Ville'
              error={errors.city}
            />
          </div>
          <FormTextarea
            label='Divers'
            name='divers'
            value={formData.divers}
            onChange={handleChange}
            placeholder='ex: code porte, n° infirmerie'
            rows={3}
            error={errors.divers}
          />
        </AccordionSection>

        {/* Information Section */}
        <AccordionSection
          title='Information'
          isOpen={openSection === 'information'}
          onToggle={() => toggleSection('information')}
          showSaveButton={isEditMode}
          isLoading={isLoading}
          isEditMode={isEditMode}
        >
          {/* Déjà vu Radio Buttons */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Déjà vu</label>
            <div className='flex space-x-6'>
              <label className='flex items-center space-x-2'>
                <input
                  type='radio'
                  name='dejaVu'
                  value='true'
                  checked={formData.dejaVu === true}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, dejaVu: true }))
                  }
                  className='w-4 h-4 text-blue-600'
                />
                <span className='text-sm text-gray-700'>Oui</span>
              </label>
              <label className='flex items-center space-x-2'>
                <input
                  type='radio'
                  name='dejaVu'
                  value='false'
                  checked={formData.dejaVu === false}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, dejaVu: false }))
                  }
                  className='w-4 h-4 text-blue-600'
                />
                <span className='text-sm text-gray-700'>Non</span>
              </label>
            </div>
          </div>

          <FormInput
            label='Absence'
            name='absenceCount'
            type='number'
            min='0'
            value={formData.absenceCount}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                absenceCount: parseInt(e.target.value) || 0,
              }))
            }
            placeholder="Nombre d'absences"
            error={errors.absenceCount}
          />
        </AccordionSection>

        {/* Block/Delete Section - Only show in edit mode */}
        {isEditMode && (
          <AccordionSection
            title='Bloquer/Supprimer'
            isOpen={openSection === 'danger'}
            onToggle={() => toggleSection('danger')}
            showSaveButton={false}
            isLoading={isLoading}
            isEditMode={isEditMode}
          >
            <div className='space-y-4'>
              <p className='text-sm text-gray-600'>
                Actions de gestion du patient. Ces actions peuvent avoir des
                conséquences importantes.
              </p>

              <div className='space-y-3'>
                <Button
                  type='button'
                  variant='outline'
                  className={`w-full ${
                    patient?.isBlocked
                      ? 'border-green-500 text-green-600 hover:bg-green-50'
                      : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setShowBlockConfirm(true)}
                >
                  {patient?.isBlocked
                    ? 'Débloquer le patient'
                    : 'Bloquer le patient'}
                </Button>

                <Button
                  type='button'
                  variant='destructive'
                  className='w-full'
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer le patient
                </Button>
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Single Save Button for Create Mode */}
        {!isEditMode && (
          <div className='pt-4'>
            <Button
              type='submit'
              loading={isLoading}
              disabled={isLoading}
              className='w-full bg-purple-600 hover:bg-purple-700'
            >
              Enregistrer
            </Button>
          </div>
        )}
      </form>

      {/* Block Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={() => {
          setShowBlockConfirm(false);
          if (onBlock) {
            onBlock(patient);
          }
        }}
        title={
          patient?.isBlocked ? 'Débloquer le patient' : 'Bloquer le patient'
        }
        description={
          patient?.isBlocked
            ? `Êtes-vous sûr de vouloir débloquer ${
                getPatientDisplayName(patient) || 'ce patient'
              } ? Le patient pourra à nouveau prendre des rendez-vous.`
            : `Êtes-vous sûr de vouloir bloquer ${
                getPatientDisplayName(patient) || 'ce patient'
              } ? Le patient ne pourra plus prendre de rendez-vous.`
        }
        confirmText={patient?.isBlocked ? 'Débloquer' : 'Bloquer'}
        cancelText='Annuler'
        variant={patient?.isBlocked ? 'default' : 'warning'}
        icon={patient?.isBlocked ? Unlock : Ban}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          if (onDelete) {
            onDelete(patient);
          }
        }}
        title='Supprimer le patient'
        description={`Êtes-vous sûr de vouloir supprimer ${
          getPatientDisplayName(patient) || 'ce patient'
        } ? Cette action est irréversible.`}
        confirmText='Supprimer'
        cancelText='Annuler'
        variant='destructive'
        icon={Trash2}
      />
    </>
  );

  // If inline mode, return form content directly without SheetContent wrapper
  if (inline) {
    return formContent;
  }

  return (
    <SheetContent title={sheetTitle} onClose={onClose}>
      {formContent}
    </SheetContent>
  );
};

export default PatientFormSheet;
