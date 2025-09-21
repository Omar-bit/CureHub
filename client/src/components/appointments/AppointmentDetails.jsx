import React from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';

const AppointmentDetails = ({
  appointment,
  isOpen = false,
  onClose,
  onEdit,
  onDelete,
  inline = false,
}) => {
  if (!isOpen || !appointment) return null;

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

  const content = (
    <>
      {/* Header */}
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
        {!inline && (
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        )}
      </div>

      {/* Content */}
      <div className='p-6 space-y-6'>
        {/* Title */}
        {appointment.title && (
          <div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {appointment.title}
            </h3>
          </div>
        )}

        {/* Patient Information */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <h4 className='flex items-center text-sm font-medium text-gray-700 mb-3'>
            <User className='h-4 w-4 mr-2' />
            Patient Information
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-600'>Name</p>
              <p className='font-medium text-gray-900'>
                {appointment.patient?.name}
              </p>
            </div>
            {appointment.patient?.email && (
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
            {appointment.patient?.phoneNumber && (
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
            <div className='bg-gray-50 rounded-lg p-3'>
              <p className='font-medium text-gray-900'>
                {appointment.consultationType.name}
              </p>
              <div className='mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600'>
                <div>
                  <span className='font-medium'>Duration:</span>{' '}
                  {appointment.consultationType.duration} minutes
                </div>
                <div>
                  <span className='font-medium'>Location:</span>{' '}
                  {appointment.consultationType.location}
                </div>
                <div>
                  <span className='font-medium'>Price:</span> $
                  {appointment.consultationType.price}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {appointment.location && (
          <div>
            <p className='flex items-center text-sm font-medium text-gray-700 mb-2'>
              <MapPin className='h-4 w-4 mr-2' />
              Location
            </p>
            <p className='text-gray-900'>{appointment.location}</p>
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

        {/* Notes */}
        {appointment.notes && (
          <div>
            <p className='text-sm font-medium text-gray-700 mb-2'>
              Doctor's Notes
            </p>
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
              <p className='text-gray-900 whitespace-pre-wrap'>
                {appointment.notes}
              </p>
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

      {/* Actions */}
      <div className='flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50'>
        <button
          onClick={onClose}
          className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
        >
          Close
        </button>
        <button
          onClick={() => onEdit(appointment)}
          className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          <Edit className='h-4 w-4' />
          <span>Edit</span>
        </button>
        {appointment.status !== 'COMPLETED' && (
          <button
            onClick={() => onDelete(appointment)}
            className='flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
          >
            <Trash2 className='h-4 w-4' />
            <span>Delete</span>
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
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {content}
      </div>
    </div>
  );
};

export default AppointmentDetails;
