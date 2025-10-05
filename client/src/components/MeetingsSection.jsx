import React, { useState, useEffect } from 'react';
import { CalendarView } from './calendar';
import { AppointmentForm, AppointmentDetails } from './appointments';
import {
  appointmentAPI,
  patientAPI,
  consultationTypesAPI,
} from '../services/api';
import { showError, showSuccess } from '../lib/toast';
import { Loader2 } from 'lucide-react';

const MeetingsSection = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] =
    useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load data in parallel
      const [appointmentsData, patientsData, consultationTypesData] =
        await Promise.all([
          appointmentAPI.getAll(),
          patientAPI.getAll(),
          consultationTypesAPI.getAll(),
        ]);

      setAppointments(appointmentsData.appointments || appointmentsData || []);
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

  const loadAppointments = async (params = {}) => {
    try {
      const data = await appointmentAPI.getAll(params);
      setAppointments(data.appointments || data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showError('Failed to load appointments.');
    }
  };

  const handleNewAppointment = (dateTime = null) => {
    setSelectedDateTime(dateTime);
    setSelectedAppointment(null);
    setIsAppointmentFormOpen(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDateTime(null);
    setIsAppointmentDetailsOpen(false);
    setIsAppointmentFormOpen(true);
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailsOpen(true);
  };

  const handleSaveAppointment = async (appointmentData) => {
    try {
      if (selectedAppointment) {
        // Update existing appointment
        const updatedAppointment = await appointmentAPI.update(
          selectedAppointment.id,
          appointmentData
        );
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === selectedAppointment.id ? updatedAppointment : apt
          )
        );
        showSuccess('Appointment updated successfully!');
      } else {
        // Create new appointment
        const newAppointment = await appointmentAPI.create(appointmentData);
        setAppointments((prev) => [...prev, newAppointment]);
        showSuccess('Appointment created successfully!');
      }

      setIsAppointmentFormOpen(false);
      setSelectedAppointment(null);
      setSelectedDateTime(null);
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
      setAppointments((prev) =>
        prev.filter((apt) => apt.id !== appointment.id)
      );
      setIsAppointmentDetailsOpen(false);
      setSelectedAppointment(null);
      showSuccess('Appointment deleted successfully!');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showError('Failed to delete appointment. Please try again.');
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const updatedAppointment = await appointmentAPI.update(appointmentId, {
        status: newStatus,
      });

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updatedAppointment : apt))
      );

      // Update selected appointment if it's the one being changed
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(updatedAppointment);
      }

      showSuccess(`Appointment status updated to ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showError('Failed to update appointment status. Please try again.');
    }
  };

  const handleCloseModals = () => {
    setIsAppointmentFormOpen(false);
    setIsAppointmentDetailsOpen(false);
    setSelectedAppointment(null);
    setSelectedDateTime(null);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex items-center space-x-2 text-gray-600'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading appointments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col '>
      {/* Calendar View */}
      <div className='flex-1'>
        <CalendarView
          appointments={appointments}
          onAppointmentClick={handleViewAppointment}
          onTimeSlotClick={handleNewAppointment}
          workingHours={{ start: 8, end: 20 }}
          defaultView='day'
        />
      </div>

      {/* Appointment Form Modal */}
      <AppointmentForm
        appointment={selectedAppointment}
        isOpen={isAppointmentFormOpen}
        onClose={handleCloseModals}
        onSave={handleSaveAppointment}
        patients={patients}
        consultationTypes={consultationTypes}
        selectedDate={selectedDateTime}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetails
        appointment={selectedAppointment}
        isOpen={isAppointmentDetailsOpen}
        onClose={handleCloseModals}
        onEdit={handleEditAppointment}
        onDelete={handleDeleteAppointment}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default MeetingsSection;
