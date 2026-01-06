import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Attaches Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handles Errors Globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Handle 401 (Unauthorized) - Auto Logout
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('token');

      // Using globalThis is preferred for environment agnostic access
      // Note: 'location' must still exist in the environment (Browser)
      if (globalThis.location) {
        globalThis.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
