import axios from 'axios';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/boskit/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token if available in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('boskit_access_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for session expiration handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/distributor/refresh-token');
        return api(originalRequest);
      } catch (refreshErr) {
        // If refresh fails, let application handle redirect
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
