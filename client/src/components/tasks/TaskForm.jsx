import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { User, X, Search, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PatientFormSheet from '../PatientFormSheet';
import { patientAPI } from '../../services/api';
import { splitPatientName } from '../../lib/patient';

const priorityLabels = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

const categoryLabels = {
  RENDEZ_VOUS: 'Rendez-vous',
  DOCUMENTS: 'Documents',
  CONTACTER: 'Contacter',
  PAIEMENTS: 'Paiements',
  AUTRE: 'Autre',
};

const TaskForm = ({
  task = null,
  patients = [],
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false,
  readOnlyPatients = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'MEDIUM',
    category: 'AUTRE',
  });

  const [errors, setErrors] = useState({});
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [availablePatients, setAvailablePatients] = useState(patients);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showPatientFormSheet, setShowPatientFormSheet] = useState(false);
  const [prefilledPatientName, setPrefilledPatientName] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setAvailablePatients(patients);
  }, [patients]);

  // Initialize form data when task prop changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        deadline: task.deadline
          ? format(new Date(task.deadline), 'yyyy-MM-dd')
          : '',
        priority: task.priority || 'MEDIUM',
        category: task.category || 'AUTRE',
      });
      setSelectedPatients((task.patients || []).filter(Boolean));
      setPatientSearch('');
      setIsCompleted(task.completed || false);
    } else {
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'MEDIUM',
        category: 'AUTRE',
      });
      // Auto-select patients if readOnlyPatients is true
      setSelectedPatients(
        readOnlyPatients && patients.length > 0 ? patients : []
      );
      setPatientSearch('');
      setIsCompleted(false);
    }
    setErrors({});
  }, [task, readOnlyPatients, patients]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handlePatientSearch = (e) => {
    const value = e.target.value;
    setPatientSearch(value);
    setShowPatientDropdown(true);
  };

  const handlePatientSelect = (patient) => {
    if (selectedPatients.find((p) => p.id === patient.id)) {
      setPatientSearch('');
      setShowPatientDropdown(false);
      return;
    }
    setSelectedPatients((prev) => [...prev, patient]);
    setPatientSearch('');
    setShowPatientDropdown(false);
  };

  const handleCreateNewPatient = () => {
    const searchText = patientSearch.trim();
    const nameParts = searchText.split(' ').filter((part) => part.length > 0);

    setPrefilledPatientName({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
    });
    setShowPatientFormSheet(true);
    setShowPatientDropdown(false);
  };

  const handlePatientSaved = async (patientData) => {
    try {
      const newPatient = await patientAPI.create(patientData);

      // Add and select the newly created patient
      setAvailablePatients((prev) => [...prev, newPatient]);
      setSelectedPatients((prev) => [...prev, newPatient]);
      setPatientSearch('');

      setShowPatientFormSheet(false);
      setPrefilledPatientName(null);

      return newPatient;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  };

  const renderPatientLabel = (patient) => {
    if (!patient) return '';
    if (patient.name) {
      const { firstName, lastName } = splitPatientName(patient.name);
      const full = `${firstName} ${lastName}`.trim();
      if (full) return full;
    }
    return (
      `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
      patient.name ||
      ''
    );
  };

  // Filter patients based on search
  const filteredPatients = availablePatients.filter((patient) => {
    const label = renderPatientLabel(patient).toLowerCase();
    return (
      label.includes(patientSearch.toLowerCase()) &&
      !selectedPatients.some((p) => p.id === patient.id)
    );
  });

  const removePatient = (patientId) => {
    setSelectedPatients((prev) =>
      prev.filter((patient) => patient.id !== patientId)
    );
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation is now optional - will auto-fill from patient name if empty

    if (
      formData.deadline &&
      new Date(formData.deadline) < new Date().setHours(0, 0, 0, 0)
    ) {
      newErrors.deadline = "La date d'échéance ne peut pas être dans le passé";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Auto-fill title with patient name if title is empty
    let finalTitle = formData.title.trim();
    if (!finalTitle && selectedPatients.length > 0) {
      finalTitle = selectedPatients
        .map((patient) => renderPatientLabel(patient))
        .join(', ');
    }

    const submitData = {
      title: finalTitle || formData.title,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      deadline: formData.deadline || null,
      patientIds: selectedPatients.map((patient) => patient.id),
      completed: isCompleted,
    };

    onSubmit(submitData);
  };

  return (
    <>
      <Card className='w-full h-full bg-orange-50 border-orange-200'>
        <div className='flex items-center justify-between p-6 border-b border-orange-200'>
          <h2 className='text-lg font-semibold text-orange-900'>
            {task ? 'Modifier cette tâche' : 'Nouvelle tâche'}
          </h2>
          <Button
            variant='ghost'
            size='sm'
            onClick={onCancel}
            className='text-orange-700 hover:text-orange-900 hover:bg-orange-100'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {/* Title */}
          <div>
            <Input
              id='title'
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder='Entrez le titre de la tâche...'
              className={`rounded-full bg-white border-orange-200 focus:border-orange-500 focus:ring-orange-500 ${
                errors.title ? 'border-red-500' : ''
              }`}
            />
            {errors.title && (
              <p className='text-sm text-red-600 mt-1'>{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label
              htmlFor='description'
              className='text-orange-800 font-medium'
            >
              Détail
            </Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder='Décrivez la tâche...'
              rows='3'
              className='bg-white border-orange-200 focus:border-orange-500 focus:ring-orange-500 resize-none'
            />
          </div>

          {/* Deadline and Patient Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='deadline' className='text-orange-800 font-medium'>
                À faire le
              </Label>
              <Input
                id='deadline'
                type='date'
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className={`bg-white border-orange-200 focus:border-orange-500 focus:ring-orange-500 ${
                  errors.deadline ? 'border-red-500' : ''
                }`}
              />
              {errors.deadline && (
                <p className='text-sm text-red-600 mt-1'>{errors.deadline}</p>
              )}
            </div>

            <div className='relative'>
              <Label htmlFor='patient' className='text-orange-800 font-medium'>
                Patients
              </Label>

              {/* Search Input */}
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  value={patientSearch}
                  onChange={handlePatientSearch}
                  onFocus={() => setShowPatientDropdown(true)}
                  disabled={readOnlyPatients}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg bg-white border-orange-200 focus:border-orange-500 focus:ring-orange-500 ${
                    readOnlyPatients ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  placeholder={
                    readOnlyPatients
                      ? 'Patient sélectionné'
                      : 'Rechercher un patient...'
                  }
                />
              </div>

              {selectedPatients.length > 0 ? (
                <div className='mt-3 flex flex-wrap gap-2'>
                  {selectedPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className='inline-flex items-center space-x-2 bg-white border border-orange-200 rounded-full px-3 py-1 shadow-sm'
                    >
                      <User className='h-4 w-4 text-orange-600' />
                      <span className='text-sm font-medium text-orange-900'>
                        {renderPatientLabel(patient)}
                      </span>
                      {!readOnlyPatients && (
                        <button
                          type='button'
                          onClick={() => removePatient(patient.id)}
                          className='text-orange-600 hover:text-orange-800 focus:outline-none'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='mt-2 text-xs text-orange-600'>
                  Laissez vide pour créer une tâche sans patient.
                </p>
              )}

              {/* Patient Dropdown */}
              {showPatientDropdown && !readOnlyPatients && (
                <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                  {/* Header */}
                  <div className='p-3 border-b border-gray-200 bg-gray-50'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-600'>
                        PATIENTS
                      </span>
                      <button
                        type='button'
                        onClick={handleCreateNewPatient}
                        className='flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors'
                      >
                        <UserPlus className='h-4 w-4' />
                        <span>Nouveau patient</span>
                      </button>
                    </div>
                  </div>

                  {/* Patient List */}
                  <div className='max-h-48 overflow-y-auto'>
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => handlePatientSelect(patient)}
                          className='p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0'
                        >
                          <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                              <User className='h-5 w-5 text-gray-500' />
                            </div>
                            <div className='flex-1'>
                              <h4 className='font-medium text-gray-900'>
                                {renderPatientLabel(patient)}
                              </h4>
                              <p className='text-sm text-gray-500'>
                                {patient.dateOfBirth &&
                                  `Née le ${format(
                                    new Date(patient.dateOfBirth),
                                    'dd/MM/yyyy'
                                  )}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='p-4 text-center text-gray-500'>
                        <p>Aucun patient trouvé</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Click outside handler */}
              {showPatientDropdown && (
                <div
                  className='fixed inset-0 z-0'
                  onClick={() => setShowPatientDropdown(false)}
                />
              )}
            </div>
          </div>

          {/* Category Buttons */}
          <div className='space-y-2'>
            <Label className='text-orange-800 font-medium'>Catégorie</Label>
            <div className='flex flex-wrap gap-2'>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <Button
                  key={value}
                  type='button'
                  variant={formData.category === value ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handleInputChange('category', value)}
                  className={`rounded-full ${
                    formData.category === value
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'border-orange-300 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Priority Buttons */}
          <div className='space-y-2'>
            <Label className='text-orange-800 font-medium'>Priorité</Label>
            <div className='flex flex-wrap gap-2'>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <Button
                  key={value}
                  type='button'
                  variant={formData.priority === value ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handleInputChange('priority', value)}
                  className={`rounded-full ${
                    formData.priority === value
                      ? value === 'URGENT'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : value === 'HIGH'
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : value === 'MEDIUM'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                      : 'border-orange-300 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Task Completion Toggle */}
          {task && (
            <div className='flex items-center justify-between p-4 bg-orange-500 rounded-full text-white'>
              <span className='font-medium'>Tâche accomplie</span>
              <div className='flex items-center'>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={isCompleted}
                    onChange={(e) => setIsCompleted(e.target.checked)}
                    className='sr-only'
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      isCompleted ? 'bg-green-400' : 'bg-white bg-opacity-30'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ease-in-out ${
                        isCompleted ? 'translate-x-5' : 'translate-x-1'
                      } mt-1`}
                    ></div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-between pt-4 space-x-3'>
            {task ? (
              <>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onDelete && onDelete(task.id)}
                  disabled={isLoading}
                  className='flex-1 border-red-300 text-red-700 hover:bg-red-50'
                >
                  Supprimer
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={onCancel}
                  disabled={isLoading}
                  className='flex-1 border-orange-300 text-orange-700 hover:bg-orange-100'
                >
                  Annuler
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading}
                  className='flex-1 bg-orange-500 hover:bg-orange-600 text-white'
                >
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type='button'
                  variant='outline'
                  onClick={onCancel}
                  disabled={isLoading}
                  className='flex-1 border-orange-300 text-orange-700 hover:bg-orange-100'
                >
                  Annuler
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading}
                  className='flex-1 bg-orange-500 hover:bg-orange-600 text-white'
                >
                  {isLoading ? 'Enregistrement...' : 'Créer'}
                </Button>
              </>
            )}
          </div>
        </form>
      </Card>

      {/* Patient Form Sheet */}
      {showPatientFormSheet && (
        <PatientFormSheet
          patient={prefilledPatientName}
          isOpen={showPatientFormSheet}
          onClose={() => {
            setShowPatientFormSheet(false);
            setPrefilledPatientName(null);
          }}
          onSave={handlePatientSaved}
        />
      )}
    </>
  );
};

export default TaskForm;
