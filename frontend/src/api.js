import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach current user role to all requests
api.interceptors.request.use((config) => {
  const currentRole = localStorage.getItem('smartcal_user_role') || 'ADMIN';
  config.headers['X-User-Role'] = currentRole;
  return config;
});

export default api;
