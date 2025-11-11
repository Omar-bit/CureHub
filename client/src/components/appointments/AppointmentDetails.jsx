import React, { useState } from 'react';
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
} from 'lucide-react';
// date-fns format removed (not used)
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { splitPatientName } from '../../lib/patient';

const AppointmentDetails = ({
  appointment,
  isOpen = false,
  onClose,
  // onEdit removed - not used in this view
  onDelete,
  // onStatusChange removed (not used in this view)
  inline = true,
}) => {
  const [activeTab, setActiveTab] = useState('motif'); // 'motif' | 'documents' | 'honoraires' | 'chronologie'
  const [selectedStatusChip, setSelectedStatusChip] = useState(null); // Track which status chip is active (visual state)

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

  // Handle status chip clicks - Update visual state (API integration will come later)
  const handleStatusChipClick = (chipName) => {
    setSelectedStatusChip(chipName);
    // TODO: Call API to update appointment status
    // Example: await appointmentAPI.update(appointment.id, { status: chipName });
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
            Née le {appointment.patient?.dateOfBirth ? new Date(appointment.patient.dateOfBirth).toLocaleDateString('fr-FR') : '-'} •{' '}
            {appointment.patient?.dateOfBirth ? (new Date().getFullYear() - new Date(appointment.patient.dateOfBirth).getFullYear()) : '-'} ans
          </div>
          <div className='mt-2 flex items-center gap-3 text-xs text-gray-500'>
            {appointment.patient?.phoneNumber && <span>■ Téléphone</span>}
            {appointment.patient?.email && <span>■ Email</span>}
            {appointment.patient?.address && <span>■ Adresse</span>}
            {appointment.patient && <span className='text-orange-600 font-medium'>1 absence</span>}
          </div>
        </div>

        {/* Status chips (view-only buttons) */}
        <div className='px-4 flex flex-wrap gap-3'>
          <button 
            onClick={() => handleStatusChipClick('waiting')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedStatusChip === 'waiting'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Circle className={`w-3 h-3 ${selectedStatusChip === 'waiting' ? 'fill-white' : 'fill-blue-500'}`} />
            En salle d'attente
          </button>
          <button 
            onClick={() => handleStatusChipClick('seen')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedStatusChip === 'seen'
                ? 'bg-green-500 text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <Circle className={`w-3 h-3 ${selectedStatusChip === 'seen' ? 'fill-white' : 'fill-green-500'}`} />
            Patient vu
          </button>
          <button 
            onClick={() => handleStatusChipClick('absent')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedStatusChip === 'absent'
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <Circle className={`w-3 h-3 ${selectedStatusChip === 'absent' ? 'fill-white' : 'fill-red-500'}`} />
            Patient absent
          </button>
        </div>

        {/* Consultation type badge with duration and action icons */}
        <div className='px-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <span className='inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full font-semibold text-green-700 text-sm'>
              {appointment.consultationType?.duration || '30'}
            </span>
            <div>
              <p className='font-medium text-gray-900'>{appointment.consultationType?.name || 'Consultation'}</p>
              <p className='text-xs text-gray-500'>{getDuration()}</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <button className='p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors'>
              <Stethoscope className='w-4 h-4 text-gray-600' />
            </button>
            <button className='p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors'>
              <VideoOn className='w-4 h-4 text-gray-600' />
            </button>
            <button className='p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors'>
              <Phone className='w-4 h-4 text-gray-600' />
            </button>
            <button className='p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors'>
              <Edit className='w-4 h-4 text-gray-600' />
            </button>
            <button onClick={() => onDelete && onDelete(appointment)} className='p-2 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors'>
              <Trash2 className='w-4 h-4 text-red-600' />
            </button>
          </div>
        </div>

        {/* Tabs and content area */}
        <div className='px-4 border-t border-gray-200 pt-4'>
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
                  <label className='text-sm font-medium text-gray-700'>Motif de consultation</label>
                  <textarea
                    value={appointment.description || ''}
                    readOnly
                    rows={6}
                    className='w-full mt-2 rounded-lg border border-gray-200 p-3 bg-gray-50 text-gray-900 resize-none focus:outline-none'
                  />
                </div>

                <div>
                  <label className='text-sm font-medium text-red-600'>Note privée (invisible du patient)</label>
                  <textarea
                    value={appointment.notes || ''}
                    readOnly
                    rows={4}
                    className='w-full mt-2 rounded-lg border border-pink-200 p-3 bg-pink-50 text-gray-900 resize-none focus:outline-none'
                  />
                </div>
              </TabsContent>

              <TabsContent value='documents'>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600'>
                  Documents du patient et pièces jointes liés au rendez-vous.
                </div>
              </TabsContent>

              <TabsContent value='honoraires'>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-gray-600'>Honoraires</p>
                      <p className='font-semibold text-gray-900 mt-1'>{appointment.consultationType ? `€ ${appointment.consultationType.price}` : '—'}</p>
                    </div>
                    <Button onClick={() => {}} className='bg-gray-900 text-white hover:bg-gray-800'>
                      Gérer le paiement
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='chronologie'>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600'>
                  Chronologie des actions et des modifications.
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Footer actions */}
      <div className='border-t border-gray-200 bg-white p-4 flex justify-end gap-3'>
        {!inline && (
          <button onClick={onClose} className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'>
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
