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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;