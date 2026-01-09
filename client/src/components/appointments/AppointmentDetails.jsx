import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  PlayCircle,
  Circle,
  DollarSign,
  Video,
  Home,
  Building2,
  Stethoscope,
  Video as VideoOn,
  AlertCircle,
  Download,
  Upload,
  History,
  Lock,
  Unlock,
  Plus,
  ArrowLeftRight,
  Rabbit,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
  getPatientDisplayName,
  getAppointmentPatientsDisplay,
} from '../../lib/patient';
import {
  appointmentAPI,
  appointmentDocumentsApi,
  patientAPI,
} from '../../services/api';
import { showSuccess, showError } from '../../lib/toast';
import PatientCard from '../PatientCard';
import PatientDetailsSheet from '../PatientDetailsSheet';
import DatePickerPopup from '../calendar/DatePickerPopup';

const STATUS_CHIP_TO_APPOINTMENT_STATUS = {
  waiting: 'WAITING', // Updated to reflect correct status
  seen: 'COMPLETED',
  absent: 'ABSENT',
  cancelled: 'CANCELLED',
};

const APPOINTMENT_STATUS_TO_CHIP = {
  SCHEDULED: 'scheduled', // Default status when created
  WAITING: 'waiting', // Updated to reflect correct status
  COMPLETED: 'seen',
  ABSENT: 'absent',
  CANCELLED: 'cancelled',
};

