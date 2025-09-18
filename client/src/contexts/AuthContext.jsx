import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      // Try to get current user to check if cookie is valid
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);

      // Store user data in localStorage for persistence across page refreshes
      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (error) {
      // No valid authentication cookie or network error
      console.log(
        'No valid authentication found:',
        error.response?.status || error.message
      );

      // Just clear state without calling API logout to prevent loops
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies to prevent re-creation

  useEffect(() => {
    // Only check auth status once on mount
    checkAuthStatus();
  }, [checkAuthStatus]); // Include checkAuthStatus as dependency

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });

      // Cookie is set automatically by the server
      // Store user data in localStorage for UI state
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      setIsAuthenticated(true);

      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      // Cookie is set automatically by the server
      // Store user data in localStorage for UI state
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      setIsAuthenticated(true);

      return { success: true, user: response.user };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear server-side cookie
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of server response
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
