import React, { useState, useEffect } from 'react';
import { format, parse, addMinutes } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  FileText,
  MapPin,
  CreditCard,
  X,
  Save,
} from 'lucide-react';

const AppointmentForm = ({
  appointment = null,
  isOpen = false,
  onClose,
  onSave,
  patients = [],
  consultationTypes = [],
  selectedDate = null,
  inline = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    patientId: '',
    consultationTypeId: '',
    description: '',
    location: '',
    status: 'SCHEDULED',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (appointment) {
      // Editing existing appointment
      const startDate = new Date(appointment.startTime);
      const endDate = new Date(appointment.endTime);

      setFormData({
        title: appointment.title || '',
        date: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        patientId: appointment.patientId || '',
        consultationTypeId: appointment.consultationTypeId || '',
        description: appointment.description || '',
        location: appointment.location || '',
        status: appointment.status || 'SCHEDULED',
      });
    } else if (selectedDate) {
      // Creating new appointment with selected date
      setFormData((prev) => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
      }));
    } else {
      // Reset form
      setFormData({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        patientId: '',
        consultationTypeId: '',
        description: '',
        location: '',
        status: 'SCHEDULED',
      });
    }
    setErrors({});
  }, [appointment, selectedDate, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Auto-calculate end time when consultation type changes
    if (name === 'consultationTypeId' && value) {
      const selectedType = consultationTypes.find(
        (type) => type.id === parseInt(value)
      );
      if (selectedType && formData.startTime) {
        const startDateTime = parse(formData.startTime, 'HH:mm', new Date());
        const endDateTime = addMinutes(startDateTime, selectedType.duration);
        setFormData((prev) => ({
          ...prev,
          endTime: format(endDateTime, 'HH:mm'),
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }

    if (!formData.consultationTypeId) {
      newErrors.consultationTypeId = 'Consultation type is required';
    }

    // Validate time logic
    if (formData.startTime && formData.endTime) {
      const start = parse(formData.startTime, 'HH:mm', new Date());
      const end = parse(formData.endTime, 'HH:mm', new Date());

      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    // Validate date is not in the past (only for new appointments)
    if (!appointment && formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = 'Cannot schedule appointments in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into ISO strings
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      const appointmentData = {
        title: formData.title.trim(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        patientId: parseInt(formData.patientId),
        consultationTypeId: parseInt(formData.consultationTypeId),
        description: formData.description.trim(),
        location: formData.location.trim(),
        status: formData.status,
      };

      await onSave(appointmentData);

      if (!inline) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      setErrors({ submit: 'Failed to save appointment. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(
    (p) => p.id === parseInt(formData.patientId)
  );
  const selectedConsultationType = consultationTypes.find(
    (ct) => ct.id === parseInt(formData.consultationTypeId)
  );

  const content = (
    <>
      {/* Header */}
      <div className='flex items-center justify-between p-6 border-b border-gray-200'>
        <h2 className='text-xl font-semibold text-gray-900'>
          {appointment ? 'Edit Appointment' : 'New Appointment'}
        </h2>
        {!inline && (
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='p-6'>
        <div className='space-y-6'>
          {/* Title */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <FileText className='h-4 w-4 inline mr-2' />
              Title *
            </label>
            <input
              type='text'
              name='title'
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='e.g., Regular Checkup'
            />
            {errors.title && (
              <p className='mt-1 text-sm text-red-600'>{errors.title}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Calendar className='h-4 w-4 inline mr-2' />
                Date *
              </label>
              <input
                type='date'
                name='date'
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className='mt-1 text-sm text-red-600'>{errors.date}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Clock className='h-4 w-4 inline mr-2' />
                Start Time *
              </label>
              <input
                type='time'
                name='startTime'
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className='mt-1 text-sm text-red-600'>{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Clock className='h-4 w-4 inline mr-2' />
                End Time *
              </label>
              <input
                type='time'
                name='endTime'
                value={formData.endTime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className='mt-1 text-sm text-red-600'>{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Patient */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <User className='h-4 w-4 inline mr-2' />
              Patient *
            </label>
            <select
              name='patientId'
              value={formData.patientId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.patientId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value=''>Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                  {patient.dateOfBirth && (
                    <span className='text-gray-500'>
                      {' '}
                      ({format(new Date(patient.dateOfBirth), 'yyyy-MM-dd')})
                    </span>
                  )}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className='mt-1 text-sm text-red-600'>{errors.patientId}</p>
            )}

            {selectedPatient && (
              <div className='mt-2 p-3 bg-gray-50 rounded-lg'>
                <p className='text-sm text-gray-600'>
                  <strong>Contact:</strong> {selectedPatient.phoneNumber} |{' '}
                  {selectedPatient.email}
                </p>
                {selectedPatient.address && (
                  <p className='text-sm text-gray-600'>
                    <strong>Address:</strong> {selectedPatient.address}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Consultation Type */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <CreditCard className='h-4 w-4 inline mr-2' />
              Consultation Type *
            </label>
            <select
              name='consultationTypeId'
              value={formData.consultationTypeId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.consultationTypeId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value=''>Select consultation type</option>
              {consultationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.duration} min) - ${type.price}
                </option>
              ))}
            </select>
            {errors.consultationTypeId && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.consultationTypeId}
              </p>
            )}

            {selectedConsultationType && (
              <div className='mt-2 p-3 bg-gray-50 rounded-lg'>
                <p className='text-sm text-gray-600'>
                  <strong>Duration:</strong> {selectedConsultationType.duration}{' '}
                  minutes
                </p>
                <p className='text-sm text-gray-600'>
                  <strong>Price:</strong> ${selectedConsultationType.price}
                </p>
                {selectedConsultationType.description && (
                  <p className='text-sm text-gray-600'>
                    <strong>Description:</strong>{' '}
                    {selectedConsultationType.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <MapPin className='h-4 w-4 inline mr-2' />
              Location
            </label>
            <input
              type='text'
              name='location'
              value={formData.location}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder="e.g., Clinic Room 1, Patient's Home, Online"
            />
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Description
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Additional notes or instructions...'
            />
          </div>

          {/* Status (only for editing) */}
          {appointment && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Status
              </label>
              <select
                name='status'
                value={formData.status}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='SCHEDULED'>Scheduled</option>
                <option value='CONFIRMED'>Confirmed</option>
                <option value='IN_PROGRESS'>In Progress</option>
                <option value='COMPLETED'>Completed</option>
                <option value='CANCELLED'>Cancelled</option>
                <option value='NO_SHOW'>No Show</option>
              </select>
            </div>
          )}

          {/* Error Messages */}
          {errors.submit && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-600'>{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
            {!inline && (
              <button
                type='button'
                onClick={onClose}
                disabled={loading}
                className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50'
              >
                Cancel
              </button>
            )}
            <button
              type='submit'
              disabled={loading}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              <Save className='h-4 w-4' />
              <span>
                {loading ? 'Saving...' : appointment ? 'Update' : 'Create'}{' '}
                Appointment
              </span>
            </button>
          </div>
        </div>
      </form>
    </>
  );

  if (inline) {
    return (
      <div className='bg-white border border-gray-200 rounded-lg'>
        {content}
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {content}
      </div>
    </div>
  );
};

export default AppointmentForm;
