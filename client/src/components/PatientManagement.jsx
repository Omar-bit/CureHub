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
import { api } from '../services/api';
import { Button } from './ui/button';
import { SheetContent } from './ui/sheet';
import { ConfirmDialog } from './ui/confirm-dialog';
import { EntityCard } from './ui/entity-card';
import { FormInput, FormSelect, FormTextarea } from './ui/form-field';
import { SearchBar } from './ui/search-bar';
import { Alert } from './ui/alert';

import PatientCard from './PatientCard';
import PatientDetailsSheet from './PatientDetailsSheet';
import PatientFormSheet from './PatientFormSheet';

// Main Patient Management Component
const PatientManagement = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter patients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (patient.email &&
            patient.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (patient.phoneNumber && patient.phoneNumber.includes(searchQuery))
      );
      setFilteredPatients(filtered);
    }
  }, [patients, searchQuery]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/patients');
      setPatients(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load patients');
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
      await api.delete(`/patients/${patientToDelete.id}`);
      await loadPatients();
      setShowDetails(false);
      setPatientToDelete(null);
    } catch (error) {
      console.error('Error deleting patient:', error);
      setError('Failed to delete patient');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePatient = async (patientData) => {
    try {
      if (editingPatient) {
        await api.put(`/patients/${editingPatient.id}`, patientData);
      } else {
        await api.post('/patients', patientData);
      }
      await loadPatients();
    } catch (error) {
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

  return (
    <div className='h-full flex flex-col relative'>
      {/* Header */}
      <div className='flex-shrink-0 p-4 sm:p-6 border-b border-border'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center'>
            <Users className='w-6 h-6 text-primary mr-2' />
            <h2 className='text-xl font-semibold text-foreground'>Patients</h2>
          </div>
          <Button onClick={handleAddPatient} leftIcon={<Plus />}>
            Add Patient
          </Button>
        </div>

        {/* Search Bar */}
        <SearchBar
          placeholder='Search patients...'
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
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
                ? 'No patients found matching your search'
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
