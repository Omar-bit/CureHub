import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  X,
  ChevronRight,
  Users,
} from 'lucide-react';
import { api } from '../services/api';

// Patient Card Component
const PatientCard = ({ patient, onEdit, onDelete, onView }) => {
  const { t } = useTranslation();

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
    <div className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'>
      <div className='flex items-start justify-between'>
        <div
          className='flex items-start space-x-3 flex-1'
          onClick={() => onView(patient)}
        >
          <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
            {patient.profileImage ? (
              <img
                src={patient.profileImage}
                alt={patient.name}
                className='w-12 h-12 rounded-full object-cover'
              />
            ) : (
              <User className='w-6 h-6 text-blue-600' />
            )}
          </div>

          <div className='flex-1 min-w-0'>
            <h3 className='text-sm font-medium text-gray-900 truncate'>
              {patient.name}
            </h3>
            <p className='text-sm text-gray-500'>
              {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
            </p>

            <div className='mt-2 space-y-1'>
              {patient.email && (
                <div className='flex items-center text-xs text-gray-500'>
                  <Mail className='w-3 h-3 mr-1' />
                  <span className='truncate'>{patient.email}</span>
                </div>
              )}
              {patient.phoneNumber && (
                <div className='flex items-center text-xs text-gray-500'>
                  <Phone className='w-3 h-3 mr-1' />
                  <span>{patient.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='flex items-center space-x-2 ml-2'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(patient);
            }}
            className='p-1 text-gray-400 hover:text-blue-600 transition-colors'
          >
            <Edit3 className='w-4 h-4' />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(patient);
            }}
            className='p-1 text-gray-400 hover:text-red-600 transition-colors'
          >
            <Trash2 className='w-4 h-4' />
          </button>
          <ChevronRight className='w-4 h-4 text-gray-400' />
        </div>
      </div>
    </div>
  );
};

