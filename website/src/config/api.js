import { Capacitor } from '@capacitor/core';

/**
 * Automatically determine the backend API URL based on the environment.
 */
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (Capacitor.isNativePlatform()) {
    return 'https://kctraders-backend.onrender.com/api';
  }

  // Prevent auto-replace script from breaking this file again by splitting the string
  return 'http://localhost' + ':5000/api';
};

export const API_URL = getBaseUrl();