const AppointmentDetails = ({
  appointment,
  isOpen = false,
  onClose,
  onEdit = null,
  onDelete,
  onStatusChange = null,
  onAddAppointment = null,
  onLocationSwitch = null,
  inline = true,
}) => {
  console.log({ inline });
  const [activeTab, setActiveTab] = useState('motif'); // 'motif' | 'documents' | 'honoraires' | 'chronologie'
  const [selectedStatusChip, setSelectedStatusChip] = useState(null); // Track which status chip is active (visual state)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false); // Track async state for chip actions
  const [isDragging, setIsDragging] = useState(false); // Track drag state for file upload
  const [uploadedFiles, setUploadedFiles] = useState([]); // Track uploaded files (local state before upload)
  const [documents, setDocuments] = useState([]); // Existing documents from server
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false); // Track if video call panel is visible
  const [history, setHistory] = useState([]); // Appointment history
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [absenceCounts, setAbsenceCounts] = useState({}); // Track patient absence counts {patientId: count}
  const [selectedPatientForView, setSelectedPatientForView] = useState(null); // Track which patient's details to show
  const [selectedPatientTab, setSelectedPatientTab] = useState('profil'); // Track which tab to show for patient details
  const [documentBlockSettings, setDocumentBlockSettings] = useState({}); // Track block/share settings per document {documentId: {blockClientDownload: bool, shareUntilDate: string}}
  const [openDatePickerId, setOpenDatePickerId] = useState(null); // Track which document's date picker is open
  const [isSwitchingLocation, setIsSwitchingLocation] = useState(false); // Track location switch in progress
  const [showAbsenceBanner, setShowAbsenceBanner] = useState(false); // Track if absence notification banner is visible
  const [isSendingAbsenceNotification, setIsSendingAbsenceNotification] =
    useState(false); // Track if sending absence notification

  // When inline mode is true, show content if appointment exists, regardless of isOpen
  // When inline mode is false (modal/overlay), require both isOpen and appointment
  if (inline ? !appointment : !isOpen || !appointment) return null;

  const getDuration = () => {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMs = end - start;
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
  };

  const renderPatientNames = () => {
    return getAppointmentPatientsDisplay(appointment);
  };

  // Get all patients from appointment (for displaying additional info)
  const getAllPatients = () => {
    const patients = [];

    if (
      appointment.appointmentPatients &&
      appointment.appointmentPatients.length > 0
    ) {
      const sortedPatients = [...appointment.appointmentPatients].sort(
        (a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return 0;
        }
      );

      sortedPatients.forEach((ap) => {
        if (ap.patient) {
          patients.push(ap.patient);
        }
      });
    }

    // Fallback to old single patient field
    if (patients.length === 0 && appointment.patient) {
      patients.push(appointment.patient);
    }

    return patients;
  };

  const [localPatients, setLocalPatients] = useState(null);
  const patientsFromAppointment = getAllPatients();
  // Use local override when available to reflect optimistic updates (dejaVu increments, etc.)
  const patients = localPatients || patientsFromAppointment;
  const primaryPatient = patients[0]; // For displaying age, contact info, etc.

  useEffect(() => {
    if (!appointment?.status) {
      setSelectedStatusChip(null);
      return;
    }

    setSelectedStatusChip(
      APPOINTMENT_STATUS_TO_CHIP[appointment.status] || null
    );

    // Load documents when appointment changes
    if (appointment?.id) {
      loadDocuments();
      loadHistory();
    }

    // Load absence counts for all patients
    const allPatients = getAllPatients();
    loadAbsenceCounts(allPatients);

    // Initialize localPatients for optimistic UI updates, but avoid overwriting optimistic changes
    const currentIds = allPatients
      .map((p) => p.id || '')
      .sort()
      .join(',');
    const localIds = (localPatients || [])
      .map((p) => p.id || '')
      .sort()
      .join(',');
    if (!localPatients || currentIds !== localIds) {
      setLocalPatients(allPatients);
    }
  }, [
    appointment?.status,
    appointment?.id,
    appointment?.updatedAt,
    localPatients,
  ]);

  // Load documents from server
  const loadDocuments = async () => {
    if (!appointment?.id) return;

    setIsLoadingDocuments(true);
    try {
      const docs = await appointmentDocumentsApi.getByAppointment(
        appointment.id
      );
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      showError('Failed to load documents');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Load appointment history from server
  const loadHistory = async () => {
    if (!appointment?.id) return;

    setIsLoadingHistory(true);
    try {
      const historyData = await appointmentAPI.getHistory(appointment.id);
      setHistory(historyData || []);
    } catch (error) {
      console.error('Error loading history:', error);
      // Don't show error toast for history as it's not critical
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load absence counts for all patients
  const loadAbsenceCounts = async (patientsList) => {
    if (!patientsList || patientsList.length === 0) return;

    const counts = {};
    // Fetch each patient's data from API to get the latest absenceCount
    for (const patient of patientsList) {
      if (patient?.id) {
        try {
          const patientData = await patientAPI.getById(patient.id);
          counts[patient.id] = patientData.absenceCount || 0;
        } catch (error) {
          console.error(
            'Error fetching patient absence count:',
            patient.id,
            error
          );
          // Fallback to the absenceCount from the patient object if API fails
          counts[patient.id] = patient.absenceCount || 0;
        }
      }
    }
    setAbsenceCounts(counts);
  };

  // Handle incrementing absence count for a patient
  const handleIncrementAbsence = async (patient) => {
    if (!patient?.id) return;

    try {
      const result = await patientAPI.incrementAbsenceCount(patient.id);
      setAbsenceCounts((prev) => ({
        ...prev,
        [patient.id]: result.absenceCount,
      }));
      showSuccess("Compteur d'absences mis à jour");
    } catch (error) {
      console.error('Error incrementing absence count:', error);
      showError('Erreur lors de la mise à jour du compteur');
    }
  };

  // Handle status chip clicks - Update backend and visual state
  // Clicking an active status chip will reset the appointment to SCHEDULED
  const handleStatusChipClick = async (chipName) => {
    if (!appointment || isStatusUpdating) return;

    // If clicking the same chip that is already active, toggle back to SCHEDULED
    const isTogglingOff = selectedStatusChip === chipName;
    const targetStatus = isTogglingOff ? 'SCHEDULED' : STATUS_CHIP_TO_APPOINTMENT_STATUS[chipName];

    if (!targetStatus) return;

    const previousChip = selectedStatusChip;
    setSelectedStatusChip(isTogglingOff ? null : chipName);

    // Show absence banner when marking patient as absent (not when toggling off)
    if (chipName === 'absent' && !isTogglingOff) {
      setShowAbsenceBanner(true);
    } else {
      setShowAbsenceBanner(false);
    }

    if (!onStatusChange) return;

    try {
      setIsStatusUpdating(true);
      await onStatusChange(appointment.id, targetStatus);

      const allPatients = getAllPatients();

      // Automatically increment absence count for all patients when status changes to absent (not when toggling off)
      if (chipName === 'absent' && !isTogglingOff) {
        for (const patient of allPatients) {
          if (patient?.id) {
            try {
              const result = await patientAPI.incrementAbsenceCount(patient.id);
              setAbsenceCounts((prev) => ({
                ...prev,
                [patient.id]: result.absenceCount,
              }));
            } catch (error) {
              console.error(
                'Error incrementing absence count for patient:',
                patient.id,
                error
              );
            }
          }
        }
      }

      // Automatically decrement absence count for all patients when status changes from absent to another status
      // This includes toggling off the absent status
      if (previousChip === 'absent' && (chipName !== 'absent' || isTogglingOff)) {
        for (const patient of allPatients) {
          if (patient?.id) {
            try {
              const result = await patientAPI.decrementAbsenceCount(patient.id);
              setAbsenceCounts((prev) => ({
                ...prev,
                [patient.id]: result.absenceCount,
              }));
            } catch (error) {
              console.error(
                'Error decrementing absence count for patient:',
                patient.id,
                error
              );
            }
          }
        }
      }

      // If appointment marked as seen (not toggling off), increment patient's dejaVu
      if (chipName === 'seen' && !isTogglingOff) {
        for (const patient of allPatients) {
          if (patient?.id) {
            try {
              // Increment dejaVu count on the server
              await patientAPI.update(patient.id, {
                dejaVu: (patient.dejaVu || 0) + 1,
              });

              // Fetch fresh patient record to avoid shape/serialization issues
              const freshPatient = await patientAPI.getById(patient.id);

              // Update local patient cache for immediate UI feedback
              setLocalPatients((prev) => {
                const base = prev || allPatients;
                return base.map((p) =>
                  p.id === freshPatient.id ? freshPatient : p
                );
              });

              // Broadcast a lightweight event for other parts of the app to react if they need to
              try {
                window.dispatchEvent(
                  new CustomEvent('patient:updated', { detail: freshPatient })
                );
              } catch (e) {
                /* ignore on older browsers */
              }
            } catch (error) {
              console.error(
                'Error updating dejaVu for patient:',
                patient.id,
                error
              );
            }
          }
        }
      }

      // Reload history after status change
      loadHistory();
    } catch (error) {
      setSelectedStatusChip(previousChip);
      setShowAbsenceBanner(false);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Handle sending absence notification to patient
  const handleSendAbsenceNotification = async (send) => {
    if (send && appointment?.id) {
      setIsSendingAbsenceNotification(true);
      try {
        await appointmentAPI.sendAbsenceNotification(appointment.id);
        showSuccess("Message d'absence envoyé au patient");
      } catch (error) {
        console.error('Error sending absence notification:', error);
        showError("Erreur lors de l'envoi du message");
      } finally {
        setIsSendingAbsenceNotification(false);
      }
    }
    setShowAbsenceBanner(false);
  };

  // Get consultation badge color and icon based on consultation type location
  const getConsultationBadgeStyle = () => {
    const location = appointment.consultationType?.location;

    switch (location) {
      case 'ONLINE':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          icon: <VideoOn className='w-4 h-4 text-blue-600' />,
          label: 'Téléconsultation',
        };
      case 'ATHOME':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          icon: <Home className='w-4 h-4 text-red-600' />,
          label: 'Visite à domicile',
        };
      case 'ONSITE':
      default:
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          icon: <Building2 className='w-4 h-4 text-green-600' />,
          label: 'Consultation au cabinet',
        };
    }
  };

  // Handle drag and drop for file uploads
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
  };

  // Upload files to server
  const uploadFiles = async (files) => {
    if (!appointment?.id || files.length === 0) return;

    setIsUploadingDocument(true);
    try {
      // Upload each file with default blocking settings (not blocked, no expiry)
      for (const file of files) {
        await appointmentDocumentsApi.upload(
          file,
          appointment.id,
          null,
          null,
          false,
          null
        );
      }

      showSuccess(`${files.length} document(s) uploaded successfully`);
      // Reload documents list and history
      await loadDocuments();
      await loadHistory();
    } catch (error) {
      console.error('Error uploading documents:', error);
      showError('Failed to upload documents');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  // Delete a document
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await appointmentDocumentsApi.delete(documentId);
      showSuccess('Document deleted successfully');
      await loadDocuments();
      await loadHistory();
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
    }
  };

  // Download a document
  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const response = await appointmentDocumentsApi.download(documentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document');
    }
  };

  // Toggle document blocking for client download
  const handleToggleDocumentBlock = async (documentId, currentBlockStatus) => {
    try {
      const newBlockStatus = !currentBlockStatus;
      await appointmentDocumentsApi.update(documentId, {
        blockClientDownload: newBlockStatus,
      });
      showSuccess(
        `Document ${newBlockStatus ? 'blocked' : 'unblocked'} successfully`
      );
      await loadDocuments();
    } catch (error) {
      console.error('Error toggling document block:', error);
      showError('Failed to update document settings');
    }
  };

  // Update document share until date
  const handleUpdateShareDate = async (documentId, date) => {
    try {
      await appointmentDocumentsApi.update(documentId, {
        shareUntilDate: date,
      });
      showSuccess('Document sharing date updated successfully');
      await loadDocuments();
    } catch (error) {
      console.error('Error updating share date:', error);
      showError('Failed to update sharing date');
    }
  };

  // Handle patient card view actions
  const handlePatientView = (patient, tab) => {
    console.log(`Viewing patient ${patient.name} - ${tab} tab`);
    setSelectedPatientForView(patient);
    setSelectedPatientTab(tab);
  };

  const handlePatientEdit = (patient) => {
    console.log('Edit patient:', patient);
    setSelectedPatientForView(patient);
    setSelectedPatientTab('profil');
  };

  const handlePatientDelete = (patient) => {
    console.log('Delete patient:', patient);
    // In appointment context, we probably don't want to allow patient deletion
    showError('Cannot delete patient from appointment view');
  };

  // Handle switching appointment location between ONSITE and ONLINE
  const handleSwitchLocation = async () => {
    if (!onLocationSwitch) return;

    const currentLocation = appointment.consultationType?.location || 'ONSITE';
    const newLocation = currentLocation === 'ONSITE' ? 'ONLINE' : 'ONSITE';

    setIsSwitchingLocation(true);
    try {
      await onLocationSwitch(appointment, newLocation);
      showSuccess(
        newLocation === 'ONLINE'
          ? 'Rendez-vous converti en téléconsultation'
          : 'Rendez-vous converti en consultation au cabinet'
      );
    } catch (error) {
      console.error('Error switching location:', error);
      showError('Erreur lors de la conversion du rendez-vous');
    } finally {
      setIsSwitchingLocation(false);
    }
  };

  // Handle adding a new appointment with the same patient(s)
  const handleAddAppointmentWithPatient = () => {
    if (!onAddAppointment) return;

    // Pass the patient data to the add appointment handler
    const patientData = {
      patients: patients,
      primaryPatient: primaryPatient,
    };

    onAddAppointment(patientData);
  };

  // Check if appointment is ONSITE or ONLINE for switch button display
  const isOnlineAppointment =
    appointment.consultationType?.location === 'ONLINE';

  const content = (
    <>
      {/* Header - always show appointment date/time */}
      <div className='flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg'>
            <Calendar className='w-6 h-6 text-blue-600' />
          </div>
          <div>
            <div className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              {new Date(appointment.startTime).toLocaleDateString('fr-FR', {
                weekday: 'long',
              })}
            </div>
            <div className='flex items-baseline gap-2 mt-0.5'>
              <span className='text-lg font-bold text-gray-900'>
                {new Date(appointment.startTime).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className='text-sm text-gray-400'>•</span>
              <span className='text-base font-semibold text-blue-600 flex items-center gap-1'>
                <Clock className='w-4 h-4' />
                {new Date(appointment.startTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
        {!inline && (
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            aria-label='Fermer'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className={`${inline ? 'space-y-4' : 'p-4 space-y-4'}`}>
        {/* Patient Cards */}
        <div className='px-4'>
          {patients.length > 1 && (
            <div className='mb-3 flex items-center gap-2'>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                {patients.length} patients
              </span>
            </div>
          )}
          <div className='space-y-3'>
            {patients.map((patient, index) => (
              <div key={patient.id || index} className='relative'>
                {index === 0 && patients.length > 1 && (
                  <div className='absolute -top-2 left-2 z-10'>
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white'>
                      Principal
                    </span>
                  </div>
                )}
                <PatientCard
                  patient={patient}
                  onEdit={handlePatientEdit}
                  onDelete={handlePatientDelete}
                  onView={handlePatientView}
                  absenceCount={absenceCounts[patient.id] || 0}
                  onIncrementAbsence={handleIncrementAbsence}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Status chips (view-only buttons) */}
        <div className='px-4 flex flex-wrap gap-3 justify-center'>
          <button
            onClick={() => handleStatusChipClick('waiting')}
            disabled={isStatusUpdating}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${selectedStatusChip === 'waiting'
              ? 'bg-purple-500 text-white'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
          >
            <MapPin
              className={`w-4 h-4 ${selectedStatusChip === 'waiting'
                ? 'text-white'
                : 'text-purple-500'
                }`}
            />
            En salle d'attente
          </button>
          <button
            onClick={() => handleStatusChipClick('seen')}
            disabled={isStatusUpdating}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${selectedStatusChip === 'seen'
              ? 'bg-green-500 text-white'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
          >
            <Eye
              className={`w-4 h-4 ${selectedStatusChip === 'seen' ? 'text-white' : 'text-green-500'
                }`}
            />
            Patient vu
          </button>
          <button
            onClick={() => handleStatusChipClick('absent')}
            disabled={isStatusUpdating}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${selectedStatusChip === 'absent'
              ? 'text-white'
              : 'hover:opacity-80'
              }`}
            style={{
              backgroundColor:
                selectedStatusChip === 'absent' ? '#f9516a' : '#fef2f2',
              color: selectedStatusChip === 'absent' ? 'white' : '#f9516a',
            }}
          >
            <Rabbit
              className='w-4 h-4'
              style={{
                color: selectedStatusChip === 'absent' ? 'white' : '#f9516a',
              }}
            />
            Patient absent
          </button>
          <button
            onClick={() => handleStatusChipClick('cancelled')}
            disabled={isStatusUpdating}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${selectedStatusChip === 'cancelled'
              ? 'bg-gray-500 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
          >
            <X
              className={`w-4 h-4 ${selectedStatusChip === 'cancelled'
                ? 'text-white'
                : 'text-gray-500'
                }`}
            />
            Annulé
          </button>
        </div>

        {/* Absence Notification Banner */}
        {showAbsenceBanner && (
          <div
            className='mx-4 mt-4 rounded-xl overflow-hidden'
            style={{
              background: 'linear-gradient(135deg, #f9516a 0%, #e8435a 100%)',
            }}
          >
            <div className='flex items-center justify-between p-6'>
              <div className='flex-1'>
                <h3 className='text-white text-lg font-bold mb-2'>
                  Signaler une absence
                </h3>
                <p className='text-white/90 text-sm mb-4'>
                  Envoyer un message au patient ?
                </p>
                <div className='flex gap-3'>
                  <button
                    onClick={() => handleSendAbsenceNotification(true)}
                    disabled={isSendingAbsenceNotification}
                    className='px-6 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSendingAbsenceNotification ? 'Envoi...' : 'Oui'}
                  </button>
                  <button
                    onClick={() => handleSendAbsenceNotification(false)}
                    disabled={isSendingAbsenceNotification}
                    className='px-6 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Non
                  </button>
                </div>
              </div>
              {/* Illustration */}
              <div className='flex-shrink-0 ml-4'>
                <div className='w-24 h-24 relative'>
                  <svg viewBox='0 0 100 100' className='w-full h-full'>
                    {/* Simple doctor illustration */}
                    <circle cx='50' cy='30' r='18' fill='#f5d6c6' />
                    <ellipse cx='50' cy='75' rx='25' ry='20' fill='white' />
                    {/* Alert icon */}
                    <circle cx='75' cy='25' r='15' fill='#FCD34D' />
                    <text
                      x='75'
                      y='32'
                      textAnchor='middle'
                      fontSize='20'
                      fontWeight='bold'
                      fill='#78350F'
                    >
                      !
                    </text>
                    {/* Hair */}
                    <path d='M32 30 Q35 10 50 12 Q65 10 68 30' fill='#4A3728' />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consultation type badge with duration and action icons */}
        <div className='px-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {(() => {
              const style = getConsultationBadgeStyle();
              return (
                <span
                  className={`inline-flex items-center justify-center w-10 h-10 ${style.bgColor} rounded-full font-semibold ${style.textColor} text-sm`}
                >
                  {appointment.consultationType?.duration || '30'}
                </span>
              );
            })()}
            <div>
              <p className='font-medium text-gray-900'>
                {appointment.consultationType?.name || 'Consultation'}
              </p>
              <p className='text-xs text-gray-500'>{getDuration()}</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {/* Switch location toggle - Toggle between Cabinet and Visio */}
            <button
              onClick={handleSwitchLocation}
              disabled={!onLocationSwitch || isSwitchingLocation}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isOnlineAppointment ? 'bg-purple-500' : 'bg-green-500'
                }`}
              title={
                isOnlineAppointment
                  ? 'Convertir en RDV Cabinet'
                  : 'Convertir en RDV Visio'
              }
            >
              {/* Toggle knob with icon */}
              <span
                className={`inline-flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${isOnlineAppointment ? 'translate-x-9' : 'translate-x-1'
                  } ${isSwitchingLocation ? 'animate-pulse' : ''}`}
              >
                {isOnlineAppointment ? (
                  <VideoOn className='w-3.5 h-3.5 text-purple-600' />
                ) : (
                  <Building2 className='w-3.5 h-3.5 text-green-600' />
                )}
              </span>
              {/* Background icons */}
              <span className='absolute inset-0 flex items-center justify-between px-1.5'>
                <Building2
                  className={`w-3.5 h-3.5 ${isOnlineAppointment
                    ? 'text-purple-200'
                    : 'text-white opacity-0'
                    }`}
                />
                <VideoOn
                  className={`w-3.5 h-3.5 ${isOnlineAppointment
                    ? 'text-white opacity-0'
                    : 'text-green-200'
                    }`}
                />
              </span>
            </button>
            {/* Edit button */}
            <button
              onClick={() => onEdit && onEdit(appointment)}
              disabled={!onEdit}
              className='p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              title={onEdit ? 'Modifier le rendez-vous' : undefined}
            >
              <Edit className='w-4 h-4 text-gray-600' />
            </button>
            {/* Add appointment with same patient button */}
            <button
              onClick={handleAddAppointmentWithPatient}
              disabled={!onAddAppointment}
              className='p-2 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              title='Ajouter un rendez-vous pour ce patient'
            >
              <Plus className='w-4 h-4 text-blue-600' />
            </button>
            {/* Delete button */}
            <button
              onClick={() => onDelete && onDelete(appointment)}
              className='p-2 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors'
              title='Supprimer le rendez-vous'
            >
              <Trash2 className='w-4 h-4 text-red-600' />
            </button>
          </div>
        </div>

        {/* Tabs and content area */}
        <div className='px-4 border-t border-gray-200 pt-4'>
          {/* Video call panel (shown when video button is clicked) */}
          {showVideoCall && (
            <div className='mb-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white'>
              <div className='flex items-start justify-between mb-4'>
                <h3 className='text-lg font-semibold'>
                  téléconsult<span className='text-yellow-300'>✨</span>
                </h3>
                <button
                  onClick={() => setShowVideoCall(false)}
                  className='px-4 py-1.5 bg-white text-purple-600 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors flex-shrink-0'
                >
                  Convertir
                </button>
              </div>

              <div className='flex items-start gap-3'>
                <div className='w-6 h-6 bg-blue-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                  <span className='text-xs font-bold text-blue-600'>i</span>
                </div>
                <div>
                  <p className='font-semibold text-white mb-1'>CONVERSION</p>
                  <p className='text-sm leading-relaxed text-white'>
                    Vous pouvez convertir ce rendez-vous en téléconsultation.
                    Une notification sera envoyée à votre patient(e) pour le
                    prévenir.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='grid grid-cols-4 gap-0 bg-transparent border-b border-gray-200 p-0 h-auto'>
              <TabsTrigger
                value='motif'
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent text-sm font-medium'
              >
                Motif de Cs
              </TabsTrigger>
              <TabsTrigger
                value='documents'
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent text-sm font-medium'
              >
                <span className='flex items-center gap-2'>
                  Documents
                  <span className='inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full'>
                    {documents.length}
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value='honoraires'
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent text-sm font-medium'
              >
                Honoraires
              </TabsTrigger>
              <TabsTrigger
                value='chronologie'
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent text-sm font-medium'
              >
                Chronologie
              </TabsTrigger>
            </TabsList>

            <div className='mt-6'>
              <TabsContent value='motif' className='space-y-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700'>
                    Motif de consultation
                  </label>
                  <textarea
                    value={appointment.description || ''}
                    readOnly
                    rows={6}
                    className='w-full mt-2 rounded-lg border border-gray-200 p-3 bg-gray-50 text-gray-900 resize-none focus:outline-none'
                  />
                </div>

                <div>
                  <label className='text-sm font-medium text-red-600'>
                    Note privée (invisible du patient)
                  </label>
                  <textarea
                    value={appointment.notes || ''}
                    readOnly
                    rows={4}
                    className='w-full mt-2 rounded-lg border border-pink-200 p-3 bg-pink-50 text-gray-900 resize-none focus:outline-none'
                  />
                </div>
              </TabsContent>

              <TabsContent value='documents' className='space-y-4'>
                {/* Help message box */}
                <div className='bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3'>
                  <div className='flex-shrink-0'>
                    <div className='flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full'>
                      <AlertCircle className='w-5 h-5 text-purple-600' />
                    </div>
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm text-gray-700'>
                      Vous pouvez également bloquer l'accès aux documents
                      transmis, tant que la (télé)consultation n'est pas
                      régléiée.
                    </p>
                    <p className='text-sm text-gray-600 mt-2'>
                      Un levier supplémentaire pour lutter contre les impayés.
                    </p>
                  </div>
                  <div className='flex-shrink-0'>
                    <svg
                      className='w-6 h-6 text-purple-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4'
                      />
                    </svg>
                  </div>
                </div>

                {/* File upload area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                >
                  <input
                    type='file'
                    id='file-input'
                    multiple
                    onChange={handleFileInputChange}
                    className='hidden'
                  />

                  <div className='flex flex-col items-center justify-center'>
                    <FileText className='w-10 h-10 text-blue-400 mb-3' />

                    <label htmlFor='file-input' className='mb-2'>
                      <button
                        type='button'
                        onClick={() =>
                          document.getElementById('file-input')?.click()
                        }
                        disabled={isUploadingDocument}
                        className='text-blue-500 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {isUploadingDocument
                          ? 'Uploading...'
                          : 'Partager un fichier'}
                      </button>
                    </label>

                    <p className='text-sm text-gray-500'>ou déposez-le ici</p>
                  </div>
                </div>

                {/* Uploaded documents list from server */}
                {isLoadingDocuments ? (
                  <div className='text-center py-4'>
                    <p className='text-sm text-gray-500'>
                      Loading documents...
                    </p>
                  </div>
                ) : documents.length > 0 ? (
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-gray-700'>
                      Documents ({documents.length})
                    </p>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className='p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2 flex-1 min-w-0'>
                            <FileText className='w-4 h-4 text-gray-400 flex-shrink-0' />
                            <div className='min-w-0'>
                              <p className='text-sm font-medium text-gray-900 truncate'>
                                {doc.originalName}
                              </p>
                              <p className='text-xs text-gray-500'>
                                {(doc.fileSize / 1024).toFixed(2)} KB
                                {doc.category && doc.category !== 'AUTRE' && (
                                  <span className='ml-2'>• {doc.category}</span>
                                )}
                                {doc.description && (
                                  <span className='ml-2'>
                                    • {doc.description}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <button
                              onClick={() =>
                                handleToggleDocumentBlock(
                                  doc.id,
                                  doc.blockClientDownload
                                )
                              }
                              className={`p-1 transition-colors ${doc.blockClientDownload
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                              title={
                                doc.blockClientDownload
                                  ? 'Blocked from client'
                                  : 'Accessible to client'
                              }
                            >
                              {doc.blockClientDownload ? (
                                <Lock className='w-4 h-4' />
                              ) : (
                                <Unlock className='w-4 h-4' />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleDownloadDocument(doc.id, doc.originalName)
                              }
                              className='p-1 text-gray-400 hover:text-blue-600 transition-colors'
                              title='Download'
                            >
                              <Download className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className='p-1 text-gray-400 hover:text-red-600 transition-colors'
                              title='Delete'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </div>

                        {/* Share until date selector */}
                        <div className='mt-2 flex items-center gap-2'>
                          <label className='text-xs text-gray-600 whitespace-nowrap'>
                            Partager jusqu'au:
                          </label>
                          <div className='relative flex-1'>
                            <button
                              type='button'
                              onClick={() =>
                                setOpenDatePickerId(
                                  openDatePickerId === doc.id ? null : doc.id
                                )
                              }
                              className='w-full text-xs border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:border-gray-400 transition-colors text-left flex items-center justify-between'
                            >
                              <span
                                className={
                                  doc.shareUntilDate
                                    ? 'text-gray-900'
                                    : 'text-gray-400'
                                }
                              >
                                {doc.shareUntilDate
                                  ? new Date(
                                    doc.shareUntilDate
                                  ).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                  : 'Sélectionner une date'}
                              </span>
                              <Calendar className='w-3.5 h-3.5 text-gray-400' />
                            </button>
                            {openDatePickerId === doc.id && (
                              <DatePickerPopup
                                currentDate={
                                  doc.shareUntilDate
                                    ? new Date(doc.shareUntilDate)
                                    : new Date()
                                }
                                onDateChange={(date) => {
                                  handleUpdateShareDate(
                                    doc.id,
                                    date.toISOString().split('T')[0]
                                  );
                                  setOpenDatePickerId(null);
                                }}
                                onClose={() => setOpenDatePickerId(null)}
                              />
                            )}
                          </div>
                          {doc.shareUntilDate && (
                            <button
                              onClick={() => {
                                handleUpdateShareDate(doc.id, null);
                                setOpenDatePickerId(null);
                              }}
                              className='p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors'
                              title='Effacer la date'
                            >
                              <X className='w-3.5 h-3.5' />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-4'>
                    <p className='text-sm text-gray-500'>
                      No documents uploaded yet
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value='honoraires'>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600'>Honoraires</p>
                      <p className='font-semibold text-gray-900 mt-1'>
                        {appointment.consultationType
                          ? `€ ${appointment.consultationType.price}`
                          : '—'}
                      </p>
                    </div>
                    <Button
                      onClick={() => { }}
                      className='bg-gray-900 text-white hover:bg-gray-800'
                    >
                      Gérer le paiement
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='chronologie'>
                <div className='space-y-3'>
                  {isLoadingHistory ? (
                    <div className='text-center py-8'>
                      <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
                      <p className='mt-2 text-sm text-gray-500'>
                        Chargement de l'historique...
                      </p>
                    </div>
                  ) : history.length > 0 ? (
                    <div className='space-y-3'>
                      {history.map((entry) => {
                        const getActionBadge = (action) => {
                          switch (action) {
                            case 'CREATED':
                              return { text: 'CRE', bgColor: 'bg-green-500' };
                            case 'UPDATED':
                            case 'RESCHEDULED':
                              return { text: 'EDIT', bgColor: 'bg-yellow-500' };
                            case 'CONSULTATION_TYPE_CHANGED':
                              return { text: 'EDIT', bgColor: 'bg-yellow-500' };
                            case 'STATUS_CHANGED':
                              return { text: 'EDIT', bgColor: 'bg-yellow-500' };
                            case 'DOCUMENT_UPLOADED':
                              return { text: 'DOC', bgColor: 'bg-blue-500' };
                            case 'DOCUMENT_DELETED':
                              return { text: 'DEL', bgColor: 'bg-red-500' };
                            default:
                              return { text: 'LOG', bgColor: 'bg-gray-500' };
                          }
                        };

                        const formatTimestamp = (timestamp) => {
                          try {
                            // Clean up potential malformed timestamps
                            const cleanTimestamp =
                              timestamp?.replace(/0+Z$/, 'Z') || timestamp;
                            const date = new Date(cleanTimestamp);

                            // Check if date is valid
                            if (isNaN(date.getTime())) {
                              return {
                                dayMonth: '',
                                time: '',
                                formattedDate: timestamp,
                              };
                            }

                            const dayMonth = new Intl.DateTimeFormat('fr-FR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            }).format(date);

                            const time = new Intl.DateTimeFormat('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(date);

                            const formattedDate = new Intl.DateTimeFormat(
                              'fr-FR',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            ).format(date);

                            return { dayMonth, time, formattedDate };
                          } catch (error) {
                            console.error(
                              'Error formatting timestamp:',
                              error,
                              timestamp
                            );
                            return {
                              dayMonth: '',
                              time: '',
                              formattedDate: timestamp,
                            };
                          }
                        };

                        const { dayMonth, time } = formatTimestamp(
                          entry.createdAt
                        );
                        const doctorName = entry.doctor?.user
                          ? `${entry.doctor.user.firstName || ''} ${entry.doctor.user.lastName || ''
                            }`.trim()
                          : 'DAVID Nicole';

                        const badge = getActionBadge(entry.action);

                        // Extract change details for display
                        const getChangeDetails = () => {
                          if (entry.action === 'CREATED') {
                            return null;
                          }

                          if (
                            entry.changedFields &&
                            Object.keys(entry.changedFields).length > 0
                          ) {
                            return Object.entries(entry.changedFields)
                              .filter(([field]) => field !== 'endTime') // Hide endTime, only show startTime
                              .map(([field, change]) => {
                                const fieldLabels = {
                                  status: "L'acte associé au RDV",
                                  startTime: "L'horaire du RDV",
                                  consultationType: 'Type de consultation',
                                  description: 'Motif de consultation',
                                  notes: 'Note privée',
                                };

                                const fieldLabel = fieldLabels[field] || field;

                                // Format values based on field type
                                const formatValue = (value, fieldName) => {
                                  if (!value) return '—';

                                  // Check if value is an object with a name property
                                  if (typeof value === 'object' && value.name) {
                                    return value.name;
                                  }

                                  // Check if value is a date string (ISO format or timestamp)
                                  if (typeof value === 'string') {
                                    // Try to detect ISO date strings
                                    const isDateString =
                                      fieldName === 'startTime' ||
                                      fieldName === 'endTime' ||
                                      /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/.test(
                                        value
                                      );

                                    if (isDateString) {
                                      try {
                                        const date = new Date(value);

                                        if (!isNaN(date.getTime())) {
                                          return new Intl.DateTimeFormat(
                                            'fr-FR',
                                            {
                                              weekday: 'short',
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            }
                                          ).format(date);
                                        }
                                      } catch (error) {
                                        console.error(
                                          'Error formatting date:',
                                          error,
                                          value
                                        );
                                      }
                                    }
                                  }

                                  return String(value);
                                };

                                return {
                                  field: fieldLabel,
                                  before: formatValue(change.before, field),
                                  after: formatValue(change.after, field),
                                };
                              });
                          }

                          return null;
                        };

                        const changeDetails = getChangeDetails();

                        return (
                          <div
                            key={entry.id}
                            className='flex items-start gap-3 py-1'
                          >
                            {/* Badge */}
                            <div className='flex-shrink-0'>
                              <span
                                className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold text-white ${badge.bgColor}`}
                              >
                                {badge.text}
                              </span>
                            </div>

                            {/* Content */}
                            <div className='flex-1 min-w-0'>
                              <div className='text-sm text-gray-700'>
                                <span className='font-medium'>{dayMonth}</span>
                                {' à '}
                                <span className='font-medium'>{time}</span>
                                {', par '}
                                <span className='font-medium'>
                                  {doctorName}
                                </span>
                              </div>

                              {changeDetails && changeDetails.length > 0 && (
                                <div className='mt-1 text-sm'>
                                  {changeDetails.map((detail, idx) => (
                                    <div key={idx} className='mb-1'>
                                      <div className='text-gray-700'>
                                        {detail.field} a été modifié.
                                      </div>
                                      <div className='text-gray-600'>
                                        <span className='font-medium'>
                                          Avant :
                                        </span>{' '}
                                        {detail.before}
                                      </div>
                                      <div className='text-gray-600'>
                                        <span className='font-medium text-green-600'>
                                          Après :
                                        </span>{' '}
                                        {detail.after}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Display notifications if any */}
                              {entry.action === 'DOCUMENT_UPLOADED' && (
                                <div className='mt-1'>
                                  <span className='text-sm font-medium text-gray-700'>
                                    Documents :{' '}
                                  </span>
                                  <span className='text-sm text-gray-600'>
                                    notifications{' '}
                                  </span>
                                  <span className='text-sm font-semibold text-green-600'>
                                    activées
                                  </span>
                                  <span className='text-sm text-gray-500'>
                                    {' '}
                                    (sur dépôt du patient)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <History className='w-12 h-12 text-gray-300 mx-auto mb-2' />
                      <p className='text-sm text-gray-500'>
                        Aucun historique disponible
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Footer actions */}
      <div className='border-t border-gray-200 bg-white p-4 flex justify-end gap-3'>
        {!inline && (
          <button
            onClick={onClose}
            className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
          >
            Fermer
          </button>
        )}
      </div>
    </>
  );

  if (inline) {
    return (
      <>
        {content}
        {/* Patient Details Sheet */}
        {selectedPatientForView && (
          <PatientDetailsSheet
            patient={selectedPatientForView}
            isOpen={!!selectedPatientForView}
            onClose={() => setSelectedPatientForView(null)}
            onEdit={() => { }}
            onDelete={() => { }}
            initialTab={selectedPatientTab}
            onView={handlePatientView}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center  z-50'>
        <div className='bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto'>
          {content}
        </div>
      </div>
      {/* Patient Details Sheet */}
      {selectedPatientForView && (
        <PatientDetailsSheet
          patient={selectedPatientForView}
          isOpen={!!selectedPatientForView}
          onClose={() => setSelectedPatientForView(null)}
          onEdit={() => { }}
          onDelete={() => { }}
          initialTab={selectedPatientTab}
          onView={handlePatientView}
        />
      )}
    </>
  );
};

export default AppointmentDetails;
