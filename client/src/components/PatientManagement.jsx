import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit3,
  Trash2,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
} from 'lucide-react';
import {
  api,
  patientAPI,
  appointmentAPI,
  consultationTypesAPI,
} from '../services/api';
import {
  showSuccess,
  showError,
  showApiError,
  TOAST_MESSAGES,
} from '../lib/toast';
import { Button } from './ui/button';
import { SheetContent } from './ui/sheet';
import { ConfirmDialog } from './ui/confirm-dialog';
import { EntityCard } from './ui/entity-card';
import { FormInput, FormSelect, FormTextarea } from './ui/form-field';
import { CategorizedSearchBar } from './ui/categorized-search-bar';
import { Alert } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

import PatientCard from './PatientCard';
import PatientDetailsSheet from './PatientDetailsSheet';
import PatientFormSheet from './PatientFormSheet';
import { getPatientDisplayName } from '../lib/patient';

// Main Patient Management Component
const PatientManagement = ({ onAppointmentCreated }) => {
  const { t } = useTranslation();

  // Search categories configuration
  const searchCategories = [
    { value: 'fullName', label: t('Full Name') || 'Nom Prénom' },
    { value: 'lastName', label: t('Last Name') || 'Nom' },
    { value: 'firstName', label: t('First Name') || 'Prénom' },
    { value: 'dateOfBirth', label: t('Birth Date') || 'Date naiss.' },
    { value: 'phoneNumber', label: t('Phone') || 'Téléphone' },
    { value: 'email', label: t('Email') || 'Email' },
  ];

  // Status filter categories
  const statusCategories = [
    { value: 'all', label: t('All') || 'Tous' },
    { value: 'new', label: t('New') || 'Nouveaux' },
    { value: 'seen', label: t('Already Seen') || 'Déjà vus' },
    { value: 'visitors', label: t('Visitors') || 'Visiteurs' },
    { value: 'relatives', label: t('Relatives') || 'Proches' },
    { value: 'blocked', label: t('Blocked') || 'Blacklisté' },
  ];

  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('fullName');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTab, setSelectedTab] = useState('profil');
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Load patients
  useEffect(() => {
    loadPatients();
  }, []);

  // Filter patients based on search query, category, and status filter
  useEffect(() => {
    let filtered = [];

    // Apply status filter first
    if (statusFilter === 'visitors') {
      // Show only visitors (patients where visitor = true)
      filtered = patients.filter((patient) => patient.visitor === true);
    } else if (statusFilter === 'all') {
      // Show all patients (including visitors)
      filtered = [...patients];
    } else {
      // Filter regular patients only (exclude visitors)
      filtered = patients.filter((patient) => {
        // Exclude visitors from other filters
        if (patient.visitor === true) {
          return false;
        }
        
        switch (statusFilter) {
          case 'new':
            // New patients have dejaVu = 0 (never been seen)
            return patient.dejaVu === 0;
          case 'seen':
            // Seen patients have dejaVu > 0 (been seen at least once)
            return patient.dejaVu > 0;
          case 'relatives':
            // Patients who have relationships (either as main or related patient)
            return (
              (patient.relatedPatients && patient.relatedPatients.length > 0) ||
              (patient.relationshipsAsRelated &&
                patient.relationshipsAsRelated.length > 0)
            );
          case 'blocked':
            return patient.isBlocked;
          default:
            return true;
        }
      });
    }

    // Then apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((patient) => {
        const query = searchQuery.toLowerCase();

        // Parse name field: format is "firstName!SP!lastName" or just "name" for visitors
        const nameParts = patient.name?.split('!SP!') || [];
        const firstName = (nameParts[0] || '').toLowerCase();
        const lastName = (nameParts[1] || '').toLowerCase();
        const fullName = patient.name?.replace('!SP!', ' ').toLowerCase() || '';

        switch (searchCategory) {
          case 'fullName':
            return fullName.includes(query);
          case 'lastName':
            return lastName.includes(query);
          case 'firstName':
            return firstName.includes(query);
          case 'dateOfBirth':
            // Convert date to string for searching
            const dateStr = patient.dateOfBirth
              ? new Date(patient.dateOfBirth).toLocaleDateString()
              : '';
            return dateStr.toLowerCase().includes(query);
          case 'phoneNumber':
            return patient.phoneNumber?.includes(query);
          case 'email':
            return patient.email?.toLowerCase().includes(query);
          default:
            // Fallback to search all fields if category not found
            const fallbackDateStr = patient.dateOfBirth
              ? new Date(patient.dateOfBirth).toLocaleDateString()
              : '';
            return (
              fullName.includes(query) ||
              patient.email?.toLowerCase().includes(query) ||
              patient.phoneNumber?.includes(query) ||
              fallbackDateStr.toLowerCase().includes(query)
            );
        }
      });
    }

    setFilteredPatients(filtered);
  }, [patients, searchQuery, searchCategory, statusFilter]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const [patientsResponse, consultationTypesResponse] = await Promise.all([
        patientAPI.getAll(),
        consultationTypesAPI.getAll(),
      ]);
      setPatients(patientsResponse);
      setConsultationTypes(consultationTypesResponse);
      setError('');
    } catch (error) {
      const errorMessage = 'Failed to load patients';
      setError(errorMessage);
      showApiError(error, errorMessage);
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    setShowAddEdit(true);
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setShowAddEdit(true);
    setShowDetails(false);
  };

  const handleViewPatient = (patient, tab = 'profil') => {
    setSelectedPatient(patient);
    setSelectedTab(tab);
    setShowDetails(true);
  };

  const handleDeletePatient = (patient) => {
    setPatientToDelete(patient);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      setIsDeleting(true);
      await patientAPI.delete(patientToDelete.id);
      await loadPatients();
      setShowDetails(false);
      setPatientToDelete(null);
      showSuccess(TOAST_MESSAGES.PATIENT_DELETED);
    } catch (error) {
      console.error('Error deleting patient:', error);
      showApiError(error, TOAST_MESSAGES.PATIENT_ERROR);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePatient = async (patientData) => {
    try {
      if (editingPatient) {
        await patientAPI.update(editingPatient.id, patientData);
        showSuccess(TOAST_MESSAGES.PATIENT_UPDATED);
      } else {
        await patientAPI.create(patientData);
        showSuccess(TOAST_MESSAGES.PATIENT_CREATED);
      }
      await loadPatients();
    } catch (error) {
      showApiError(error, TOAST_MESSAGES.PATIENT_ERROR);
      throw new Error(
        error.response?.data?.message || 'Failed to save patient'
      );
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  const handleCategoryChange = (category) => {
    setSearchCategory(category);
  };

  return (
    <div className=' flex flex-col '>
      {/* Header */}
      <div className='flex-shrink-0 p-4 sm:p-6 border-b border-border'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center'>
            <Users className='w-6 h-6 text-primary mr-2' />
            <h2 className='text-xl font-semibold text-foreground'>Patients</h2>
            <Plus
              onClick={handleAddPatient}
              className='text-primary bg-primary/30 rounded-full p-1 ml-2 cursor-pointer'
            />
          </div>
        </div>

        {/* Search Bar with Categories and Status Filter */}
        <div className='flex gap-2 items-center'>
          <div className='flex-1'>
            <CategorizedSearchBar
              value={searchQuery}
              selectedCategory={searchCategory}
              categories={searchCategories}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              onCategoryChange={handleCategoryChange}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder={t('Status') || 'Statut'} />
            </SelectTrigger>
            <SelectContent>
              {statusCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
        {error && (
          <Alert variant='destructive' className='mb-4'>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className='flex items-center justify-center h-32'>
            <div className='text-muted-foreground'>Loading patients...</div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-32 text-muted-foreground'>
            <Users className='w-12 h-12 mb-2 text-muted-foreground/50' />
            <p className='text-sm'>
              {searchQuery
                ? `No patients found matching "${searchQuery}" in ${
                    searchCategories.find((cat) => cat.value === searchCategory)
                      ?.label || 'selected category'
                  }`
                : 'No patients yet'}
            </p>
            {!searchQuery && (
              <Button
                variant='link'
                onClick={handleAddPatient}
                className='mt-2'
              >
                Add your first patient
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onEdit={handleEditPatient}
                onDelete={handleDeletePatient}
                onView={handleViewPatient}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sheets and Dialogs */}
      {showDetails && (
        <PatientDetailsSheet
          patient={selectedPatient}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedTab('profil'); // Reset to default tab when closing
            loadPatients(); // Reload patients to reflect any changes made in the details view
          }}
          onEdit={handleEditPatient}
          onDelete={handleDeletePatient}
          initialTab={selectedTab}
          onView={handleViewPatient}
          patients={patients}
          consultationTypes={consultationTypes}
          onAppointmentCreated={onAppointmentCreated}
          onPatientUpdated={loadPatients}
        />
      )}

      {showAddEdit && (
        <PatientFormSheet
          patient={editingPatient}
          isOpen={showAddEdit}
          onClose={() => setShowAddEdit(false)}
          onSave={handleSavePatient}
          onDelete={(patient) => {
            setShowAddEdit(false);
            handleDeletePatient(patient);
          }}
          onBlock={async (patient) => {
            try {
              const newBlockedStatus = !patient.isBlocked;
              const updatedPatient = await patientAPI.update(patient.id, {
                isBlocked: newBlockedStatus,
              });
              await loadPatients();
              // Update editingPatient with the new blocked status
              setEditingPatient(updatedPatient);
              showSuccess(
                newBlockedStatus
                  ? 'Patient bloqué avec succès'
                  : 'Patient débloqué avec succès'
              );
            } catch (error) {
              showApiError(
                error,
                'Erreur lors de la modification du statut du patient'
              );
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={confirmDeletePatient}
        title='Delete Patient'
        description={`Are you sure you want to delete ${getPatientDisplayName(
          patientToDelete
        )}? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        variant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PatientManagement;
