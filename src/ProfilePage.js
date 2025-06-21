// src/ProfilePage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, getValidToken } from './AuthSystem';
import { apiCall } from './api-config';

// Helper function for formatting numbers
function formatNumber(num) {
  if (!num && num !== 0) return 'Not specified';
  return Number(num).toLocaleString();
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
          // Use apiCall from api-config.js
          const profileData = await apiCall('GET', `/profiles/unified/${id}`);
          
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
          const projectsData = await apiCall('GET', `/projects?user_id=${id}`);
          setProjects(Array.isArray(projectsData) ? projectsData : []);
        } catch (err) {
          console.log('Error fetching projects:', err);
        }
        
        // Fetch solutions if provider
        try {
          const solutionsData = await apiCall('GET', `/marketplace/products?user_id=${id}`);
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
  
  // Debug logging to see what data we actually have
  console.log('Developer data:', developer);
  console.log('Website:', developer.website);
  console.log('Social profiles:', developer.social_profiles);
  console.log('Contact info:', developer.contact_info);
  console.log('Visibility settings:', developer.visibility_settings);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link to="/projects" className="hover:text-green-600">Projects</Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700">{developer.organization_name || developer.company_name || 'Profile'}</span>
        </div>
        
        {/* DEBUG SECTION - Remove this after debugging */}
        {isProfileOwner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Info (Only visible to profile owner)</h3>
            <div className="text-xs font-mono">
              <p><strong>Website:</strong> {developer.website || 'Not set'}</p>
              <p><strong>Social Profiles:</strong></p>
              <pre>{JSON.stringify(developer.social_profiles, null, 2)}</pre>
              <p><strong>Contact Info:</strong></p>
              <pre>{JSON.stringify(developer.contact_info, null, 2)}</pre>
              <p><strong>Visibility Settings:</strong></p>
              <pre>{JSON.stringify(developer.visibility_settings, null, 2)}</pre>
              <p><strong>All Data:</strong></p>
              <details>
                <summary>Click to expand</summary>
                <pre className="overflow-x-auto">{JSON.stringify(developer, null, 2)}</pre>
              </details>
            </div>
          </div>
        )}
        
        {/* Profile Header */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8 relative">
          {/* Edit Button - Only shown to profile owner */}
          {isProfileOwner && (
            <Link 
              to={`/profile/edit/${developer.id || id}`}
              className="absolute top-4 right-4 inline-flex items-center px-3 py-1 border border-green-500 rounded-md shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50"
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
          )}
          
          <div className="px-6 py-5">
            <div className="flex items-start">
              {/* Profile avatar/logo */}
              <div className="flex-shrink-0 mr-6">
                <div className="h-20 w-20 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl overflow-hidden">
                  {developer.logo ? (
                    <img 
                      src={developer.logo} 
                      alt={developer.organization_name || developer.company_name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {(developer.organization_name || developer.company_name || 'P').substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Profile details */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {developer.organization_name || developer.company_name || 'Profile'}
                </h1>
                
                <div className="flex items-center mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                    {developer.organization_type || developer.provider_type || 'Organization'}
                  </span>
                  
                  {developer.industry && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {developer.industry}
                    </span>
                  )}
                </div>
                
                {/* Website - Always show if it exists and is not empty */}
                {developer.website && developer.website.trim() !== '' && (
                  <a 
                    href={developer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {developer.website}
                  </a>
                )}
              </div>
            </div>
            
            {/* Profile details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200">
              {developer.headquarters_city && developer.headquarters_country && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Headquarters</h3>
                  <p className="text-gray-900">{developer.headquarters_city}, {developer.headquarters_country}</p>
                </div>
              )}
              
              {developer.regions && developer.regions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Regions of Operation</h3>
                  <p className="text-gray-900">
                    {Array.isArray(developer.regions) 
                      ? developer.regions.join(', ') 
                      : typeof developer.regions === 'string' 
                        ? developer.regions
                        : 'Global'}
                  </p>
                </div>
              )}
              
              {developer.founded_year && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Founded</h3>
                  <p className="text-gray-900">{developer.founded_year}</p>
                </div>
              )}
              
              {developer.created_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                  <p className="text-gray-900">{formatDate(developer.created_at)}</p>
                </div>
              )}
              
              {/* Project Types Section */}
              {developer.project_types && Array.isArray(developer.project_types) && developer.project_types.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Project Types</h3>
                  <p className="text-gray-900">
                    {developer.project_types.join(', ')}
                  </p>
                </div>
              )}
              
              {/* Certifications Section */}
              {developer.certifications && Array.isArray(developer.certifications) && developer.certifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Certifications</h3>
                  <p className="text-gray-900">
                    {developer.certifications.join(', ')}
                  </p>
                </div>
              )}
              
              {developer.company_size && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Company Size</h3>
                  <p className="text-gray-900">{developer.company_size}</p>
                </div>
              )}
              
              {/* Provider Types Section - For Service Providers */}
              {developer.provider_types_detail && (
                <div className="md:col-span-2">
                  <ProviderTypesDisplay providerTypes={developer.provider_types_detail} />
                </div>
              )}
            </div>
            
            {/* Contact Information - only shown if visibility allows */}
            {developer.contact_info && 
              (checkVisibility('contactInfo') || isProfileOwner) && 
              (
                (developer.contact_info.contact_name && developer.contact_info.contact_name.trim() !== '') ||
                (developer.contact_info.contact_email && developer.contact_info.contact_email.trim() !== '') ||
                (developer.contact_info.contact_phone && developer.contact_info.contact_phone.trim() !== '')
              ) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Contact Information
                  {!checkVisibility('contactInfo') && isProfileOwner && (
                    <span className="text-xs font-normal ml-2 text-gray-500">(Only visible to you)</span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {developer.contact_info.contact_name && developer.contact_info.contact_name.trim() !== '' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Person</h4>
                      <p className="text-gray-900">{developer.contact_info.contact_name}</p>
                      {developer.contact_info.contact_position && developer.contact_info.contact_position.trim() !== '' && (
                        <p className="text-sm text-gray-500">{developer.contact_info.contact_position}</p>
                      )}
                    </div>
                  )}
                  
                  {developer.contact_info.contact_email && developer.contact_info.contact_email.trim() !== '' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                      <a 
                        href={`mailto:${developer.contact_info.contact_email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {developer.contact_info.contact_email}
                      </a>
                    </div>
                  )}
                  
                  {developer.contact_info.contact_phone && developer.contact_info.contact_phone.trim() !== '' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                      <p className="text-gray-900">{developer.contact_info.contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* About section */}
            {developer.company_description && developer.company_description.trim() !== '' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                <p className="text-gray-600 whitespace-pre-line">{developer.company_description}</p>
              </div>
            )}
            
            {/* Social Media Links - Show if any exist and are not empty */}
            {developer.social_profiles && Object.values(developer.social_profiles).some(url => url && url.trim() !== '') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Connect</h3>
                <div className="flex space-x-4">
                  {developer.social_profiles.linkedin && developer.social_profiles.linkedin.trim() !== '' && (
                    <a 
                      href={developer.social_profiles.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="LinkedIn"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  )}
                  
                  {developer.social_profiles.twitter && developer.social_profiles.twitter.trim() !== '' && (
                    <a 
                      href={developer.social_profiles.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-600"
                      title="Twitter"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </a>
                  )}
                  
                  {developer.social_profiles.facebook && developer.social_profiles.facebook.trim() !== '' && (
                    <a 
                      href={developer.social_profiles.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="Facebook"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  
                  {developer.social_profiles.instagram && developer.social_profiles.instagram.trim() !== '' && (
                    <a 
                      href={developer.social_profiles.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-800"
                      title="Instagram"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Solutions Section - For Providers */}
        {developer.profileType === 'provider' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5">
              <SolutionsDisplay solutions={solutions} />
            </div>
          </div>
        )}
        
        {/* Projects Section */}
        {(checkVisibility('projectHistory') || isProfileOwner) && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Projects by {developer.organization_name || developer.company_name || 'this User'}
                  {!checkVisibility('projectHistory') && isProfileOwner && (
                    <span className="text-xs font-normal ml-2 text-gray-500">(Only visible to you)</span>
                  )}
                </h2>
                
                {/* Add New Project button - only for profile owner */}
                {isProfileOwner && (
                  <Link
                    to="/projects/new"
                    className="inline-flex items-center px-3 py-1 border border-green-500 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Project
                  </Link>
                )}
              </div>
              
              {projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map(project => (
                    <div key={project.id} className="border rounded-lg overflow-hidden shadow-sm">
                      <div className="h-40 bg-green-100 relative">
                        {project.image_url ? (
                          <img 
                            src={project.image_url} 
                            alt={project.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Project badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${project.status === 'Active' ? 'bg-green-100 text-green-800' : 
                              project.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                              project.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 
                              project.status === 'Seeking Partners' ? 'bg-purple-100 text-purple-800' : 
                              'bg-yellow-100 text-yellow-800'}`}
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
                        
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {project.description}
                        </p>
                        
                        {project.reduction_target && (
                          <div className="flex items-center text-sm text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {formatNumber(project.reduction_target)} tCO2e
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic mb-4">No projects found for this profile</p>
                  
                  {isProfileOwner && (
                    <Link
                      to="/projects/new"
                      className="inline-flex items-center px-4 py-2 border border-green-500 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Your First Project
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between">
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