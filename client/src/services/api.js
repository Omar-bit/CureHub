import axios from 'axios';
import { showError, TOAST_MESSAGES } from '../lib/toast';

const API_BASE_URL = 'http://localhost:3000';

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
};
