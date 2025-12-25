// src/api/api.js
import axios from 'axios';

// Create a custom instance of Axios with a base URL
// Can be overridden with VITE_API_BASE_URL environment variable
// Ensure base URL always ends with /api/
let baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/';
if (baseURL && !baseURL.endsWith('/api/')) {
  // If it doesn't end with /api/, add it
  baseURL = baseURL.replace(/\/+$/, '') + '/api/';
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('ldf_token');
      localStorage.removeItem('ldf_user');
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;