// api-config.js - Production-scalable configuration with fixed refresh logic
import axios from 'axios';

// Environment-based API configuration
const getApiConfig = () => {
  const config = {
    development: {
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
    },
    test: {
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 5000,
    },
    production: {
      // In production, use relative URLs (same domain) or environment variable
      baseURL: process.env.REACT_APP_API_URL || '/api',
      timeout: 30000, // Longer timeout for production
    }
  };

  const env = process.env.NODE_ENV || 'development';
  return config[env] || config.development;
};

// Create axios instance with environment-specific config
const apiConfig = getApiConfig();
const api = axios.create({
  ...apiConfig,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Track if we're currently refreshing to prevent loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        url: `${config.baseURL}${config.url}`,
        method: config.method,
        hasToken: !!token
      });
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with production-ready error handling
api.interceptors.response.use(
  (response) => {
    // Validate response format
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
      throw new Error('Server configuration error: API endpoint returning HTML');
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log errors appropriately per environment
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        isRefreshRequest: error.config?.url?.includes('/auth/refresh')
      });
    }
    
    // Don't retry refresh requests to prevent infinite loops
    if (error.config?.url?.includes('/auth/refresh')) {
      // Clear auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      isRefreshing = false;
      processQueue(error, null);
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
      return Promise.reject(error);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Only attempt refresh if we have a token
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          throw new Error('No token available');
        }
        
        // Attempt token refresh
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.token;
        
        localStorage.setItem('token', newToken);
        if (refreshResponse.data.user) {
          localStorage.setItem('user', JSON.stringify(refreshResponse.data.user));
        }
        
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear auth state
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle HTML responses (misconfigured server)
    if (error.response?.data && typeof error.response.data === 'string' && 
        error.response.data.includes('<!DOCTYPE')) {
      const customError = new Error('API configuration error');
      customError.status = 500;
      customError.code = 'SERVER_MISCONFIGURED';
      return Promise.reject(customError);
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const networkError = new Error('Network connection failed');
      networkError.code = 'NETWORK_ERROR';
      networkError.isRetryable = true;
      return Promise.reject(networkError);
    }
    
    return Promise.reject(error);
  }
);

// Unified API call function with retry logic
export const apiCall = async (method, url, data = null, options = {}) => {
  const maxRetries = options.retries || (process.env.NODE_ENV === 'production' ? 3 : 1);
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config = {
        method,
        url,
        ...options,
        ...(data && { data })
      };
      
      const response = await api(config);
      return response.data;
    } catch (error) {
      lastError = error;
      
      // Only retry on network errors or 5xx server errors
      const isRetryable = error.isRetryable || 
                         (error.response?.status >= 500 && error.response?.status < 600);
      
      if (attempt < maxRetries && isRetryable) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      break;
    }
  }
  
  // Format error for consumption
  const apiError = new Error(
    lastError.response?.data?.message || 
    lastError.message || 
    'Request failed'
  );
  apiError.status = lastError.response?.status;
  apiError.code = lastError.code;
  throw apiError;
};

// File upload helper (handles multipart/form-data)
export const uploadFile = async (endpoint, file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    ...(onProgress && {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    })
  };
  
  const response = await api.post(endpoint, formData, config);
  return response.data;
};

// Health check function
export const healthCheck = async () => {
  try {
    await apiCall('GET', '/health');
    return true;
  } catch (error) {
    return false;
  }
};

// Logout function to clear auth state
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export default api;