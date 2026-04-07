import axios from 'axios';

// Dynamically determine the API base URL based on where the frontend is being accessed from
const getBaseUrl = () => {
  // Check if we are accessed via devtunnels
  if (window.location.hostname.includes('devtunnels.ms')) {
    // Replace the frontend port (e.g. 5173) with the backend port (5000) for the API URL
    const backendHost = window.location.host.replace(/(?:-\d+)?\.inc1\.devtunnels\.ms/, '-5000.inc1.devtunnels.ms');
    return `${window.location.protocol}//${backendHost}/api`;
  }

  // Check if we are accessed via localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  // Default to the env variable if provided
  return import.meta.env.VITE_API_URL;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {},
});

// Add a request interceptor to include the active company ID
api.interceptors.request.use(
  (config) => {
    const activeCompany = localStorage.getItem('activeCompany');
    if (activeCompany) {
      config.headers['x-company-id'] = activeCompany;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle subscription limit errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.limitReached) {
      // Trigger the global plan selection modal
      window.dispatchEvent(new CustomEvent('open-subscription-modal'));
    }
    return Promise.reject(error);
  }
);

export default api;