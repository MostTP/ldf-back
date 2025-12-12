// src/api/api.js
import axios from 'axios';

// Create a custom instance of Axios with a base URL
const api = axios.create({
  // 🛑 IMPORTANT: Replace this placeholder with your actual backend URL
  // Example: 'https://api.yourldfproject.com/v1'
  baseURL: 'YOUR_BACKEND_API_BASE_URL_HERE', 
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

export default api;