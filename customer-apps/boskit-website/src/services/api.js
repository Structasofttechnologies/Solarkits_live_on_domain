import axios from 'axios';

const api = axios.create({
  baseURL: '/api/boskit/v1',
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
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
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
