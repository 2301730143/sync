import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — routes dynamically in production across separate
// microservice domains if VITE_AUTH_API_URL / VITE_PROJECT_API_URL are set,
// or uses /api for Vite dev proxy / Vercel rewrites.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syncmind_token');

    // If deployed to separate URLs without a proxy/rewrite:
    if (config.url && config.url.startsWith('/auth') && import.meta.env.VITE_AUTH_API_URL) {
      config.baseURL = import.meta.env.VITE_AUTH_API_URL;
      config.url = config.url.replace(/^\/auth/, '');
    } else if (import.meta.env.VITE_PROJECT_API_URL && !config.url?.startsWith('/auth')) {
      config.baseURL = import.meta.env.VITE_PROJECT_API_URL;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Something went wrong. Please try again.';

    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('syncmind_token');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      status,
      message,
      details: error.response?.data?.details,
    });
  }
);

export default api;