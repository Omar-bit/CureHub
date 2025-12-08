import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Trash2,
  Users,
  FileText,
  Activity,
  History,
  MessageSquare,
  Clock,
  Plus,
  Send,
  ChevronDown,
  AlertCircle,
  Loader2,
  CheckSquare,
  CalendarDays,
  X,
} from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { appointmentAPI } from '../services/api';
import PatientDocumentsTab from './PatientDocumentsTab';
import PatientRelativesTab from './PatientRelativesTab';
import PatientActesTab from './PatientActesTab';
import PatientTasksTab from './PatientTasksTab';
import AppointmentForm from './appointments/AppointmentForm';
import { showSuccess } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorProfile } from '../hooks/useDoctorProfile';

// Wrapper component to pre-select a patient in the appointment form
const PreSelectedPatientAppointmentForm = ({
  patientId,
  patient,
  onClose,
  onSave,
  patients,
  consultationTypes,
}) => {
  // Ensure consultationTypes is always an array
  const safeConsultationTypes = Array.isArray(consultationTypes)
    ? consultationTypes
    : [];
  // Move the pre-selected patient to the front of the list
  const safePatients = Array.isArray(patients) ? [...patients] : [];

  // Sort patients to put the selected one first (helps with visibility)
  if (patient) {
    const patientIndex = safePatients.findIndex((p) => p.id === patient.id);
    if (patientIndex > 0) {
      const [selectedPatient] = safePatients.splice(patientIndex, 1);
      safePatients.unshift(selectedPatient);
    }
  }

  // Wrap onSave to ensure patient is included
  const handleSave = async (appointmentData) => {
    try {
      //complete the appointment creation here using this service appointmentAPI.create(appointmentData);

      const newAppointment = await appointmentAPI.create(appointmentData);
      showSuccess('Appointment created successfully!');

      // Notify parent about the created appointment for calendar navigation
      if (onSave && typeof onSave === 'function') {
        await onSave(newAppointment);
      }

      return newAppointment;
    } catch (error) {
      console.error('Error saving appointment:', error);
      showSuccess('Appointment creation failed.');
      throw error;
    }
  };

  return (
    <div className='space-y-4'>
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
        <div className='flex items-center gap-2 text-blue-800'>
          <User className='w-4 h-4' />
          <span className='font-medium'>
            Patient: {patient?.name?.replace(/!SP!/g, ' ') || ''}
          </span>
        </div>
        <p className='text-xs text-blue-600 mt-1'>
          Ce rendez-vous sera créé pour ce patient
        </p>
      </div>
      <AppointmentForm
        appointment={null}
        isOpen={false}
        onClose={onClose}
        onSave={handleSave}
        patients={safePatients}
        consultationTypes={safeConsultationTypes}
        selectedDate={new Date()}
        inline={true}
        onPatientCreated={null}
      />
    </div>
  );
};

