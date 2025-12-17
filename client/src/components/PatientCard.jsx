import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  Users,
  MessageCircle,
  FileText,
  Activity,
  Clock,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  UserX,
} from 'lucide-react';

const PatientCard = ({
  patient,
  onEdit,
  onDelete,
  onView,
  absenceCount = 0,
  onIncrementAbsence,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const patientName = patient.name.includes('!SP!')
    ? patient.name.split('!SP!').join(' ')
    : patient.name;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
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

  const actionButtons = [
    {
      icon: UserCheck,
      label: 'Profil',
      onClick: () => onView(patient, 'profil'),
      variant: 'default',
    },
    {
      icon: Users,
      label: 'Proches',
      onClick: () => onView(patient, 'proches'),
      variant: 'secondary',
    },
    {
      icon: MessageCircle,
      label: 'Contacter',
      onClick: () => onView(patient, 'contacter'),
      variant: 'secondary',
    },
    {
      icon: FileText,
      label: 'Docs',
      onClick: () => onView(patient, 'documents'),
      variant: 'secondary',
    },
    {
      icon: Activity,
      label: 'Actes',
      onClick: () => onView(patient, 'actes'),
      variant: 'secondary',
    },
    {
      icon: Clock,
      label: 'Historique',
      onClick: () => onView(patient, 'historique'),
      variant: 'secondary',
    },
    {
      icon: CalendarDays,
      label: 'RDV',
      onClick: () => onView(patient, 'rdv'),
      variant: 'secondary',
      badge: true,
    },
    {
      icon: CheckSquare,
      label: 'Tâche',
      onClick: () => onView(patient, 'taches'),
      variant: 'secondary',
      badge: true,
    },
  ];

  return (
    <div className='bg-gray-100 rounded-lg shadow-sm border border-gray-300 p-4 mb-4 hover:shadow-md transition-all duration-300'>
      {/* Collapsed Header Section */}
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <h3 className='text-lg font-semibold text-gray-900 mb-1'>
            {patientName}
          </h3>
          <p className='text-sm text-gray-600 mb-2'>
            Née le {formatDate(patient.dateOfBirth)} •{' '}
            {calculateAge(patient.dateOfBirth)} ans
          </p>

          {/* Essential contact info in collapsed state */}
          {!isExpanded && (
            <div className='flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600'>
              {patient.phoneNumber && (
                <div className='flex items-center'>
                  <Phone className='w-3 h-3 mr-1' />
                </div>
              )}
              {patient.email && (
                <div className='flex items-center'>
                  <Mail className='w-3 h-3 mr-1' />
                </div>
              )}
              {patient.address && (
                <div className='flex items-center'>
                  <MapPin className='w-3 h-3 mr-1' />
                </div>
              )}
              {/* Absence counter badge */}

              <div
                className='flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium'
                style={{ backgroundColor: '#f9516a', color: 'white' }}
              >
                <UserX className='w-3 h-3' />
                <span>
                  {absenceCount} absence{absenceCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='ml-4 p-2 rounded-full hover:bg-gray-200 transition-colors'
        >
          {isExpanded ? (
            <ChevronUp className='w-5 h-5 text-gray-600' />
          ) : (
            <ChevronDown className='w-5 h-5 text-gray-600' />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className='mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300'>
          {/* Detailed Contact Information */}
          <div className='space-y-2'>
            {patient.phoneNumber && (
              <div className='flex items-center text-sm text-gray-600'>
                <Phone className='w-4 h-4 mr-2' />
                <span>{patient.phoneNumber}</span>
              </div>
            )}

            {patient.email && (
              <div className='flex items-center text-sm text-gray-600'>
                <Mail className='w-4 h-4 mr-2' />
                <span>{patient.email}</span>
              </div>
            )}

            {patient.address && (
              <div className='flex items-center text-sm text-gray-600'>
                <MapPin className='w-4 h-4 mr-2' />
                <span>{patient.address}</span>
              </div>
            )}
          </div>

          {/* Action Buttons Grid */}
          <div className='flex items-center justify-around gap-2 pt-2 border-t border-gray-300'>
            {actionButtons.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className='relative flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-gray-200 transition-colors border border-gray-200'
                >
                  <Icon className='w-5 h-5 text-gray-600 mb-1' />
                  <span className='text-xs text-gray-700 font-medium'>
                    {action.label}
                  </span>
                  {action.badge && (
                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full'></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCard;
