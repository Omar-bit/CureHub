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
import { api, patientAPI } from '../services/api';
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

import PatientCard from './PatientCard';
import PatientDetailsSheet from './PatientDetailsSheet';
import PatientFormSheet from './PatientFormSheet';

// Main Patient Management Component
const PatientManagement = () => {
  const { t } = useTranslation();

  // Search categories configuration
  const searchCategories = [
    { value: 'name', label: t('Name') || 'Nom Prénom' },
    { value: 'dateOfBirth', label: t('Birth Date') || 'Date naiss.' },
    { value: 'phoneNumber', label: t('Phone') || 'Téléphone' },
    { value: 'email', label: t('Email') || 'Email' },
    { value: 'address', label: t('Address') || 'Adresse' },
  ];
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('name');
  const [selectedPatient, setSelectedPatient] = useState(null);
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

  // Filter patients based on search query and category
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter((patient) => {
        const query = searchQuery.toLowerCase();

        switch (searchCategory) {
          case 'name':
            return patient.name?.toLowerCase().includes(query);
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
          case 'address':
            return patient.address?.toLowerCase().includes(query);
          default:
            // Fallback to search all fields if category not found
            const fallbackDateStr = patient.dateOfBirth
              ? new Date(patient.dateOfBirth).toLocaleDateString()
              : '';
            return (
              patient.name?.toLowerCase().includes(query) ||
              patient.email?.toLowerCase().includes(query) ||
              patient.phoneNumber?.includes(query) ||
              patient.address?.toLowerCase().includes(query) ||
              fallbackDateStr.toLowerCase().includes(query)
            );
        }
      });
      setFilteredPatients(filtered);
    }
  }, [patients, searchQuery, searchCategory]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const response = await patientAPI.getAll();
      setPatients(response);
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

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
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

        {/* Search Bar with Categories */}
        <CategorizedSearchBar
          value={searchQuery}
          selectedCategory={searchCategory}
          categories={searchCategories}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          onCategoryChange={handleCategoryChange}
        />
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
          onClose={() => setShowDetails(false)}
          onEdit={handleEditPatient}
          onDelete={handleDeletePatient}
        />
      )}

      {showAddEdit && (
        <PatientFormSheet
          patient={editingPatient}
          isOpen={showAddEdit}
          onClose={() => setShowAddEdit(false)}
          onSave={handleSavePatient}
        />
      )}

      <ConfirmDialog
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={confirmDeletePatient}
        title='Delete Patient'
        description={`Are you sure you want to delete ${patientToDelete?.name}? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        variant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PatientManagement;
