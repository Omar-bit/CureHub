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
  const [initialPatientsForForm, setInitialPatientsForForm] = useState(null); // Pre-selected patients for new appointment

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

  const handleViewAppointment = async (appointment) => {
    try {
      // Fetch full appointment details to ensure we have all patient data
      const fullAppointment = await appointmentAPI.getById(appointment.id);
      setSelectedAppointment(fullAppointment);
      setIsAppointmentDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      // Fallback to the appointment data we have
      setSelectedAppointment(appointment);
      setIsAppointmentDetailsOpen(true);
    }
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
      const updatedAppointment = await appointmentAPI.updateStatus(
        appointmentId,
        newStatus
      );

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

  // Handle adding a new appointment with pre-selected patient(s)
  const handleAddAppointmentWithPatient = (patientData) => {
    setSelectedDateTime(new Date());
    // Store the patients to pre-fill in the form
    setInitialPatientsForForm(patientData.patients);
    // Clear selectedAppointment since this is a new appointment
    setSelectedAppointment(null);
    setIsAppointmentDetailsOpen(false);
    setIsAppointmentFormOpen(true);
  };

  // Handle switching appointment location between ONSITE and ONLINE
  const handleLocationSwitch = async (appointment, newLocation) => {
    try {
      // Find a consultation type with the same properties but different location
      const currentConsultationType = appointment.consultationType;

      if (!currentConsultationType) {
        throw new Error('No consultation type found for this appointment');
      }

      // Find a matching consultation type with the new location
      const matchingConsultationType = consultationTypes.find(
        (ct) =>
          ct.location === newLocation &&
          ct.enabled &&
          ct.duration === currentConsultationType.duration
      );

      // If no exact match, find any consultation type with the new location
      const newConsultationType =
        matchingConsultationType ||
        consultationTypes.find(
          (ct) => ct.location === newLocation && ct.enabled
        );

      if (!newConsultationType) {
        throw new Error(
          `No consultation type found with location ${newLocation}`
        );
      }

      const updatedAppointment = await appointmentAPI.update(appointment.id, {
        consultationTypeId: newConsultationType.id,
      });

      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointment.id ? updatedAppointment : apt
        )
      );

      // Update selected appointment if it's the one being changed
      if (selectedAppointment?.id === appointment.id) {
        setSelectedAppointment(updatedAppointment);
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error switching appointment location:', error);
      throw error;
    }
  };

  const handleCloseModals = () => {
    setIsAppointmentFormOpen(false);
    setIsAppointmentDetailsOpen(false);
    setSelectedAppointment(null);
    setSelectedDateTime(null);
    setInitialPatientsForForm(null);
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
        onPatientCreated={handlePatientCreated}
        patients={patients}
        consultationTypes={consultationTypes}
        selectedDate={selectedDateTime}
        initialPatients={initialPatientsForForm}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetails
        appointment={selectedAppointment}
        isOpen={isAppointmentDetailsOpen}
        onClose={handleCloseModals}
        onEdit={handleEditAppointment}
        onDelete={handleDeleteAppointment}
        onStatusChange={handleStatusChange}
        onAddAppointment={handleAddAppointmentWithPatient}
        onLocationSwitch={handleLocationSwitch}
      />
    </div>
  );
};

export default MeetingsSection;
