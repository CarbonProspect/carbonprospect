// src/UniversalProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, getValidToken } from './AuthSystem';

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

const UniversalProfilePage = ({ type = "developer" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        
        // Make sure user is authenticated
        if (!isAuthenticated) {
          setError('You must be logged in to view profiles');
          setLoading(false);
          return;
        }
        
        const token = getValidToken();
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Fetch profile data based on type
        const profileResponse = await fetch(`/api/profiles/public/${type}/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch ${type} profile`);
        }
        
        const profileData = await profileResponse.json();
        
        // Parse JSON fields for provider profiles
        if (type === 'provider') {
          profileData.regions = parseJsonField(profileData.regions, []);
          profileData.services = parseJsonField(profileData.services, []);
          profileData.certifications = parseJsonField(profileData.certifications, []);
          profileData.provider_types_detail = parseJsonField(profileData.provider_types_detail, []);
        }
        
        setProfile(profileData);
        
        // Fetch projects or products based on profile type
        if (type === 'developer') {
          // Fetch projects for developers
          const projectsResponse = await fetch(`/api/projects?developer=${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            setProjects(projectsData);
          }
        } else {
          // Fetch products for providers from marketplace_products table
          // First try to get all products and filter by user_id client-side
          const productsResponse = await fetch(`/api/marketplace/products`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (productsResponse.ok) {
            const allProducts = await productsResponse.json();
            // Filter products by user_id
            const userProducts = allProducts.filter(product => 
              product.user_id === parseInt(id) || product.user_id === id
            );
            setProjects(userProducts); // Using projects state for products too
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching ${type} profile:`, err);
        setError(err.message || `An error occurred while fetching the ${type} profile`);
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [id, type, isAuthenticated]);
  
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
  
  // Helper function for formatting numbers
  const formatNumber = (num) => {
    if (!num && num !== 0) return 'Not specified';
    return Number(num).toLocaleString();
  };
  
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
  
  // No profile data
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{type === 'developer' ? 'Developer' : 'Provider'} Not Found</h2>
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
  
  // Render developer profile
  if (type === 'developer') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link to="/projects" className="hover:text-green-600">Projects</Link>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link to="/developers" className="hover:text-green-600">Developers</Link>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-700">{profile.organization_name || 'Developer Profile'}</span>
          </div>
          
          {/* Developer Profile */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5">
              <div className="flex items-start">
                {/* Developer avatar/logo */}
                <div className="flex-shrink-0 mr-6">
                  <div className="h-20 w-20 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl overflow-hidden">
                    {profile.logo ? (
                      <img 
                        src={profile.logo} 
                        alt={profile.organization_name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {(profile.organization_name || 'PD').substring(0, 2)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Developer details */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {profile.organization_name || 'Project Developer'}
                  </h1>
                  
                  <div className="flex items-center mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                      {profile.organization_type || 'Organization'}
                    </span>
                    
                    {profile.industry && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {profile.industry}
                      </span>
                    )}
                  </div>
                  
                  {profile.website && (
                    <a 
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {profile.website}
                    </a>
                  )}
                </div>
              </div>
              
              {/* Developer details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200">
                {profile.headquarters_city && profile.headquarters_country && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Headquarters</h3>
                    <p className="text-gray-900">{profile.headquarters_city}, {profile.headquarters_country}</p>
                  </div>
                )}
                
                {profile.regions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Regions of Operation</h3>
                    <p className="text-gray-900">
                      {Array.isArray(profile.regions) ? profile.regions.join(', ') : profile.regions}
                    </p>
                  </div>
                )}
                
                {profile.founded_year && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Founded</h3>
                    <p className="text-gray-900">{profile.founded_year}</p>
                  </div>
                )}
                
                {profile.created_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                    <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                  </div>
                )}
              </div>
              
              {/* About section */}
              {profile.company_description && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 whitespace-pre-line">{profile.company_description}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Projects Section */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Projects by {profile.organization_name}</h2>
              
              {projects.length > 0 ? (
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
                <p className="text-gray-500 italic">No projects found for this developer</p>
              )}
            </div>
          </div>
          
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
          </div>
        </div>
      </div>
    );
  }
  
  // Render provider profile
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link to="/projects" className="hover:text-green-600">Projects</Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/providers" className="hover:text-green-600">Solution Providers</Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700">{profile.company_name || 'Provider Profile'}</span>
        </div>
        
        {/* Provider Profile */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5">
            <div className="flex items-start">
              {/* Provider avatar/logo */}
              <div className="flex-shrink-0 mr-6">
                <div className="h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl overflow-hidden"
                  style={{
                    backgroundColor: 
                      profile.provider_type === 'Financial' ? '#10B981' : 
                      profile.provider_type === 'Auditor' ? '#F59E0B' : 
                      profile.provider_type === 'Technology' ? '#3B82F6' : 
                      '#6366F1'
                  }}
                >
                  {profile.logo ? (
                    <img 
                      src={profile.logo} 
                      alt={profile.company_name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {(profile.company_name || 'SP').substring(0, 2)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Provider details */}
              <div className="flex-1">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {profile.company_name || 'Solution Provider'}
                  </h1>
                  
                  <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                    ${profile.provider_type === 'Financial' ? 'bg-green-100 text-green-800' : 
                      profile.provider_type === 'Auditor' ? 'bg-yellow-100 text-yellow-800' : 
                      profile.provider_type === 'Technology' ? 'bg-blue-100 text-blue-800' : 
                      'bg-indigo-100 text-indigo-800'}`}
                  >
                    {profile.provider_type || 'Technology'}
                  </span>
                </div>
                
                <div className="flex items-center mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                    {profile.company_size} company
                  </span>
                  
                  {profile.industry && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {profile.industry}
                    </span>
                  )}
                </div>
                
                {profile.website && (
                  <a 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
            
            {/* Provider details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200">
              {profile.headquarters_city && profile.headquarters_country && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Headquarters</h3>
                  <p className="text-gray-900">{profile.headquarters_city}, {profile.headquarters_country}</p>
                </div>
              )}
              
              {profile.founded_year && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Founded</h3>
                  <p className="text-gray-900">{profile.founded_year}</p>
                </div>
              )}
              
              {profile.created_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                  <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                </div>
              )}
              
              {profile.regions && profile.regions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Regions of Operation</h3>
                  <div className="flex flex-wrap">
                    {Array.isArray(profile.regions) ? 
                      profile.regions.map((region, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2 mb-2">
                          {region}
                        </span>
                      )) : 
                      <span className="text-gray-900">{profile.regions}</span>
                    }
                  </div>
                </div>
              )}
              
              {/* Provider Types Section - For Service Providers */}
              {profile.provider_types_detail && (
                <div className="md:col-span-2">
                  <ProviderTypesDisplay providerTypes={profile.provider_types_detail} />
                </div>
              )}
            </div>
            
            {/* About section */}
            {profile.company_description && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                <p className="text-gray-600 whitespace-pre-line">{profile.company_description}</p>
              </div>
            )}
            
            {/* Services & Certifications */}
            <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.services && profile.services.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Services</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {Array.isArray(profile.services) ? 
                      profile.services.map((service, index) => (
                        <li key={index}>{service}</li>
                      )) : 
                      <li>Services information not available</li>
                    }
                  </ul>
                </div>
              )}
              
              {profile.certifications && profile.certifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Certifications</h3>
                  <div className="flex flex-wrap">
                    {Array.isArray(profile.certifications) ? 
                      profile.certifications.map((cert, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                          {cert}
                        </span>
                      )) : 
                      <span className="text-gray-600">Certification information not available</span>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Products Section */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Products by {profile.company_name}
            </h2>
            
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(product => (
                  <Link 
                    to={`/marketplace/solution/${product.id}`} 
                    key={product.id}
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 bg-gray-100 relative">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/uploads/images/placeholder-project.jpg';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-green-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Category badge */}
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {product.category || 'Product'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {product.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-green-600 font-bold">
                            {product.emissions_reduction_factor ? 
                              `${Math.round(product.emissions_reduction_factor * 100)}%` : 
                              'N/A'}
                          </span>
                          <span className="ml-1 text-sm text-gray-500">reduction</span>
                        </div>
                        
                        {product.unit_price && (
                          <span className="text-sm text-gray-700">
                            ${product.unit_price.toLocaleString()}
                            {product.unit && <span className="text-gray-500">/{product.unit}</span>}
                          </span>
                        )}
                      </div>
                      
                      {product.implementation_time && (
                        <p className="mt-2 text-xs text-gray-500">
                          Implementation: {product.implementation_time}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No products found for this provider</p>
            )}
          </div>
        </div>
        
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
          
          <Link
            to="/providers"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            All Solution Providers
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UniversalProfilePage;