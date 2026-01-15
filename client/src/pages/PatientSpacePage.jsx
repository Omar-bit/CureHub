import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Calendar,
  FileText,
  User,
  AlertCircle,
  Clock,
  MapPin,
  Plus,
  Users,
  X,
  Trash2,
} from 'lucide-react';
import PatientIdentityTab from '../components/PatientIdentityTab';
import PatientPasswordTab from '../components/PatientPasswordTab';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { patientAuthAPI } from '../services/api';
import { showSuccess, showError } from '../lib/toast';

const PatientSpacePage = () => {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      // First, try to get patient data from localStorage
      let patientStr = localStorage.getItem('patientUser');
      let doctorIdStr = localStorage.getItem('patientDoctorId');

      // If not in localStorage, try to get from API using patient_token cookie
      if (!patientStr) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/patient/profile`,
          {
            method: 'GET',
            credentials: 'include', // Send cookies with request
          }
        );

        if (response.ok) {
          const patient = await response.json();
          patientStr = JSON.stringify(patient);
          localStorage.setItem('patientUser', patientStr);
          // Note: doctorId might not be available from API, but we can continue
        } else {
          // No valid session, redirect to login
          navigate(`/${doctorIdStr || 'unknown'}/login`);
          return;
        }
      }

      if (!patientStr) {
        navigate(`/${doctorIdStr || 'unknown'}/login`);
        return;
      }

      const patient = JSON.parse(patientStr);
      setPatientData(patient);

      // TODO: Load actual appointments and documents from API
      // For now, using mock data
      setAppointments([
        {
          id: '1',
          title: 'Consultation générale',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          time: '14:30',
          doctor: 'Dr. Smith',
          location: 'Cabinet - Paris',
          status: 'scheduled',
        },
        {
          id: '2',
          title: 'Suivi post-consultation',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          time: '10:00',
          doctor: 'Dr. Smith',
          location: 'En ligne',
          status: 'scheduled',
        },
      ]);

      setDocuments([
        {
          id: '1',
          name: 'Ordonnance.pdf',
          category: 'Ordonnance',
          uploadDate: new Date().toISOString(),
          locked: false,
        },
        {
          id: '2',
          name: 'Résultats_labo.pdf',
          category: 'Biologie',
          uploadDate: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          locked: true,
        },
      ]);

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading patient data:', err);
      setError('Erreur lors du chargement des données');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear patient data
      const doctorId = localStorage.getItem('patientDoctorId');
      localStorage.removeItem('patientToken');
      localStorage.removeItem('patientUser');
      localStorage.removeItem('patientDoctorId');
      navigate(`/${doctorId || 'unknown'}/login`);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  // Determine which page to render based on location
  const renderContent = () => {
    if (location.pathname === '/patient-space/profile') {
      return <PatientProfilePage patientData={patientData} />;
    } else if (location.pathname === '/patient-space/relatives') {
      return <PatientRelativesPage />;
    } else if (location.pathname === '/patient-space/appointments') {
      return <PatientAppointmentsPage appointments={appointments} />;
    } else if (location.pathname === '/patient-space/documents') {
      return <PatientDocumentsPage documents={documents} />;
    } else if (location.pathname === '/patient-space/payments') {
      return <PatientPaymentsPage />;
    }

    // Default dashboard
    return (
      <div className='p-8'>
        {error && (
          <Alert variant='destructive' className='mb-6'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dashboard Header */}
        <div className='mb-8'>
          <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
            <span>ACCUEIL</span>
            <span>›</span>
            <span>MON COMPTE</span>
          </nav>
          <h1 className='text-3xl font-bold text-foreground'>
            Tableau de bord
          </h1>
        </div>

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
          <Card>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <p className='text-muted-foreground text-sm mb-2'>
                  Prochains rendez-vous
                </p>
                <p className='text-3xl font-bold text-foreground'>
                  {appointments.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <p className='text-muted-foreground text-sm mb-2'>Documents</p>
                <p className='text-3xl font-bold text-foreground'>
                  {documents.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <p className='text-muted-foreground text-sm mb-2'>Proches</p>
                <p className='text-3xl font-bold text-foreground'>0</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <p className='text-muted-foreground text-sm mb-2'>
                  Solde à payer
                </p>
                <p className='text-3xl font-bold text-foreground'>€0.00</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Appointments */}
        <div className='mb-8'>
          <h2 className='text-xl font-bold text-foreground mb-4 flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Rendez-vous à venir
          </h2>

          {appointments.length > 0 ? (
            <div className='space-y-3'>
              {appointments.slice(0, 3).map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className='pt-6'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-foreground'>
                          {appointment.title}
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          avec {appointment.doctor}
                        </p>
                        <div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-4 w-4' />
                            {new Date(appointment.date).toLocaleDateString(
                              'fr-FR'
                            )}{' '}
                            à {appointment.time}
                          </span>
                          <span className='flex items-center gap-1'>
                            <MapPin className='h-4 w-4' />
                            {appointment.location}
                          </span>
                        </div>
                      </div>
                      <span className='px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full'>
                        Prévu
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className='pt-6'>
                <p className='text-muted-foreground text-center py-6'>
                  Aucun rendez-vous prévu
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  return <>{renderContent()}</>;
};

// Patient Profile Page (cards style)
const PatientProfilePage = ({ patientData }) => {
  const [showIdentity, setShowIdentity] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [updatedPatientData, setUpdatedPatientData] = useState(patientData);

  const handlePatientUpdate = (updatedData) => {
    setUpdatedPatientData(updatedData);
  };

  return (
    <div className='p-8'>
      <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
        <span>ACCUEIL</span>
        <span>›</span>
        <span>MON COMPTE</span>
      </nav>
      <h1 className='text-3xl font-bold text-foreground mb-8'>Mon profil</h1>

      {/* Cards row */}
      {!showIdentity && !showPassword && (
        <div className='flex flex-col md:flex-row gap-8 justify-center mb-8'>
          {/* Identity Card */}
          <div className='flex-1 bg-white rounded-2xl shadow-md p-8 flex flex-col justify-between min-w-[320px] max-w-[420px]'>
            <div>
              <h2 className='text-lg font-bold text-foreground mb-2'>
                Mon identité
              </h2>
              <p className='text-muted-foreground mb-4'>
                Gérez vos informations personnelles. Assurez-vous de les
                maintenir à jour.
              </p>
            </div>
            <div className='flex items-end justify-between mt-auto'>
              {/* Illustration placeholder */}
              <div className='w-24 h-24 bg-blue-50 rounded-xl flex items-center justify-center'>
                <svg width='60' height='60' fill='none' viewBox='0 0 60 60'>
                  <rect width='60' height='60' rx='12' fill='#E0EDFF' />
                  <rect
                    x='15'
                    y='20'
                    width='30'
                    height='20'
                    rx='3'
                    fill='#90C2FF'
                  />
                  <rect
                    x='20'
                    y='25'
                    width='20'
                    height='3'
                    rx='1.5'
                    fill='#fff'
                  />
                  <rect
                    x='20'
                    y='31'
                    width='12'
                    height='2'
                    rx='1'
                    fill='#fff'
                  />
                </svg>
              </div>
              <Button
                className='ml-4'
                onClick={() => {
                  setShowIdentity(true);
                  setShowPassword(false);
                }}
              >
                Modifier <span className='ml-2'>→</span>
              </Button>
            </div>
          </div>

          {/* Password Card */}
          <div className='flex-1 bg-white rounded-2xl shadow-md p-8 flex flex-col justify-between min-w-[320px] max-w-[420px]'>
            <div>
              <h2 className='text-lg font-bold text-foreground mb-2'>
                Mon mot de passe
              </h2>
              <p className='text-muted-foreground mb-4'>
                Sécurisez l'accès à votre compte. Ne le communiquez jamais.
              </p>
            </div>
            <div className='flex items-end justify-between mt-auto'>
              {/* Illustration placeholder */}
              <div className='w-24 h-24 bg-blue-50 rounded-xl flex items-center justify-center'>
                <svg width='60' height='60' fill='none' viewBox='0 0 60 60'>
                  <rect width='60' height='60' rx='12' fill='#E0EDFF' />
                  <circle cx='30' cy='32' r='8' fill='#90C2FF' />
                  <rect x='26' y='28' width='8' height='8' rx='2' fill='#fff' />
                </svg>
              </div>
              <Button
                className='ml-4'
                onClick={() => {
                  setShowPassword(true);
                  setShowIdentity(false);
                }}
              >
                Modifier <span className='ml-2'>→</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Show forms below cards */}
      {showIdentity && (
        <div className='max-w-2xl mx-auto mt-8'>
          <Button
            variant='outline'
            onClick={() => {
              setShowIdentity(false);
              setShowPassword(false);
            }}
            className='mb-4'
          >
            ← Retour
          </Button>
          <PatientIdentityTab
            patientData={updatedPatientData || patientData}
            onUpdate={handlePatientUpdate}
          />
        </div>
      )}
      {showPassword && (
        <div className='max-w-2xl mx-auto mt-8'>
          <Button
            variant='outline'
            onClick={() => {
              setShowIdentity(false);
              setShowPassword(false);
            }}
            className='mb-4'
          >
            ← Retour
          </Button>
          <PatientPasswordTab />
        </div>
      )}
    </div>
  );
};

// Family relationship labels
const FAMILY_RELATIONSHIPS = [
  { value: 'SON', label: 'Fils' },
  { value: 'DAUGHTER', label: 'Fille' },
  { value: 'FATHER', label: 'Père' },
  { value: 'MOTHER', label: 'Mère' },
  { value: 'BROTHER', label: 'Frère' },
  { value: 'SISTER', label: 'Sœur' },
  { value: 'SPOUSE', label: 'Conjoint(e)' },
  { value: 'GRANDFATHER', label: 'Grand-père' },
  { value: 'GRANDMOTHER', label: 'Grand-mère' },
  { value: 'GRANDSON', label: 'Petit-fils' },
  { value: 'GRANDDAUGHTER', label: 'Petite-fille' },
  { value: 'UNCLE', label: 'Oncle' },
  { value: 'AUNT', label: 'Tante' },
  { value: 'NEPHEW', label: 'Neveu' },
  { value: 'NIECE', label: 'Nièce' },
  { value: 'COUSIN', label: 'Cousin(e)' },
];

const getFamilyRelationshipLabel = (value) => {
  const rel = FAMILY_RELATIONSHIPS.find((r) => r.value === value);
  return rel ? rel.label : value;
};

// Patient Relatives Page
const PatientRelativesPage = () => {
  const [relatives, setRelatives] = useState([]);
  const [canAddRelatives, setCanAddRelatives] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingType, setAddingType] = useState('FAMILY'); // 'FAMILY' or 'OTHER'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRelativeId, setDeletingRelativeId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phoneNumber: '',
    address: '',
    familyRelationship: '',
    customRelationship: '',
  });

  useEffect(() => {
    loadRelatives();
  }, []);

  const loadRelatives = async () => {
    try {
      setIsLoading(true);
      const data = await patientAuthAPI.getRelatives();
      setRelatives(data.relatives || []);
      setCanAddRelatives(data.canAddRelatives || false);
    } catch (error) {
      console.error('Error loading relatives:', error);
      showError('Erreur lors du chargement des proches');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phoneNumber: '',
      address: '',
      familyRelationship: '',
      customRelationship: '',
    });
  };

  const openAddDialog = (type) => {
    setAddingType(type);
    resetForm();
    setShowAddDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate
      if (!formData.name || !formData.gender) {
        showError('Veuillez remplir les champs obligatoires');
        setIsSubmitting(false);
        return;
      }

      if (addingType === 'FAMILY' && !formData.familyRelationship) {
        showError('Veuillez sélectionner le lien familial');
        setIsSubmitting(false);
        return;
      }

      if (addingType === 'OTHER' && !formData.customRelationship) {
        showError('Veuillez décrire la relation');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        patient: {
          name: formData.name,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender,
          email: formData.email || null,
          phoneNumber: formData.phoneNumber || null,
          address: formData.address || null,
        },
        relationship: {
          relationshipType: addingType,
          familyRelationship:
            addingType === 'FAMILY' ? formData.familyRelationship : null,
          customRelationship:
            addingType === 'OTHER' ? formData.customRelationship : null,
        },
      };

      await patientAuthAPI.createRelative(payload);
      showSuccess('Proche ajouté avec succès');
      setShowAddDialog(false);
      loadRelatives();
    } catch (error) {
      console.error('Error creating relative:', error);
      showError(
        error.response?.data?.message || 'Erreur lors de la création du proche'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (relationshipId) => {
    setDeletingRelativeId(relationshipId);
    setShowDeleteDialog(true);
  };

  const handleRemoveRelative = async () => {
    if (!deletingRelativeId) return;

    setIsDeleting(true);
    try {
      await patientAuthAPI.removeRelative(deletingRelativeId);
      showSuccess('Proche supprimé avec succès');
      setShowDeleteDialog(false);
      setDeletingRelativeId(null);
      loadRelatives();
    } catch (error) {
      console.error('Error removing relative:', error);
      showError('Erreur lors de la suppression du proche');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter relatives by type
  const familyRelatives = relatives.filter(
    (r) => r.relationshipType === 'FAMILY'
  );
  const otherRelatives = relatives.filter(
    (r) => r.relationshipType === 'OTHER'
  );

  if (isLoading) {
    return (
      <div className='p-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-8 bg-slate-50 min-h-full'>
      <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-2'>
        <span>ACCUEIL</span>
        <span>›</span>
        <span>MON COMPTE</span>
      </nav>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold text-foreground'>Mes proches</h1>
        <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
          <Users className='h-6 w-6 text-blue-600' />
        </div>
      </div>

      {/* Famille Section */}
      <Card className='mb-6'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg font-semibold'>Famille</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4'>
            {/* Existing family relatives */}
            {familyRelatives.map((rel) => (
              <div
                key={rel.id}
                className='relative flex flex-col items-center p-4 border border-dashed border-gray-300 rounded-xl min-w-[160px] max-w-[180px] bg-white'
              >
                {canAddRelatives && (
                  <button
                    onClick={() => openDeleteDialog(rel.id)}
                    className='absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors'
                    title='Supprimer'
                  >
                    <X className='h-4 w-4' />
                  </button>
                )}
                <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3'>
                  <User className='h-8 w-8 text-gray-400' />
                </div>
                <p className='font-medium text-sm text-center truncate w-full'>
                  {rel.relatedPatient?.name || 'N/A'}
                </p>
                <p className='text-xs text-muted-foreground text-center'>
                  {getFamilyRelationshipLabel(rel.familyRelationship)}
                </p>
              </div>
            ))}

            {/* Add new family member card */}
            {canAddRelatives && (
              <div className='flex flex-col items-center p-4 border border-dashed border-gray-300 rounded-xl min-w-[160px] max-w-[180px] bg-white'>
                <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3'>
                  <User className='h-8 w-8 text-gray-400' />
                </div>
                <p className='font-medium text-sm text-center mb-3'>
                  Nouveau compte
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => openAddDialog('FAMILY')}
                  className='text-xs'
                >
                  Ajouter
                </Button>
              </div>
            )}

            {/* Empty state for family */}
            {familyRelatives.length === 0 && !canAddRelatives && (
              <p className='text-muted-foreground py-4'>
                Aucun proche familial enregistré
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Autre Section */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg font-semibold'>Autre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4'>
            {/* Existing other relatives */}
            {otherRelatives.map((rel) => (
              <div
                key={rel.id}
                className='relative flex flex-col items-center p-4 border border-dashed border-gray-300 rounded-xl min-w-[160px] max-w-[180px] bg-white'
              >
                {canAddRelatives && (
                  <button
                    onClick={() => openDeleteDialog(rel.id)}
                    className='absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors'
                    title='Supprimer'
                  >
                    <X className='h-4 w-4' />
                  </button>
                )}
                <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3'>
                  <User className='h-8 w-8 text-gray-400' />
                </div>
                <p className='font-medium text-sm text-center truncate w-full'>
                  {rel.relatedPatient?.name || 'N/A'}
                </p>
                <p className='text-xs text-muted-foreground text-center'>
                  {rel.customRelationship || 'Autre'}
                </p>
              </div>
            ))}

            {/* Add new other relative card */}
            {canAddRelatives && (
              <div className='flex flex-col items-center p-4 border border-dashed border-gray-300 rounded-xl min-w-[160px] max-w-[180px] bg-white'>
                <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3'>
                  <User className='h-8 w-8 text-gray-400' />
                </div>
                <p className='font-medium text-sm text-center mb-3'>
                  Nouveau compte
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => openAddDialog('OTHER')}
                  className='text-xs'
                >
                  Ajouter
                </Button>
              </div>
            )}

            {/* Empty state for other */}
            {otherRelatives.length === 0 && !canAddRelatives && (
              <p className='text-muted-foreground py-4'>
                Aucun autre proche enregistré
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permission notice if cannot add */}
      {!canAddRelatives && (
        <div className='mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
          <p className='text-sm text-amber-800'>
            Vous n'avez pas la permission d'ajouter des proches. Veuillez
            contacter votre médecin pour obtenir cette autorisation.
          </p>
        </div>
      )}

      {/* Add Relative Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className='max-h-[90vh] flex flex-col p-0'>
          {/* Sticky Header */}
          <DialogHeader className='sticky top-0 bg-background z-10 px-6 pt-6 pb-4 border-b'>
            <DialogTitle>
              Ajouter un proche{' '}
              {addingType === 'FAMILY' ? '(Famille)' : '(Autre)'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className='flex flex-col flex-1 overflow-hidden'
          >
            {/* Scrollable Content */}
            <div className='flex-1 overflow-y-auto px-6 py-4 space-y-4'>
              {/* Name */}
              <div>
                <Label htmlFor='name'>
                  Nom complet <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='Nom et prénom'
                  required
                />
              </div>

              {/* Date of birth */}
              <div>
                <Label htmlFor='dateOfBirth'>Date de naissance</Label>
                <Input
                  id='dateOfBirth'
                  type='date'
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>

              {/* Gender */}
              <div>
                <Label htmlFor='gender'>
                  Genre <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Sélectionner' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='MALE'>Homme</SelectItem>
                    <SelectItem value='FEMALE'>Femme</SelectItem>
                    {/* <SelectItem value='OTHER'>Autre</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {/* Relationship type specific fields */}
              {addingType === 'FAMILY' ? (
                <div>
                  <Label htmlFor='familyRelationship'>
                    Lien familial <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={formData.familyRelationship}
                    onValueChange={(value) =>
                      setFormData({ ...formData, familyRelationship: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner le lien' />
                    </SelectTrigger>
                    <SelectContent>
                      {FAMILY_RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel.value} value={rel.value}>
                          {rel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label htmlFor='customRelationship'>
                    Description de la relation{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='customRelationship'
                    value={formData.customRelationship}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customRelationship: e.target.value,
                      })
                    }
                    placeholder='Ex: Ami, Voisin, Collègue...'
                    required={addingType === 'OTHER'}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='email@exemple.com'
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor='phoneNumber'>Téléphone</Label>
                <Input
                  id='phoneNumber'
                  type='tel'
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder='+33 6 XX XX XX XX'
                />
              </div>

              {/* Address */}
              <div>
                <Label htmlFor='address'>Adresse</Label>
                <Input
                  id='address'
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder='Adresse complète'
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className='sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowAddDialog(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingRelativeId(null);
        }}
        onConfirm={handleRemoveRelative}
        title='Supprimer ce proche'
        description='Êtes-vous sûr de vouloir supprimer ce proche ? Cette action est irréversible.'
        confirmText='Supprimer'
        cancelText='Annuler'
        variant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
};

// Patient Appointments Page
const PatientAppointmentsPage = ({ appointments }) => {
  return (
    <div className='p-8'>
      <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
        <span>ACCUEIL</span>
        <span>›</span>
        <span>MES RENDEZ-VOUS</span>
      </nav>
      <h1 className='text-3xl font-bold text-foreground mb-8'>
        Mes rendez-vous
      </h1>

      {appointments.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className='pt-6'>
                <div className='space-y-3'>
                  <div>
                    <h3 className='font-semibold text-lg text-foreground'>
                      {appointment.title}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      avec {appointment.doctor}
                    </p>
                  </div>

                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Clock className='h-4 w-4' />
                    <span>
                      {new Date(appointment.date).toLocaleDateString('fr-FR')} à{' '}
                      {appointment.time}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <MapPin className='h-4 w-4' />
                    <span>{appointment.location}</span>
                  </div>

                  <div className='pt-2'>
                    <span className='inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full'>
                      Prévu
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='pt-6'>
            <p className='text-muted-foreground text-center py-8'>
              Aucun rendez-vous prévu
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Patient Documents Page
const PatientDocumentsPage = ({ documents }) => {
  return (
    <div className='p-8'>
      <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
        <span>ACCUEIL</span>
        <span>›</span>
        <span>MES DOCUMENTS</span>
      </nav>
      <h1 className='text-3xl font-bold text-foreground mb-8'>Mes documents</h1>

      {documents.length > 0 ? (
        <div className='space-y-2'>
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <FileText className='h-5 w-5 text-muted-foreground' />
                    <div>
                      <p className='font-semibold text-foreground'>
                        {doc.name}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {doc.category} •{' '}
                        {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {doc.locked && (
                      <span className='text-xs px-2 py-1 bg-red-100 text-red-700 rounded'>
                        Verrouillé
                      </span>
                    )}
                    {!doc.locked && (
                      <Button size='sm' variant='outline'>
                        Télécharger
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='pt-6'>
            <p className='text-muted-foreground text-center py-8'>
              Aucun document disponible
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Patient Payments Page
const PatientPaymentsPage = () => {
  return (
    <div className='p-8'>
      <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
        <span>ACCUEIL</span>
        <span>›</span>
        <span>MES PAIEMENTS</span>
      </nav>
      <h1 className='text-3xl font-bold text-foreground mb-8'>Mes paiements</h1>

      <Card>
        <CardContent className='pt-6'>
          <p className='text-muted-foreground text-center py-8'>
            Aucun paiement enregistré
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientSpacePage;
