import toast from 'react-hot-toast';

// Custom toast utility functions with consistent styling and messaging

/**
 * Show a success toast
 * @param {string} message - The success message to display
 * @param {object} options - Additional options for the toast
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 4000,
    ...options,
  });
};

/**
 * Show an error toast
 * @param {string} message - The error message to display
 * @param {object} options - Additional options for the toast
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    duration: 5000,
    ...options,
  });
};

/**
 * Show an info toast
 * @param {string} message - The info message to display
 * @param {object} options - Additional options for the toast
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    ...options,
  });
};

/**
 * Show a warning toast
 * @param {string} message - The warning message to display
 * @param {object} options - Additional options for the toast
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      background: 'var(--background)',
      color: 'var(--foreground)',
      border: '1px solid #f59e0b',
    },
    ...options,
  });
};

/**
 * Show a loading toast
 * @param {string} message - The loading message to display
 * @param {object} options - Additional options for the toast
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...options,
  });
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - The ID of the toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Promise-based toast that shows loading, then success or error
 * @param {Promise} promise - The promise to handle
 * @param {object} messages - Object containing loading, success, and error messages
 * @param {object} options - Additional options for the toast
 */
export const showPromiseToast = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong!',
    },
    {
      duration: 4000,
      ...options,
    }
  );
};

// Pre-defined common messages
export const TOAST_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Welcome back! Successfully logged in.',
  LOGIN_ERROR: 'Login failed. Please check your credentials.',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  REGISTER_SUCCESS: 'Account created successfully! Please verify your email.',
  REGISTER_ERROR: 'Registration failed. Please try again.',
  EMAIL_VERIFICATION_SUCCESS: 'Email verified successfully!',
  EMAIL_VERIFICATION_ERROR: 'Email verification failed. Please try again.',
  EMAIL_VERIFICATION_SENT: 'Verification email sent! Please check your inbox.',

  // Patient Management
  PATIENT_CREATED: 'Patient created successfully!',
  PATIENT_UPDATED: 'Patient information updated successfully!',
  PATIENT_DELETED: 'Patient deleted successfully!',
  PATIENT_ERROR: 'Failed to process patient operation. Please try again.',

  // Profile
  PROFILE_UPDATED: 'Profile updated successfully!',
  PROFILE_ERROR: 'Failed to update profile. Please try again.',

  // General
  SAVE_SUCCESS: 'Changes saved successfully!',
  SAVE_ERROR: 'Failed to save changes. Please try again.',
  DELETE_SUCCESS: 'Item deleted successfully!',
  DELETE_ERROR: 'Failed to delete item. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Loading messages
  SAVING: 'Saving changes...',
  LOADING: 'Loading...',
  DELETING: 'Deleting...',
  UPLOADING: 'Uploading...',
  PROCESSING: 'Processing...',
};

// Error message parser for API responses
export const parseErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

// Helper function to show API error with fallback
export const showApiError = (
  error,
  fallbackMessage = TOAST_MESSAGES.SAVE_ERROR
) => {
  const message = parseErrorMessage(error);
  return showError(message || fallbackMessage);
};
