import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Include cookies in requests
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any stored user data and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data).then((res) => res.data),

  register: (data) => api.post('/auth/register', data).then((res) => res.data),

  logout: () => api.post('/auth/logout').then((res) => res.data),

  getProfile: () => api.get('/auth/profile').then((res) => res.data),

  getCurrentUser: () => api.get('/auth/me').then((res) => res.data),
};
