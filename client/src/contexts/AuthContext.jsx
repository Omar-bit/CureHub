import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { authAPI } from '../services/api';
import { showSuccess, showError, showInfo, TOAST_MESSAGES } from '../lib/toast';

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

      showSuccess(TOAST_MESSAGES.LOGIN_SUCCESS);

      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage =
        error.response?.data?.message || TOAST_MESSAGES.LOGIN_ERROR;
      showError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      // Registration now returns a message instead of immediate login
      // User needs to verify email before logging in
      const message = response.message || TOAST_MESSAGES.REGISTER_SUCCESS;
      showSuccess(message);

      return {
        success: true,
        requiresVerification: true,
        email: userData.email,
        message,
      };
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage =
        error.response?.data?.message || TOAST_MESSAGES.REGISTER_ERROR;
      showError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear server-side cookie
      await authAPI.logout();
      showSuccess(TOAST_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of server response
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const setUserData = useCallback((updatedUser) => {
    if (!updatedUser) {
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsAuthenticated(true);
  }, []);

  const verifyEmail = async (email, code) => {
    try {
      const response = await authAPI.verifyEmail({ email, code });
      const message =
        response.message || TOAST_MESSAGES.EMAIL_VERIFICATION_SUCCESS;
      showSuccess(message);
      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Email verification failed:', error);
      const errorMessage =
        error.response?.data?.message ||
        TOAST_MESSAGES.EMAIL_VERIFICATION_ERROR;
      showError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await authAPI.resendVerification({ email });
      const message =
        response.message || TOAST_MESSAGES.EMAIL_VERIFICATION_SENT;
      showInfo(message);
      return {
        success: true,
        message,
      };
    } catch (error) {
      console.error('Resend verification failed:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to resend verification code';
      showError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    setUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
