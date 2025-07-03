import axios from 'axios';

const API = axios.create({
  baseURL: 'https://yoga-backend-17s9.onrender.com/api',
});

// Add token to headers if present
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers['x-auth-token'] = token;
  }
  return req;
});

export default API;