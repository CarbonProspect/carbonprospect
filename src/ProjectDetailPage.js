import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, getValidToken } from './AuthSystem';
import { apiCall } from './api-config';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshToken, currentUser } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Helper function to get credit type information
  const getCreditTypeInfo = (creditType) => {
    const creditTypeMap = {
      'VCS': { name: 'Verified Carbon Standard', jurisdiction: 'International' },
      'Gold_Standard': { name: 'Gold Standard', jurisdiction: 'International' },
      'CDM': { name: 'Clean Development Mechanism', jurisdiction: 'International' },
      'Plan_Vivo': { name: 'Plan Vivo', jurisdiction: 'International' },
      'ACR': { name: 'American Carbon Registry', jurisdiction: 'International' },
      'CAR': { name: 'Climate Action Reserve', jurisdiction: 'International' },
      'ACCU': { name: 'Australian Carbon Credit Units', jurisdiction: 'Australia' },
      'JCM': { name: 'Joint Crediting Mechanism', jurisdiction: 'Japan' },
      'J_Credit': { name: 'J-Credit Scheme', jurisdiction: 'Japan' },
      'EUA': { name: 'EU Allowances', jurisdiction: 'European Union' },
      'UK_ETS': { name: 'UK ETS Allowances', jurisdiction: 'United Kingdom' },
      'CCA': { name: 'California Carbon Allowances', jurisdiction: 'United States' },
      'RGGI': { name: 'RGGI Allowances', jurisdiction: 'United States' },
      'NZU': { name: 'New Zealand Units', jurisdiction: 'New Zealand' },
      'KAU': { name: 'Korean Allowance Units', jurisdiction: 'South Korea' },
      'K_Credit': { name: 'K-Credit', jurisdiction: 'South Korea' },
      'Federal_Backstop': { name: 'Federal Backstop Credits', jurisdiction: 'Canada' },
      'Provincial_Allowances': { name: 'Provincial Allowances', jurisdiction: 'Canada' },
      'Swiss_Domestic': { name: 'Swiss Domestic Credits', jurisdiction: 'Switzerland' },
      'Singapore_Eligible_International': { name: 'Singapore Eligible International Credits', jurisdiction: 'Singapore' }
    };
    
    return creditTypeMap[creditType] || null;
  };

  // Helper function to get registry from credit type
  const getRegistryFromCreditType = (creditType) => {
    const registryMap = {
      'VCS': 'Verra Registry',
      'Gold_Standard': 'Gold Standard Registry',
      'CDM': 'UNFCCC CDM Registry',
      'Plan_Vivo': 'Plan Vivo Registry',
      'ACR': 'American Carbon Registry',
      'CAR': 'Climate Action Reserve',
      'ACCU': 'Australian National Registry',
      'JCM': 'JCM Registry',
      'J_Credit': 'J-Credit Registry',
      'EUA': 'EU Registry',
      'UK_ETS': 'UK Registry',
      'CCA': 'California ARB Registry',
      'RGGI': 'RGGI COATS',
      'NZU': 'New Zealand Registry',
      'KAU': 'Korean Registry',
      'K_Credit': 'Korean Registry',
      'Federal_Backstop': 'Canadian Federal Registry',
      'Provincial_Allowances': 'Provincial Registry',
      'Swiss_Domestic': 'Swiss Registry',
      'Singapore_Eligible_International': 'Singapore Registry'
    };
    
    return registryMap[creditType] || null;
  };
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token and validate
        const token = getValidToken();
        
        if (!token) {
          setError('Authentication required. Please log in to view this project.');
          setLoading(false);
          return;
        }
        
        // Use the improved API call helper
        const data = await apiCall('GET', `/projects/${id}`);
        setProject(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching project:', err);
        
        // Handle specific error types
        if (err.isNetworkError) {
          setError('Cannot connect to the server. Please check if the API server is running on the correct port.');
        } else if (err.status === 401 || err.status === 403) {
          // Try to refresh token
          try {
            const refreshed = await refreshToken();
            if (refreshed) {
              // Retry the request
              const data = await apiCall('GET', `/projects/${id}`);
              setProject(data);
              setLoading(false);
              return;
            } else {
              setError('Your session has expired. Please log in again.');
            }
          } catch (refreshError) {
            setError('Authentication failed. Please log in again.');
          }
        } else if (err.status === 404) {
          setError('Project not found. It may have been deleted.');
        } else if (err.message.includes('API endpoint not found')) {
          setError('API endpoint not available. Please check if the server is running and the API routes are properly configured.');
        } else {
          setError(err.message || 'An unexpected error occurred while loading the project.');
        }
        
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [id, refreshToken]);
  
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
  
  // Format number with commas
  const formatNumber = (num) => {
    if (!num && num !== 0) return 'Not specified';
    return Number(num).toLocaleString();
  };

  // Determine SDG Goals 
  const renderSDGGoals = (goals) => {
    if (!goals || goals.length === 0) return <span className="text-gray-500 italic">None specified</span>;
    
    const sdgMap = {
      "1": { name: "No Poverty", color: "bg-red-500" },
      "2": { name: "Zero Hunger", color: "bg-yellow-500" },
      "3": { name: "Good Health & Well-being", color: "bg-green-500" },
      "4": { name: "Quality Education", color: "bg-red-600" },
      "5": { name: "Gender Equality", color: "bg-orange-500" },
      "6": { name: "Clean Water & Sanitation", color: "bg-blue-400" },
      "7": { name: "Affordable & Clean Energy", color: "bg-yellow-400" },
      "8": { name: "Decent Work & Economic Growth", color: "bg-red-400" },
      "9": { name: "Industry, Innovation & Infrastructure", color: "bg-orange-400" },
      "10": { name: "Reduced Inequalities", color: "bg-pink-500" },
      "11": { name: "Sustainable Cities & Communities", color: "bg-yellow-600" },
      "12": { name: "Responsible Consumption & Production", color: "bg-amber-600" },
      "13": { name: "Climate Action", color: "bg-green-600" },
      "14": { name: "Life Below Water", color: "bg-blue-600" },
      "15": { name: "Life on Land", color: "bg-green-700" },
      "16": { name: "Peace, Justice & Strong Institutions", color: "bg-blue-700" },
      "17": { name: "Partnerships for the Goals", color: "bg-purple-600" }
    };
    
    return (
      <div className="flex flex-wrap gap-2">
        {goals.map(goal => {
          const sdg = sdgMap[goal.toString()] || { name: `SDG ${goal}`, color: "bg-gray-500" };
          return (
            <span 
              key={goal} 
              className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${sdg.color}`}
              title={sdg.name}
            >
              SDG {goal}
            </span>
          );
        })}
      </div>
    );
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
          {(error.includes('Authentication') || error.includes('session')) && (
            <button
              onClick={() => navigate('/login')}
              className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Log In
            </button>
          )}
          {error.includes('server') && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Troubleshooting tips:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Make sure your API server is running</li>
                <li>Check if the API is running on port 3001</li>
                <li>Verify your API routes are properly configured</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // No project data
  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <p className="mb-6">The project you're looking for couldn't be located.</p>
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
  
  // Determine project type label
  const projectTypeLabel = project.project_type === 'assessment' 
    ? 'Assessment Project' 
    : 'Project Listing';
  
  // Create project stage badges with colors
  const getProjectStageInfo = (stage) => {
    const stageMap = {
      'concept': { label: 'Concept/Idea Stage', color: 'bg-purple-100 text-purple-800' },
      'planning': { label: 'Planning & Development', color: 'bg-blue-100 text-blue-800' },
      'implementation': { label: 'Implementation', color: 'bg-indigo-100 text-indigo-800' },
      'monitoring': { label: 'Monitoring & Reporting', color: 'bg-cyan-100 text-cyan-800' },
      'verification': { label: 'Verification', color: 'bg-teal-100 text-teal-800' },
      'issuance': { label: 'Credit Issuance', color: 'bg-green-100 text-green-800' },
      'completed': { label: 'Completed', color: 'bg-emerald-100 text-emerald-800' }
    };
    
    return stageMap[stage] || { label: stage, color: 'bg-gray-100 text-gray-800' };
  };
  
  const getVerificationStatusInfo = (status) => {
    const statusMap = {
      'unverified': { label: 'Not Yet Verified', color: 'bg-gray-100 text-gray-800' },
      'validation': { label: 'Validation in Process', color: 'bg-yellow-100 text-yellow-800' },
      'validated': { label: 'Validated', color: 'bg-blue-100 text-blue-800' },
      'verification': { label: 'Verification in Process', color: 'bg-indigo-100 text-indigo-800' },
      'verified': { label: 'Verified', color: 'bg-teal-100 text-teal-800' },
      'registered': { label: 'Registered & Verified', color: 'bg-emerald-100 text-emerald-800' },
      'issuance': { label: 'Credits Issued', color: 'bg-green-100 text-green-800' }
    };
    
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  // Prepare project stage and verification status info
  const projectStageInfo = getProjectStageInfo(project.project_stage || 'concept');
  const verificationStatusInfo = getVerificationStatusInfo(project.verification_status || 'unverified');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link to="/projects" className="hover:text-green-600">Projects</Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700">{project.name}</span>
        </div>
        
        {/* Header with Image Banner */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="relative h-56 bg-green-800">
            {project.image_url ? (
              <img 
                src={project.image_url} 
                alt={project.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-200 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            {/* Status Badges */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                ${project.status === 'Active' ? 'bg-green-100 text-green-800' : 
                  project.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                  project.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 
                  project.status === 'Seeking Partners' ? 'bg-purple-100 text-purple-800' : 
                  'bg-yellow-100 text-yellow-800'}`}
              >
                {project.status || 'Draft'}
              </span>
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {projectTypeLabel}
              </span>
            </div>
            
            {/* Project title */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
              <div className="flex items-center text-white opacity-90">
                <span className="inline-flex items-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  {project.category || 'Uncategorized'}
                </span>
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {project.location || 'Location not specified'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content - Single Page Layout */}
        <div className="space-y-8">
          {/* Overview Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-600 whitespace-pre-line mb-6">{project.description}</p>
              
              {/* Project Stage & Status */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Project Stage</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${projectStageInfo.color}`}>
                    {projectStageInfo.label}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Verification Status</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${verificationStatusInfo.color}`}>
                    {verificationStatusInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Project Classification Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Classification</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Project Category</h4>
                  <p className="text-gray-900 text-lg font-semibold">{project.category || 'Not specified'}</p>
                  <p className="text-xs text-gray-500 mt-1">Methodology type</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Credit Type</h4>
                  <p className="text-gray-900 text-lg font-semibold">{project.credit_type || project.creditType || 'Not specified'}</p>
                  <p className="text-xs text-gray-500 mt-1">Type of carbon credit issued</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Target Markets</h4>
                  {project.target_markets && project.target_markets.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {project.target_markets.slice(0, 3).map(market => (
                        <span key={market} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {market}
                        </span>
                      ))}
                      {project.target_markets.length > 3 && (
                        <span className="text-xs text-gray-500">+{project.target_markets.length - 3} more</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">Not specified</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Intended compliance markets</p>
                </div>
              </div>
              
              {/* All target markets list */}
              {project.target_markets && project.target_markets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">All Target Markets</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.target_markets.map(market => (
                      <span key={market} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {market}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Key Metrics Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Emissions Reduction Target</h4>
                  <p className="text-gray-900 text-xl font-semibold">{formatNumber(project.reduction_target)} tCO2e</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Budget</h4>
                  <p className="text-gray-900 text-xl font-semibold">${formatNumber(project.budget)} USD</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Project Timeline</h4>
                  <p className="text-gray-900">
                    {formatDate(project.timeline?.start || null)} - {formatDate(project.timeline?.end || null)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Credit Pricing Section - Only show for listing projects with pricing */}
          {project.project_type === 'listing' && project.credit_price && (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-6 py-5">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Credit Pricing</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Price per tCO2e</h4>
                    <p className="text-gray-900 text-2xl font-semibold">
                      {project.credit_price_currency} ${Number(project.credit_price).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {project.credit_price_type === 'fixed' ? 'Fixed Price' :
                       project.credit_price_type === 'negotiable' ? 'Negotiable' :
                       project.credit_price_type === 'auction' ? 'Auction-based' :
                       'Request Quote'}
                    </p>
                  </div>
                  
                  {project.minimum_purchase && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Minimum Purchase</h4>
                      <p className="text-gray-900 text-xl font-semibold">
                        {formatNumber(project.minimum_purchase)} tCO2e
                      </p>
                    </div>
                  )}
                  
                  {project.price_valid_until && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Price Valid Until</h4>
                      <p className="text-gray-900 text-lg font-semibold">
                        {formatDate(project.price_valid_until)}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Bulk Discounts */}
                {project.bulk_discounts && project.bulk_discounts.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Volume Discounts Available</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                            <th className="pr-4">Minimum Quantity</th>
                            <th>Discount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {project.bulk_discounts.map((discount, index) => (
                            <tr key={index}>
                              <td className="py-2 text-sm text-gray-900">
                                {Number(discount.minQuantity).toLocaleString()} tCO2e
                              </td>
                              <td className="py-2 text-sm text-green-600 font-medium">
                                {discount.discountPercent}% off
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Enhanced Methodology & Standards Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Methodology & Standards</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Methodology</h4>
                  <p className="text-gray-900">
                    {project.methodology || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Standard Body</h4>
                  <p className="text-gray-900">
                    {project.standard_body || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Credit Type</h4>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {project.credit_type || project.creditType || 'Not specified'}
                    </span>
                    {getCreditTypeInfo(project.credit_type || project.creditType) && (
                      <span className="text-xs text-gray-500">
                        ({getCreditTypeInfo(project.credit_type || project.creditType).jurisdiction})
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Registry</h4>
                  <p className="text-gray-900">
                    {getRegistryFromCreditType(project.credit_type || project.creditType) || 'Not specified'}
                  </p>
                </div>
              </div>
              
              {project.methodology_details && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Methodology Details</h4>
                  <p className="text-gray-900 whitespace-pre-line">{project.methodology_details}</p>
                </div>
              )}
              
              {project.registry_link && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Registry Link</h4>
                  <a 
                    href={project.registry_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {project.registry_link}
                  </a>
                </div>
              )}
              
              {/* Enhanced Eligibility Section */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Market Eligibility & Standards</h4>
                
                {project.eligibility && Object.keys(project.eligibility).some(key => project.eligibility[key]) ? (
                  <div className="flex flex-wrap gap-2">
                    {project.eligibility.article6 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Paris Agreement Article 6.2
                      </span>
                    )}
                    {project.eligibility.corsia && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        CORSIA Eligible
                      </span>
                    )}
                    {project.eligibility.verra && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                        Verra Registered
                      </span>
                    )}
                    {project.eligibility.gold_standard && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Gold Standard Registered
                      </span>
                    )}
                    {project.eligibility.cdm && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        CDM Registered
                      </span>
                    )}
                    {project.eligibility.other && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {project.eligibility_other || 'Other Standard'}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No eligibility standards specified</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Project Developer/Proponent Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Developer</h2>
              
              <div className="flex items-start">
                {/* Developer avatar/logo */}
                <div className="flex-shrink-0 mr-4">
                  <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white text-lg overflow-hidden">
                    {project.developer_logo ? (
                      <img 
                        src={project.developer_logo} 
                        alt={project.developer_name || project.organization_name || 'Project Developer'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {(project.developer_name || project.organization_name || 'PD').substring(0, 2)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Developer details */}
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {project.developer_name || project.organization_name || 'Project Developer'}
                  </h3>
                  
                  <div className="text-sm text-gray-500 mb-3">
                    {project.organization_type || 'Organization'} 
                    {project.headquarters_city && project.headquarters_country && (
                      <span> • {project.headquarters_city}, {project.headquarters_country}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Link 
                      to={`/profiles/${project.developer_id || project.user_id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Profile
                    </Link>
                    
                    <Link 
                      to={`/projects?developer=${project.developer_id || project.user_id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View All Projects
                    </Link>
                    
                    {project.website && (
                      <a 
                        href={project.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
              
              {/* Industry and expertise */}
              {(project.industry || project.project_types) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.industry && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Industry</h4>
                        <p className="text-gray-800">{project.industry}</p>
                      </div>
                    )}
                    
                    {project.project_types && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Specialization</h4>
                        <p className="text-gray-800">{Array.isArray(project.project_types) ? project.project_types.join(', ') : project.project_types}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Project description - if available */}
              {project.company_description && (
                <div className="mt-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">About</h4>
                  <p>{project.company_description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Solution Providers Section */}
          {project.providers && project.providers.length > 0 && (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-6 py-5">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Solution Providers</h2>
                
                <div className="space-y-4">
                  {project.providers.map(provider => (
                    <div key={provider.id} className="flex items-start p-4 border rounded-lg">
                      {/* Provider avatar/logo */}
                      <div className="flex-shrink-0 mr-4">
                        <div 
                          className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg overflow-hidden"
                          style={{
                            backgroundColor: 
                              provider.provider_type === 'Financial' ? '#10B981' : 
                              provider.provider_type === 'Auditor' ? '#F59E0B' : 
                              provider.provider_type === 'Technology' ? '#3B82F6' : 
                              '#6366F1'
                          }}
                        >
                          {provider.logo ? (
                            <img 
                              src={provider.logo} 
                              alt={provider.company_name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>
                              {(provider.company_name || 'SP').substring(0, 2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Provider details */}
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <h3 className="text-lg font-medium text-gray-900 mr-2">
                            {provider.company_name || 'Solution Provider'}
                          </h3>
                          
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${provider.provider_type === 'Financial' ? 'bg-green-100 text-green-800' : 
                              provider.provider_type === 'Auditor' ? 'bg-yellow-100 text-yellow-800' : 
                              provider.provider_type === 'Technology' ? 'bg-blue-100 text-blue-800' : 
                              'bg-indigo-100 text-indigo-800'}`}
                          >
                            {provider.provider_type || 'Technology'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-3">
                          {provider.company_size && `${provider.company_size} company`} 
                          {provider.industry && ` • ${provider.industry}`}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Link 
                            to={`/profiles/${provider.id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            View Profile
                          </Link>
                          
                          {provider.website && (
                            <a 
                              href={provider.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Geographic Information Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Geographic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                  <p className="text-gray-900">{project.location || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Coordinates</h4>
                  <p className="text-gray-900">
                    {project.latitude && project.longitude ? (
                      <>
                        {project.latitude}, {project.longitude}
                        <a 
                          href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline ml-2 text-sm"
                        >
                          (View on Map)
                        </a>
                      </>
                    ) : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bilateral Agreements Section - Only shown for Article 6 projects */}
          {project.article6_compliant && (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-6 py-5">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 6.2 Information</h2>
                
                {/* Bilateral Agreement Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Bilateral Agreement</h3>
                  
                  {project.bilateral_agreements && project.bilateral_agreements.length > 0 ? (
                    <div className="space-y-4">
                      {project.bilateral_agreements.map((agreement, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-blue-50">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {typeof agreement === 'string' ? agreement : agreement.name || 'Bilateral Agreement'}
                              </h4>
                              
                              {typeof agreement !== 'string' && agreement.buyingParty && agreement.hostCountry && (
                                <p className="text-sm text-gray-600">
                                  Buying Party: {agreement.buyingParty} | Host Country: {agreement.hostCountry}
                                </p>
                              )}
                            </div>
                            
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Paris Agreement Article 6.2
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No specific bilateral agreements specified</p>
                  )}
                </div>
                
                {/* Article 6 Documents */}
                {project.agreement_documents && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Article 6 Documentation</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* MOU Documents */}
                      <div className="border rounded p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Memorandum of Understanding</h4>
                        {project.agreement_documents.mou && project.agreement_documents.mou.length > 0 ? (
                          <ul className="space-y-2">
                            {project.agreement_documents.mou.map((doc, idx) => (
                              <li key={idx} className="flex items-center text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:underline"
                                >
                                  {doc.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic text-sm">No MOU documents provided</p>
                        )}
                      </div>
                      
                      {/* Intent Documents */}
                      <div className="border rounded p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Letter of Intent</h4>
                        {project.agreement_documents.intent && project.agreement_documents.intent.length > 0 ? (
                          <ul className="space-y-2">
                            {project.agreement_documents.intent.map((doc, idx) => (
                              <li key={idx} className="flex items-center text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:underline"
                                >
                                  {doc.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic text-sm">No Letter of Intent documents provided</p>
                        )}
                      </div>
                      
                      {/* No Objection Documents */}
                      <div className="border rounded p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Letter of No Objection</h4>
                        {project.agreement_documents.noObjection && project.agreement_documents.noObjection.length > 0 ? (
                          <ul className="space-y-2">
                            {project.agreement_documents.noObjection.map((doc, idx) => (
                              <li key={idx} className="flex items-center text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:underline"
                                >
                                  {doc.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic text-sm">No Letter of No Objection documents provided</p>
                        )}
                      </div>
                      
                      {/* Authorization Documents */}
                      <div className="border rounded p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Letter of Authorization</h4>
                        {project.agreement_documents.authorization && project.agreement_documents.authorization.length > 0 ? (
                          <ul className="space-y-2">
                            {project.agreement_documents.authorization.map((doc, idx) => (
                              <li key={idx} className="flex items-center text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:underline"
                                >
                                  {doc.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic text-sm">No Letter of Authorization documents provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Article 6 specific info */}
                {project.implementing_agency && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Implementation Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Implementing Agency</h4>
                        <p className="text-gray-800">{project.implementing_agency}</p>
                      </div>
                      
                      {project.verification_standard && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Verification Standard</h4>
                          <p className="text-gray-800">{project.verification_standard}</p>
                        </div>
                      )}
                      
                      {project.project_link && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Official Project Link</h4>
                          <a 
                            href={project.project_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {project.project_link}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Co-Benefits & SDGs Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sustainability Information</h2>
              
              {/* Co-Benefits */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Co-Benefits</h3>
                
                {project.cobenefits && project.cobenefits.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.cobenefits.map((benefit, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No co-benefits specified</p>
                )}
              </div>
              
              {/* SDGs */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sustainable Development Goals (SDGs)</h3>
                {renderSDGGoals(project.sdg_goals)}
              </div>
            </div>
          </div>
          
          {/* Assessment Data Section (Conditional) */}
          {project.assessment_data && project.project_type === 'assessment' && (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-6 py-5">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Data</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Project Size</h4>
                    <p className="text-gray-900">{formatNumber(project.assessment_data.projectSize || 0)} {project.assessment_data.projectType === 'forestry' ? 'hectares' : 
                      project.assessment_data.projectType === 'renewable' ? 'MW' : 'units'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Project Years</h4>
                    <p className="text-gray-900">{project.assessment_data.projectYears || 30} years</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Carbon Credit Price</h4>
                    <p className="text-gray-900">${project.assessment_data.carbonCreditPrice || 15}/tCO2e</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Discount Rate</h4>
                    <p className="text-gray-900">{(project.assessment_data.discountRate || 0.05) * 100}%</p>
                  </div>
                  
                  {/* Conditionally rendered project-specific fields */}
                  {project.assessment_data.projectType === 'forestry' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Tree Type</h4>
                      <p className="text-gray-900">{project.assessment_data.treeType || 'Not specified'}</p>
                    </div>
                  )}
                  
                  {project.assessment_data.projectType === 'renewable' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Renewable Type</h4>
                      <p className="text-gray-900">{project.assessment_data.renewableType || 'Not specified'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Supporting Documents Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Supporting Documents</h2>
              
              {project.documents && project.documents.length > 0 ? (
                <ul className="divide-y divide-gray-200 border rounded-md overflow-hidden">
                  {project.documents.map((doc, index) => (
                    <li key={index} className="px-4 py-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB · ` : ''}
                          Uploaded {doc.uploadDate ? formatDate(doc.uploadDate) : 'Not specified'}
                        </p>
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No documents have been uploaded for this project</p>
              )}
            </div>
          </div>
          
          {/* Contact Information Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.contact_email && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                    <a 
                      href={`mailto:${project.contact_email}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {project.contact_email}
                    </a>
                  </div>
                )}
                
                {project.contact_phone && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                    <a 
                      href={`tel:${project.contact_phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {project.contact_phone}
                    </a>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                  <p className="text-gray-900">{formatDate(project.created_at)}</p>
                </div>
              </div>
              
              {!project.contact_email && !project.contact_phone && (
                <p className="text-gray-500 italic">No contact information has been provided for this project</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Projects
          </Link>
          
          <div className="flex space-x-2">
            <Link
              to={`/projects/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Project
            </Link>
            
            <button
              onClick={() => {
                // Clone project functionality would go here
                if (window.confirm('Are you sure you want to clone this project?')) {
                  alert('Clone functionality will be implemented in a future update.');
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Clone
            </button>
            
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to ${project.status === 'Active' ? 'deactivate' : 'activate'} this project?`)) {
                  alert(`${project.status === 'Active' ? 'Deactivation' : 'Activation'} functionality will be implemented in a future update.`);
                }
              }}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none 
                ${project.status === 'Active' ? 
                  'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100' : 
                  'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {project.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;