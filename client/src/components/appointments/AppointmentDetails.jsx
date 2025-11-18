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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { splitPatientName } from '../../lib/patient';
import { appointmentAPI, appointmentDocumentsApi } from '../../services/api';
import { showSuccess, showError } from '../../lib/toast';

const STATUS_CHIP_TO_APPOINTMENT_STATUS = {
  waiting: 'SCHEDULED',
  seen: 'COMPLETED',
  absent: 'ABSENT',
};

const APPOINTMENT_STATUS_TO_CHIP = {
  SCHEDULED: 'waiting',
  COMPLETED: 'seen',
  ABSENT: 'absent',
};

const AppointmentDetails = ({
  appointment,
  isOpen = false,
  onClose,
  onEdit = null,
  onDelete,
  onStatusChange = null,
  inline = true,
}) => {
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

  const renderPatientName = (patient) => {
    if (!patient) return '—';

    // If stored as single `name` field, split it using helper to avoid showing the separator
    if (patient.name) {
      const { firstName, lastName } = splitPatientName(patient.name);
      const full = `${firstName} ${lastName}`.trim();
      if (full) return full;
    }

    // Fallback to separate fields if available
    if (patient.firstName || patient.lastName) {
      return `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    }

    // Last resort: raw name or appointment title
    return patient.name || appointment.title || '—';
  };

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
  }, [appointment?.status, appointment?.id, appointment?.updatedAt]);

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

  // Handle status chip clicks - Update backend and visual state
  const handleStatusChipClick = async (chipName) => {
    if (!appointment || isStatusUpdating) return;

    const mappedStatus = STATUS_CHIP_TO_APPOINTMENT_STATUS[chipName];
    if (!mappedStatus || selectedStatusChip === chipName) return;

    const previousChip = selectedStatusChip;
    setSelectedStatusChip(chipName);

    if (!onStatusChange) return;

    try {
      setIsStatusUpdating(true);
      await onStatusChange(appointment.id, mappedStatus);
      // Reload history after status change
      loadHistory();
    } catch (error) {
      setSelectedStatusChip(previousChip);
    } finally {
      setIsStatusUpdating(false);
    }
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
      // Upload each file
      for (const file of files) {
        await appointmentDocumentsApi.upload(file, appointment.id);
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

  const content = (
    <>
      {/* Header - only show when not in inline mode */}
      {!inline && (
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <div className='text-sm text-gray-600'>
            {new Date(appointment.startTime).toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            })}{' '}
            <span className='ml-2 font-semibold'>
              {new Date(appointment.startTime).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            aria-label='Fermer'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className={`${inline ? 'space-y-4' : 'p-4 space-y-4'}`}>
        {/* Patient name and info header */}
        <div className='px-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {renderPatientName(appointment.patient)}
          </h3>
          <div className='text-sm text-gray-600'>
            Née le{' '}
            {appointment.patient?.dateOfBirth
              ? new Date(appointment.patient.dateOfBirth).toLocaleDateString(
                  'fr-FR'
                )
              : '-'}{' '}
            •{' '}
            {appointment.patient?.dateOfBirth
              ? new Date().getFullYear() -
                new Date(appointment.patient.dateOfBirth).getFullYear()
              : '-'}{' '}
            ans
          </div>
          <div className='mt-2 flex items-center gap-3 text-xs text-gray-500'>
            {appointment.patient?.phoneNumber && <span>■ Téléphone</span>}
            {appointment.patient?.email && <span>■ Email</span>}
            {appointment.patient?.address && <span>■ Adresse</span>}
            {appointment.patient && (
              <span className='text-orange-600 font-medium'>1 absence</span>
            )}
          </div>
        </div>

        {/* Status chips (view-only buttons) */}
        <div className='px-4 flex flex-wrap gap-3'>
          <button
            onClick={() => handleStatusChipClick('waiting')}
            disabled={isStatusUpdating}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              selectedStatusChip === 'waiting'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Circle
              className={`w-3 h-3 ${
                selectedStatusChip === 'waiting'
                  ? 'fill-white'
                  : 'fill-blue-500'
              }`}
            />
            En salle d'attente
          </button>
          <button
            onClick={() => handleStatusChipClick('seen')}
            disabled={isStatusUpdating}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              selectedStatusChip === 'seen'
                ? 'bg-green-500 text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <Circle
              className={`w-3 h-3 ${
                selectedStatusChip === 'seen' ? 'fill-white' : 'fill-green-500'
              }`}
            />
            Patient vu
          </button>
          <button
            onClick={() => handleStatusChipClick('absent')}
            disabled={isStatusUpdating}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              selectedStatusChip === 'absent'
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <Circle
              className={`w-3 h-3 ${
                selectedStatusChip === 'absent' ? 'fill-white' : 'fill-red-500'
              }`}
            />
            Patient absent
          </button>
        </div>

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
            <button className='p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors'>
              <Stethoscope className='w-4 h-4 text-gray-600' />
            </button>
            <button
              onClick={() => setShowVideoCall(!showVideoCall)}
              className={`p-2 rounded-full transition-colors ${
                showVideoCall
                  ? 'bg-purple-100 border border-purple-300'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <VideoOn
                className={`w-4 h-4 ${
                  showVideoCall ? 'text-purple-600' : 'text-gray-600'
                }`}
              />
            </button>
            <button className='p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors'>
              <Phone className='w-4 h-4 text-gray-600' />
            </button>
            <button
              onClick={() => onEdit && onEdit(appointment)}
              disabled={!onEdit}
              className='p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              title={onEdit ? 'Modifier le rendez-vous' : undefined}
            >
              <Edit className='w-4 h-4 text-gray-600' />
            </button>
            <button
              onClick={() => onDelete && onDelete(appointment)}
              className='p-2 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors'
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
                Documents
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
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
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
                        className='flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors'
                      >
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
                      onClick={() => {}}
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
                        const getActionIcon = (action) => {
                          switch (action) {
                            case 'CREATED':
                              return (
                                <CheckCircle className='w-4 h-4 text-green-600' />
                              );
                            case 'UPDATED':
                            case 'RESCHEDULED':
                            case 'CONSULTATION_TYPE_CHANGED':
                              return <Edit className='w-4 h-4 text-blue-600' />;
                            case 'STATUS_CHANGED':
                              return (
                                <Circle className='w-4 h-4 text-purple-600' />
                              );
                            case 'DOCUMENT_UPLOADED':
                              return (
                                <Upload className='w-4 h-4 text-green-600' />
                              );
                            case 'DOCUMENT_DELETED':
                              return (
                                <Trash2 className='w-4 h-4 text-red-600' />
                              );
                            default:
                              return (
                                <History className='w-4 h-4 text-gray-600' />
                              );
                          }
                        };

                        const getActionBadgeColor = (action) => {
                          switch (action) {
                            case 'CREATED':
                              return 'bg-green-100 text-green-700';
                            case 'UPDATED':
                            case 'RESCHEDULED':
                            case 'CONSULTATION_TYPE_CHANGED':
                              return 'bg-blue-100 text-blue-700';
                            case 'STATUS_CHANGED':
                              return 'bg-purple-100 text-purple-700';
                            case 'DOCUMENT_UPLOADED':
                              return 'bg-green-100 text-green-700';
                            case 'DOCUMENT_DELETED':
                              return 'bg-red-100 text-red-700';
                            default:
                              return 'bg-gray-100 text-gray-700';
                          }
                        };

                        const formatTimestamp = (timestamp) => {
                          try {
                            const date = new Date(timestamp);
                            const distance = formatDistanceToNow(date, {
                              addSuffix: true,
                              locale: fr,
                            });
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
                            return { distance, formattedDate };
                          } catch (error) {
                            return { distance: '', formattedDate: timestamp };
                          }
                        };

                        const { distance, formattedDate } = formatTimestamp(
                          entry.createdAt
                        );
                        const doctorName = entry.doctor?.user
                          ? `${entry.doctor.user.firstName || ''} ${
                              entry.doctor.user.lastName || ''
                            }`.trim()
                          : 'Système';

                        return (
                          <div
                            key={entry.id}
                            className='flex gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors'
                          >
                            <div className='flex-shrink-0 mt-0.5'>
                              <div
                                className={`p-2 rounded-full ${getActionBadgeColor(
                                  entry.action
                                )}`}
                              >
                                {getActionIcon(entry.action)}
                              </div>
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-start justify-between gap-2'>
                                <div className='flex-1'>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {entry.description || entry.action}
                                  </p>
                                  <p className='text-xs text-gray-500 mt-1'>
                                    par {doctorName}
                                  </p>
                                </div>
                                <div className='text-right flex-shrink-0'>
                                  <p className='text-xs text-gray-600 font-medium'>
                                    {distance}
                                  </p>
                                  <p className='text-xs text-gray-400 mt-0.5'>
                                    {formattedDate}
                                  </p>
                                </div>
                              </div>

                              {/* Show changed fields if available */}
                              {entry.changedFields &&
                                Object.keys(entry.changedFields).length > 0 && (
                                  <div className='mt-2 p-2 bg-white border border-gray-200 rounded text-xs'>
                                    <p className='font-medium text-gray-700 mb-1'>
                                      Modifications :
                                    </p>
                                    {Object.entries(entry.changedFields).map(
                                      ([field, change]) => (
                                        <div key={field} className='mt-1'>
                                          <span className='text-gray-600 capitalize'>
                                            {field}
                                          </span>
                                          {change.before !== undefined &&
                                            change.after !== undefined && (
                                              <div className='ml-2 text-gray-500'>
                                                <span className='line-through'>
                                                  {String(change.before)}
                                                </span>
                                                {' → '}
                                                <span className='text-gray-900 font-medium'>
                                                  {String(change.after)}
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                      )
                                    )}
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
    return content;
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto'>
        {content}
      </div>
    </div>
  );
};

export default AppointmentDetails;
