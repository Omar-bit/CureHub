import axios from 'axios';
import { showError, TOAST_MESSAGES } from '../lib/toast';

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Include cookies in requests
});

// Response interceptor to handle auth errors and network issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      showError(TOAST_MESSAGES.NETWORK_ERROR);
    } else {
      // Handle specific HTTP errors
      switch (error.response.status) {
        case 401:
          // Clear any stored user data
          localStorage.removeItem('user');
          showError(TOAST_MESSAGES.SESSION_EXPIRED);

          // Only redirect if not already on login or register page
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/login';
          }
          break;
        case 403:
          showError(TOAST_MESSAGES.PERMISSION_ERROR);
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          showError('Server error. Please try again later.');
          break;
        // Don't show toast for other errors as they should be handled specifically
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data).then((res) => res.data),

  register: (data) => api.post('/auth/register', data).then((res) => res.data),

  verifyEmail: (data) =>
    api.post('/auth/verify-email', data).then((res) => res.data),

  resendVerification: (data) =>
    api.post('/auth/resend-verification', data).then((res) => res.data),

  logout: () => api.post('/auth/logout').then((res) => res.data),

  getProfile: () => api.get('/auth/profile').then((res) => res.data),

  getCurrentUser: () => api.get('/auth/me').then((res) => res.data),
};

export const patientAPI = {
  // Get all patients with optional query parameters
  getAll: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    const url = params ? `/patients?${params}` : '/patients';
    return api.get(url).then((res) => res.data);
  },

  // Get a specific patient by ID
  getById: (id) => api.get(`/patients/${id}`).then((res) => res.data),

  // Create a new patient
  create: (patientData) =>
    api.post('/patients', patientData).then((res) => res.data),

  // Update an existing patient
  update: (id, patientData) =>
    api.patch(`/patients/${id}`, patientData).then((res) => res.data),

  // Delete a patient (soft delete)
  delete: (id) => api.delete(`/patients/${id}`).then((res) => res.data),

  // Restore a deleted patient
  restore: (id) => api.patch(`/patients/${id}/restore`).then((res) => res.data),

  // Patient Relationships API

  // Get all relatives (proches) of a patient
  getRelatives: (patientId) =>
    api.get(`/patients/${patientId}/relatives`).then((res) => res.data),

  // Create a new patient and link them as a relative
  createWithRelationship: (mainPatientId, data) =>
    api
      .post(`/patients/${mainPatientId}/relatives`, data)
      .then((res) => res.data),

  // Add an existing patient as a relative
  addExistingRelative: (mainPatientId, relatedPatientId, relationshipData) =>
    api
      .post(
        `/patients/${mainPatientId}/relatives/${relatedPatientId}`,
        relationshipData
      )
      .then((res) => res.data),

  // Remove a patient relationship
  removeRelationship: (relationshipId) =>
    api
      .delete(`/patients/relationships/${relationshipId}`)
      .then((res) => res.data),

  // Update patient permissions
  updatePermissions: (patientId, permissions) =>
    api
      .patch(`/patients/${patientId}/permissions`, permissions)
      .then((res) => res.data),
};

export const consultationTypesAPI = {
  // Get all consultation types with optional query parameters
  getAll: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    const url = params
      ? `/consultation-types?${params}`
      : '/consultation-types';
    return api.get(url).then((res) => res.data);
  },

  // Get a specific consultation type by ID
  getById: (id) => api.get(`/consultation-types/${id}`).then((res) => res.data),

  // Create a new consultation type
  create: (data) =>
    api.post('/consultation-types', data).then((res) => res.data),

  // Update an existing consultation type
  update: (id, data) =>
    api.patch(`/consultation-types/${id}`, data).then((res) => res.data),

  // Delete a consultation type
  delete: (id) =>
    api.delete(`/consultation-types/${id}`).then((res) => res.data),
};

export const timeplanAPI = {
  // Get all timeplans for the authenticated doctor
  getAll: () => api.get('/timeplan').then((res) => res.data),

  // Get timeplan for a specific day
  getByDay: (dayOfWeek) =>
    api.get(`/timeplan/${dayOfWeek}`).then((res) => res.data),

  // Create or update timeplan for a specific day
  createOrUpdate: (data) => api.post('/timeplan', data).then((res) => res.data),

  // Update timeplan for a specific day
  update: (dayOfWeek, data) =>
    api.put(`/timeplan/${dayOfWeek}`, data).then((res) => res.data),

  // Delete timeplan for a specific day
  delete: (dayOfWeek) =>
    api.delete(`/timeplan/${dayOfWeek}`).then((res) => res.data),

  // Delete a specific time slot
  deleteTimeSlot: (timeSlotId) =>
    api.delete(`/timeplan/time-slot/${timeSlotId}`).then((res) => res.data),
};

