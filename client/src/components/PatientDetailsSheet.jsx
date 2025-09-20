import React from 'react';
import {
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Trash2,
} from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';

const PatientDetailsSheet = ({
  patient,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
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

  return (
    <SheetContent title='Patient Details' onClose={onClose}>
      {/* Profile Section */}
      <div className='text-center mb-6'>
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
        <h3 className='text-xl font-semibold text-foreground'>
          {patient.name}
        </h3>
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

      {/* Action Buttons */}
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
    </SheetContent>
  );
};

export default PatientDetailsSheet;
