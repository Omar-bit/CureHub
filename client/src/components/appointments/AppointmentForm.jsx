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
  AlertTriangle,
} from 'lucide-react';
import TimeSlotSelector from '../ui/TimeSlotSelector';
import TimePickerInput from '../ui/TimePickerInput';
import PatientFormSheet from '../PatientFormSheet';
import { Sheet } from '../ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { patientAPI, appointmentAPI } from '../../services/api';
import { splitPatientName } from '../../lib/patient';

const AppointmentForm = ({
  appointment = null,
  isOpen = false,
  onClose,
  onSave,
  patients = [],
  consultationTypes = [],
  selectedDate = null,
  inline = false,
  onPatientCreated = null, // Callback when a new patient is created
}) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    patientId: '',
    consultationTypeId: '',
    description: '',
    notes: '',
    status: 'SCHEDULED',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showConsultationDropdown, setShowConsultationDropdown] =
    useState(false);
  const [selectedLocation, setSelectedLocation] = useState('ONSITE'); // Default to ONSITE (au cabinet)
  const [showPatientFormSheet, setShowPatientFormSheet] = useState(false);
  const [prefilledPatientName, setPrefilledPatientName] = useState(null);
  const [selectedPatients, setSelectedPatients] = useState([]); // Array of selected patient objects (includes sans fiche patients)
  const [patientConsultationAccess, setPatientConsultationAccess] = useState(
    {}
  ); // Store consultation type access for each patient
  const [durationPerPatient, setDurationPerPatient] = useState(20); // Duration per patient in minutes
  const [isManualDuration, setIsManualDuration] = useState(false); // Track if duration was manually changed
  const [useManualTime, setUseManualTime] = useState(false); // Track if using manual time input
  const [manualTime, setManualTime] = useState(''); // Manual time input
  const [showConflictDialog, setShowConflictDialog] = useState(false); // Show conflict confirmation dialog
  const [conflictDetails, setConflictDetails] = useState(null); // Details of the conflicting appointment

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
        notes: appointment.notes || '',
        status: appointment.status || 'SCHEDULED',
      });

      // Set manual time when editing
      setManualTime(format(startDate, 'HH:mm'));

      // Load multiple patients if available
      if (
        appointment.appointmentPatients &&
        appointment.appointmentPatients.length > 0
      ) {
        const loadedPatients = appointment.appointmentPatients.map(
          (ap) => ap.patient
        );
        setSelectedPatients(loadedPatients);
        setPatientSearch(''); // Clear search when editing with multiple patients
      } else if (!appointment.patientId && appointment.title) {
        // Check if this is a "Sans fiche" appointment
        const sansFichePatient = {
          id: 'sans-fiche-' + Date.now(),
          name: appointment.title,
          isSansFiche: true,
        };
        setSelectedPatients([sansFichePatient]);
        setPatientSearch('');
      } else if (appointment.patientId) {
        // Set patient search if editing with single patient
        const patient = patients.find((p) => p.id === appointment.patientId);
        if (patient) {
          setSelectedPatients([patient]);
          setPatientSearch('');
        }
      }

      // Set the correct location tab if editing
      const consultationType = consultationTypes.find(
        (type) => type.id === parseInt(appointment.consultationTypeId)
      );
      if (consultationType) {
        setSelectedLocation(consultationType.location);

        // Calculate duration per patient if editing with multiple patients
        const numberOfPatients = appointment.appointmentPatients?.length || 1;
        const startTime = new Date(appointment.startTime);
        const endTime = new Date(appointment.endTime);
        const totalMinutes = Math.round((endTime - startTime) / (1000 * 60));
        const calculatedDurationPerPatient = Math.round(
          totalMinutes / numberOfPatients
        );

        setDurationPerPatient(calculatedDurationPerPatient);
        setIsManualDuration(
          calculatedDurationPerPatient !== consultationType.duration
        );
      }
    } else if (selectedDate) {
      // Creating new appointment with selected date
      setFormData((prev) => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: '09:00',
      }));
      setSelectedPatients([]);
      setManualTime('09:00');
    } else {
      // Reset form
      setFormData({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        patientId: '',
        consultationTypeId: '',
        description: '',
        notes: '',
        location: '',
        status: 'SCHEDULED',
      });
      setPatientSearch('');
      setManualTime('09:00');
      setPatientSearch('');
      setSelectedPatients([]);
      setDurationPerPatient(20);
      setIsManualDuration(false);
    }
    setErrors({});
  }, [appointment, selectedDate, isOpen, patients, consultationTypes]);

  // Fetch consultation type access for selected patients
  useEffect(() => {
    const fetchPatientAccess = async () => {
      const accessMap = {};
      for (const patient of selectedPatients) {
        if (patient.id && !patient.isSansFiche) {
          try {
            const access = await patientAPI.getConsultationTypeAccess(
              patient.id
            );
            // Create a map of consultation type ID to isEnabled status
            accessMap[patient.id] = access.reduce((acc, ct) => {
              acc[ct.id] = ct.isEnabled;
              return acc;
            }, {});
          } catch (error) {
            console.error(
              `Failed to fetch consultation type access for patient ${patient.id}:`,
              error
            );
            accessMap[patient.id] = {};
          }
        }
      }
      setPatientConsultationAccess(accessMap);
    };

    if (selectedPatients.length > 0) {
      fetchPatientAccess();
    } else {
      setPatientConsultationAccess({});
    }
  }, [selectedPatients]);

  // Auto-calculate duration based on number of patients and consultation type
  useEffect(() => {
    if (!isManualDuration && formData.consultationTypeId) {
      const selectedType = consultationTypes.find(
        (ct) =>
          ct.id === parseInt(formData.consultationTypeId) ||
          ct.id === formData.consultationTypeId
      );

      if (selectedType) {
        setDurationPerPatient(selectedType.duration);
      }
    }
  }, [formData.consultationTypeId, consultationTypes, isManualDuration]);

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

    // Update duration per patient and reset manual override
    setDurationPerPatient(type.duration);
    setIsManualDuration(false);

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
  };

  const handlePatientSelect = (patient) => {
    // Check if patient is already selected
    if (selectedPatients.find((p) => p.id === patient.id)) {
      return; // Don't add duplicate patients
    }

    // Add patient to the list
    setSelectedPatients((prev) => [...prev, patient]);
    setPatientSearch(''); // Clear search after adding
    setShowPatientDropdown(false);
  };

  const handleRemovePatient = (patientId) => {
    setSelectedPatients((prev) => prev.filter((p) => p.id !== patientId));
  };

  const handleIncreaseDuration = () => {
    setDurationPerPatient((prev) => prev + 5); // Increase by 5 minutes
    setIsManualDuration(true);
  };

  const handleDecreaseDuration = () => {
    setDurationPerPatient((prev) => Math.max(5, prev - 5)); // Decrease by 5 minutes, minimum 5
    setIsManualDuration(true);
  };

  const handleSansFiche = () => {
    // Create a "Sans fiche" patient object
    const sansFicheName = patientSearch.trim() || 'Sans fiche';
    const sansFichePatient = {
      id: 'sans-fiche-' + Date.now(), // Unique temporary ID
      name: sansFicheName,
      isSansFiche: true, // Mark as sans fiche
    };

    // Add to selected patients
    setSelectedPatients((prev) => [...prev, sansFichePatient]);
    setPatientSearch(''); // Clear search
    setShowPatientDropdown(false);
  };

  const handleCreateNewPatient = () => {
    // Parse the search text to pre-fill first and last name
    const searchText = patientSearch.trim();
    const nameParts = searchText.split(' ').filter((part) => part.length > 0);

    setPrefilledPatientName({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
    });
    setShowPatientFormSheet(true);
    setShowPatientDropdown(false);
  };

  const renderPatientLabel = (patient) => {
    if (!patient) return '';
    // If stored in `name` field, prefer parsing it
    if (patient.name) {
      const { firstName, lastName } = splitPatientName(patient.name);
      const full = `${firstName} ${lastName}`.trim();
      if (full) return full;
    }

    // Fallback to separate fields
    return (
      `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
      patient.name ||
      ''
    );
  };

  const handlePatientSaved = async (patientData) => {
    try {
      // Call the parent's callback to refresh patient list
      if (onPatientCreated) {
        const newPatient = await onPatientCreated(patientData);

        // Select the newly created patient
        if (newPatient) {
          console.log('New patient created:', newPatient);
          // Directly set the patient data instead of calling handlePatientSelect
          setFormData((prev) => ({ ...prev, patientId: newPatient.id }));
          setPatientSearch(newPatient.name);
        }
      }

      setShowPatientFormSheet(false);
      setPrefilledPatientName(null);
    } catch (error) {
      // Error is handled by the parent component
      throw error;
    }
  };

  const handleManualTimeToggle = () => {
    setUseManualTime(!useManualTime);
    if (!useManualTime && formData.startTime) {
      // Switching to manual mode - copy current time
      setManualTime(formData.startTime);
    }
  };

  const handleManualTimeChange = (e) => {
    const time = e.target.value;
    setManualTime(time);
    setFormData((prev) => ({ ...prev, startTime: time }));
  };

  // Filter patients based on search
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Check if a consultation type is enabled for all selected patients
  const isConsultationTypeAvailable = (consultationTypeId) => {
    // If no patients selected or all are "sans fiche", all consultation types are available
    if (
      selectedPatients.length === 0 ||
      selectedPatients.every((p) => p.isSansFiche)
    ) {
      return true;
    }

    // Check if the consultation type is enabled for all patients
    return selectedPatients.every((patient) => {
      if (patient.isSansFiche) return true; // Sans fiche patients can access all types
      const access = patientConsultationAccess[patient.id];
      if (!access) return true; // If we don't have access data yet, assume enabled
      return access[consultationTypeId] !== false; // Enabled if not explicitly disabled
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // if (!formData.title.trim()) {
    //   newErrors.title = 'Title is required';
    // }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    // Validate patient selection
    if (selectedPatients.length === 0) {
      newErrors.patientId = 'At least one patient is required';
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
        (type) =>
          type.id === parseInt(formData.consultationTypeId) ||
          type.id === formData.consultationTypeId
      );

      if (!selectedType) {
        throw new Error(
          `Consultation type not found. ID: ${formData.consultationTypeId}`
        );
      }

      // Calculate total duration based on number of patients and duration per patient
      const numberOfPatients = Math.max(1, selectedPatients.length);
      const totalDuration = durationPerPatient * numberOfPatients;

      // Always use manualTime since we removed the toggle
      const timeToUse = manualTime || formData.startTime;

      // Combine date and time into ISO strings
      const startDateTime = new Date(`${formData.date}T${timeToUse}`);
      const endDateTime = addMinutes(startDateTime, totalDuration);

      // Separate regular patients from sans fiche patients
      const regularPatients = selectedPatients.filter((p) => !p.isSansFiche);
      const sansFichePatients = selectedPatients.filter((p) => p.isSansFiche);

      // Get patient IDs array (only regular patients)
      const patientIds = regularPatients.map((p) => p.id);

      // Create title from all patient names (rendered without separator)
      const allPatientNames = selectedPatients
        .map((p) => renderPatientLabel(p))
        .join(', ');

      const appointmentData = {
        title: allPatientNames,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        patientIds: patientIds.length > 0 ? patientIds : undefined, // Send array of patient IDs (only if there are regular patients)
        patientId: patientIds.length === 0 ? null : undefined, // null if only sans fiche patients
        consultationTypeId: formData.consultationTypeId,
        description: formData.description.trim(),
        notes: formData.notes.trim(),
        status: formData.status,
        skipConflictCheck: true, // Always skip backend conflict check, we handle it on frontend
      };

      // Check for conflicts on frontend before saving
      if (!appointment) {
        const conflict = await checkForConflicts(appointmentData);
        if (conflict && conflict.hasConflict) {
          setConflictDetails(conflict);
          setShowConflictDialog(true);
          setLoading(false);
          return; // Don't save yet, wait for user confirmation
        }
      }

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

  const checkForConflicts = async (appointmentData) => {
    try {
      // For now, we'll call the getByDate endpoint and check manually
      const dateStr = format(new Date(appointmentData.startTime), 'yyyy-MM-dd');
      const appointments = await appointmentAPI.getByDate(dateStr);

      const newStart = new Date(appointmentData.startTime);
      const newEnd = new Date(appointmentData.endTime);

      // Check for overlapping appointments
      const conflicting = appointments.find((apt) => {
        if (appointment && apt.id === appointment.id) return false; // Skip current appointment when editing
        if (apt.status === 'CANCELLED') return false; // Skip cancelled appointments

        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);

        // Check for overlap
        return (
          (newStart >= aptStart && newStart < aptEnd) || // New starts during existing
          (newEnd > aptStart && newEnd <= aptEnd) || // New ends during existing
          (newStart <= aptStart && newEnd >= aptEnd) // New completely contains existing
        );
      });

      if (conflicting) {
        return {
          hasConflict: true,
          conflictingAppointment: conflicting,
        };
      }
      return null;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return null;
    }
  };

  const handleForceCreate = async () => {
    setShowConflictDialog(false);
    setLoading(true);

    try {
      // Get consultation type to calculate duration
      const selectedType = consultationTypes.find(
        (type) =>
          type.id === parseInt(formData.consultationTypeId) ||
          type.id === formData.consultationTypeId
      );

      const numberOfPatients = Math.max(1, selectedPatients.length);
      const totalDuration = durationPerPatient * numberOfPatients;
      const timeToUse = manualTime || formData.startTime;
      const startDateTime = new Date(`${formData.date}T${timeToUse}`);
      const endDateTime = addMinutes(startDateTime, totalDuration);

      const regularPatients = selectedPatients.filter((p) => !p.isSansFiche);
      const patientIds = regularPatients.map((p) => p.id);
      const allPatientNames = selectedPatients
        .map((p) => renderPatientLabel(p))
        .join(', ');

      const appointmentData = {
        title: allPatientNames,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        patientIds: patientIds.length > 0 ? patientIds : undefined,
        patientId: patientIds.length === 0 ? null : undefined,
        consultationTypeId: formData.consultationTypeId,
        description: formData.description.trim(),
        notes: formData.notes.trim(),
        status: formData.status,
        skipConflictCheck: true, // Skip backend conflict check since user confirmed
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
          {/* <div>
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
          </div> */}

          {/* Patient */}
          <div className='relative'>
            <label className='block text-xs font-medium text-cyan-800 mb-2'>
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
                value={patientSearch?.replace('!SP!', '')}
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
                    <div className='flex items-center space-x-2'>
                      <button
                        type='button'
                        onClick={handleSansFiche}
                        className='flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors'
                      >
                        <FileText className='h-4 w-4' />
                        <span>Sans fiche</span>
                      </button>
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

            {/* Display selected patients */}
            {selectedPatients.length > 0 && (
              <div className='mt-2 space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>
                    Selected Patients ({selectedPatients.length})
                  </span>
                </div>
                {selectedPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 rounded-lg border ${
                      patient.isSansFiche
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            patient.isSansFiche ? 'bg-blue-200' : 'bg-gray-200'
                          }`}
                        >
                          {patient.isSansFiche ? (
                            <FileText className='h-4 w-4 text-blue-600' />
                          ) : (
                            <User className='h-4 w-4 text-gray-500' />
                          )}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              patient.isSansFiche
                                ? 'text-blue-900'
                                : 'text-gray-900'
                            }`}
                          >
                            {renderPatientLabel(patient)}
                            {patient.isSansFiche && (
                              <span className='ml-2 text-xs text-blue-600'>
                                (Sans fiche)
                              </span>
                            )}
                          </p>
                          {patient.phoneNumber && !patient.isSansFiche && (
                            <p className='text-xs text-gray-600'>
                              {patient.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleRemovePatient(patient.id)}
                        className={`transition-colors ${
                          patient.isSansFiche
                            ? 'text-blue-500 hover:text-blue-700'
                            : 'text-red-500 hover:text-red-700'
                        }`}
                      >
                        <X className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date and Time Selection */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-medium text-cyan-800 mb-2'>
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
              <label className='block text-xs font-medium text-cyan-800 mb-2'>
                <Clock className='h-4 w-4 inline mr-2' />
                Time *
              </label>
              <TimePickerInput
                value={manualTime}
                onChange={(time) => {
                  setManualTime(time);
                  setFormData((prev) => ({ ...prev, startTime: time }));
                }}
                error={errors.startTime}
              />
              {errors.startTime && (
                <p className='mt-1 text-sm text-red-600'>{errors.startTime}</p>
              )}
            </div>
          </div>

          {/* Consultation Type */}
          <div className='relative'>
            <label className='block text-xs font-medium text-cyan-800 mb-2'>
              <CreditCard className='h-4 w-4 inline mr-2' />
              Consultation Type *
            </label>

            {/* Dropdown Trigger - Styled to match the screenshot */}
            <div
              onClick={() =>
                setShowConsultationDropdown(!showConsultationDropdown)
              }
              className={`w-full p-2 border rounded-lg cursor-pointer bg-white flex items-center justify-between ${
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
                <div className='p-2 px-3 border-b border-gray-200 bg-gray-50'>
                  <span className='text-md font-semibold text-gray-700'>
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
                          .map((type) => {
                            const isAvailable = isConsultationTypeAvailable(
                              type.id
                            );
                            return (
                              <div
                                key={type.id}
                                onClick={() =>
                                  isAvailable &&
                                  handleConsultationTypeSelect(type)
                                }
                                className={`p-3 rounded-lg transition-colors ${
                                  isAvailable
                                    ? 'cursor-pointer hover:bg-gray-50'
                                    : 'cursor-not-allowed opacity-50 bg-gray-50'
                                } ${
                                  formData.consultationTypeId ===
                                  String(type.id)
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'border border-gray-200'
                                }`}
                              >
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center space-x-3'>
                                    <div
                                      className='w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold'
                                      style={{
                                        backgroundColor:
                                          type.color || '#3B82F6',
                                      }}
                                    >
                                      {type.duration}
                                    </div>
                                    <div>
                                      <h4
                                        className={`font-medium ${
                                          isAvailable
                                            ? 'text-gray-900'
                                            : 'text-gray-500'
                                        }`}
                                      >
                                        {type.name}
                                        {!isAvailable && (
                                          <span className='ml-2 text-xs text-red-500'>
                                            (Non disponible)
                                          </span>
                                        )}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className='text-right'>
                                    <p
                                      className={`font-semibold ${
                                        isAvailable
                                          ? 'text-gray-900'
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      ${type.price}
                                    </p>
                                    <p className='text-xs text-gray-500'>
                                      {type.duration} min.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {selectedLocation === 'ONLINE' && (
                    <div className='space-y-2'>
                      {consultationTypes
                        .filter((type) => type.location === 'ONLINE')
                        .map((type) => {
                          const isAvailable = isConsultationTypeAvailable(
                            type.id
                          );
                          return (
                            <div
                              key={type.id}
                              onClick={() =>
                                isAvailable &&
                                handleConsultationTypeSelect(type)
                              }
                              className={`p-3 rounded-lg transition-colors ${
                                isAvailable
                                  ? 'cursor-pointer hover:bg-gray-50'
                                  : 'cursor-not-allowed opacity-50 bg-gray-50'
                              } ${
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
                                    <h4
                                      className={`font-medium ${
                                        isAvailable
                                          ? 'text-gray-900'
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      {type.name}
                                      {!isAvailable && (
                                        <span className='ml-2 text-xs text-red-500'>
                                          (Non disponible)
                                        </span>
                                      )}
                                    </h4>
                                  </div>
                                </div>
                                <div className='text-right'>
                                  <p
                                    className={`font-semibold ${
                                      isAvailable
                                        ? 'text-gray-900'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    ${type.price}
                                  </p>
                                  <p className='text-xs text-gray-500'>
                                    {type.duration} min.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {selectedLocation === 'ATHOME' && (
                    <div className='space-y-2'>
                      {consultationTypes
                        .filter((type) => type.location === 'ATHOME')
                        .map((type) => {
                          const isAvailable = isConsultationTypeAvailable(
                            type.id
                          );
                          return (
                            <div
                              key={type.id}
                              onClick={() =>
                                isAvailable &&
                                handleConsultationTypeSelect(type)
                              }
                              className={`p-3 rounded-lg transition-colors ${
                                isAvailable
                                  ? 'cursor-pointer hover:bg-gray-50'
                                  : 'cursor-not-allowed opacity-50 bg-gray-50'
                              } ${
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
                                    <h4
                                      className={`font-medium ${
                                        isAvailable
                                          ? 'text-gray-900'
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      {type.name}
                                      {!isAvailable && (
                                        <span className='ml-2 text-xs text-red-500'>
                                          (Non disponible)
                                        </span>
                                      )}
                                    </h4>
                                  </div>
                                </div>
                                <div className='text-right'>
                                  <p
                                    className={`font-semibold ${
                                      isAvailable
                                        ? 'text-gray-900'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    ${type.price}
                                  </p>
                                  <p className='text-xs text-gray-500'>
                                    {type.duration} min.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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

          {/* Duration Display and Controls */}
          {formData.consultationTypeId && selectedPatients.length > 0 && (
            <div>
              <label className='block text-xs font-medium text-cyan-800 mb-2'>
                <Clock className='h-4 w-4 inline mr-2' />
                Duration
              </label>
              <div className='flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50'>
                <div className='flex items-center space-x-2'>
                  <span className='text-lg font-semibold text-gray-900'>
                    {selectedPatients.length} × {durationPerPatient} min.
                  </span>
                  <span className='text-sm text-gray-500'>
                    ({durationPerPatient} min/pers.)
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    type='button'
                    onClick={handleDecreaseDuration}
                    className='w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-300 hover:bg-gray-100 transition-colors'
                  >
                    <span className='text-lg font-bold text-gray-600'>−</span>
                  </button>
                  <button
                    type='button'
                    onClick={handleIncreaseDuration}
                    className='w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-300 hover:bg-gray-100 transition-colors'
                  >
                    <span className='text-lg font-bold text-gray-600'>+</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Time Selection - only show when date and consultation type are selected */}
          {formData.date && formData.consultationTypeId && (
            <div>
              <label className='block text-xs font-medium text-cyan-800 mb-2'>
                <Clock className='h-4 w-4 inline mr-2' />
                Available Time Slots
              </label>
              <div className='border border-gray-300 rounded-lg p-4'>
                <TimeSlotSelector
                  selectedDate={formData.date}
                  consultationTypeId={formData.consultationTypeId}
                  consultationTypes={consultationTypes}
                  value={manualTime}
                  onChange={(time) => {
                    setManualTime(time);
                    handleChange({
                      target: { name: 'startTime', value: time },
                    });
                  }}
                  onDateChange={(newDate) =>
                    handleChange({ target: { name: 'date', value: newDate } })
                  }
                  error={errors.startTime}
                  totalDuration={
                    durationPerPatient * Math.max(1, selectedPatients.length)
                  }
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className='block text-xs font-medium text-cyan-800 mb-2'>
              Motif de consultation
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Décrivez le motif de la consultation...'
            />
          </div>

          {/* Private Notes */}
          <div>
            <label className='block text-xs font-medium text-red-600 mb-2'>
              Note privée (invisible du patient)
            </label>
            <textarea
              name='notes'
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className='w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-pink-50'
              placeholder='Notes privées non visibles par le patient...'
            />
          </div>

          {/* Status (only for editing) */}
          {appointment && (
            <div>
              <label className='block text-xs font-medium text-sky-500 mb-2'>
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
                <option value='ABSENT'>Absent</option>
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
      <>
        <div className='bg-white  rounded-lg'>{content}</div>

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

        {/* Conflict Confirmation Dialog */}
        <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center space-x-2 text-orange-700'>
                <AlertTriangle className='h-5 w-5' />
                <span>Appointment Conflict Detected</span>
              </DialogTitle>
            </DialogHeader>

            <div className='p-6 space-y-4'>
              <DialogDescription>
                There is already an appointment scheduled at this time:
              </DialogDescription>

              {conflictDetails?.conflictingAppointment && (
                <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Patient:
                      </span>
                      <span className='text-sm text-gray-900'>
                        {conflictDetails.conflictingAppointment.title ||
                          conflictDetails.conflictingAppointment.patient
                            ?.name ||
                          'Unknown'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Time:
                      </span>
                      <span className='text-sm text-gray-900'>
                        {format(
                          new Date(
                            conflictDetails.conflictingAppointment.startTime
                          ),
                          'HH:mm'
                        )}{' '}
                        -{' '}
                        {format(
                          new Date(
                            conflictDetails.conflictingAppointment.endTime
                          ),
                          'HH:mm'
                        )}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Status:
                      </span>
                      <span className='text-sm text-gray-900'>
                        {conflictDetails.conflictingAppointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                <p className='text-sm text-yellow-800'>
                  <strong>Warning:</strong> Creating this appointment will
                  result in overlapping schedules. Are you sure you want to
                  continue?
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowConflictDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleForceCreate}
                className='bg-orange-600 hover:bg-orange-700'
              >
                Force Create Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
        <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
          {content}
        </div>
      </div>

      {/* Patient Form Sheet */}
      {showPatientFormSheet && (
        <Sheet>
          <PatientFormSheet
            patient={prefilledPatientName}
            isOpen={showPatientFormSheet}
            onClose={() => {
              setShowPatientFormSheet(false);
              setPrefilledPatientName(null);
            }}
            onSave={handlePatientSaved}
          />
        </Sheet>
      )}

      {/* Conflict Confirmation Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center space-x-2 text-orange-700'>
              <AlertTriangle className='h-5 w-5' />
              <span>Appointment Conflict Detected</span>
            </DialogTitle>
          </DialogHeader>

          <div className='p-6 space-y-4'>
            <DialogDescription>
              There is already an appointment scheduled at this time:
            </DialogDescription>

            {conflictDetails?.conflictingAppointment && (
              <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-700'>
                      Patient:
                    </span>
                    <span className='text-sm text-gray-900'>
                      {conflictDetails.conflictingAppointment.title ||
                        conflictDetails.conflictingAppointment.patient?.name ||
                        'Unknown'}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-700'>
                      Time:
                    </span>
                    <span className='text-sm text-gray-900'>
                      {format(
                        new Date(
                          conflictDetails.conflictingAppointment.startTime
                        ),
                        'HH:mm'
                      )}{' '}
                      -{' '}
                      {format(
                        new Date(
                          conflictDetails.conflictingAppointment.endTime
                        ),
                        'HH:mm'
                      )}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-700'>
                      Status:
                    </span>
                    <span className='text-sm text-gray-900'>
                      {conflictDetails.conflictingAppointment.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
              <p className='text-sm text-yellow-800'>
                <strong>Warning:</strong> Creating this appointment will result
                in overlapping schedules. Are you sure you want to continue?
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowConflictDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForceCreate}
              className='bg-orange-600 hover:bg-orange-700'
            >
              Force Create Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentForm;
