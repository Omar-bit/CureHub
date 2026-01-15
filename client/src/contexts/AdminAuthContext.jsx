import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { adminAPI } from '../services/api';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('admin');

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const adminData = await adminAPI.getProfile();
      setAdmin(adminData);
      setIsAuthenticated(true);
      localStorage.setItem('admin', JSON.stringify(adminData));
    } catch (error) {
      console.log('Admin auth check failed:', error.message);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      setAdmin(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password) => {
    try {
      const response = await adminAPI.login({ email, password });
      setAdmin(response.admin);
      setIsAuthenticated(true);
      localStorage.setItem('admin', JSON.stringify(response.admin));
      return { success: true, admin: response.admin };
    } catch (error) {
      console.error('Admin login failed:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    await adminAPI.logout();
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const value = {
    admin,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
