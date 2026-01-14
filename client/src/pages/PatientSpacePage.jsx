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
  Calendar,
  FileText,
  User,
  AlertCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import PatientIdentityTab from '../components/PatientIdentityTab';
import PatientPasswordTab from '../components/PatientPasswordTab';

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
          <PatientIdentityTab
            patientData={updatedPatientData || patientData}
            onUpdate={handlePatientUpdate}
          />
        </div>
      )}
      {showPassword && (
        <div className='max-w-2xl mx-auto mt-8'>
          <PatientPasswordTab />
        </div>
      )}
    </div>
  );
};

// Patient Relatives Page
const PatientRelativesPage = () => {
  return (
    <div className='p-8'>
      <nav className='flex items-center space-x-2 text-sm text-muted-foreground mb-4'>
        <span>ACCUEIL</span>
        <span>›</span>
        <span>MES PROCHES</span>
      </nav>
      <h1 className='text-3xl font-bold text-foreground mb-8'>Mes proches</h1>

      <Card>
        <CardContent className='pt-6'>
          <p className='text-muted-foreground text-center py-8'>
            Aucun proche enregistré
          </p>
        </CardContent>
      </Card>
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
