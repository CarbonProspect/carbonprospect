// src/Services/api.js
import axios from 'axios';
import { getValidToken } from '../AuthSystem';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // This will prepend /api to all requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    // Get token from your auth system
    const token = getValidToken();
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url);
    
    // Handle 401 unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized - token may be expired');
      // Optional: window.location.href = '/login';
    }
    
    // If we get HTML instead of JSON (usually a 404), provide a better error
    if (error.response && error.response.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
      console.error('API endpoint not found, received HTML instead of JSON');
      error.message = 'API endpoint not found';
    }
    
    return Promise.reject(error);
  }
);

// Make sure we're exporting the axios instance
export default api;

// Test that the export is working
console.log('API instance methods:', Object.keys(api));