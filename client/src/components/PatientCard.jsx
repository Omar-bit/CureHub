import React from 'react';
import { User, Mail, Phone, Edit3, Trash2 } from 'lucide-react';
import { EntityCard } from './ui/entity-card';

const PatientCard = ({ patient, onEdit, onDelete, onView }) => {
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

  const avatar = (
    <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
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
  );

  const metadata = [
    ...(patient.email
      ? [
          {
            icon: <Mail />,
            value: patient.email,
          },
        ]
      : []),
    ...(patient.phoneNumber
      ? [
          {
            icon: <Phone />,
            value: patient.phoneNumber,
          },
        ]
      : []),
  ];

  const actions = [
    {
      icon: <Edit3 className='w-4 h-4' />,
      onClick: () => onEdit(patient),
      tooltip: 'Edit patient',
    },
    {
      icon: <Trash2 className='w-4 h-4' />,
      onClick: () => onDelete(patient),
      variant: 'destructive',
      tooltip: 'Delete patient',
    },
  ];

  return (
    <EntityCard
      avatar={avatar}
      title={patient.name}
      subtitle={`${calculateAge(patient.dateOfBirth)} years old • ${
        patient.gender
      }`}
      metadata={metadata}
      actions={actions}
      onClick={() => onView(patient)}
    />
  );
};

export default PatientCard;
