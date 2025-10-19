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
} from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { appointmentAPI } from '../services/api';
import PatientDocumentsTab from './PatientDocumentsTab';

const PatientDetailsSheet = ({
  patient,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState('profil');
  const [appointments, setAppointments] = useState({
    upcoming: [],
    past: [],
  });
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Fetch appointments when patient changes or tab becomes active
  useEffect(() => {
    if (patient?.id && (activeTab === 'historique' || isOpen)) {
      fetchPatientAppointments();
    }
  }, [patient?.id, activeTab, isOpen]);

  const fetchPatientAppointments = async () => {
    if (!patient?.id) return;

    setLoadingAppointments(true);
    try {
      const response = await appointmentAPI.getByPatient(patient.id);
      const appointmentData = response.appointments || [];
      console.log('Fetched Appointments:', appointmentData);

      // Separate upcoming and past appointments based on startTime
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
      NO_SHOW: 'Absent',
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
    // Since the API response doesn't include doctor details,
    // we can use the doctorId or get it from context
    // For now, return a default value
    return 'Dr. Smith'; // You might want to fetch doctor details separately
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
                <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <MessageSquare className='w-5 h-5 text-blue-600' />
                    </div>
                    <div>
                      <p className='font-medium text-foreground'>Par SMS</p>
                      <p className='text-sm text-muted-foreground'>
                        Envoyer un SMS au {patient.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Contact */}
              {patient.email && (
                <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center'>
                      <Mail className='w-5 h-5 text-orange-600' />
                    </div>
                    <div>
                      <p className='font-medium text-foreground'>Par email</p>
                      <p className='text-sm text-blue-600 hover:underline'>
                        {patient.email}
                      </p>
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
            <div className='text-center text-muted-foreground py-8'>
              <Activity className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p>Medical procedures and treatments will be displayed here</p>
            </div>
          </TabsContent>

          <TabsContent value='historique' className='space-y-4'>
            {loadingAppointments ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='w-6 h-6 animate-spin text-primary' />
                <span className='ml-2 text-muted-foreground'>
                  Chargement de l'historique...
                </span>
              </div>
            ) : (
              <div className='space-y-6'>
                {/* Header with scheduled tasks indicator */}
                {appointments.upcoming.length > 0 && (
                  <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                    <div className='flex items-center gap-2 text-yellow-800'>
                      <Clock className='w-4 h-4' />
                      <span className='font-medium'>Tâches programmées</span>
                    </div>
                  </div>
                )}

                {/* Upcoming Appointments */}
                {appointments.upcoming.length > 0 && (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold text-foreground'>
                        RDV à venir
                      </h3>
                      <Button size='sm' variant='outline' className='text-xs'>
                        <Plus className='w-3 h-3 mr-1' />
                        {new Date().getFullYear()}
                      </Button>
                    </div>

                    {appointments.upcoming.map((appointment) => {
                      const dateTime = formatDateTime(appointment.startTime);
                      const urgency = getUrgencyLevel(appointment);
                      const doctorName = getDoctorName(appointment);
                      const appointmentType = getAppointmentTypeLabel(
                        appointment.consultationType
                      );

                      return (
                        <div
                          key={appointment.id}
                          className='border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-start gap-4'>
                            {/* Left section - Date and Type */}
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div className='bg-red-500 text-white text-xs font-medium px-2 py-1 rounded mb-2'>
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className='text-xs text-gray-500 uppercase'>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className='text-xl font-bold text-gray-900'>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                  {dateTime.time}
                                </div>
                              </div>
                            </div>

                            {/* Middle section - Doctor and Urgency */}
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User className='w-4 h-4 text-yellow-500' />
                                <span className='font-medium text-gray-900'>
                                  {doctorName}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                                <span className='text-sm text-red-600 font-medium'>
                                  {urgency}
                                </span>
                              </div>
                            </div>

                            {/* Right section - Action button */}
                            <div className='flex items-start'>
                              <Button
                                size='sm'
                                className='bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1.5 rounded-md'
                              >
                                <Send className='w-3 h-3 mr-1' />
                                Envoyer un rappel
                              </Button>
                            </div>
                          </div>

                          {/* Bottom chevron */}
                          <div className='flex justify-center mt-3 pt-2 border-t border-gray-100'>
                            <ChevronDown className='w-4 h-4 text-gray-400' />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Past Appointments */}
                {appointments.past.length > 0 && (
                  <div className='space-y-3'>
                    <h3 className='text-lg font-semibold text-foreground'>
                      RDV passés
                    </h3>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        {new Date().getFullYear()}
                      </span>
                    </div>

                    {appointments.past.map((appointment) => {
                      const dateTime = formatDateTime(appointment.startTime);
                      const urgency = getUrgencyLevel(appointment);
                      const doctorName = getDoctorName(appointment);
                      const appointmentType = getAppointmentTypeLabel(
                        appointment.consultationType
                      );

                      return (
                        <div
                          key={appointment.id}
                          className='border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-start gap-4'>
                            {/* Left section - Date and Type */}
                            <div className='flex flex-col items-center min-w-[60px]'>
                              <div className='bg-red-500 text-white text-xs font-medium px-2 py-1 rounded mb-2'>
                                {appointmentType}
                              </div>
                              <div className='text-center'>
                                <div className='text-xs text-gray-500 uppercase'>
                                  {dateTime.date.split(' ')[0]}
                                </div>
                                <div className='text-xl font-bold text-gray-900'>
                                  {dateTime.date.split(' ')[1]}
                                </div>
                                <div className='text-xs text-gray-500 mt-1'>
                                  {dateTime.time}
                                </div>
                              </div>
                            </div>

                            {/* Middle section - Doctor and Urgency */}
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <User className='w-4 h-4 text-yellow-500' />
                                <span className='font-medium text-gray-900'>
                                  {doctorName}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                                <span className='text-sm text-red-600 font-medium'>
                                  {urgency}
                                </span>
                              </div>
                              <div className='text-xs text-gray-500 mt-2'>
                                Statut:{' '}
                                {getAppointmentStatusLabel(appointment.status)}
                              </div>
                            </div>
                          </div>

                          {/* Bottom chevron */}
                          <div className='flex justify-center mt-3 pt-2 border-t border-gray-100'>
                            <ChevronDown className='w-4 h-4 text-gray-400' />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty state if no appointments */}
                {appointments.upcoming.length === 0 &&
                  appointments.past.length === 0 &&
                  !loadingAppointments && (
                    <div className='text-center text-muted-foreground py-8'>
                      <History className='w-12 h-12 mx-auto mb-4 opacity-50' />
                      <p>Aucun rendez-vous dans l'historique</p>
                    </div>
                  )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Action Buttons */}
      {activeTab === 'profil' && (
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
      )}
    </SheetContent>
  );
};

export default PatientDetailsSheet;
