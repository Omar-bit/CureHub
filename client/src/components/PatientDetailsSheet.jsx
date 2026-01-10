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
  UserPlus,
  Edit,
  Trash,
  Sparkles,
  Copy,
  RotateCcw,
  Paperclip,
} from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { appointmentAPI, taskAPI, patientAPI } from '../services/api';
import PatientDocumentsTab from './PatientDocumentsTab';
import PatientRelativesTab from './PatientRelativesTab';
import PatientActesTab from './PatientActesTab';
import PatientTasksTab from './PatientTasksTab';
import PatientFormSheet from './PatientFormSheet';
import AppointmentForm from './appointments/AppointmentForm';
import { showSuccess, showError } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorProfile } from '../hooks/useDoctorProfile';
import { geminiService } from '../services/gemini';

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
  onPatientUpdated,
}) => {
  const { user } = useAuth();
  const { profile: doctorProfile } = useDoctorProfile();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [appointments, setAppointments] = useState({
    upcoming: [],
    past: [],
  });
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [preSelectedPatientId, setPreSelectedPatientId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');

  // AI Message Generation State
  const [emailAiPrompt, setEmailAiPrompt] = useState('');
  const [smsAiPrompt, setSmsAiPrompt] = useState('');
  const [generatingEmailAi, setGeneratingEmailAi] = useState(false);
  const [generatingSmsAi, setGeneratingSmsAi] = useState(false);
  const [showEmailAiPanel, setShowEmailAiPanel] = useState(false);
  const [showSmsAiPanel, setShowSmsAiPanel] = useState(false);

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

  // Fetch tasks when historique tab is active
  useEffect(() => {
    if (patient?.id && activeTab === 'historique') {
      fetchPatientTasks();
    }
  }, [patient?.id, activeTab]);

  // Build timeline when data is available
  useEffect(() => {
    if (activeTab === 'historique') {
      buildTimeline();
    }
  }, [appointments, tasks, patient, activeTab]);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchPatientAppointments = async () => {
    if (!patient?.id) return;

    setLoadingAppointments(true);
    try {
      // Fetch appointments including deleted ones
      const response = await appointmentAPI.getByPatient(patient.id, { includeDeleted: true });
      const appointmentData = response.appointments || [];
      console.log('Fetched Appointments:', appointmentData);

      // Separate appointments by time (include deleted in their respective categories)
      const now = new Date();
      const upcoming = appointmentData.filter(
        (apt) => new Date(apt.startTime) > now
      );
      const past = appointmentData.filter(
        (apt) => new Date(apt.startTime) <= now
      );

      setAppointments({
        upcoming: upcoming.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        ),
        past: past.sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime)
        ),
      });
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      setAppointments({ upcoming: [], past: [] });
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchPatientTasks = async () => {
    if (!patient?.id) return;

    setLoadingTasks(true);
    try {
      const response = await taskAPI.getAll({ patientId: patient.id });
      setTasks(response || []);
    } catch (error) {
      console.error('Error fetching patient tasks:', error);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const buildTimeline = () => {
    setLoadingTimeline(true);
    try {
      const events = [];

      // Add patient creation event
      if (patient?.createdAt) {
        events.push({
          id: `patient-created-${patient.id}`,
          type: 'patient_created',
          date: new Date(patient.createdAt),
          title: 'Patient créé',
          description: `Le dossier patient a été créé`,
          icon: 'UserPlus',
          color: 'green',
        });
      }

      // Add patient update event (if updated after creation)
      if (patient?.updatedAt && patient?.createdAt) {
        const createdDate = new Date(patient.createdAt).getTime();
        const updatedDate = new Date(patient.updatedAt).getTime();
        // Only add if there's a meaningful difference (more than 1 minute)
        if (updatedDate - createdDate > 60000) {
          events.push({
            id: `patient-updated-${patient.id}`,
            type: 'patient_updated',
            date: new Date(patient.updatedAt),
            title: 'Informations mises à jour',
            description: `Le dossier patient a été modifié`,
            icon: 'Edit',
            color: 'blue',
          });
        }
      }

      // Add appointments
      const allAppointments = [
        ...appointments.upcoming,
        ...appointments.past,
        ...appointments.cancelled,
      ];

      allAppointments.forEach((apt) => {
        const aptDate = new Date(apt.startTime);
        const now = new Date();
        let eventType = 'appointment_scheduled';
        let title = 'Rendez-vous programmé';
        let description = '';

        if (apt.status === 'CANCELLED') {
          eventType = 'appointment_cancelled';
          title = 'Rendez-vous annulé';
          description = apt.consultationType?.name || 'Consultation';
        } else if (apt.status === 'COMPLETED') {
          eventType = 'appointment_completed';
          title = 'Rendez-vous terminé';
          description = apt.consultationType?.name || 'Consultation';
        } else if (aptDate < now) {
          eventType = 'appointment_past';
          title = 'Rendez-vous passé';
          description = apt.consultationType?.name || 'Consultation';
        } else {
          description = apt.consultationType?.name || 'Consultation';
        }

        events.push({
          id: `appointment-${apt.id}`,
          type: eventType,
          date: aptDate,
          title: title,
          description: description,
          icon: 'Calendar',
          color:
            apt.status === 'CANCELLED'
              ? 'red'
              : aptDate > now
                ? 'blue'
                : 'gray',
          metadata: apt,
        });
      });

      // Add tasks
      tasks.forEach((task) => {
        const taskDate = task.dueDate
          ? new Date(task.dueDate)
          : new Date(task.createdAt);

        let eventType = task.completed ? 'task_completed' : 'task_created';
        let title = task.completed ? 'Tâche terminée' : 'Tâche créée';
        let color = task.completed
          ? 'green'
          : task.priority === 'HIGH'
            ? 'red'
            : 'orange';

        events.push({
          id: `task-${task.id}`,
          type: eventType,
          date: taskDate,
          title: title,
          description: task.title || task.description || 'Tâche',
          icon: 'CheckSquare',
          color: color,
          metadata: task,
        });

        // Add completion event if task is completed and has completedAt date
        if (task.completed && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          events.push({
            id: `task-completed-${task.id}`,
            type: 'task_completed',
            date: completedDate,
            title: 'Tâche marquée comme terminée',
            description: task.title || task.description || 'Tâche',
            icon: 'CheckSquare',
            color: 'green',
            metadata: task,
          });
        }
      });

      // Sort events by date (most recent first)
      events.sort((a, b) => b.date - a.date);

      setTimelineEvents(events);
    } catch (error) {
      console.error('Error building timeline:', error);
      setTimelineEvents([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // AI Message Generation Functions
  const getDoctorFullName = () => {
    if (doctorProfile?.user) {
      const { firstName, lastName } = doctorProfile.user;
      if (firstName && lastName) return `Dr. ${firstName} ${lastName}`;
      if (firstName) return `Dr. ${firstName}`;
      if (lastName) return `Dr. ${lastName}`;
    }
    if (user?.firstName && user?.lastName) {
      return `Dr. ${user.firstName} ${user.lastName}`;
    }
    return 'Dr.';
  };

  const handleGenerateEmailWithAi = async () => {
    if (!emailAiPrompt.trim()) {
      showError('Veuillez décrire le message que vous souhaitez générer');
      return;
    }

    setGeneratingEmailAi(true);
    try {
      const generatedEmail = await geminiService.generateProfessionalEmail({
        description: emailAiPrompt,
        patientName: patientName,
        doctorName: getDoctorFullName(),
        clinicName: doctorProfile?.clinicName || '',
        language: 'fr',
      });
      setEmailMessage(generatedEmail);
      setEmailAiPrompt('');
      setShowEmailAiPanel(false);
      showSuccess('Message généré avec succès !');
    } catch (error) {
      console.error('Error generating email with AI:', error);
      showError(
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de la génération du message'
      );
    } finally {
      setGeneratingEmailAi(false);
    }
  };

  const handleGenerateSmsWithAi = async () => {
    if (!smsAiPrompt.trim()) {
      showError('Veuillez décrire le message que vous souhaitez générer');
      return;
    }

    setGeneratingSmsAi(true);
    try {
      const generatedSms = await geminiService.generateProfessionalSMS({
        description: smsAiPrompt,
        patientName: patientName,
        doctorName: getDoctorFullName(),
        clinicName: doctorProfile?.clinicName || '',
        language: 'fr',
      });
      setSmsMessage(generatedSms);
      setSmsAiPrompt('');
      setShowSmsAiPanel(false);
      showSuccess('Message généré avec succès !');
    } catch (error) {
      console.error('Error generating SMS with AI:', error);
      showError(
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de la génération du message'
      );
    } finally {
      setGeneratingSmsAi(false);
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

  const getEventIcon = (iconName) => {
    const icons = {
      UserPlus: UserPlus,
      Edit: Edit,
      Calendar: Calendar,
      CheckSquare: CheckSquare,
      Trash: Trash,
      X: X,
    };
    const IconComponent = icons[iconName] || Activity;
    return IconComponent;
  };

  const getEventColorClass = (color) => {
    const colorClasses = {
      green: 'bg-green-100 text-green-600 border-green-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      red: 'bg-red-100 text-red-600 border-red-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200',
      gray: 'bg-gray-100 text-gray-600 border-gray-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
    };
    return colorClasses[color] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const formatTimelineDate = (date) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffInDays = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Aujourd'hui à ${eventDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (diffInDays === 1) {
      return `Hier à ${eventDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return eventDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
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
        className='w-full mt-6 '
      >
        <TabsList className='grid w-full grid-cols-8 gap-1 ' >
          <TabsTrigger value='profil' className='flex items-center gap-1'>
            <User className='size-3' />
            Profil
          </TabsTrigger>
          <TabsTrigger value='proches' className='flex items-center gap-1'>
            <Users className='size-3' />
            Proches
          </TabsTrigger>
          <TabsTrigger value='contacter' className='flex items-center gap-1'>
            <Phone className='size-3' />
            Contacter
          </TabsTrigger>
          <TabsTrigger value='documents' className='flex items-center gap-1'>
            <FileText className='size-3' />
            Documents
          </TabsTrigger>
          <TabsTrigger value='actes' className='flex items-center gap-1'>
            <Activity className='size-3' />
            Actes
          </TabsTrigger>
          <TabsTrigger value='rdv' className='flex items-center gap-1'>
            <CalendarDays className='size-3' />
            RDV
          </TabsTrigger>
          <TabsTrigger value='taches' className='flex items-center gap-1'>
            <CheckSquare className='size-3' />
            Tâches
          </TabsTrigger>
          <TabsTrigger value='historique' className='flex items-center gap-1'>
            <History className='size-3' />
            Historique
          </TabsTrigger>
        </TabsList>

        <div className='mt-6'>
          <TabsContent value='profil' className='space-y-4'>
            <PatientFormSheet
              patient={patient}
              isOpen={true}
              onClose={() => { }}
              onSave={async (data) => {
                try {
                  await patientAPI.update(patient.id, data);
                  showSuccess('Patient modifié avec succès');
                  // Refresh the patient list to reflect the change
                  if (onPatientUpdated) {
                    onPatientUpdated();
                  }
                  // Note: Don't call onEdit here as it opens a separate PatientFormSheet
                  // The patient data will be refreshed via onPatientUpdated
                } catch (error) {
                  showError(error.message || 'Erreur lors de la modification');
                  throw error;
                }
              }}
              onDelete={onDelete}
              onBlock={async (patientToBlock) => {
                try {
                  const newBlockedStatus = !patientToBlock.isBlocked;
                  await patientAPI.update(patientToBlock.id, {
                    isBlocked: newBlockedStatus,
                  });
                  showSuccess(
                    newBlockedStatus
                      ? 'Patient bloqué avec succès'
                      : 'Patient débloqué avec succès'
                  );
                  // Refresh the patient list to reflect the change
                  if (onPatientUpdated) {
                    onPatientUpdated();
                  }
                  // Note: Don't call onEdit here as it opens a separate PatientFormSheet
                } catch (error) {
                  showError(
                    error.message || 'Erreur lors de la modification du statut'
                  );
                }
              }}
              inline={true}
            />
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
                <div className='p-4 border rounded-lg'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                        <MessageSquare className='w-5 h-5 text-blue-600' />
                      </div>
                      <div>
                        <p className='font-medium text-foreground'>Par SMS</p>
                      </div>
                    </div>
                    {/* <Button
                      size='sm'
                      variant='ghost'
                      className='text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                      onClick={() => setShowSmsAiPanel(!showSmsAiPanel)}
                    >
                      <Sparkles className='w-4 h-4 mr-1' />
                      {showSmsAiPanel ? 'Masquer IA' : 'Générer avec IA'}
                    </Button> */}
                  </div>

                  {/* AI Generation Panel for SMS */}
                  {showSmsAiPanel && (
                    <div className='mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg'>
                      <div className='flex items-center gap-2 mb-3'>
                        <Sparkles className='w-4 h-4 text-purple-600' />
                        <span className='text-sm font-medium text-purple-800'>
                          Assistant IA - Génération de SMS
                        </span>
                      </div>
                      <textarea
                        value={smsAiPrompt}
                        onChange={(e) => setSmsAiPrompt(e.target.value)}
                        placeholder="Décrivez le message que vous souhaitez envoyer... (ex: 'Rappeler le rendez-vous de demain à 14h', 'Demander de rappeler pour confirmer', 'Informer d'un changement d'horaire')"
                        className='w-full min-h-[60px] p-3 border border-purple-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-sm'
                        disabled={generatingSmsAi}
                      />
                      <div className='flex items-center justify-between mt-3'>
                        <p className='text-xs text-purple-600'>
                          L'IA génèrera un SMS professionnel et concis
                        </p>
                        <Button
                          size='sm'
                          disabled={!smsAiPrompt.trim() || generatingSmsAi}
                          onClick={handleGenerateSmsWithAi}
                          className='bg-purple-600 hover:bg-purple-700 text-white'
                        >
                          {generatingSmsAi ? (
                            <>
                              <Loader2 className='w-4 h-4 animate-spin mr-1' />
                              Génération...
                            </>
                          ) : (
                            <>
                              <Sparkles className='w-4 h-4 mr-1' />
                              Générer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className='space-y-3'>
                    <div className='relative'>
                      <textarea
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        placeholder={`Message pour ${patientName}...`}
                        className='w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50'
                      />
                      {smsMessage && (
                        <div className='absolute top-2 right-2 flex gap-1'>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(smsMessage);
                              showSuccess('Message copié !');
                            }}
                            className='p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded'
                            title='Copier'
                          >
                            <Copy className='w-4 h-4' />
                          </button>
                          <button
                            onClick={() => setSmsMessage('')}
                            className='p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded'
                            title='Effacer'
                          >
                            <RotateCcw className='w-4 h-4' />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        {patient.phoneNumber}
                      </span>
                      <Button
                        size='sm'
                        disabled={!smsMessage.trim()}
                        variant='outline'
                        onClick={() => {
                          showError(
                            'Service SMS non disponible pour le moment'
                          );
                        }}
                      >
                        <Send className='w-4 h-4 mr-1' />
                        Envoyer
                      </Button>
                    </div>
                    <p className='text-xs text-muted-foreground italic'>
                      * Service SMS bientôt disponible
                    </p>
                  </div>
                </div>
              )}

              {/* Email Contact */}
              {patient.email && (
                <div className='p-4 border rounded-lg'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center'>
                        <Mail className='w-5 h-5 text-orange-600' />
                      </div>
                      <div>
                        <p className='font-medium text-foreground'>Par email</p>
                      </div>
                    </div>
                    {/* <Button
                      size='sm'
                      variant='ghost'
                      className='text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                      onClick={() => setShowEmailAiPanel(!showEmailAiPanel)}
                    >
                      <Sparkles className='w-4 h-4 mr-1' />
                      {showEmailAiPanel ? 'Masquer IA' : 'Générer avec IA'}
                    </Button> */}
                  </div>

                  {/* AI Generation Panel for Email */}
                  {showEmailAiPanel && (
                    <div className='mb-4 p-4 bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-200 rounded-lg'>
                      <div className='flex items-center gap-2 mb-3'>
                        <Sparkles className='w-4 h-4 text-purple-600' />
                        <span className='text-sm font-medium text-purple-800'>
                          Assistant IA - Génération d'Email
                        </span>
                      </div>
                      <textarea
                        value={emailAiPrompt}
                        onChange={(e) => setEmailAiPrompt(e.target.value)}
                        placeholder="Décrivez le message que vous souhaitez envoyer... (ex: 'Envoyer les résultats d'analyse avec une explication rassurante', 'Rappeler le rendez-vous de suivi', 'Demander de prendre un nouveau rendez-vous')"
                        className='w-full min-h-[80px] p-3 border border-purple-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-sm'
                        disabled={generatingEmailAi}
                      />
                      <div className='flex items-center justify-between mt-3'>
                        <p className='text-xs text-purple-600'>
                          L'IA génèrera un email professionnel et bienveillant
                        </p>
                        <Button
                          size='sm'
                          disabled={!emailAiPrompt.trim() || generatingEmailAi}
                          onClick={handleGenerateEmailWithAi}
                          className='bg-purple-600 hover:bg-purple-700 text-white'
                        >
                          {generatingEmailAi ? (
                            <>
                              <Loader2 className='w-4 h-4 animate-spin mr-1' />
                              Génération...
                            </>
                          ) : (
                            <>
                              <Sparkles className='w-4 h-4 mr-1' />
                              Générer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className='space-y-3'>
                    <div className='relative'>
                      <textarea
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder={`Message pour ${patientName}...`}
                        className='w-full min-h-[120px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50'
                      />
                      {emailMessage && (
                        <div className='absolute top-2 right-2 flex gap-1'>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(emailMessage);
                              showSuccess('Message copié !');
                            }}
                            className='p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded'
                            title='Copier'
                          >
                            <Copy className='w-4 h-4' />
                          </button>
                          <button
                            onClick={() => setEmailMessage('')}
                            className='p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded'
                            title='Effacer'
                          >
                            <RotateCcw className='w-4 h-4' />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* File Attachment Section */}
                    <div className='flex items-center gap-2'>
                      <input
                        type="file"
                        id="email-attachment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => document.getElementById('email-attachment').click()}
                      >
                        <Paperclip className="w-4 h-4" />
                        {selectedFile ? 'Changer le fichier' : 'Joindre un fichier'}
                      </Button>

                      {selectedFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className='flex items-center justify-between'>
                      <a
                        href={`mailto:${patient.email}`}
                        className='flex items-center gap-1 text-sm text-blue-600 hover:underline'
                      >
                        <Mail className='w-3 h-3' />
                        {patient.email}
                      </a>
                      <Button
                        size='sm'
                        disabled={!emailMessage.trim() || sendingEmail}
                        onClick={async () => {
                          if (!emailMessage.trim()) return;
                          setSendingEmail(true);
                          try {
                            const formData = new FormData();
                            formData.append('subject', 'Message de votre médecin');
                            formData.append('message', emailMessage);
                            if (selectedFile) {
                              formData.append('file', selectedFile);
                            }

                            // We need access to axios directly or update patientAPI to handle this specific call with FormData
                            // Since patientAPI.sendEmail wraps api.post, we can pass the FormData directly
                            // BUT we need to make sure the Content-Type header is set correctly for multipart/form-data
                            // By passing FormData, axios usually detects it. 
                            // However, the api wrapper function takes (id, data) -> api.post(url, data)

                            await patientAPI.sendEmail(patient.id, formData);

                            showSuccess('Email envoyé avec succès');
                            setEmailMessage('');
                            setSelectedFile(null);
                          } catch (error) {
                            console.error(error);
                            showError(
                              error.response?.data?.message ||
                              "Échec de l'envoi de l'email"
                            );
                          } finally {
                            setSendingEmail(false);
                          }
                        }}
                      >
                        {sendingEmail ? (
                          <Loader2 className='w-4 h-4 animate-spin mr-1' />
                        ) : (
                          <Send className='w-4 h-4 mr-1' />
                        )}
                        Envoyer
                      </Button>
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
                          className={`border rounded-lg p-4 shadow-sm transition-shadow ${appointment.isDeleted
                            ? 'bg-gray-100 border-gray-300 opacity-80'
                            : appointment.status === 'CANCELLED'
                              ? 'bg-red-50 border-red-300 hover:shadow-md'
                              : 'bg-white border-gray-200 hover:shadow-md'
                            }`}
                        >
                          <div className='flex items-start gap-4'>
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div
                                className={`text-white text-xs font-medium px-2 py-1 rounded mb-2 ${appointment.isDeleted
                                  ? 'bg-gray-400'
                                  : appointment.status === 'CANCELLED'
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                                  } ${appointment.isDeleted ? 'line-through' : ''}`}
                              >
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className={`text-xs uppercase ${appointment.isDeleted ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className={`text-xl font-bold ${appointment.isDeleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className={`text-xs mt-1 ${appointment.isDeleted ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                                  {dateTime.time}
                                </div>
                                <div className='text-xs text-gray-400 mt-1'>
                                  {dateTime.month} {dateTime.year}
                                </div>
                              </div>
                            </div>

                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User
                                  className={`w-4 h-4 ${appointment.isDeleted
                                    ? 'text-gray-400'
                                    : appointment.status === 'CANCELLED'
                                      ? 'text-red-500'
                                      : 'text-blue-500'
                                    }`}
                                />
                                <span className={`font-medium ${appointment.isDeleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                  {doctorName}
                                </span>
                                {appointment.isDeleted && (
                                  <span className='ml-auto text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded'>
                                    Supprimé
                                  </span>
                                )}
                                {!appointment.isDeleted && appointment.status === 'CANCELLED' && (
                                  <span className='ml-auto text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded'>
                                    Annulé
                                  </span>
                                )}
                              </div>
                              <div className='flex items-center gap-2'>
                                <div
                                  className={`w-2 h-2 rounded-full ${appointment.isDeleted
                                    ? 'bg-gray-400'
                                    : appointment.status === 'CANCELLED'
                                      ? 'bg-red-500'
                                      : 'bg-blue-500'
                                    }`}
                                ></div>
                                <span
                                  className={`text-sm font-medium ${appointment.isDeleted
                                    ? 'text-gray-400 line-through'
                                    : appointment.status === 'CANCELLED'
                                      ? 'text-red-600'
                                      : 'text-blue-600'
                                    }`}
                                >
                                  {appointment.isDeleted
                                    ? 'Supprimé'
                                    : appointment.status === 'CANCELLED'
                                      ? 'Annulé'
                                      : urgency}
                                </span>
                              </div>
                            </div>

                            {!appointment.isDeleted && (
                              <div className='flex items-start'>
                                <Button
                                  size='sm'
                                  className='bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1.5 rounded-md'
                                >
                                  <Send className='w-3 h-3 mr-1' />
                                  Rappel
                                </Button>
                              </div>
                            )}
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

                {/* Cancelled Appointments Section - REMOVED */}
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
                          className={`border rounded-lg p-4 shadow-sm transition-shadow ${appointment.isDeleted
                            ? 'bg-gray-100 border-gray-300 opacity-80'
                            : appointment.status === 'CANCELLED'
                              ? 'bg-red-50 border-red-300 hover:shadow-md'
                              : 'bg-gray-50 border-gray-200 hover:shadow-md'
                            }`}
                        >
                          <div className='flex items-start gap-4'>
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div
                                className={`text-white text-xs font-medium px-2 py-1 rounded mb-2 ${appointment.isDeleted
                                  ? 'bg-gray-400'
                                  : appointment.status === 'CANCELLED'
                                    ? 'bg-red-500'
                                    : 'bg-gray-500'
                                  } ${appointment.isDeleted ? 'line-through' : ''}`}
                              >
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className={`text-xs uppercase ${appointment.isDeleted ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className={`text-xl font-bold ${appointment.isDeleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className={`text-xs mt-1 ${appointment.isDeleted ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                                  {dateTime.time}
                                </div>
                                <div className='text-xs text-gray-400 mt-1'>
                                  {dateTime.month} {dateTime.year}
                                </div>
                              </div>
                            </div>

                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User
                                  className={`w-4 h-4 ${appointment.isDeleted
                                    ? 'text-gray-400'
                                    : appointment.status === 'CANCELLED'
                                      ? 'text-red-500'
                                      : 'text-gray-500'
                                    }`}
                                />
                                <span className={`font-medium ${appointment.isDeleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                  {doctorName}
                                </span>
                                {appointment.isDeleted && (
                                  <span className='ml-auto text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded'>
                                    Supprimé
                                  </span>
                                )}
                                {!appointment.isDeleted && appointment.status === 'CANCELLED' && (
                                  <span className='ml-auto text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded'>
                                    Annulé
                                  </span>
                                )}
                              </div>
                              <div className='flex items-center gap-2'>
                                <div
                                  className={`w-2 h-2 rounded-full ${appointment.isDeleted
                                    ? 'bg-gray-400'
                                    : appointment.status === 'CANCELLED'
                                      ? 'bg-red-500'
                                      : 'bg-gray-500'
                                    }`}
                                ></div>
                                <span
                                  className={`text-sm font-medium ${appointment.isDeleted
                                    ? 'text-gray-400 line-through'
                                    : appointment.status === 'CANCELLED'
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                                    }`}
                                >
                                  {appointment.isDeleted
                                    ? 'Supprimé'
                                    : appointment.status === 'CANCELLED'
                                      ? 'Annulé'
                                      : urgency}
                                </span>
                              </div>
                              <div
                                className={`text-xs mt-2 ${appointment.isDeleted
                                  ? 'text-gray-400 line-through'
                                  : appointment.status === 'CANCELLED'
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                                  }`}
                              >
                                Statut:{' '}
                                {appointment.isDeleted ? 'Supprimé' : getAppointmentStatusLabel(appointment.status)}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`flex justify-center mt-3 pt-2 ${appointment.isDeleted
                              ? 'border-t border-gray-200'
                              : appointment.status === 'CANCELLED'
                                ? 'border-t border-red-200'
                                : 'border-t border-gray-100'
                              }`}
                          >
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
            {loadingAppointments || loadingTasks || loadingTimeline ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='w-6 h-6 animate-spin text-primary' />
                <span className='ml-2 text-muted-foreground'>
                  Chargement de l'historique...
                </span>
              </div>
            ) : (
              <div className='space-y-4'>
                {/* Header */}
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
                    <History className='w-5 h-5 text-primary' />
                    Historique complet
                    <span className='text-sm font-normal text-muted-foreground'>
                      ({timelineEvents.length} événements)
                    </span>
                  </h3>
                </div>

                {/* Timeline */}
                {timelineEvents.length > 0 ? (
                  <div className='relative space-y-4'>
                    {/* Timeline line */}
                    <div className='absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200'></div>

                    {timelineEvents.map((event, index) => {
                      const IconComponent = getEventIcon(event.icon);
                      const colorClass = getEventColorClass(event.color);

                      return (
                        <div
                          key={event.id}
                          className='relative flex gap-4 items-start'
                        >
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-12 h-12 rounded-full border-2 ${colorClass} flex items-center justify-center z-10`}
                          >
                            <IconComponent className='w-5 h-5' />
                          </div>

                          {/* Content */}
                          <div className='flex-1 bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow'>
                            <div className='flex items-start justify-between gap-4'>
                              <div className='flex-1'>
                                <h4 className='font-semibold text-foreground mb-1'>
                                  {event.title}
                                </h4>
                                <p className='text-sm text-muted-foreground mb-2'>
                                  {event.description}
                                </p>
                                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                  <Clock className='w-3 h-3' />
                                  <span>{formatTimelineDate(event.date)}</span>
                                </div>

                                {/* Additional metadata for appointments */}
                                {event.metadata &&
                                  event.type.startsWith('appointment') && (
                                    <div className='mt-3 pt-3 border-t border-gray-100'>
                                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                                        <div className='flex items-center gap-1'>
                                          <User className='w-3 h-3' />
                                          <span>
                                            {getDoctorName(event.metadata)}
                                          </span>
                                        </div>
                                        <div className='flex items-center gap-1'>
                                          <AlertCircle className='w-3 h-3' />
                                          <span>
                                            {getAppointmentStatusLabel(
                                              event.metadata.status
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                {/* Additional metadata for tasks */}
                                {event.metadata &&
                                  event.type.startsWith('task') && (
                                    <div className='mt-3 pt-3 border-t border-gray-100'>
                                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                                        {event.metadata.priority && (
                                          <div className='flex items-center gap-1'>
                                            <AlertCircle className='w-3 h-3' />
                                            <span>
                                              Priorité:{' '}
                                              {event.metadata.priority ===
                                                'HIGH'
                                                ? 'Haute'
                                                : event.metadata.priority ===
                                                  'MEDIUM'
                                                  ? 'Moyenne'
                                                  : 'Basse'}
                                            </span>
                                          </div>
                                        )}
                                        {event.metadata.completed && (
                                          <div className='flex items-center gap-1'>
                                            <CheckSquare className='w-3 h-3 text-green-600' />
                                            <span className='text-green-600'>
                                              Terminée
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              {/* Event type badge */}
                              <div
                                className={`px-2 py-1 rounded text-xs font-medium ${event.color === 'green'
                                  ? 'bg-green-50 text-green-700'
                                  : event.color === 'blue'
                                    ? 'bg-blue-50 text-blue-700'
                                    : event.color === 'red'
                                      ? 'bg-red-50 text-red-700'
                                      : event.color === 'orange'
                                        ? 'bg-orange-50 text-orange-700'
                                        : 'bg-gray-50 text-gray-700'
                                  }`}
                              >
                                {event.type
                                  .replace('_', ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className='text-center text-muted-foreground py-8 border rounded-lg'>
                    <History className='w-12 h-12 mx-auto mb-4 opacity-50' />
                    <p>Aucun événement dans l'historique</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

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
