import React, { useState } from 'react';
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
} from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const PatientDetailsSheet = ({
  patient,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState('profil');

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
          <SheetTitle className='text-left'>{patient.name}</SheetTitle>
        </div>
      </SheetHeader>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full mt-6'
      >
        <TabsList className='grid w-full grid-cols-6'>
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
            <div className='text-center text-muted-foreground py-8'>
              <Users className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p>Family members and contacts will be displayed here</p>
            </div>
          </TabsContent>

          <TabsContent value='contacter' className='space-y-4'>
            <div className='text-center text-muted-foreground py-8'>
              <Phone className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p>
                Contact information and communication options will be displayed
                here
              </p>
            </div>
          </TabsContent>

          <TabsContent value='documents' className='space-y-4'>
            <div className='text-center text-muted-foreground py-8'>
              <FileText className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p>Patient documents and files will be displayed here</p>
            </div>
          </TabsContent>

          <TabsContent value='actes' className='space-y-4'>
            <div className='text-center text-muted-foreground py-8'>
              <Activity className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p>Medical procedures and treatments will be displayed here</p>
            </div>
          </TabsContent>

          <TabsContent value='historique' className='space-y-4'>
            <div className='text-center text-muted-foreground py-8'>
              <History className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p>Patient history and timeline will be displayed here</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>

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
