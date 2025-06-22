// src/AuthSystem.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { apiCall } from './api-config'; // Import both api and apiCall

// Create Auth Context
const AuthContext = createContext();

// Get a valid token for components that need direct access
export const getValidToken = () => {
  return localStorage.getItem('token');
};

// Set auth token (no need to set it in axios since api-config handles it)
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    return true;
  } else {
    localStorage.removeItem('token');
    return false;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [lastChecked, setLastChecked] = useState(0); // To prevent frequent rechecks
  
  // Function to check authentication status
  const checkAuthStatus = async (force = false) => {
    // Prevent too frequent checks (unless forced)
    const now = Date.now();
    if (!force && now - lastChecked < 10000) { // 10 seconds throttle
      console.log('Auth check throttled, using cached status');
      return authenticated;
    }
    
    console.log('Checking auth status...');
    setLoading(true);
    setLastChecked(now);
    
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Verify token with backend using the api instance
        const response = await api.get('/auth/verify-token');
        
        // If successful, set user state
        const userData = response.data;
        
        // Add profileId to user data (now equal to user ID)
        userData.profileId = userData.id;
        
        // Set profile type based on role - Updated to include generalUser
        userData.profileType = 
          userData.role === 'solutionProvider' ? 'provider' : 
          userData.role === 'projectDeveloper' ? 'developer' : 
          userData.role === 'consultant' ? 'consultant' : 
          userData.role === 'generalUser' ? 'general' : '';
        
        setCurrentUser(userData);
        setAuthenticated(true);
        console.log('Auth status check: Authenticated');
        setLoading(false);
        return true;
      } catch (error) {
        // If token verification fails, clear auth state
        console.error('Token verification failed during status check:', error);
        localStorage.removeItem('token');
        setCurrentUser(null);
        setAuthenticated(false);
        console.log('Auth status check: Token invalid');
        setLoading(false);
        return false;
      }
    } else {
      // No token found
      setCurrentUser(null);
      setAuthenticated(false);
      console.log('Auth status check: No token');
      setLoading(false);
      return false;
    }
  };
  
  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuthStatus(true); // Force initial check
    };
    
    initializeAuth();
  }, []);
  
  // Register user - UPDATED to handle email verification flow
  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Use apiCall which handles status codes better
      const response = await apiCall('POST', '/auth/register', userData);
      
      // The backend returns a 201 status with message and requiresVerification
      // for email verification flow
      if (response.message && response.requiresVerification) {
        return {
          success: true,
          message: response.message,
          requiresVerification: response.requiresVerification
        };
      }
      
      // If we get a token (shouldn't happen with email verification, but handle legacy case)
      if (response.token && response.user) {
        const { token, user } = response;
        
        // Add profileId equal to user ID
        user.profileId = user.id;
        
        // Set profile type based on role
        user.profileType = 
          user.role === 'solutionProvider' ? 'provider' : 
          user.role === 'projectDeveloper' ? 'developer' : 
          user.role === 'consultant' ? 'consultant' : 
          user.role === 'generalUser' ? 'general' : '';
        
        // Set token and user
        setAuthToken(token);
        setCurrentUser(user);
        setAuthenticated(true);
        setLastChecked(Date.now());
        
        return { success: true, user };
      }
      
      // Default success response
      return {
        success: true,
        ...response
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check if it's actually a success (201 status code)
      // This handles cases where api.post might throw on 201 status
      if (error.response?.status === 201) {
        const data = error.response.data;
        return {
          success: true,
          message: data.message,
          requiresVerification: data.requiresVerification
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      console.log('Attempting login with api instance');
      
      // Make API request to login using the api instance
      const response = await api.post('/auth/login', { email, password });
      
      console.log('Login response received:', response.status);
      
      const { token, user } = response.data;
      
      // Add profileId equal to user ID
      user.profileId = user.id;
      
      // Set profile type based on role - Updated to include generalUser
      user.profileType = 
        user.role === 'solutionProvider' ? 'provider' : 
        user.role === 'projectDeveloper' ? 'developer' : 
        user.role === 'consultant' ? 'consultant' : 
        user.role === 'generalUser' ? 'general' : '';
      
      // Set token and user
      const tokenSet = setAuthToken(token);
      console.log('Token set in localStorage:', tokenSet);
      
      setCurrentUser(user);
      setAuthenticated(true);
      setLastChecked(Date.now());
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error details:', error);
      
      // Log more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Check for email verification requirement
        if (error.response.data?.requiresVerification) {
          return {
            success: false,
            requiresVerification: true,
            email: error.response.data.email,
            error: error.response.data.message
          };
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please check the server logs for details.' 
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout user
  const logout = () => {
    // Clear token and user state
    localStorage.removeItem('token');
    setCurrentUser(null);
    setAuthenticated(false);
    setLastChecked(Date.now());
    console.log('Logout successful');
  };
  
  // Check if user has a specific role
  const hasRole = (role) => {
    return currentUser && currentUser.role === role;
  };
  
  // Check if user is a general user
  const isGeneralUser = () => {
    return currentUser && currentUser.role === 'generalUser';
  };
  
  // Check if user is a professional user (provider, developer, or consultant)
  const isProfessionalUser = () => {
    return currentUser && ['solutionProvider', 'projectDeveloper', 'consultant'].includes(currentUser.role);
  };
  
  // Get user's display name
  const getUserDisplayName = () => {
    if (!currentUser) return '';
    
    if (currentUser.firstName || currentUser.lastName) {
      return `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    }
    
    return currentUser.email;
  };
  
  // Check if user has completed their profile
  const hasCompletedProfile = () => {
    if (!currentUser) return false;
    
    // General users don't need to complete a profile
    if (currentUser.role === 'generalUser') return true;
    
    // For other users, check if they have a profile_completed flag
    // This would need to be set by your backend
    return currentUser.profile_completed || false;
  };
  
  // Verify email with token (for email verification flow)
  const verifyEmail = async (token) => {
    try {
      setLoading(true);
      
      const response = await api.get(`/auth/verify-email?token=${token}`);
      
      if (response.data.token && response.data.user) {
        const { token: authToken, user } = response.data;
        
        // Add profileId equal to user ID
        user.profileId = user.id;
        
        // Set profile type based on role
        user.profileType = 
          user.role === 'solutionProvider' ? 'provider' : 
          user.role === 'projectDeveloper' ? 'developer' : 
          user.role === 'consultant' ? 'consultant' : 
          user.role === 'generalUser' ? 'general' : '';
        
        // Set token and user (auto-login after verification)
        setAuthToken(authToken);
        setCurrentUser(user);
        setAuthenticated(true);
        setLastChecked(Date.now());
        
        return { success: true, user, message: response.data.message };
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Email verification error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Email verification failed' 
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Resend verification email
  const resendVerificationEmail = async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to resend verification email' 
      };
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authenticated,
        isAuthenticated: authenticated, // Add isAuthenticated as an alias
        register,
        login,
        logout,
        hasRole,
        isGeneralUser,
        isProfessionalUser,
        getUserDisplayName,
        hasCompletedProfile,
        checkAuthStatus,
        verifyEmail,
        resendVerificationEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;