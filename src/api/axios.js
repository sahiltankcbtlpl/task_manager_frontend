// import axios from 'axios';

// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Default local API
//     withCredentials: true, // Important for HTTP-only cookies
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// export default api;

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
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;