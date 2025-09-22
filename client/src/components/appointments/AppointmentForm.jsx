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
  Search,
  UserPlus,
  Building2,
  Video,
  Home,
  ChevronDown,
} from 'lucide-react';
import TimeSlotSelector from '../ui/TimeSlotSelector';

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
    patientId: '',
    consultationTypeId: '',
    description: '',
    status: 'SCHEDULED',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showConsultationDropdown, setShowConsultationDropdown] =
    useState(false);
  const [selectedLocation, setSelectedLocation] = useState('ONSITE'); // Default to ONSITE (au cabinet)

  useEffect(() => {
    if (appointment) {
      // Editing existing appointment
      const startDate = new Date(appointment.startTime);
      const endDate = new Date(appointment.endTime);

      setFormData({
        title: appointment.title || '',
        date: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        patientId: appointment.patientId || '',
        consultationTypeId: appointment.consultationTypeId || '',
        description: appointment.description || '',
        status: appointment.status || 'SCHEDULED',
      });

      // Set patient search if editing
      const patient = patients.find((p) => p.id === appointment.patientId);
      if (patient) {
        setPatientSearch(patient.name);
      }

      // Set the correct location tab if editing
      const consultationType = consultationTypes.find(
        (type) => type.id === parseInt(appointment.consultationTypeId)
      );
      if (consultationType) {
        setSelectedLocation(consultationType.location);
      }
    } else if (selectedDate) {
      // Creating new appointment with selected date
      setFormData((prev) => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: '09:00',
      }));
    } else {
      // Reset form
      setFormData({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        patientId: '',
        consultationTypeId: '',
        description: '',
        location: '',
        status: 'SCHEDULED',
      });
      setPatientSearch('');
    }
    setErrors({});
  }, [appointment, selectedDate, isOpen, patients, consultationTypes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Clear start time when date or consultation type changes
    if (
      (name === 'date' || name === 'consultationTypeId') &&
      formData.startTime
    ) {
      setFormData((prev) => ({ ...prev, startTime: '' }));
    }

    // Set the correct location tab when a consultation type is selected
    if (name === 'consultationTypeId') {
      const selectedType = consultationTypes.find(
        (type) => type.id === parseInt(value)
      );
      if (selectedType) {
        setSelectedLocation(selectedType.location);
      }
    }
  };

  // Special handler for consultation type selection
  const handleConsultationTypeSelect = (type) => {
    // Ensure type.id is converted to a string consistently
    setFormData((prev) => ({
      ...prev,
      consultationTypeId: String(type.id),
    }));

    // Set the location tab based on the selected type
    setSelectedLocation(type.location);

    // Clear any consultation type selection error
    if (errors.consultationTypeId) {
      setErrors((prev) => ({ ...prev, consultationTypeId: '' }));
    }

    // Clear start time when consultation type changes
    if (formData.startTime) {
      setFormData((prev) => ({ ...prev, startTime: '' }));
    }

    // Close the dropdown
    setShowConsultationDropdown(false);
  };

  const handlePatientSearch = (e) => {
    const value = e.target.value;
    setPatientSearch(value);
    setShowPatientDropdown(true);

    // Clear selected patient if search changes
    if (formData.patientId && value !== selectedPatient?.name) {
      setFormData((prev) => ({ ...prev, patientId: '' }));
    }
  };

  const handlePatientSelect = (patient) => {
    setFormData((prev) => ({ ...prev, patientId: patient.id }));
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
  };

  // Filter patients based on search
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

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

    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }

    if (!formData.consultationTypeId) {
      newErrors.consultationTypeId = 'Consultation type is required';
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
      // Get consultation type to calculate duration
      const selectedType = consultationTypes.find(
        (type) => type.id === parseInt(formData.consultationTypeId)
      );

      if (!selectedType) {
        throw new Error('Consultation type not found');
      }

      // Combine date and time into ISO strings
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = addMinutes(startDateTime, selectedType.duration);

      const appointmentData = {
        title: formData.title.trim(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        patientId: parseInt(formData.patientId),
        consultationTypeId: parseInt(formData.consultationTypeId),
        description: formData.description.trim(),
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
  // Ensure we're properly parsing the consultation type ID
  const selectedConsultationType = formData.consultationTypeId
    ? consultationTypes.find(
        (ct) =>
          ct.id === parseInt(formData.consultationTypeId) ||
          ct.id === formData.consultationTypeId
      )
    : null;

  const content = (
    <>
      {/* Header */}
      {!inline && (
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {appointment ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className={inline ? 'space-y-6' : 'p-6'}>
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

          {/* Date */}
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

          {/* Patient */}
          <div className='relative'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <User className='h-4 w-4 inline mr-2' />
              Patient *
            </label>

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
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.patientId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Search patients by name...'
              />
              <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                {/* <UserPlus className='h-4 w-4 text-gray-400' /> */}
              </div>
            </div>

            {/* Patient Dropdown */}
            {showPatientDropdown && (
              <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                {/* Header */}
                <div className='p-3 border-b border-gray-200 bg-gray-50'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-600'>
                      PATIENT
                    </span>
                    <button
                      type='button'
                      className='flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm'
                    >
                      {/* <UserPlus className='h-4 w-4' />
                      <span>Nouveau patient</span> */}
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
                              {patient.name}
                            </h4>
                            <p className='text-sm text-gray-500'>
                              {patient.dateOfBirth &&
                                `Née le ${format(
                                  new Date(patient.dateOfBirth),
                                  'dd/MM/yyyy'
                                )}`}
                            </p>
                          </div>
                          <div className='text-right'>
                            <span className='text-sm text-gray-400'>V</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='p-4 text-center text-gray-500'>
                      <p>No patients found</p>
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
          <div className='relative'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <CreditCard className='h-4 w-4 inline mr-2' />
              Consultation Type *
            </label>

            {/* Dropdown Trigger - Styled to match the screenshot */}
            <div
              onClick={() =>
                setShowConsultationDropdown(!showConsultationDropdown)
              }
              className={`w-full px-4 py-3 border rounded-lg cursor-pointer bg-white flex items-center justify-between ${
                errors.consultationTypeId ? 'border-red-300' : 'border-gray-300'
              } ${
                showConsultationDropdown
                  ? 'ring-2 ring-blue-500 border-transparent'
                  : 'hover:border-gray-400'
              }`}
            >
              <div className='flex items-center space-x-2'>
                {selectedConsultationType ? (
                  <div className='flex items-center space-x-2'>
                    <div
                      className='rounded-full size-8 bg-gray-200 flex items-center justify-center text-sm font-bold'
                      style={{
                        backgroundColor:
                          selectedConsultationType.color || '#3B82F6',
                        color: 'white',
                      }}
                    >
                      {selectedConsultationType.duration}
                    </div>
                    <span className='text-gray-800'>
                      {selectedConsultationType.name}
                    </span>
                  </div>
                ) : (
                  <span className='text-gray-500'>
                    Select consultation type...
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${
                  showConsultationDropdown ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* Dropdown Content */}
            {showConsultationDropdown && (
              <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto'>
                {/* Header */}
                <div className='p-4 border-b border-gray-200 bg-gray-50'>
                  <span className='text-lg font-semibold text-gray-700'>
                    ACTE ET HORAIRES
                  </span>
                </div>

                {/* Location Tabs - Styled like the screenshot */}
                <div className='flex border-b border-gray-200 bg-gray-50'>
                  {consultationTypes.filter(
                    (type) => type.location === 'ONSITE'
                  ).length > 0 && (
                    <div
                      onClick={() => setSelectedLocation('ONSITE')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-2 py-4 cursor-pointer transition-colors ${
                        selectedLocation === 'ONSITE'
                          ? 'bg-blue-600 border-blue-700 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedLocation === 'ONSITE'
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                        }`}
                      >
                        <Building2
                          className={`w-4 h-4 ${
                            selectedLocation === 'ONSITE'
                              ? 'text-white'
                              : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <span className='font-medium'>au cabinet</span>
                    </div>
                  )}

                  {consultationTypes.filter(
                    (type) => type.location === 'ONLINE'
                  ).length > 0 && (
                    <div
                      onClick={() => setSelectedLocation('ONLINE')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-2 py-4 cursor-pointer transition-colors ${
                        selectedLocation === 'ONLINE'
                          ? 'bg-blue-600 border-blue-700 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedLocation === 'ONLINE'
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                        }`}
                      >
                        <Video
                          className={`w-4 h-4 ${
                            selectedLocation === 'ONLINE'
                              ? 'text-white'
                              : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <span className='font-medium'>en visio</span>
                    </div>
                  )}

                  {consultationTypes.filter(
                    (type) => type.location === 'ATHOME'
                  ).length > 0 && (
                    <div
                      onClick={() => setSelectedLocation('ATHOME')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-2 py-4 cursor-pointer transition-colors ${
                        selectedLocation === 'ATHOME'
                          ? 'bg-blue-600 border-blue-700 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedLocation === 'ATHOME'
                            ? 'bg-blue-500'
                            : 'bg-gray-200'
                        }`}
                      >
                        <Home
                          className={`w-4 h-4 ${
                            selectedLocation === 'ATHOME'
                              ? 'text-white'
                              : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <span className='font-medium'>à domicile</span>
                    </div>
                  )}
                </div>

                {/* Consultation Types for Selected Location */}
                <div className='p-4 space-y-3'>
                  {selectedLocation === 'ONSITE' && (
                    <div className='mb-3'>
                      <div className='space-y-2'>
                        {consultationTypes
                          .filter((type) => type.location === 'ONSITE')
                          .map((type) => (
                            <div
                              key={type.id}
                              onClick={() => handleConsultationTypeSelect(type)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                                formData.consultationTypeId === String(type.id)
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'border border-gray-200'
                              }`}
                            >
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center space-x-3'>
                                  <div
                                    className='w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold'
                                    style={{
                                      backgroundColor: type.color || '#3B82F6',
                                    }}
                                  >
                                    {type.duration}
                                  </div>
                                  <div>
                                    <h4 className='font-medium text-gray-900'>
                                      {type.name}
                                    </h4>
                                  </div>
                                </div>
                                <div className='text-right'>
                                  <p className='font-semibold text-gray-900'>
                                    ${type.price}
                                  </p>
                                  <p className='text-xs text-gray-500'>
                                    {type.duration} min.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {selectedLocation === 'ONLINE' && (
                    <div className='space-y-2'>
                      {consultationTypes
                        .filter((type) => type.location === 'ONLINE')
                        .map((type) => (
                          <div
                            key={type.id}
                            onClick={() => {
                              handleChange({
                                target: {
                                  name: 'consultationTypeId',
                                  value: type.id,
                                },
                              });
                              setShowConsultationDropdown(false);
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                              formData.consultationTypeId === type.id.toString()
                                ? 'bg-blue-50 border border-blue-200'
                                : 'border border-gray-200'
                            }`}
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-3'>
                                <div
                                  className='w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold'
                                  style={{
                                    backgroundColor: type.color || '#3B82F6',
                                  }}
                                >
                                  {type.duration}
                                </div>
                                <div>
                                  <h4 className='font-medium text-gray-900'>
                                    {type.name}
                                  </h4>
                                </div>
                              </div>
                              <div className='text-right'>
                                <p className='font-semibold text-gray-900'>
                                  ${type.price}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  {type.duration} min.
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {selectedLocation === 'ATHOME' && (
                    <div className='space-y-2'>
                      {consultationTypes
                        .filter((type) => type.location === 'ATHOME')
                        .map((type) => (
                          <div
                            key={type.id}
                            onClick={() => {
                              handleChange({
                                target: {
                                  name: 'consultationTypeId',
                                  value: type.id,
                                },
                              });
                              setShowConsultationDropdown(false);
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                              formData.consultationTypeId === type.id.toString()
                                ? 'bg-blue-50 border border-blue-200'
                                : 'border border-gray-200'
                            }`}
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-3'>
                                <div
                                  className='w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold'
                                  style={{
                                    backgroundColor: type.color || '#3B82F6',
                                  }}
                                >
                                  {type.duration}
                                </div>
                                <div>
                                  <h4 className='font-medium text-gray-900'>
                                    {type.name}
                                  </h4>
                                </div>
                              </div>
                              <div className='text-right'>
                                <p className='font-semibold text-gray-900'>
                                  ${type.price}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  {type.duration} min.
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Click outside handler */}
            {showConsultationDropdown && (
              <div
                className='fixed inset-0 z-0'
                onClick={() => setShowConsultationDropdown(false)}
              />
            )}

            {errors.consultationTypeId && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.consultationTypeId}
              </p>
            )}
          </div>

          {/* Time Selection - only show when date and consultation type are selected */}
          {formData.date && formData.consultationTypeId && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Clock className='h-4 w-4 inline mr-2' />
                Select Time *
              </label>
              <div className='border border-gray-300 rounded-lg p-4'>
                <TimeSlotSelector
                  selectedDate={formData.date}
                  consultationTypeId={formData.consultationTypeId}
                  consultationTypes={consultationTypes}
                  value={formData.startTime}
                  onChange={(time) =>
                    handleChange({ target: { name: 'startTime', value: time } })
                  }
                  error={errors.startTime}
                />
              </div>
            </div>
          )}

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
    return <div className='bg-white  rounded-lg'>{content}</div>;
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
