// src/utils/auth.js
// Simple authentication utility functions

export const isAuthenticated = () => {
  const token = localStorage.getItem('ldf_token');
  return !!token;
};

export const getToken = () => {
  return localStorage.getItem('ldf_token');
};

export const setAuth = (token, user = null) => {
  localStorage.setItem('ldf_token', token);
  if (user) {
    localStorage.setItem('ldf_user', JSON.stringify(user));
  }
};

export const clearAuth = () => {
  localStorage.removeItem('ldf_token');
  localStorage.removeItem('ldf_user');
};

export const getUser = () => {
  const userStr = localStorage.getItem('ldf_user');
  return userStr ? JSON.parse(userStr) : null;
};

