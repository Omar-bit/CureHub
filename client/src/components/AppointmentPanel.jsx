import React, { useState, useEffect } from 'react';
import { AppointmentForm, AppointmentDetails } from './appointments';
import {
  appointmentAPI,
  patientAPI,
  consultationTypesAPI,
} from '../services/api';
import { showError, showSuccess } from '../lib/toast';
import { Loader2, Plus } from 'lucide-react';

const AppointmentPanel = ({
  mode = 'create', // 'create', 'view', 'edit'
  appointment = null,
  selectedDateTime = null,
  onClose,
}) => {
  const [patients, setPatients] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentAppointment, setCurrentAppointment] = useState(appointment);

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
      } else {
        // Create new appointment
        const newAppointment = await appointmentAPI.create(appointmentData);
        setCurrentAppointment(newAppointment);
        setCurrentMode('view');
        showSuccess('Appointment created successfully!');
      }

      // Refresh calendar appointments
      if (window.refreshCalendarAppointments) {
        window.refreshCalendarAppointments();
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

  const handleEditAppointment = () => {
    setCurrentMode('edit');
  };

  const handleDeleteAppointment = async (appointment) => {
    if (
      !confirm(
        'Are you sure you want to delete this appointment? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await appointmentAPI.delete(appointment.id);
      showSuccess('Appointment deleted successfully!');

      // Refresh calendar appointments
      if (window.refreshCalendarAppointments) {
        window.refreshCalendarAppointments();
      }

      // Close panel or switch to create mode
      onClose?.();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showError('Failed to delete appointment. Please try again.');
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
                patients={patients}
                consultationTypes={consultationTypes}
                selectedDate={selectedDateTime}
                inline={true} // Add inline prop
              />
            </div>
          </div>
        );

      case 'view':
        return (
          <div className='h-full bg-white overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Appointment Details
              </h2>
            </div>
            <div className='p-6'>
              <AppointmentDetails
                appointment={currentAppointment}
                isOpen={false} // Use inline mode
                onClose={onClose}
                onEdit={handleEditAppointment}
                onDelete={handleDeleteAppointment}
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
    <div className='h-full bg-white overflow-hidden'>{renderContent()}</div>
  );
};

export default AppointmentPanel;
