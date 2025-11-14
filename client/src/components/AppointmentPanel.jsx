import React, { useState, useEffect } from 'react';
import { AppointmentForm, AppointmentDetails } from './appointments';
import {
  appointmentAPI,
  patientAPI,
  consultationTypesAPI,
  timeplanAPI,
} from '../services/api';
import { showError, showSuccess } from '../lib/toast';
import { Loader2, Plus } from 'lucide-react';
import { ConfirmDialog } from './ui/confirm-dialog';

const AppointmentPanel = ({
  mode = 'create', // 'create', 'view', 'edit'
  appointment = null,
  selectedDateTime = null,
  onClose,
  onAppointmentCreated,
  onAppointmentDeleted,
  onAppointmentUpdated,
}) => {
  const [patients, setPatients] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentAppointment, setCurrentAppointment] = useState(appointment);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update when props change
  useEffect(() => {
    setCurrentMode(mode);
    setCurrentAppointment(appointment);
  }, [mode, appointment]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load data in parallel
      const [patientsData, consultationTypesData] = await Promise.all([
        patientAPI.getAll(),
        consultationTypesAPI.getAll(),
      ]);

      setPatients(patientsData.patients || patientsData || []);
      setConsultationTypes(
        consultationTypesData.consultationTypes || consultationTypesData || []
      );
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppointment = async (appointmentData) => {
    try {
      if (currentMode === 'edit' && currentAppointment) {
        // Update existing appointment
        const updatedAppointment = await appointmentAPI.update(
          currentAppointment.id,
          appointmentData
        );
        setCurrentAppointment(updatedAppointment);
        setCurrentMode('view');
        showSuccess('Appointment updated successfully!');

        if (onAppointmentUpdated) {
          onAppointmentUpdated(updatedAppointment);
        }
      } else {
        // Create new appointment
        const newAppointment = await appointmentAPI.create(appointmentData);
        setCurrentAppointment(newAppointment);
        setCurrentMode('view');
        showSuccess('Appointment created successfully!');

        const appointmentStart =
          newAppointment.startTime ||
          newAppointment.appointmentDate ||
          appointmentData.startTime ||
          appointmentData.appointmentDate ||
          null;

        // Notify parent component with the appointment date
        if (onAppointmentCreated && appointmentStart) {
          onAppointmentCreated(appointmentStart);
        }
      }
    } catch (error) {
      console.error('Error saving appointment:', error);

      // Handle specific error messages
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.response?.status === 400) {
        showError('Invalid appointment data. Please check your inputs.');
      } else if (error.response?.status === 404) {
        showError('Patient or consultation type not found.');
      } else {
        showError('Failed to save appointment. Please try again.');
      }

      throw error; // Re-throw to prevent form closure
    }
  };

  const handlePatientCreated = async (patientData) => {
    try {
      console.log('Creating patient with data:', patientData);
      const newPatient = await patientAPI.create(patientData);
      console.log('Patient created successfully:', newPatient);

      // Add the new patient to the list immediately for instant selection
      setPatients((prev) => {
        console.log('Current patients count:', prev.length);
        const updated = [...prev, newPatient];
        console.log('Updated patients count:', updated.length);
        return updated;
      });

      showSuccess('Patient created successfully!');
      return newPatient;
    } catch (error) {
      console.error('Error creating patient:', error);

      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to create patient. Please try again.');
      }

      throw error;
    }
  };

  const handleEditAppointment = () => {
    setCurrentMode('edit');
  };

  const handleDeleteAppointment = (appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      setIsDeleting(true);
      await appointmentAPI.delete(appointmentToDelete.id);
      showSuccess('Appointment deleted successfully!');

      if (onAppointmentDeleted) {
        await onAppointmentDeleted(appointmentToDelete);
      }

      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);

      // Close panel or switch to create mode
      onClose?.();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showError('Failed to delete appointment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const updatedAppointment = await appointmentAPI.update(appointmentId, {
        status: newStatus,
      });

      setCurrentAppointment(updatedAppointment);

      showSuccess(`Appointment status updated to ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showError('Failed to update appointment status. Please try again.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className='flex items-center justify-center h-64'>
          <div className='flex items-center space-x-2 text-gray-600'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span>Loading...</span>
          </div>
        </div>
      );
    }

    switch (currentMode) {
      case 'create':
      case 'edit':
        return (
          <div className='h-full bg-white overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <h2 className='text-xl font-semibold text-gray-900'>
                {currentMode === 'edit'
                  ? 'Edit Appointment'
                  : 'New Appointment'}
              </h2>
            </div>
            <div className='p-6'>
              <AppointmentForm
                appointment={currentAppointment}
                isOpen={false} // Use inline mode
                onClose={() => {
                  if (currentAppointment) {
                    setCurrentMode('view');
                  } else {
                    onClose?.();
                  }
                }}
                onSave={handleSaveAppointment}
                onPatientCreated={handlePatientCreated}
                patients={patients}
                consultationTypes={consultationTypes}
                selectedDate={selectedDateTime}
                inline={true} // Add inline prop
              />
            </div>
          </div>
        );

      case 'view':
        const getStatusColor = (status) => {
          switch (status) {
            case 'SCHEDULED':
              return 'bg-blue-100 text-blue-800';
            case 'CONFIRMED':
              return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS':
              return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETED':
              return 'bg-green-100 text-green-800';
            case 'CANCELLED':
              return 'bg-red-100 text-red-800';
            case 'NO_SHOW':
              return 'bg-gray-100 text-gray-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };

        const getStatusText = (status) => {
          switch (status) {
            case 'SCHEDULED':
              return 'Scheduled';
            case 'CONFIRMED':
              return 'Confirmed';
            case 'IN_PROGRESS':
              return 'In Progress';
            case 'COMPLETED':
              return 'Completed';
            case 'CANCELLED':
              return 'Cancelled';
            case 'NO_SHOW':
              return 'No Show';
            default:
              return status;
          }
        };

        return (
          <div className='h-full bg-white overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <div className='flex items-center space-x-3'>
                <h2 className='text-xl font-semibold text-gray-900'>
                  Appointment Details
                </h2>
                {currentAppointment && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      currentAppointment.status
                    )}`}
                  >
                    {getStatusText(currentAppointment.status)}
                  </span>
                )}
              </div>
            </div>
            <div className='p-6'>
              <AppointmentDetails
                appointment={currentAppointment}
                isOpen={false} // Use inline mode, so isOpen can be false
                onClose={onClose}
                onEdit={handleEditAppointment}
                onDelete={handleDeleteAppointment}
                onStatusChange={handleStatusChange}
                inline={true} // Add inline prop
              />
            </div>
          </div>
        );

      default:
        return (
          <div className='p-6 h-full flex flex-col items-center justify-center text-gray-500'>
            <Plus className='h-12 w-12 mb-4' />
            <h3 className='text-lg font-medium mb-2'>Create New Appointment</h3>
            <p className='text-center text-sm'>
              Click on a time slot in the calendar to create a new appointment,
              or use the form below.
            </p>
            <button
              onClick={() => setCurrentMode('create')}
              className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Create Appointment
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <div className='h-full bg-white overflow-hidden'>{renderContent()}</div>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteAppointment}
        title='Delete appointment'
        description='This action will permanently remove the appointment and its related information.'
        confirmText='Delete'
        cancelText='Cancel'
        variant='destructive'
        isLoading={isDeleting}
      />
    </>
  );
};

export default AppointmentPanel;