export const appointmentAPI = {
  // Get all appointments for the authenticated doctor
  getAll: (params = {}) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/appointments${query}`).then((res) => res.data);
  },

  // Get upcoming appointments
  getUpcoming: (limit = 5) =>
    api.get(`/appointments/upcoming?limit=${limit}`).then((res) => res.data),

  // Get appointments for a specific date
  getByDate: (date) => {
    const dateStr =
      date instanceof Date ? date.toISOString().split('T')[0] : date;
    return api.get(`/appointments/by-date/${dateStr}`).then((res) => res.data);
  },

  // Get a specific appointment by ID
  getById: (id) => api.get(`/appointments/${id}`).then((res) => res.data),

  // Create a new appointment
  create: (data) => api.post('/appointments', data).then((res) => res.data),

  // Update an existing appointment
  update: (id, data) =>
    api.patch(`/appointments/${id}`, data).then((res) => res.data),

  // Delete an appointment
  delete: (id) => api.delete(`/appointments/${id}`).then((res) => res.data),

  // Get appointments for a date range
  getByDateRange: (startDate, endDate, additionalParams = {}) => {
    const params = new URLSearchParams({
      startDate:
        startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
      ...additionalParams,
    });
    return api
      .get(`/appointments?${params.toString()}`)
      .then((res) => res.data);
  },

  // Get appointments by status
  getByStatus: (status, additionalParams = {}) => {
    const params = new URLSearchParams({
      status,
      ...additionalParams,
    });
    return api
      .get(`/appointments?${params.toString()}`)
      .then((res) => res.data);
  },

  // Get appointments for a specific patient
  getByPatient: (patientId, additionalParams = {}) => {
    const params = new URLSearchParams({
      patientId,
      ...additionalParams,
    });
    return api
      .get(`/appointments?${params.toString()}`)
      .then((res) => res.data);
  },

  // Get available time slots for a specific date and consultation type
  getAvailableSlots: (date, consultationTypeId) => {
    const params = new URLSearchParams({
      date: date instanceof Date ? date.toISOString().split('T')[0] : date,
      ...(consultationTypeId && { consultationTypeId }),
    });
    return api
      .get(`/appointments/available-slots?${params.toString()}`)
      .then((res) => res.data);
  },
};

export const taskAPI = {
  // Get all tasks for the authenticated doctor
  getAll: (params = {}) => {
    const query =
      params && Object.keys(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : '';
    return api.get(`/tasks${query}`).then((res) => res.data);
  },

  // Get task statistics
  getStats: () => api.get('/tasks/stats').then((res) => res.data),

  // Get a specific task by ID
  getById: (id) => api.get(`/tasks/${id}`).then((res) => res.data),

  // Create a new task
  create: (data) => api.post('/tasks', data).then((res) => res.data),

  // Update an existing task
  update: (id, data) => api.patch(`/tasks/${id}`, data).then((res) => res.data),

  // Toggle task completion status
  toggleCompletion: (id) =>
    api.patch(`/tasks/${id}/toggle-completion`).then((res) => res.data),

  // Delete a task
  delete: (id) => api.delete(`/tasks/${id}`).then((res) => res.data),

  // Get tasks filtered by completion status
  getByCompletion: (completed, additionalParams = {}) => {
    const params = new URLSearchParams({
      completed: completed.toString(),
      ...additionalParams,
    });
    return api.get(`/tasks?${params.toString()}`).then((res) => res.data);
  },

  // Get tasks filtered by priority
  getByPriority: (priority, additionalParams = {}) => {
    const params = new URLSearchParams({
      priority,
      ...additionalParams,
    });
    return api.get(`/tasks?${params.toString()}`).then((res) => res.data);
  },

  // Get tasks filtered by category
  getByCategory: (category, additionalParams = {}) => {
    const params = new URLSearchParams({
      category,
      ...additionalParams,
    });
    return api.get(`/tasks?${params.toString()}`).then((res) => res.data);
  },

  // Get tasks for a specific patient
  getByPatient: (patientId, additionalParams = {}) => {
    const params = new URLSearchParams({
      patientId,
      ...additionalParams,
    });
    return api.get(`/tasks?${params.toString()}`).then((res) => res.data);
  },

  // Search tasks
  search: (searchTerm, additionalParams = {}) => {
    const params = new URLSearchParams({
      search: searchTerm,
      ...additionalParams,
    });
    return api.get(`/tasks?${params.toString()}`).then((res) => res.data);
  },
};

// Patient Documents API
export const documentsApi = {
  // Upload a document for a patient
  upload: (file, patientId, category, description) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    if (category) formData.append('category', category);
    if (description) formData.append('description', description);

    return api
      .post('/patient-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data);
  },

  // Get all documents for a patient
  getByPatient: (patientId, filters = {}) => {
    const params = new URLSearchParams(filters);
    return api
      .get(`/patient-documents/patient/${patientId}?${params.toString()}`)
      .then((res) => res.data);
  },

  // Get document categories
  getCategories: () =>
    api.get('/patient-documents/categories').then((res) => res.data),

  // Get a specific document
  get: (documentId) =>
    api.get(`/patient-documents/${documentId}`).then((res) => res.data),

  // Update a document
  update: (documentId, data) =>
    api.put(`/patient-documents/${documentId}`, data).then((res) => res.data),

  // Delete a document
  delete: (documentId) =>
    api.delete(`/patient-documents/${documentId}`).then((res) => res.data),

  // Download a document
  download: (documentId) => {
    return api.get(`/patient-documents/${documentId}/download`, {
      responseType: 'blob',
    });
  },

  // Get download URL for a document
  getDownloadUrl: (documentId) =>
    `${API_BASE_URL}/patient-documents/${documentId}/download`,
};