const PatientDetailsSheet = ({
  patient,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  initialTab = 'profil',
  onView,
  patients = [],
  consultationTypes = [],
  onAppointmentCreated,
}) => {
  const { user } = useAuth();
  const { profile: doctorProfile } = useDoctorProfile();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [appointments, setAppointments] = useState({
    upcoming: [],
    past: [],
    cancelled: [],
  });
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [preSelectedPatientId, setPreSelectedPatientId] = useState(null);
  const patientName = patient.name.includes('!SP!')
    ? patient.name.split('!SP!').join(' ')
    : patient.name;
  // Fetch appointments when patient changes or tab becomes active
  useEffect(() => {
    if (
      patient?.id &&
      (activeTab === 'historique' || activeTab === 'rdv' || isOpen)
    ) {
      fetchPatientAppointments();
    }
  }, [patient?.id, activeTab, isOpen]);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchPatientAppointments = async () => {
    if (!patient?.id) return;

    setLoadingAppointments(true);
    try {
      const response = await appointmentAPI.getByPatient(patient.id);
      const appointmentData = response.appointments || [];
      console.log('Fetched Appointments:', appointmentData);

      // Separate appointments by status and time
      const now = new Date();
      const cancelled = appointmentData.filter(
        (apt) => apt.status === 'CANCELLED'
      );
      const activeAppointments = appointmentData.filter(
        (apt) => apt.status !== 'CANCELLED'
      );
      const upcoming = activeAppointments.filter(
        (apt) => new Date(apt.startTime) > now
      );
      const past = activeAppointments.filter(
        (apt) => new Date(apt.startTime) <= now
      );

      setAppointments({
        upcoming: upcoming.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        ),
        past: past.sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime)
        ),
        cancelled: cancelled.sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime)
        ),
      });
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      setAppointments({ upcoming: [], past: [], cancelled: [] });
    } finally {
      setLoadingAppointments(false);
    }
  };

  if (!isOpen || !patient) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      month: date.toLocaleDateString('fr-FR', {
        month: 'long',
      }),
      year: date.getFullYear(),
    };
  };

  const getAppointmentStatusLabel = (status) => {
    const statusMap = {
      SCHEDULED: 'Programmé',
      CONFIRMED: 'Confirmé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
      ABSENT: 'Absent',
    };
    return statusMap[status] || status;
  };

  const getAppointmentTypeLabel = (consultationType) => {
    return consultationType?.name || 'Consultation';
  };

  const getUrgencyLevel = (appointment) => {
    // Check if appointment is urgent based on title, description, or other fields
    // For now, we'll check if the title or description contains urgent keywords
    const urgentKeywords = ['urgent', 'urgence', 'emergency', 'priorité'];
    const title = appointment.title?.toLowerCase() || '';
    const description = appointment.description?.toLowerCase() || '';

    const isUrgent = urgentKeywords.some(
      (keyword) => title.includes(keyword) || description.includes(keyword)
    );

    return isUrgent ? 'Urgence' : 'Normal';
  };

  const getDoctorName = (appointment) => {
    // Try to get doctor name from appointment.doctor relation
    if (appointment.doctor?.user) {
      const { firstName, lastName } = appointment.doctor.user;
      if (firstName && lastName) {
        return `Dr. ${firstName} ${lastName}`;
      } else if (firstName) {
        return `Dr. ${firstName}`;
      } else if (lastName) {
        return `Dr. ${lastName}`;
      }
    }

    // Fallback to current logged-in doctor from context
    if (user?.firstName && user?.lastName) {
      return `Dr. ${user.firstName} ${user.lastName}`;
    } else if (user?.firstName) {
      return `Dr. ${user.firstName}`;
    } else if (user?.lastName) {
      return `Dr. ${user.lastName}`;
    }

    // Last fallback
    return 'Médecin';
  };

  const handleNewAppointment = () => {
    setPreSelectedPatientId(patient.id);
    setShowAppointmentForm(true);
  };

  const handleAppointmentSaved = async (appointmentData) => {
    setShowAppointmentForm(false);
    setPreSelectedPatientId(null);
    // Refresh appointments list
    await fetchPatientAppointments();

    // Notify parent component for calendar navigation if callback provided
    if (onAppointmentCreated && appointmentData?.startTime) {
      const appointmentDate = new Date(appointmentData.startTime);
      onAppointmentCreated(appointmentDate);
    }
  };

  const handleAppointmentFormClose = () => {
    setShowAppointmentForm(false);
    setPreSelectedPatientId(null);
  };

  const ProfileContent = () => (
    <div className='space-y-6'>
      {/* Profile Section */}
      <div className='text-center'>
        <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
          {patient.profileImage ? (
            <img
              src={patient.profileImage}
              alt={patient.name}
              className='w-20 h-20 rounded-full object-cover'
            />
          ) : (
            <User className='w-10 h-10 text-primary' />
          )}
        </div>
        <h3 className='text-xl font-semibold text-foreground'>{patientName}</h3>
        <p className='text-muted-foreground'>
          {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
        </p>
      </div>

      {/* Information Section */}
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-foreground mb-1'>
            Date of Birth
          </label>
          <div className='flex items-center text-sm text-muted-foreground'>
            <Calendar className='w-4 h-4 mr-2' />
            {formatDate(patient.dateOfBirth)}
          </div>
        </div>

        {patient.email && (
          <div>
            <label className='block text-sm font-medium text-foreground mb-1'>
              Email Address
            </label>
            <div className='flex items-center text-sm text-muted-foreground'>
              <Mail className='w-4 h-4 mr-2' />
              {patient.email}
            </div>
          </div>
        )}

        {patient.phoneNumber && (
          <div>
            <label className='block text-sm font-medium text-foreground mb-1'>
              Phone Number
            </label>
            <div className='flex items-center text-sm text-muted-foreground'>
              <Phone className='w-4 h-4 mr-2' />
              {patient.phoneNumber}
            </div>
          </div>
        )}

        {patient.address && (
          <div>
            <label className='block text-sm font-medium text-foreground mb-1'>
              Address
            </label>
            <div className='flex items-start text-sm text-muted-foreground'>
              <MapPin className='w-4 h-4 mr-2 mt-0.5' />
              <span>{patient.address}</span>
            </div>
          </div>
        )}

        <div>
          <label className='block text-sm font-medium text-foreground mb-1'>
            Patient Since
          </label>
          <div className='text-sm text-muted-foreground'>
            {formatDate(patient.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <SheetContent onClose={onClose} className='w-full '>
      <SheetHeader>
        <div className='flex items-center gap-3'>
          <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0'>
            {patient.profileImage ? (
              <img
                src={patient.profileImage}
                alt={patient.name}
                className='w-12 h-12 rounded-full object-cover'
              />
            ) : (
              <User className='w-6 h-6 text-primary' />
            )}
          </div>
          <SheetTitle className='text-left'>{patientName}</SheetTitle>
        </div>
      </SheetHeader>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full mt-6'
      >
        <TabsList className='grid w-full grid-cols-8'>
          <TabsTrigger value='profil' className='flex items-center gap-2'>
            <User className='w-4 h-4' />
            Profil
          </TabsTrigger>
          <TabsTrigger value='proches' className='flex items-center gap-2'>
            <Users className='w-4 h-4' />
            Proches
          </TabsTrigger>
          <TabsTrigger value='contacter' className='flex items-center gap-2'>
            <Phone className='w-4 h-4' />
            Contacter
          </TabsTrigger>
          <TabsTrigger value='documents' className='flex items-center gap-2'>
            <FileText className='w-4 h-4' />
            Documents
          </TabsTrigger>
          <TabsTrigger value='actes' className='flex items-center gap-2'>
            <Activity className='w-4 h-4' />
            Actes
          </TabsTrigger>
          <TabsTrigger value='rdv' className='flex items-center gap-2'>
            <CalendarDays className='w-4 h-4' />
            RDV
          </TabsTrigger>
          <TabsTrigger value='taches' className='flex items-center gap-2'>
            <CheckSquare className='w-4 h-4' />
            Tâches
          </TabsTrigger>
          <TabsTrigger value='historique' className='flex items-center gap-2'>
            <History className='w-4 h-4' />
            Historique
          </TabsTrigger>
        </TabsList>

        <div className='mt-6'>
          <TabsContent value='profil' className='space-y-4'>
            <ProfileContent />
          </TabsContent>

          <TabsContent value='proches' className='space-y-4'>
            <PatientRelativesTab patient={patient} />
          </TabsContent>

          <TabsContent value='contacter' className='space-y-4'>
            <div className='space-y-4'>
              {/* Phone Contact */}
              {patient.phoneNumber && (
                <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                      <Phone className='w-5 h-5 text-green-600' />
                    </div>
                    <div>
                      <p className='font-medium text-foreground'>
                        Par téléphone
                      </p>
                      <p className='text-sm text-blue-600 hover:underline'>
                        {patient.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS Contact */}
              {patient.phoneNumber && (
                <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <MessageSquare className='w-5 h-5 text-blue-600' />
                    </div>
                    <div>
                      <p className='font-medium text-foreground'>Par SMS</p>
                      <p className='text-sm text-muted-foreground'>
                        Envoyer un SMS au {patient.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Contact */}
              {patient.email && (
                <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center'>
                      <Mail className='w-5 h-5 text-orange-600' />
                    </div>
                    <div>
                      <p className='font-medium text-foreground'>Par email</p>
                      <p className='text-sm text-blue-600 hover:underline'>
                        {patient.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* No contact info message */}
              {!patient.phoneNumber && !patient.email && (
                <div className='text-center text-muted-foreground py-8'>
                  <Phone className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p>Aucune information de contact disponible</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value='documents' className='space-y-4'>
            <PatientDocumentsTab patient={patient} />
          </TabsContent>

          <TabsContent value='actes' className='space-y-4'>
            <PatientActesTab patient={patient} />
          </TabsContent>

          <TabsContent value='rdv' className='space-y-4'>
            {loadingAppointments ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='w-6 h-6 animate-spin text-primary' />
                <span className='ml-2 text-muted-foreground'>
                  Chargement des rendez-vous...
                </span>
              </div>
            ) : (
              <div className='space-y-6'>
                {/* Upcoming Appointments Section */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
                      <Clock className='w-5 h-5 text-blue-500' />
                      RDV à venir
                      <span className='text-sm font-normal text-muted-foreground'>
                        ({appointments.upcoming.length})
                      </span>
                    </h3>
                    <Button
                      size='sm'
                      variant='outline'
                      className='text-xs'
                      onClick={handleNewAppointment}
                    >
                      <Plus className='w-3 h-3 mr-1' />
                      Nouveau RDV
                    </Button>
                  </div>

                  {appointments.upcoming.length > 0 ? (
                    appointments.upcoming.map((appointment) => {
                      const dateTime = formatDateTime(appointment.startTime);
                      const urgency = getUrgencyLevel(appointment);
                      const doctorName = getDoctorName(appointment);
                      const appointmentType = getAppointmentTypeLabel(
                        appointment.consultationType
                      );

                      return (
                        <div
                          key={appointment.id}
                          className='border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-start gap-4'>
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div className='bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded mb-2'>
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className='text-xs text-gray-500 uppercase'>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className='text-xl font-bold text-gray-900'>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                  {dateTime.time}
                                </div>
                              </div>
                            </div>

                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User className='w-4 h-4 text-blue-500' />
                                <span className='font-medium text-gray-900'>
                                  {doctorName}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                                <span className='text-sm text-blue-600 font-medium'>
                                  {urgency}
                                </span>
                              </div>
                            </div>

                            <div className='flex items-start'>
                              <Button
                                size='sm'
                                className='bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1.5 rounded-md'
                              >
                                <Send className='w-3 h-3 mr-1' />
                                Rappel
                              </Button>
                            </div>
                          </div>

                          <div className='flex justify-center mt-3 pt-2 border-t border-gray-100'>
                            <ChevronDown className='w-4 h-4 text-gray-400' />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className='text-center text-muted-foreground py-8 border rounded-lg'>
                      <CalendarDays className='w-12 h-12 mx-auto mb-4 opacity-50' />
                      <p>Aucun rendez-vous à venir</p>
                    </div>
                  )}
                </div>

                {/* Cancelled Appointments Section */}
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
                    <X className='w-5 h-5 text-red-500' />
                    RDV annulés
                    <span className='text-sm font-normal text-muted-foreground'>
                      ({appointments.cancelled.length})
                    </span>
                  </h3>

                  {appointments.cancelled.length > 0 ? (
                    appointments.cancelled.map((appointment) => {
                      const dateTime = formatDateTime(appointment.startTime);
                      const doctorName = getDoctorName(appointment);
                      const appointmentType = getAppointmentTypeLabel(
                        appointment.consultationType
                      );

                      return (
                        <div
                          key={appointment.id}
                          className='border border-red-200 rounded-lg p-4 bg-red-50 shadow-sm opacity-75'
                        >
                          <div className='flex items-start gap-4'>
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div className='bg-red-500 text-white text-xs font-medium px-2 py-1 rounded mb-2'>
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className='text-xs text-gray-500 uppercase'>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className='text-xl font-bold text-gray-900'>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                  {dateTime.time}
                                </div>
                              </div>
                            </div>

                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User className='w-4 h-4 text-red-500' />
                                <span className='font-medium text-gray-900'>
                                  {doctorName}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <X className='w-4 h-4 text-red-600' />
                                <span className='text-sm text-red-600 font-medium'>
                                  Annulé
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className='text-center text-muted-foreground py-8 border rounded-lg'>
                      <X className='w-12 h-12 mx-auto mb-4 opacity-50' />
                      <p>Aucun rendez-vous annulé</p>
                    </div>
                  )}
                </div>

                {/* Past Appointments Section */}
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
                    <History className='w-5 h-5 text-gray-500' />
                    RDV passés
                    <span className='text-sm font-normal text-muted-foreground'>
                      ({appointments.past.length})
                    </span>
                  </h3>

                  {appointments.past.length > 0 ? (
                    appointments.past.map((appointment) => {
                      const dateTime = formatDateTime(appointment.startTime);
                      const urgency = getUrgencyLevel(appointment);
                      const doctorName = getDoctorName(appointment);
                      const appointmentType = getAppointmentTypeLabel(
                        appointment.consultationType
                      );

                      return (
                        <div
                          key={appointment.id}
                          className='border rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-start gap-4'>
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div className='bg-gray-500 text-white text-xs font-medium px-2 py-1 rounded mb-2'>
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className='text-xs text-gray-500 uppercase'>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className='text-xl font-bold text-gray-900'>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                  {dateTime.time}
                                </div>
                              </div>
                            </div>

                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User className='w-4 h-4 text-gray-500' />
                                <span className='font-medium text-gray-900'>
                                  {doctorName}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                                <span className='text-sm text-gray-600 font-medium'>
                                  {urgency}
                                </span>
                              </div>
                              <div className='text-xs text-gray-500 mt-2'>
                                Statut:{' '}
                                {getAppointmentStatusLabel(appointment.status)}
                              </div>
                            </div>
                          </div>

                          <div className='flex justify-center mt-3 pt-2 border-t border-gray-100'>
                            <ChevronDown className='w-4 h-4 text-gray-400' />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className='text-center text-muted-foreground py-8 border rounded-lg'>
                      <History className='w-12 h-12 mx-auto mb-4 opacity-50' />
                      <p>Aucun rendez-vous passé</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value='taches' className='space-y-4'>
            <PatientTasksTab patient={patient} onPatientClick={onView} />
          </TabsContent>

          <TabsContent value='historique' className='space-y-4'>
            {loadingAppointments ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='w-6 h-6 animate-spin text-primary' />
                <span className='ml-2 text-muted-foreground'>
                  Chargement de l'historique...
                </span>
              </div>
            ) : (
              <div className='space-y-6'>
                {/* Header with scheduled tasks indicator */}
                {appointments.upcoming.length > 0 && (
                  <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                    <div className='flex items-center gap-2 text-yellow-800'>
                      <Clock className='w-4 h-4' />
                      <span className='font-medium'>Tâches programmées</span>
                    </div>
                  </div>
                )}

                {/* Upcoming Appointments */}
                {appointments.upcoming.length > 0 && (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold text-foreground'>
                        RDV à venir
                      </h3>
                      <Button size='sm' variant='outline' className='text-xs'>
                        <Plus className='w-3 h-3 mr-1' />
                        {new Date().getFullYear()}
                      </Button>
                    </div>

                    {appointments.upcoming.map((appointment) => {
                      const dateTime = formatDateTime(appointment.startTime);
                      const urgency = getUrgencyLevel(appointment);
                      const doctorName = getDoctorName(appointment);
                      const appointmentType = getAppointmentTypeLabel(
                        appointment.consultationType
                      );

                      return (
                        <div
                          key={appointment.id}
                          className='border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-start gap-4'>
                            {/* Left section - Date and Type */}
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div className='bg-red-500 text-white text-xs font-medium px-2 py-1 rounded mb-2'>
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className='text-xs text-gray-500 uppercase'>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className='text-xl font-bold text-gray-900'>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                  {dateTime.time}
                                </div>
                              </div>
                            </div>

                            {/* Middle section - Doctor and Urgency */}
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User className='w-4 h-4 text-yellow-500' />
                                <span className='font-medium text-gray-900'>
                                  {doctorName}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                                <span className='text-sm text-red-600 font-medium'>
                                  {urgency}
                                </span>
                              </div>
                            </div>

                            {/* Right section - Action button */}
                            <div className='flex items-start'>
                              <Button
                                size='sm'
                                className='bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1.5 rounded-md'
                              >
                                <Send className='w-3 h-3 mr-1' />
                                Envoyer un rappel
                              </Button>
                            </div>
                          </div>

                          {/* Bottom chevron */}
                          <div className='flex justify-center mt-3 pt-2 border-t border-gray-100'>
                            <ChevronDown className='w-4 h-4 text-gray-400' />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Past Appointments */}
                {appointments.past.length > 0 && (
                  <div className='space-y-3'>
                    <h3 className='text-lg font-semibold text-foreground'>
                      RDV passés
                    </h3>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        {new Date().getFullYear()}
                      </span>
                    </div>

                    {appointments.past.map((appointment) => {
                      const dateTime = formatDateTime(appointment.startTime);
                      const urgency = getUrgencyLevel(appointment);
                      const doctorName = getDoctorName(appointment);
                      const appointmentType = getAppointmentTypeLabel(
                        appointment.consultationType
                      );

                      return (
                        <div
                          key={appointment.id}
                          className='border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-start gap-4'>
                            {/* Left section - Date and Type */}
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div className='bg-red-500 text-white text-xs font-medium px-2 py-1 rounded mb-2'>
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className='text-xs text-gray-500 uppercase'>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className='text-xl font-bold text-gray-900'>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                  {dateTime.time}
                                </div>
                              </div>
                            </div>

                            {/* Middle section - Doctor and Urgency */}
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User className='w-4 h-4 text-yellow-500' />
                                <span className='font-medium text-gray-900'>
                                  {doctorName}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                                <span className='text-sm text-red-600 font-medium'>
                                  {urgency}
                                </span>
                              </div>
                              <div className='text-xs text-gray-500 mt-2'>
                                Statut:{' '}
                                {getAppointmentStatusLabel(appointment.status)}
                              </div>
                            </div>
                          </div>

                          {/* Bottom chevron */}
                          <div className='flex justify-center mt-3 pt-2 border-t border-gray-100'>
                            <ChevronDown className='w-4 h-4 text-gray-400' />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty state if no appointments */}
                {appointments.upcoming.length === 0 &&
                  appointments.past.length === 0 &&
                  !loadingAppointments && (
                    <div className='text-center text-muted-foreground py-8'>
                      <History className='w-12 h-12 mx-auto mb-4 opacity-50' />
                      <p>Aucun rendez-vous dans l'historique</p>
                    </div>
                  )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Action Buttons */}
      {activeTab === 'profil' && (
        <SheetFooter className='mt-8'>
          <Button
            onClick={() => onEdit(patient)}
            className='flex-1'
            leftIcon={<Edit3 />}
          >
            Edit Patient
          </Button>
          <Button
            onClick={() => onDelete(patient)}
            variant='destructive'
            className='flex-1'
            leftIcon={<Trash2 />}
          >
            Delete
          </Button>
        </SheetFooter>
      )}

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center'>
          <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden'>
            <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Nouveau rendez-vous pour {patientName}
              </h2>
              <button
                onClick={handleAppointmentFormClose}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
            <div className='overflow-y-auto max-h-[calc(90vh-80px)] p-6'>
              <PreSelectedPatientAppointmentForm
                patientId={preSelectedPatientId}
                patient={patient}
                onClose={handleAppointmentFormClose}
                onSave={handleAppointmentSaved}
                patients={patients}
                consultationTypes={consultationTypes}
              />
            </div>
          </div>
        </div>
      )}
    </SheetContent>
  );
};

export default PatientDetailsSheet;