// Patient Details Popup Component
const PatientDetailsPopup = ({
  patient,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

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
    <>
      {/* Popup */}
      <div className='absolute inset-0 h-full w-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto'>
        <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Patient Details
          </h2>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6'>
          {/* Profile Section */}
          <div className='text-center mb-6'>
            <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              {patient.profileImage ? (
                <img
                  src={patient.profileImage}
                  alt={patient.name}
                  className='w-20 h-20 rounded-full object-cover'
                />
              ) : (
                <User className='w-10 h-10 text-blue-600' />
              )}
            </div>
            <h3 className='text-xl font-semibold text-gray-900'>
              {patient.name}
            </h3>
            <p className='text-gray-500'>
              {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
            </p>
          </div>

          {/* Information Section */}
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Date of Birth
              </label>
              <div className='flex items-center text-sm text-gray-900'>
                <Calendar className='w-4 h-4 mr-2 text-gray-400' />
                {formatDate(patient.dateOfBirth)}
              </div>
            </div>

            {patient.email && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email Address
                </label>
                <div className='flex items-center text-sm text-gray-900'>
                  <Mail className='w-4 h-4 mr-2 text-gray-400' />
                  {patient.email}
                </div>
              </div>
            )}

            {patient.phoneNumber && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Phone Number
                </label>
                <div className='flex items-center text-sm text-gray-900'>
                  <Phone className='w-4 h-4 mr-2 text-gray-400' />
                  {patient.phoneNumber}
                </div>
              </div>
            )}

            {patient.address && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Address
                </label>
                <div className='flex items-start text-sm text-gray-900'>
                  <MapPin className='w-4 h-4 mr-2 text-gray-400 mt-0.5' />
                  <span>{patient.address}</span>
                </div>
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Patient Since
              </label>
              <div className='text-sm text-gray-900'>
                {formatDate(patient.createdAt)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='mt-8 flex space-x-3'>
            <button
              onClick={() => onEdit(patient)}
              className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center'
            >
              <Edit3 className='w-4 h-4 mr-2' />
              Edit Patient
            </button>
            <button
              onClick={() => onDelete(patient)}
              className='flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center'
            >
              <Trash2 className='w-4 h-4 mr-2' />
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Add/Edit Patient Popup Component
const AddEditPatientPopup = ({ patient, isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'MALE',
    email: '',
    phoneNumber: '',
    address: '',
    profileImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        dateOfBirth: patient.dateOfBirth
          ? patient.dateOfBirth.split('T')[0]
          : '',
        gender: patient.gender || 'MALE',
        email: patient.email || '',
        phoneNumber: patient.phoneNumber || '',
        address: patient.address || '',
        profileImage: patient.profileImage || '',
      });
    } else {
      setFormData({
        name: '',
        dateOfBirth: '',
        gender: 'MALE',
        email: '',
        phoneNumber: '',
        address: '',
        profileImage: '',
      });
    }
    setErrors({});
  }, [patient, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const payload = { ...formData };

      // Remove empty fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') {
          delete payload[key];
        }
      });

      await onSave(payload);
      onClose();
    } catch (error) {
      setErrors({ general: error.message || 'Failed to save patient' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Popup */}
      <div className='absolute inset-0 h-full w-full  bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto'>
        <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6'>
          {errors.general && (
            <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
              {errors.general}
            </div>
          )}

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Full Name *
              </label>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder="Enter patient's full name"
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Date of Birth *
              </label>
              <input
                type='date'
                name='dateOfBirth'
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Gender *
              </label>
              <select
                name='gender'
                value={formData.gender}
                onChange={handleChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='MALE'>Male</option>
                <option value='FEMALE'>Female</option>
                <option value='OTHER'>Other</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Email Address
              </label>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter email address'
              />
              <p className='text-xs text-gray-500 mt-1'>
                If provided, login credentials will be sent to this email
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Phone Number
              </label>
              <input
                type='tel'
                name='phoneNumber'
                value={formData.phoneNumber}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter phone number'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Address
              </label>
              <textarea
                name='address'
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder="Enter patient's address"
              />
            </div>
          </div>

          <div className='mt-8 flex space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {isLoading
                ? 'Saving...'
                : patient
                ? 'Update Patient'
                : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// Main Patient Management Component
const PatientManagement = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleDeletePatient = async (patient) => {
    if (window.confirm(`Are you sure you want to delete ${patient.name}?`)) {
      try {
        await api.delete(`/patients/${patient.id}`);
        await loadPatients();
        setShowDetails(false);
      } catch (error) {
        alert('Failed to delete patient');
        console.error('Error deleting patient:', error);
      }
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

  return (
    <div className='h-full flex flex-col relative'>
      {/* Header */}
      <div className='flex-shrink-0 p-4 sm:p-6 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center'>
            <Users className='w-6 h-6 text-blue-600 mr-2' />
            <h2 className='text-xl font-semibold text-gray-900'>Patients</h2>
          </div>
          <button
            onClick={handleAddPatient}
            className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm'
          >
            <Plus className='w-4 h-4 mr-2' />
            Add Patient
          </button>
        </div>

        {/* Search Bar */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <input
            type='text'
            placeholder='Search patients...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
        {isLoading ? (
          <div className='flex items-center justify-center h-32'>
            <div className='text-gray-500'>Loading patients...</div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center h-32'>
            <div className='text-red-500'>{error}</div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-32 text-gray-500'>
            <Users className='w-12 h-12 mb-2 text-gray-300' />
            <p className='text-sm'>
              {searchQuery
                ? 'No patients found matching your search'
                : 'No patients yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddPatient}
                className='mt-2 text-blue-600 hover:text-blue-700 text-sm'
              >
                Add your first patient
              </button>
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

      {/* Popups */}
      <PatientDetailsPopup
        patient={selectedPatient}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onEdit={handleEditPatient}
        onDelete={handleDeletePatient}
      />

      <AddEditPatientPopup
        patient={editingPatient}
        isOpen={showAddEdit}
        onClose={() => setShowAddEdit(false)}
        onSave={handleSavePatient}
      />
    </div>
  );
};

export default PatientManagement;
