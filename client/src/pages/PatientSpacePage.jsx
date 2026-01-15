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
  Video,
  Home,
  Building2,
  ChevronRight,
  Paperclip,
  RefreshCw,
  Grid3X3,
  List,
  Pin,
  MoreHorizontal,
  Download,
  Info,
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
      return <PatientAppointmentsPage />;
    } else if (location.pathname === '/patient-space/documents') {
      return <PatientDocumentsPage />;
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
const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await patientAuthAPI.getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showError('Erreur lors du chargement des rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLocationIcon = (location) => {
    switch (location) {
      case 'ONLINE':
        return <Video className='h-5 w-5 text-white' />;
      case 'ATHOME':
        return <Home className='h-5 w-5 text-white' />;
      default:
        return <Building2 className='h-5 w-5 text-white' />;
    }
  };

  const getLocationBgColor = (location) => {
    switch (location) {
      case 'ONLINE':
        return 'bg-blue-600';
      case 'ATHOME':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getPatientInitials = (patients) => {
    if (!patients || patients.length === 0) return '?';
    const name = patients[0]?.name || '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const AppointmentCard = ({ appointment }) => {
    // console.log(appointment);
    return (
      <div className='flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors'>
        <div className='flex items-center gap-4'>
          {/* Document icon */}
          <div className='text-gray-400'>
            <FileText className='h-5 w-5' />
          </div>

          {/* Location icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${getLocationBgColor(
              appointment.location
            )}`}
          >
            {getLocationIcon(appointment.location)}
          </div>

          {/* Date and time */}
          <div className='flex items-center gap-3'>
            <span className='text-gray-900 font-medium'>
              {formatDate(appointment.startTime)}
            </span>
            <span className='px-2 py-1 bg-gray-100 rounded text-sm text-gray-700'>
              {formatTime(appointment.startTime)}
            </span>
          </div>

          {/* Patient initials */}
          <div className='flex items-center gap-2'>
            <ChevronRight className='h-4 w-4 text-gray-400' />
            <div className='w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium'>
              {getPatientInitials(appointment.patients)}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          {/* Documents count */}
          {appointment.documentsCount > 0 && (
            <div className='flex items-center gap-1 text-gray-500'>
              <Paperclip className='h-4 w-4' />
              <span className='text-sm'>{appointment.documentsCount}</span>
            </div>
          )}

          {/* Arrow */}
          <ChevronRight className='h-5 w-5 text-gray-400' />
        </div>
      </div>
    );
  };

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
    <div className='p-8'>
      <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
        <span>ACCUEIL</span>
        <span>›</span>
        <span>MON COMPTE</span>
      </nav>

      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold text-foreground'>Mes rendez-vous</h1>
        <Button variant='outline' className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Ajouter
        </Button>
      </div>

      {/* Upcoming appointments section */}
      <div className='mb-8'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Prochain rendez-vous
        </h2>
        {appointments.upcoming.length > 0 ? (
          <div className='bg-white rounded-xl shadow-sm border divide-y'>
            {appointments.upcoming.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        ) : (
          <div className='bg-white rounded-xl shadow-sm border p-6'>
            <p className='text-muted-foreground text-center'>
              Aucun rendez-vous à venir
            </p>
          </div>
        )}
      </div>

      {/* Past appointments section */}
      <div>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Rendez-vous passé
        </h2>
        {appointments.past.length > 0 ? (
          <div className='bg-white rounded-xl shadow-sm border divide-y'>
            {appointments.past.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        ) : (
          <div className='bg-white rounded-xl shadow-sm border p-6'>
            <p className='text-muted-foreground text-center'>
              Aucun rendez-vous passé...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Patient Documents Page
const PatientDocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Document categories for filtering
  const DOCUMENT_CATEGORIES = [
    { value: 'all', label: 'Par catégorie' },
    { value: 'NON_CATEGORISE', label: 'Non catégorisés' },
    { value: 'PHARMACIE', label: 'Pharmacie' },
    { value: 'BIOLOGIE', label: 'Biologie' },
    { value: 'RADIOLOGIE', label: 'Radiologie' },
    { value: 'OPTIQUE', label: 'Optique' },
    { value: 'MATERIEL', label: 'Matériel' },
    { value: 'COMPTES_RENDUS', label: 'Comptes rendus' },
    { value: 'IMAGERIE', label: 'Imagerie' },
    { value: 'OPERATION', label: 'Opération' },
    { value: 'CONSULTATION', label: 'Consultation' },
    { value: 'HOSPITALISATION', label: 'Hospitalisation' },
    { value: 'SOINS_PARAMEDICAUX', label: 'Soins paramédicaux' },
    { value: 'KINE', label: 'Kinésithérapie' },
    { value: 'INFIRMIER', label: 'Infirmier' },
    { value: 'PODOLOGUE', label: 'Podologue' },
    { value: 'ORTHOPTISTE', label: 'Orthoptiste' },
    { value: 'ORTHOPHONISTE', label: 'Orthophoniste' },
    { value: 'ADMINISTRATIF', label: 'Administratif' },
    { value: 'COURRIER', label: 'Courrier' },
    { value: 'CERTIFICAT', label: 'Certificat' },
    { value: 'HONORAIRES', label: 'Honoraires' },
    { value: 'CONSENTEMENT', label: 'Consentement' },
    { value: 'ASSURANCE', label: 'Assurance' },
    { value: 'DEVIS', label: 'Devis' },
    { value: 'AUTRE', label: 'Autre' },
  ];

  const getCategoryLabel = (categoryValue) => {
    if (!categoryValue || categoryValue === 'AUTRE') return 'Non catégorisés';
    const cat = DOCUMENT_CATEGORIES.find((c) => c.value === categoryValue);
    return cat ? cat.label : categoryValue;
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await patientAuthAPI.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      showError('Erreur lors du chargement des documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const data = await patientAuthAPI.getDocuments();
      setDocuments(data);
      showSuccess('Documents actualisés');
    } catch (error) {
      console.error('Error refreshing documents:', error);
      showError("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async (doc) => {
    if (doc.locked) {
      showError('Ce document est verrouillé');
      return;
    }

    try {
      setDownloadingId(doc.id);
      const response = await patientAuthAPI.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Document téléchargé');
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Erreur lors du téléchargement');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleTogglePin = async (doc) => {
    // Only patient documents can be pinned (not appointment documents)
    if (doc.isAppointmentDocument) {
      showError('Les documents de rendez-vous ne peuvent pas être épinglés');
      return;
    }

    try {
      const result = await patientAuthAPI.toggleDocumentPin(doc.id);
      // Update the local state
      setDocuments((prevDocs) =>
        prevDocs.map((d) =>
          d.id === doc.id ? { ...d, pinned: result.pinned } : d
        )
      );
      showSuccess(result.pinned ? 'Document épinglé' : 'Document désépinglé');
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error toggling pin:', error);
      showError("Erreur lors de l'épinglage du document");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })} ${date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  // Filter documents based on category and pinned status
  const filteredDocuments = documents.filter((doc) => {
    // First apply pinned filter
    if (showPinnedOnly && !doc.pinned) return false;

    // Then apply category filter
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'NON_CATEGORISE') {
      return !doc.category || doc.category === 'AUTRE';
    }
    return doc.category === selectedCategory;
  });

  // Group documents by category
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const category =
      !doc.category || doc.category === 'AUTRE'
        ? 'NON_CATEGORISE'
        : doc.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {});

  // Sort pinned documents first within each category
  Object.keys(groupedDocuments).forEach((category) => {
    groupedDocuments[category].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  });

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
    <div className='p-8'>
      <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
        <span>ACCUEIL</span>
        <span>&gt;</span>
        <span>MON COMPTE</span>
      </nav>

      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold text-foreground'>Mes documents</h1>
      </div>

      {/* Toolbar */}
      <div className='flex items-center justify-between mb-6'>
        {/* Category filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='w-[180px] bg-gray-100 border-0'>
            <SelectValue placeholder='Par catégorie' />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Right side toolbar */}
        <div className='flex items-center gap-2'>
          {/* View mode buttons */}
          <div className='flex items-center border rounded-md'>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
              title='Vue grille'
            >
              <Grid3X3
                className={`h-4 w-4 ${
                  viewMode === 'grid' ? 'text-gray-700' : 'text-gray-500'
                }`}
              />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
              title='Vue liste'
            >
              <List
                className={`h-4 w-4 ${
                  viewMode === 'list' ? 'text-gray-700' : 'text-gray-500'
                }`}
              />
            </button>
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`p-2 transition-colors ${
                showPinnedOnly ? 'bg-yellow-100' : 'hover:bg-gray-100'
              }`}
              title={
                showPinnedOnly
                  ? 'Afficher tous les documents'
                  : 'Afficher uniquement les épinglés'
              }
            >
              <Pin
                className={`h-4 w-4 ${
                  showPinnedOnly
                    ? 'text-yellow-600 fill-yellow-500'
                    : 'text-gray-500'
                }`}
              />
            </button>
            <button
              onClick={handleRefresh}
              className='p-2 hover:bg-gray-100 transition-colors'
              title='Actualiser'
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 text-gray-500 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
            </button>
          </div>

          {/* Add button */}
          <Button
            variant='outline'
            className='flex items-center gap-2'
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className='h-4 w-4' />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Documents list */}
      {Object.keys(groupedDocuments).length > 0 ? (
        <div className='space-y-6'>
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <div key={category}>
              <h2 className='text-base font-semibold text-gray-700 mb-3'>
                {getCategoryLabel(category)}
              </h2>
              <div className='bg-white rounded-xl shadow-sm border'>
                {docs.map((doc, index) => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors ${
                      index !== docs.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    {/* Pin indicator */}
                    <div className='w-6 flex-shrink-0'>
                      {doc.pinned && (
                        <Pin className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                      )}
                    </div>

                    {/* File icon */}
                    <div className='flex-shrink-0 mr-3'>
                      <div className='w-8 h-8 bg-gray-100 rounded flex items-center justify-center'>
                        <FileText className='h-4 w-4 text-gray-500' />
                      </div>
                    </div>

                    {/* Document info */}
                    <div className='flex-1 min-w-0 mr-4'>
                      <p className='font-medium text-gray-900 truncate text-sm'>
                        {doc.originalName}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {formatDateTime(doc.uploadDate || doc.createdAt)}
                        {doc.fileSize && ` - ${formatFileSize(doc.fileSize)}`}
                      </p>
                    </div>

                    {/* Category dropdown */}
                    <div className='flex-shrink-0 mr-2'>
                      <Select defaultValue='choose'>
                        <SelectTrigger className='w-[130px] h-8 text-xs bg-white border'>
                          <SelectValue placeholder='Choisissez...' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='choose' disabled>
                            Choisissez...
                          </SelectItem>
                          {DOCUMENT_CATEGORIES.filter(
                            (c) =>
                              c.value !== 'all' && c.value !== 'NON_CATEGORISE'
                          ).map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* More options menu */}
                    <div className='relative flex-shrink-0'>
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === doc.id ? null : doc.id)
                        }
                        className='p-2 hover:bg-gray-100 rounded-full'
                      >
                        <MoreHorizontal className='h-4 w-4 text-gray-500' />
                      </button>
                      {openMenuId === doc.id && (
                        <div className='absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[150px]'>
                          <button
                            onClick={() => {
                              handleDownload(doc);
                              setOpenMenuId(null);
                            }}
                            disabled={doc.locked}
                            className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            <Download className='h-4 w-4' />
                            Télécharger
                          </button>
                          {!doc.isAppointmentDocument && (
                            <button
                              onClick={() => handleTogglePin(doc)}
                              className='w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2'
                            >
                              <Pin
                                className={`h-4 w-4 ${
                                  doc.pinned
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : ''
                                }`}
                              />
                              {doc.pinned ? 'Désépingler' : 'Épingler'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='bg-white rounded-xl shadow-sm border p-8'>
          <div className='text-center'>
            <FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-500'>
              {showPinnedOnly
                ? 'Aucun document épinglé'
                : selectedCategory !== 'all'
                ? 'Aucun document trouvé pour cette catégorie'
                : 'Aucun document disponible'}
            </p>
            {showPinnedOnly && (
              <Button
                variant='outline'
                className='mt-4'
                onClick={() => setShowPinnedOnly(false)}
              >
                Afficher tous les documents
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className='sm:max-w-[400px]'>
          <button
            onClick={() => setShowAddDialog(false)}
            className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100'
          >
            <X className='h-4 w-4' />
          </button>
          <div className='flex flex-col items-center text-center pt-6 pb-4'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
              <Info className='h-6 w-6 text-blue-600' />
            </div>
            <p className='text-gray-700 mb-6'>
              L'envoi de document ne peut se faire
              <br />
              qu'à l'occasion d'un rendez-vous.
            </p>
            <Button
              onClick={() => {
                setShowAddDialog(false);
                navigate('/patient-space/appointments');
              }}
              className='bg-gray-900 text-white hover:bg-gray-800'
            >
              Voir mes RDVs
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Click outside handler for menu */}
      {openMenuId && (
        <div
          className='fixed inset-0 z-0'
          onClick={() => setOpenMenuId(null)}
        />
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
