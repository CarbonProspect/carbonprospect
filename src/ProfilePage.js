// src/ProfilePage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthSystem';

// Use the same API base as ProfileEdit.js
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path (same domain)
  : 'http://localhost:3001/api';  // In development, use localhost:3001 (not 3002!)

// Replace apiCall with direct fetch
const fetchWithAuth = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('token');
  const config = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }
  
  return response.json();
};

// Helper function for formatting numbers
function formatNumber(num) {
  if (!num && num !== 0) return 'Not specified';
  return Number(num).toLocaleString();
}

// Helper function for formatting currency
function formatCurrency(amount) {
  if (!amount && amount !== 0) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Component to display provider types
const ProviderTypesDisplay = ({ providerTypes }) => {
  // Parse provider types if it's a string
  const parseProviderTypes = (types) => {
    if (!types) return [];
    if (Array.isArray(types)) return types;
    if (typeof types === 'string') {
      try {
        return JSON.parse(types);
      } catch (e) {
        return [];
      }
    }
    return [];
  };
  const types = parseProviderTypes(providerTypes);
  
  if (!types || types.length === 0) return null;
  
  // Group provider types by parent category
  const groupedTypes = types.reduce((acc, type) => {
    const parentName = type.parent_name || 'Other';
    if (!acc[parentName]) {
      acc[parentName] = [];
    }
    acc[parentName].push(type);
    return acc;
  }, {});
  
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">Service Categories</h3>
      <div className="space-y-2">
        {Object.entries(groupedTypes).map(([parentName, categoryTypes]) => (
          <div key={parentName}>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {parentName}
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {categoryTypes.map((type, index) => (
                <span 
                  key={index}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    type.is_primary 
                      ? 'bg-green-100 text-green-800 ring-1 ring-green-600' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {type.name}
                  {type.is_primary && (
                    <span className="ml-1 text-green-600">★</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Solutions Display Component with Categories
const SolutionsDisplay = ({ solutions }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Get unique categories from solutions
  const categories = useMemo(() => {
    const cats = ['all'];
    const uniqueCats = [...new Set(solutions.map(s => s.category).filter(Boolean))];
    return [...cats, ...uniqueCats];
  }, [solutions]);
  
  // Filter solutions by selected category
  const filteredSolutions = useMemo(() => {
    if (selectedCategory === 'all') return solutions;
    return solutions.filter(s => s.category === selectedCategory);
  }, [solutions, selectedCategory]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Solutions Offered ({filteredSolutions.length})
        </h2>
        
        {/* Category Filter Dropdown */}
        {categories.length > 2 && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              <svg className="ml-2 -mr-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        selectedCategory === cat
                          ? 'bg-green-100 text-green-900'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {filteredSolutions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSolutions.map(solution => (
            <div key={solution.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-100 relative">
                {solution.image_url ? (
                  <img 
                    src={solution.image_url} 
                    alt={solution.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                )}
                
                {/* Solution category badge */}
                {solution.category && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {solution.category}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  <Link to={`/marketplace/solution/${solution.id}`} className="hover:text-green-600">
                    {solution.name}
                  </Link>
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {solution.description}
                </p>
                
                <div className="flex items-center justify-between">
                  {solution.price && (
                    <span className="text-green-600 font-semibold">
                      ${formatNumber(solution.price)}
                    </span>
                  )}
                  
                  <Link
                    to={`/marketplace/solution/${solution.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic text-center py-8">
          No solutions found in this category
        </p>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  
  const [developer, setDeveloper] = useState(null);
  const [projects, setProjects] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Helper function to check visibility setting with support for both naming conventions
  const checkVisibility = (setting) => {
    if (!developer || !developer.visibility_settings) return false;
    
    const vs = developer.visibility_settings;
    
    // Check both naming conventions
    switch(setting) {
      case 'contactInfo':
        return vs.contactInfo === true || vs.showContactInfo === true;
      case 'financialInfo':
        return vs.financialInfo === true || vs.showFinancials === true;
      case 'projectHistory':
        return vs.projectHistory === true || vs.showProjects === true;
      case 'publicProfile':
        return vs.publicProfile === true;
      default:
        return false;
    }
  };
  
  // Helper function to parse JSON fields if they are strings
  const parseJsonField = (field, defaultValue = []) => {
    if (!field) return defaultValue;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return defaultValue;
      }
    }
    return field;
  };
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Check if ID is valid before proceeding
        if (!id || id === 'undefined') {
          setError('Profile ID is missing or invalid');
          setLoading(false);
          return;
        }
        
        // Make sure user is authenticated
        if (!isAuthenticated) {
          setError('You must be logged in to view profiles');
          setLoading(false);
          return;
        }
        
        try {
          // Use direct fetch instead of apiCall
          const profileData = await fetchWithAuth('GET', `/profiles/unified/${id}`);
          
          if (profileData.profile_type === 'none') {
            // User exists but has no profile
            if (profileData.user_exists && profileData.user_info) {
              const userInfo = profileData.user_info;
              const isCurrentUser = currentUser && currentUser.id === parseInt(id);
              
              if (isCurrentUser) {
                setDeveloper({
                  id: id,
                  user_id: userInfo.id,
                  organization_name: userInfo.first_name && userInfo.last_name ? 
                    `${userInfo.first_name} ${userInfo.last_name}'s Organization` : 
                    'My Organization',
                  organization_type: 'Organization',
                  profileType: profileData.suggested_profile_type || 'provider',
                  needsSetup: true,
                  regions: [],
                  project_types: [],
                  certifications: [],
                  visibility_settings: {
                    publicProfile: true,
                    contactInfo: true,
                    financialInfo: false,
                    projectHistory: true
                  }
                });
                setLoading(false);
                return;
              }
            }
            throw new Error('Profile not found');
          }
          
          // Parse JSON fields if they are strings
          profileData.regions = parseJsonField(profileData.regions, []);
          profileData.project_types = parseJsonField(profileData.project_types, []);
          profileData.certifications = parseJsonField(profileData.certifications, []);
          profileData.visibility_settings = parseJsonField(profileData.visibility_settings, {});
          profileData.contact_info = parseJsonField(profileData.contact_info, {});
          profileData.social_profiles = parseJsonField(profileData.social_profiles, {});
          profileData.provider_types_detail = parseJsonField(profileData.provider_types_detail, []);
          profileData.specializations = parseJsonField(profileData.specializations, []);
          profileData.services = parseJsonField(profileData.services, []);
          profileData.languages = parseJsonField(profileData.languages, []);
          profileData.regions_served = parseJsonField(profileData.regions_served, []);
          profileData.industries_served = parseJsonField(profileData.industries_served, []);
          
          setDeveloper({
            ...profileData,
            id: id, // Explicitly set the ID from URL parameter
            profileType: profileData.profile_type
          });
          
          setError(null);
        } catch (err) {
          console.error('Error fetching unified profile:', err);
          throw new Error('Profile not found or access denied');
        }
        
        // Fetch projects by this user
        try {
          const projectsData = await fetchWithAuth('GET', `/projects?user_id=${id}`);
          setProjects(Array.isArray(projectsData) ? projectsData : []);
        } catch (err) {
          console.log('Error fetching projects:', err);
        }
        
        // Fetch solutions if provider
        try {
          const solutionsData = await fetchWithAuth('GET', `/marketplace/products?user_id=${id}`);
          setSolutions(Array.isArray(solutionsData) ? solutionsData : []);
        } catch (err) {
          console.log('Error fetching solutions:', err);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'An error occurred while fetching the profile');
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [id, isAuthenticated, currentUser]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Enhanced profile ownership check to handle the unified ID system
  const isProfileOwner = useMemo(() => {
    if (!currentUser || !id) return false;
    
    // Primary check: current user ID matches the profile ID (unified ID system)
    const profileIdMatch = currentUser.id == id || String(currentUser.id) === id;
    
    // Secondary check: if we have developer data, check user_id
    const userIdMatch = developer && (currentUser.id === developer.user_id);
    
    return profileIdMatch || userIdMatch;
  }, [currentUser, id, developer]);
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate('/projects')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back to Projects
          </button>
          {error.includes('Authentication') || error.includes('logged in') ? (
            <button
              onClick={() => navigate('/login')}
              className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Log In
            </button>
          ) : null}
        </div>
      </div>
    );
  }
  
  // New Profile Setup State
  if (developer && developer.needsSetup) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Set Up Your Profile</h1>
          <p className="mb-6">
            It looks like you don't have a profile set up yet. Creating a complete profile will help you showcase your projects and connect with others in the carbon marketplace.
          </p>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="font-semibold text-blue-800 mb-2">Why complete your profile?</h2>
            <ul className="list-disc pl-5 text-blue-700">
              <li>Showcase your expertise and experience</li>
              <li>Build credibility with potential partners</li>
              <li>Highlight your successful projects</li>
              <li>Make it easier for others to contact you</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <Link
              to={`/profile/edit/${currentUser.id}`}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-10 10a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828l10-10zM15 3a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              Set Up Your Profile Now
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // No developer data
  if (!developer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="mb-6">The profile you're looking for couldn't be located.</p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-r from-green-600 to-blue-600 pb-32">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-white/80 mb-6">
            <Link to="/projects" className="hover:text-white">Projects</Link>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white">{developer.organization_name || developer.company_name || 'Profile'}</span>
          </div>
          
          {/* Profile Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {/* Profile Avatar */}
              <div className="h-32 w-32 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden">
                {developer.logo ? (
                  <img 
                    src={developer.logo} 
                    alt={developer.organization_name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {(developer.organization_name || developer.company_name || 'P').substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Basic Info */}
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">
                  {developer.organization_name || developer.company_name}
                </h1>
                
                <div className="flex items-center space-x-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                    {developer.organization_type || developer.provider_type}
                  </span>
                  {developer.industry && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                      {developer.industry}
                    </span>
                  )}
                  {developer.company_size && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                      {developer.company_size}
                    </span>
                  )}
                </div>
                
                {/* Location and Website */}
                <div className="flex items-center space-x-4 text-white/90">
                  {developer.headquarters_city && developer.headquarters_country && (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {developer.headquarters_city}, {developer.headquarters_country}
                    </span>
                  )}
                  
                  {developer.website && (
                    <a 
                      href={developer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {/* Edit Button */}
            {isProfileOwner && (
              <Link 
                to={`/profile/edit/${developer.id || id}`}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Founded</p>
                <p className="text-2xl font-bold text-gray-900">{developer.founded_year || 'N/A'}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Team Size</p>
                <p className="text-2xl font-bold text-gray-900">{developer.team_size || 'N/A'}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Experience</p>
                <p className="text-2xl font-bold text-gray-900">{developer.years_experience || 0}+ years</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Availability</p>
                <p className="text-2xl font-bold text-gray-900">{developer.availability || 'N/A'}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {developer.company_description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About
                </h2>
                <p className="text-gray-600 whitespace-pre-line">{developer.company_description}</p>
              </div>
            )}
            
            {/* Services & Expertise */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Services & Expertise
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {developer.services && developer.services.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Services Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {developer.services.map((service, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {developer.specializations && developer.specializations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {developer.specializations.map((spec, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {developer.certifications && developer.certifications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {developer.certifications.map((cert, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {developer.languages && developer.languages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {developer.languages.map((lang, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pricing Information */}
            {(checkVisibility('financialInfo') || isProfileOwner) && developer.pricing_model && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pricing & Terms
                  {!checkVisibility('financialInfo') && isProfileOwner && (
                    <span className="text-xs font-normal ml-2 text-gray-500">(Only visible to you)</span>
                  )}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Pricing Model</h3>
                    <p className="text-lg font-semibold text-gray-900">{developer.pricing_model}</p>
                  </div>
                  
                  {developer.hourly_rate_min && developer.hourly_rate_max && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Hourly Rate</h3>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(developer.hourly_rate_min)} - {formatCurrency(developer.hourly_rate_max)}
                      </p>
                    </div>
                  )}
                  
                  {developer.project_minimum && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Minimum Project Size</h3>
                      <p className="text-lg font-semibold text-blue-600">{formatCurrency(developer.project_minimum)}</p>
                    </div>
                  )}
                  
                  {developer.response_time && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Response Time</h3>
                      <p className="text-lg font-semibold text-purple-600">{developer.response_time}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Service Coverage */}
            {(developer.regions_served || developer.industries_served) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Service Coverage
                </h2>
                
                {developer.regions_served && developer.regions_served.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Regions Served</h3>
                    <div className="flex flex-wrap gap-2">
                      {developer.regions_served.map((region, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {developer.industries_served && developer.industries_served.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Industries Served</h3>
                    <div className="flex flex-wrap gap-2">
                      {developer.industries_served.map((industry, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {industry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right Column - Contact & Additional Info */}
          <div className="space-y-8">
            {/* Contact Information */}
            {developer.contact_info && (checkVisibility('contactInfo') || isProfileOwner) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Information
                  {!checkVisibility('contactInfo') && isProfileOwner && (
                    <span className="text-xs font-normal ml-2 text-gray-500">(Private)</span>
                  )}
                </h2>
                
                <div className="space-y-4">
                  {developer.contact_info.contact_name && (
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium text-gray-900">{developer.contact_info.contact_name}</p>
                      {developer.contact_info.contact_position && (
                        <p className="text-sm text-gray-600">{developer.contact_info.contact_position}</p>
                      )}
                    </div>
                  )}
                  
                  {developer.contact_info.contact_email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a 
                        href={`mailto:${developer.contact_info.contact_email}`}
                        className="font-medium text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {developer.contact_info.contact_email}
                      </a>
                    </div>
                  )}
                  
                  {developer.contact_info.contact_phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {developer.contact_info.contact_phone}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Contact Button */}
                {!isProfileOwner && developer.contact_info.contact_email && (
                  <div className="mt-6">
                    <a
                      href={`mailto:${developer.contact_info.contact_email}`}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Message
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {/* Social Media */}
            {developer.social_profiles && Object.values(developer.social_profiles).some(url => url && url.trim() !== '') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Connect on Social Media</h2>
                <div className="flex space-x-3">
                  {developer.social_profiles.linkedin && developer.social_profiles.linkedin.trim() !== '' && (
                    <a 
                      href={developer.social_profiles.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-100 p-3 rounded-lg hover:bg-blue-200 transition-colors group"
                      title="LinkedIn"
                    >
                      <svg className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  )}
                  
                  {developer.social_profiles.twitter && developer.social_profiles.twitter.trim() !== '' && (
                    <a 
                      href={developer.social_profiles.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors group"
                      title="Twitter"
                    >
                      <svg className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Facts</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium text-gray-900">{formatDate(developer.created_at)}</span>
                </div>
                {developer.project_count && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Projects</span>
                    <span className="font-medium text-gray-900">{developer.project_count}</span>
                  </div>
                )}
                {developer.total_reduction && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">CO₂ Reduced</span>
                    <span className="font-medium text-green-600">{formatNumber(developer.total_reduction)} tCO₂e</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* CTA Card */}
            {!isProfileOwner && (
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Interested in working together?</h3>
                <p className="text-sm mb-4 text-white/90">Get in touch to discuss your carbon reduction projects.</p>
                <button className="w-full bg-white text-gray-900 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                  Contact Now
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Provider Types Section - if they exist */}
        {developer.provider_types_detail && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <ProviderTypesDisplay providerTypes={developer.provider_types_detail} />
          </div>
        )}
        
        {/* Solutions Section - For Providers */}
        {developer.profileType === 'service_provider' && (
          <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-5">
              <SolutionsDisplay solutions={solutions} />
            </div>
          </div>
        )}
        
        {/* Projects Section */}
        {(checkVisibility('projectHistory') || isProfileOwner) && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Projects
                {!checkVisibility('projectHistory') && isProfileOwner && (
                  <span className="text-xs font-normal ml-2 text-gray-500">(Private)</span>
                )}
              </h2>
              
              {isProfileOwner && (
                <Link
                  to="/projects/new"
                  className="inline-flex items-center px-3 py-1 border border-green-500 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Project
                </Link>
              )}
            </div>
            
            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(project => (
                  <div key={project.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 relative">
                      {project.image_url ? (
                        <img 
                          src={project.image_url} 
                          alt={project.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${project.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            project.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 
                            project.status === 'Seeking Partners' ? 'bg-purple-100 text-purple-800' : 
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {project.status || 'Draft'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        <Link to={`/projects/${project.id}`} className="hover:text-green-600">
                          {project.name}
                        </Link>
                      </h3>
                      
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {project.location || 'Location not specified'}
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {project.description}
                      </p>
                      
                      {project.reduction_target && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {formatNumber(project.reduction_target)} tCO₂e
                          </div>
                          <Link
                            to={`/projects/${project.id}`}
                            className="text-sm text-green-600 hover:text-green-800 font-medium"
                          >
                            View →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 mb-4">No projects yet</p>
                {isProfileOwner && (
                  <Link
                    to="/projects/new"
                    className="inline-flex items-center px-4 py-2 border border-green-500 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Create Your First Project
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-8 mb-8">
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Projects
          </button>
          
          {isProfileOwner && (
            <Link 
              to={`/profile/edit/${developer.id || id}`}
              className="inline-flex items-center px-4 py-2 border border-green-500 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;