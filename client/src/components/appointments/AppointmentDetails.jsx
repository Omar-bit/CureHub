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
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';

const AppointmentDetails = ({
  appointment,
  isOpen = false,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  inline = true,
}) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'notes'

  // When inline mode is true, show content if appointment exists, regardless of isOpen
  // When inline mode is false (modal/overlay), require both isOpen and appointment
  if (inline ? !appointment : !isOpen || !appointment) return null;

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

  const formatDateTime = (dateTime) => {
    return format(new Date(dateTime), "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

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

  const getLocationIcon = (location) => {
    switch (location) {
      case 'ONLINE':
        return Video;
      case 'ATHOME':
        return Home;
      case 'ONSITE':
      default:
        return Building2;
    }
  };

  const getLocationText = (location) => {
    switch (location) {
      case 'ONLINE':
        return 'Online Consultation';
      case 'ATHOME':
        return 'Home Visit';
      case 'ONSITE':
      default:
        return 'In Clinic';
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(appointment.id, newStatus);
    }
  };

  const statusActions = [
    {
      status: 'CONFIRMED',
      label: 'Confirm',
      icon: CheckCircle,
      color: 'bg-green-600 hover:bg-green-700',
      show: appointment.status === 'SCHEDULED',
    },
    {
      status: 'IN_PROGRESS',
      label: 'Start',
      icon: PlayCircle,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      show:
        appointment.status === 'CONFIRMED' ||
        appointment.status === 'SCHEDULED',
    },
    {
      status: 'COMPLETED',
      label: 'Complete',
      icon: CheckCircle,
      color: 'bg-green-600 hover:bg-green-700',
      show: appointment.status === 'IN_PROGRESS',
    },
    {
      status: 'CANCELLED',
      label: 'Cancel',
      icon: XCircle,
      color: 'bg-red-600 hover:bg-red-700',
      show:
        appointment.status !== 'COMPLETED' &&
        appointment.status !== 'CANCELLED',
    },
  ];

  const content = (
    <>
      {/* Header - only show when not in inline mode */}
      {!inline && (
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Appointment Details
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                appointment.status
              )}`}
            >
              {getStatusText(appointment.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
      )}

      {/* Content */}
      <div className={`${inline ? 'space-y-6' : 'p-6 space-y-6'}`}>
        {/* Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notes & Records
            </button>
          </nav>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className='space-y-6'>
            {/* Title */}
            {appointment.title && (
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  {appointment.title}
                </h3>
              </div>
            )}

            {/* Quick Actions */}
            <div className='flex flex-wrap gap-2'>
              {appointment.patient?.phoneNumber && (
                <a
                  href={`tel:${appointment.patient.phoneNumber}`}
                  className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors'
                >
                  <Phone className='h-4 w-4 mr-2' />
                  Call Patient
                </a>
              )}
              {appointment.patient?.email && (
                <a
                  href={`mailto:${appointment.patient.email}`}
                  className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors'
                >
                  <Mail className='h-4 w-4 mr-2' />
                  Email Patient
                </a>
              )}
            </div>

            {/* Patient Information */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h4 className='flex items-center text-sm font-medium text-gray-700 mb-3'>
                <User className='h-4 w-4 mr-2' />
                Patient Information
              </h4>
              {appointment.patient ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-600'>Name</p>
                    <p className='font-medium text-gray-900'>
                      {appointment.patient.name}
                    </p>
                  </div>
                  {appointment.patient.email && (
                    <div>
                      <p className='text-sm text-gray-600'>Email</p>
                      <div className='flex items-center space-x-2'>
                        <Mail className='h-4 w-4 text-gray-400' />
                        <a
                          href={`mailto:${appointment.patient.email}`}
                          className='text-blue-600 hover:text-blue-800'
                        >
                          {appointment.patient.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {appointment.patient.phoneNumber && (
                    <div>
                      <p className='text-sm text-gray-600'>Phone</p>
                      <div className='flex items-center space-x-2'>
                        <Phone className='h-4 w-4 text-gray-400' />
                        <a
                          href={`tel:${appointment.patient.phoneNumber}`}
                          className='text-blue-600 hover:text-blue-800'
                        >
                          {appointment.patient.phoneNumber}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex items-center space-x-2 text-gray-600'>
                  <FileText className='h-4 w-4' />
                  <span className='font-medium'>
                    Sans fiche: {appointment.title || 'No name provided'}
                  </span>
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='flex items-center text-sm font-medium text-gray-700 mb-2'>
                  <Calendar className='h-4 w-4 mr-2' />
                  Start Time
                </p>
                <p className='text-gray-900'>
                  {formatDateTime(appointment.startTime)}
                </p>
              </div>
              <div>
                <p className='flex items-center text-sm font-medium text-gray-700 mb-2'>
                  <Clock className='h-4 w-4 mr-2' />
                  Duration
                </p>
                <p className='text-gray-900'>{getDuration()}</p>
              </div>
            </div>

            {/* Consultation Type */}
            {appointment.consultationType && (
              <div>
                <p className='flex items-center text-sm font-medium text-gray-700 mb-2'>
                  <FileText className='h-4 w-4 mr-2' />
                  Consultation Type
                </p>
                <div
                  className='bg-gray-50 rounded-lg p-4 border-l-4'
                  style={{ borderColor: appointment.consultationType.color }}
                >
                  <div className='flex items-center justify-between mb-3'>
                    <p className='font-medium text-gray-900'>
                      {appointment.consultationType.name}
                    </p>
                    <span
                      className='px-2 py-1 rounded-full text-xs font-medium'
                      style={{
                        backgroundColor: `${appointment.consultationType.color}20`,
                        color: appointment.consultationType.color,
                      }}
                    >
                      {appointment.consultationType.type}
                    </span>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                    <div className='flex items-center text-gray-600'>
                      <Clock className='h-4 w-4 mr-2 text-gray-400' />
                      <span>
                        {appointment.consultationType.duration} minutes
                      </span>
                    </div>
                    <div className='flex items-center text-gray-600'>
                      {React.createElement(
                        getLocationIcon(appointment.consultationType.location),
                        {
                          className: 'h-4 w-4 mr-2 text-gray-400',
                        }
                      )}
                      <span>
                        {getLocationText(appointment.consultationType.location)}
                      </span>
                    </div>
                    <div className='flex items-center text-gray-600'>
                      <DollarSign className='h-4 w-4 mr-2 text-gray-400' />
                      <span className='font-semibold text-gray-900'>
                        ${appointment.consultationType.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {appointment.description && (
              <div>
                <p className='text-sm font-medium text-gray-700 mb-2'>
                  Description
                </p>
                <div className='bg-gray-50 rounded-lg p-3'>
                  <p className='text-gray-900 whitespace-pre-wrap'>
                    {appointment.description}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Information */}
            {appointment.consultationType?.price && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <DollarSign className='h-5 w-5 text-blue-600 mr-2' />
                    <div>
                      <p className='text-sm font-medium text-gray-700'>
                        Payment Information
                      </p>
                      <p className='text-xs text-gray-600 mt-1'>
                        Status:{' '}
                        <span className='font-medium text-orange-600'>
                          Pending
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold text-gray-900'>
                      ${appointment.consultationType.price}
                    </p>
                    <p className='text-xs text-gray-600'>Total Amount</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className='border-t border-gray-200 pt-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
                <div>
                  <span className='font-medium'>Created:</span>{' '}
                  {format(
                    new Date(appointment.createdAt),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </div>
                <div>
                  <span className='font-medium'>Last updated:</span>{' '}
                  {format(
                    new Date(appointment.updatedAt),
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className='space-y-6'>
            {/* Doctor's Notes */}
            <div>
              <h4 className='text-base font-medium text-gray-900 mb-3'>
                Doctor's Notes
              </h4>
              {appointment.notes ? (
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <p className='text-gray-900 whitespace-pre-wrap'>
                    {appointment.notes}
                  </p>
                </div>
              ) : (
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-center'>
                  <FileText className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-500'>
                    No notes have been added for this appointment yet.
                  </p>
                  {appointment.status !== 'COMPLETED' && (
                    <button
                      onClick={() => onEdit(appointment)}
                      className='mt-3 text-sm text-blue-600 hover:text-blue-800'
                    >
                      Add Notes
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Medical Records Section */}
            <div>
              <h4 className='text-base font-medium text-gray-900 mb-3'>
                Medical Records
              </h4>
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-center'>
                <FileText className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                <p className='text-sm text-gray-500'>
                  Medical records and prescriptions will be displayed here.
                </p>
                <p className='text-xs text-gray-400 mt-1'>
                  This feature is coming soon.
                </p>
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <h4 className='text-base font-medium text-gray-900 mb-3'>
                Attachments
              </h4>
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-center'>
                <FileText className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                <p className='text-sm text-gray-500'>
                  No attachments for this appointment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className='border-t border-gray-200 bg-gray-50'>
        {/* Status Actions */}
        {onStatusChange && statusActions.some((action) => action.show) && (
          <div className={`${inline ? 'pt-4 pb-2' : 'px-6 pt-4 pb-2'}`}>
            <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-2'>
              Quick Actions
            </p>
            <div className='flex flex-wrap gap-2'>
              {statusActions
                .filter((action) => action.show)
                .map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusChange(action.status)}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors ${action.color}`}
                  >
                    {React.createElement(action.icon, {
                      className: 'h-4 w-4 mr-1.5',
                    })}
                    {action.label}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Main Actions */}
        <div
          className={`flex items-center justify-end space-x-3 ${
            inline ? 'py-4' : 'px-6 py-4'
          }`}
        >
          {!inline && (
            <button
              onClick={onClose}
              className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Close
            </button>
          )}
          <button
            onClick={() => onEdit(appointment)}
            className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Edit className='h-4 w-4' />
            <span>Edit</span>
          </button>
          {appointment.status !== 'COMPLETED' &&
            appointment.status !== 'CANCELLED' && (
              <button
                onClick={() => onDelete(appointment)}
                className='flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
              >
                <Trash2 className='h-4 w-4' />
                <span>Delete</span>
              </button>
            )}
        </div>
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
