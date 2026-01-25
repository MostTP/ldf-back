// src/api/api.js
import axios from 'axios';

// Create a custom instance of Axios with a base URL
// Can be overridden with VITE_API_BASE_URL environment variable
// Ensure base URL always ends with /api/
let baseURL = import.meta.env.VITE_API_BASE_URL || 'https://ldf-back-1.onrender.com/api/';

// Force HTTP for localhost (prevent HTTPS protocol errors)
if (baseURL && baseURL.includes('localhost') && baseURL.startsWith('https://')) {
  baseURL = baseURL.replace('https://', 'http://');
}

if (baseURL && !baseURL.endsWith('/api/')) {
  // If it doesn't end with /api/, add it
  baseURL = baseURL.replace(/\/+$/, '') + '/api/';
}

console.log('API Base URL:', baseURL); // Debug log

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout (increased for production)
});

// Optional: Add an interceptor to include the Authorization token on every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('ldf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and network issues
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('ldf_token');
      localStorage.removeItem('ldf_user');
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors (no response from server)
    if (!error.response) {
      // Network error - could be CORS, timeout, or connection issue
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      const isCORS = error.message?.includes('CORS') || error.message?.includes('Network Error');
      
      // Create a more informative error object
      const networkError = {
        response: {
          status: 0,
          statusText: 'Network Error',
          data: {
            success: false,
            message: isTimeout 
              ? 'Request timed out. Please check your connection and try again.'
              : isCORS
              ? 'CORS error: The server may not be configured to accept requests from this origin.'
              : 'Network error. Please check your connection and ensure the server is running.',
            error: error.message || 'Network request failed',
            code: error.code || 'NETWORK_ERROR',
          }
        }
      };
      
      return Promise.reject(networkError);
    }
    
    // Handle other HTTP errors
    return Promise.reject(error);
  }
);

export default api;