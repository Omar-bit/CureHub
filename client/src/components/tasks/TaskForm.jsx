import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'MEDIUM',
    category: 'AUTRE',
    patientId: '',
  });

  const [errors, setErrors] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);

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
        patientId: task.patientId || '',
      });
      setSelectedPatient(task.patient || null);
    } else {
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'MEDIUM',
        category: 'AUTRE',
        patientId: '',
      });
      setSelectedPatient(null);
    }
    setErrors({});
  }, [task]);

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

  const handlePatientChange = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient || null);
    handleInputChange('patientId', patientId);
  };

  const removePatient = () => {
    setSelectedPatient(null);
    handleInputChange('patientId', '');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

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

    const submitData = {
      ...formData,
      deadline: formData.deadline || null,
      patientId: formData.patientId || null,
    };

    onSubmit(submitData);
  };

  return (
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
          <Label htmlFor='description' className='text-orange-800 font-medium'>
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

          <div>
            <Label htmlFor='patient' className='text-orange-800 font-medium'>
              Patient
            </Label>
            {selectedPatient ? (
              <div className='flex items-center justify-between p-3 border rounded-md bg-white border-orange-200'>
                <div className='flex items-center space-x-2'>
                  <User className='h-4 w-4 text-orange-600' />
                  <span className='text-sm font-medium text-orange-900'>
                    {selectedPatient.name}
                  </span>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={removePatient}
                  className='text-orange-600 hover:text-orange-800'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <Select
                value={formData.patientId}
                onChange={(e) => handlePatientChange(e.target.value)}
                className='bg-white border-orange-200 focus:border-orange-500 focus:ring-orange-500'
              >
                <option value=''>Sélectionner un patient (optionnel)</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </div>

        {/* Category Buttons */}
        <div className='space-y-2'>
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

        {/* Task Completion Toggle */}
        {task && (
          <div className='flex items-center justify-between p-4 bg-orange-500 rounded-full text-white'>
            <span className='font-medium'>Tâche accomplie</span>
            <div className='flex items-center'>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={task.completed || false}
                  onChange={() => {}}
                  className='sr-only'
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    task.completed ? 'bg-green-400' : 'bg-white bg-opacity-30'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ease-in-out ${
                      task.completed ? 'translate-x-5' : 'translate-x-1'
                    } mt-1`}
                  ></div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex justify-between pt-4 space-x-3'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1 border-orange-300 text-orange-700 hover:bg-orange-100'
          >
            Supprimer
          </Button>
          <Button
            type='submit'
            disabled={isLoading}
            className='flex-1 bg-orange-500 hover:bg-orange-600 text-white'
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TaskForm;
