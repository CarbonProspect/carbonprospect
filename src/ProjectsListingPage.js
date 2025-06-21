import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from './AuthSystem';
import api from './api-config'; // ADD THIS IMPORT
import ProjectCard from './components/ProjectCard';
import ProjectFilters from './components/ProjectFilters';
import ProjectLocationMap from './components/ProjectLocationMap';
import RealWorldProjectsSearch from './components/RealWorldProjectsSearch';
import { getEligibleMarketsForProject, getBilateralMarketData } from './ComplianceMarketManager';
import 'leaflet/dist/leaflet.css';

// Function to safely filter data regardless of format
const safeFilter = (data, filterFn) => {
  // Handle null or undefined data
  if (!data) {
    console.log('Data is null or undefined');
    return [];
  }
  
  // Handle array data
  if (Array.isArray(data)) {
    return data.filter(filterFn);
  }
  
  // Handle object with projects property (legacy format)
  if (data && data.projects && Array.isArray(data.projects)) {
    console.log('Data is an object with projects array');
    return data.projects.filter(filterFn);
  }
  
  // Handle unexpected data format
  console.error('Expected array or object with projects array, got:', typeof data);
  return [];
};

const ProjectsListingPage = () => {
  const { currentUser, isAuthenticated, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedProjectIds, setSavedProjectIds] = useState(new Set());
  const [showMap, setShowMap] = useState(false);
  const [showRealWorldSearch, setShowRealWorldSearch] = useState(false);
  const previousViewState = useRef(false);
  const initialLoadDone = useRef(false); // Prevent refetching on reconnect
  const [availableMarkets, setAvailableMarkets] = useState([]);
  
  // NEW: Enhanced credit system data
  const [creditTypes, setCreditTypes] = useState([]);
  const [targetMarkets, setTargetMarkets] = useState([]);
  
  // Enhanced filters state with new credit type filters and pricing
  const [filters, setFilters] = useState({
    category: 'all',
    creditType: 'all',        // NEW: Credit type filter (VCS, ACCU, etc.)
    targetMarket: 'all',      // NEW: Target market filter
    complianceType: 'all',    // NEW: Compliance/voluntary filter
    status: 'all',
    verificationStatus: 'all',
    complianceMarket: 'all', // Paris Article 6.2 market filter (keep for compatibility)
    searchTerm: '',
    reductionTarget: { min: null, max: null },
    budget: { min: null, max: null },
    creditPrice: { min: null, max: null }, // NEW: Credit price range filter
    creditPriceType: 'all', // NEW: Price type filter
    showArticle6: true // Filter to control visibility of Article 6 projects
  });
  
  // Load available markets (legacy compatibility)
  useEffect(() => {
    // In production, this would be an API call
    const markets = getBilateralMarketData();
    setAvailableMarkets(markets);
  }, []);
  
  // NEW: Fetch credit types, target markets, and jurisdictions
  useEffect(() => {
    const fetchCreditSystemData = async () => {
      if (!isAuthenticated) return;
      
      try {
        // Fetch credit types
        const creditTypesResponse = await api.get('/credit-types');
        setCreditTypes(creditTypesResponse.data || []);
        
        // Fetch target markets
        const targetMarketsResponse = await api.get('/target-markets');
        setTargetMarkets(targetMarketsResponse.data || []);
        
        console.log('Credit system data loaded:', {
          creditTypes: creditTypesResponse.data?.length || 0,
          targetMarkets: targetMarketsResponse.data?.length || 0
        });
        
      } catch (err) {
        console.error('Error fetching credit system data:', err);
        // Don't set error state here - this is supplementary data
      }
    };
    
    if (isAuthenticated) {
      fetchCreditSystemData();
    }
  }, [isAuthenticated]);
  
  // Reset filters function with credit pricing
  const resetFilters = () => {
    setFilters({
      category: 'all',
      creditType: 'all',
      targetMarket: 'all',
      complianceType: 'all',
      status: 'all',
      verificationStatus: 'all',
      complianceMarket: 'all', // Paris Article 6.2 market filter
      searchTerm: '',
      reductionTarget: { min: null, max: null },
      budget: { min: null, max: null },
      creditPrice: { min: null, max: null },
      creditPriceType: 'all',
      showArticle6: true // Keep showing Article 6 projects
    });
  };
  
  // Toggle Article 6 projects visibility
  const toggleArticle6Projects = () => {
    setFilters(prev => ({
      ...prev,
      showArticle6: !prev.showArticle6
    }));
  };
  
  // Handle real-world project filter changes
  const handleRealWorldFilterChange = (filterAction) => {
    switch (filterAction.type) {
      case 'applyRealWorldProjectFilter':
        // Update filters to match the real-world project characteristics
        setFilters(prev => ({
          ...prev,
          // Set the category if it matches one of our existing categories
          category: filterAction.projectType && categories.includes(filterAction.projectType) 
            ? filterAction.projectType 
            : prev.category,
          // Set location to filter by the country
          searchTerm: filterAction.countryName || prev.searchTerm,
          // Set the bilateral market if provided
          complianceMarket: filterAction.bilateralMarket || prev.complianceMarket,
        }));
        break;
      case 'resetFilters':
        resetFilters();
        break;
      default:
        console.warn('Unknown real-world filter action:', filterAction.type);
    }
  };
  
  // Create a fetchProjects function using useCallback to avoid recreating it
  const fetchProjects = useCallback(async () => {
    // Skip if we've already loaded projects to prevent loops
    if (initialLoadDone.current && projects.length > 0) {
      console.log("Skipping redundant fetch - projects already loaded");
      return;
    }
    
    try {
      setLoading(true);
      
      // Use api instance - it handles auth automatically
      console.log("Fetching all projects...");
      const response = await api.get('/projects');
      
      console.log("Projects fetched:", response.data.length);
      
      const data = response.data;
      
      // Use safeFilter to handle different response formats
      const listingProjects = safeFilter(data, project => project.project_type === 'listing');
      console.log(`Filtered to ${listingProjects.length} listing projects`);
      
      if (listingProjects.length > 0) {
        console.log("First project sample:", JSON.stringify(listingProjects[0], null, 2));
      } else {
        console.log("No listing projects returned from API");
      }
      
      // Process the projects to add isArticle6 flag and enhanced credit info
      const processedProjects = listingProjects.map(project => ({
        ...project,
        isArticle6: project.article6_compliant === true,
        // For compatibility with the existing UI
        buyingParty: project.buying_party || '',
        hostParty: project.host_country || project.location || '',
        // NEW: Enhanced credit information (these should come from your database now)
        creditType: project.credit_type || 'VCS', // fallback to VCS
        targetMarkets: project.target_markets || [],
        eligibleJurisdictions: project.eligible_jurisdictions || [],
        creditTypeName: project.credit_type_name || project.credit_type || 'VCS',
        creditJurisdiction: project.credit_jurisdiction || 'International',
        complianceType: project.compliance_type || 'voluntary',
        registryName: project.registry_name || 'Verra Registry',
        // NEW: Credit pricing fields
        credit_price: project.credit_price || null,
        credit_price_currency: project.credit_price_currency || 'USD',
        credit_price_type: project.credit_price_type || 'fixed',
        minimum_purchase: project.minimum_purchase || null,
        price_valid_until: project.price_valid_until || null,
        bulk_discounts: project.bulk_discounts || []
      }));
      
      setProjects(processedProjects);
      setError(null);
      
      // Only auto-enable map view on first load, not on subsequent fetches
      if (!initialLoadDone.current) {
        const hasLocationData = listingProjects.some(project => project.latitude && project.longitude);
        if (hasLocationData) {
          setShowMap(true);
        }
        initialLoadDone.current = true;
      }
    } catch (err) {
      console.error('Error:', err);
      
      if (err.response?.status === 401) {
        console.log("401 Unauthorized response");
        checkAuthStatus();
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Error fetching projects');
      }
    } finally {
      setLoading(false);
    }
  }, [checkAuthStatus, projects.length]);
  
  // Updated fetchSavedProjects function with better error handling
  const fetchSavedProjects = async () => {
    if (!isAuthenticated) {
      setSavedProjectIds(new Set([]));
      return;
    }
    
    try {
      console.log("Fetching saved projects...");
      
      const response = await api.get('/projects/user/saved');
      
      console.log("Saved projects fetched:", response.data);
      
      // Handle both array and object with projects property formats
      const savedProjects = Array.isArray(response.data) ? response.data : 
                           (response.data && response.data.projects && Array.isArray(response.data.projects)) ? response.data.projects : [];
      
      console.log("Processed saved projects:", savedProjects.length);
      
      // Create a Set of saved project IDs for quick lookups
      setSavedProjectIds(new Set(savedProjects.map(p => p.id)));
    } catch (err) {
      console.error('Error fetching saved projects:', err);
      setSavedProjectIds(new Set([]));
    }
  };
  
  // Add useEffect to fetch saved projects
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedProjects();
    }
  }, [isAuthenticated]);
  
  // Main data fetching effect
  useEffect(() => {
    console.log("Authentication state:", isAuthenticated);
    
    // Only fetch if authenticated and we don't already have projects
    if (isAuthenticated && (!initialLoadDone.current || projects.length === 0)) {
      fetchProjects();
    } else if (!isAuthenticated) {
      // Force a check of authentication status before showing login page
      checkAuthStatus();
      setLoading(false);
    }
  }, [isAuthenticated, fetchProjects, checkAuthStatus, projects.length]);
  
  // Track view state changes
  useEffect(() => {
    console.log(`View changed from ${previousViewState.current ? 'map' : 'grid'} to ${showMap ? 'map' : 'grid'}`);
    previousViewState.current = showMap;
  }, [showMap]);
  
  // Handle manual refresh button
  const handleRefresh = () => {
    initialLoadDone.current = false; // Reset to allow refetching
    checkAuthStatus(); // Re-check auth status
    fetchProjects();   // Try fetching projects again
  };
  
  // Handle creating a new project
  const handleCreateProject = () => {
    navigate('/projects/new');
  };
  
  // Handle saving a project
  const handleSaveProject = async (projectId) => {
    try {
      console.log(`Saving project ${projectId}`);
      const response = await api.post(`/projects/save/${projectId}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`Project ${projectId} saved`);
        setSavedProjectIds(prev => new Set([...prev, projectId]));
      }
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };
  
  // Handle removing a saved project
  const handleRemoveSaved = async (projectId) => {
    try {
      console.log(`Removing saved project ${projectId}`);
      await api.delete(`/projects/unsave/${projectId}`);
      
      console.log(`Project ${projectId} removed from saved`);
      // Update the saved projects set by removing this project
      setSavedProjectIds(prev => {
        const updatedSet = new Set([...prev]);
        updatedSet.delete(projectId);
        return updatedSet;
      });
    } catch (err) {
      console.error('Error removing project:', err);
    }
  };
  
  // Apply filters to projects safely using the safeFilter helper with credit pricing
  const filteredProjects = safeFilter(projects, project => {
    // Skip Article 6 projects if showArticle6 is false
    if (project.isArticle6 && !filters.showArticle6) {
      return false;
    }
    
    // Category filter
    if (filters.category !== 'all' && project.category !== filters.category) {
      return false;
    }
    
    // NEW: Credit type filter
    if (filters.creditType !== 'all' && project.creditType !== filters.creditType) {
      return false;
    }
    
    // NEW: Target market filter
    if (filters.targetMarket !== 'all') {
      const projectTargetMarkets = Array.isArray(project.targetMarkets) 
        ? project.targetMarkets 
        : (typeof project.targetMarkets === 'string' 
          ? JSON.parse(project.targetMarkets || '[]') 
          : []);
      
      // Find the target market display name
      const selectedMarket = targetMarkets.find(tm => tm.market_code === filters.targetMarket);
      if (!selectedMarket || !projectTargetMarkets.includes(selectedMarket.display_name)) {
        return false;
      }
    }
    
    // NEW: Compliance type filter
    if (filters.complianceType !== 'all' && project.complianceType !== filters.complianceType) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && project.status !== filters.status) {
      return false;
    }
    
    // Verification status filter
    if (filters.verificationStatus !== 'all' && 
        project.verification_status !== filters.verificationStatus) {
      return false;
    }
    
    // Paris Article 6.2 market filter (legacy compatibility)
    if (filters.complianceMarket !== 'all') {
      // Special handling for Article 6 projects
      if (project.isArticle6) {
        // Get market data from the selected market ID
        const marketData = availableMarkets.find(m => m.id === filters.complianceMarket);
        // Check if the project's buyingParty matches the market's buyingParty
        if (!marketData || project.buyingParty !== marketData.buyingParty) {
          return false;
        }
      } else {
        // For regular projects, use the eligibility check
        const eligibleMarkets = getEligibleMarketsForProject(project, availableMarkets);
        const isEligible = eligibleMarkets.some(market => market.id === filters.complianceMarket);
        if (!isEligible) return false;
      }
    }
    
    // Reduction target filter - min
    if (filters.reductionTarget.min !== null && 
        (!project.reduction_target || project.reduction_target < filters.reductionTarget.min)) {
      return false;
    }
    
    // Reduction target filter - max
    if (filters.reductionTarget.max !== null && 
        (!project.reduction_target || project.reduction_target > filters.reductionTarget.max)) {
      return false;
    }
    
    // Budget filter - min
    if (filters.budget.min !== null && 
        (!project.budget || project.budget < filters.budget.min)) {
      return false;
    }
    
    // Budget filter - max
    if (filters.budget.max !== null && 
        (!project.budget || project.budget > filters.budget.max)) {
      return false;
    }
    
    // NEW: Credit price range filter - min
    if (filters.creditPrice.min !== null && 
        (!project.credit_price || project.credit_price < filters.creditPrice.min)) {
      return false;
    }
    
    // NEW: Credit price range filter - max
    if (filters.creditPrice.max !== null && 
        (!project.credit_price || project.credit_price > filters.creditPrice.max)) {
      return false;
    }
    
    // NEW: Credit price type filter
    if (filters.creditPriceType !== 'all' && 
        project.credit_price_type !== filters.creditPriceType) {
      return false;
    }
    
    // Search term filter with new credit type fields support
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const nameMatch = project.name && project.name.toLowerCase().includes(searchTermLower);
      const descriptionMatch = project.description && project.description.toLowerCase().includes(searchTermLower);
      const locationMatch = project.location && project.location.toLowerCase().includes(searchTermLower);
      const hostCountryMatch = project.host_country && project.host_country.toLowerCase().includes(searchTermLower);
      const creditTypeMatch = project.creditTypeName && project.creditTypeName.toLowerCase().includes(searchTermLower);
      const jurisdictionMatch = project.creditJurisdiction && project.creditJurisdiction.toLowerCase().includes(searchTermLower);
      
      if (!nameMatch && !descriptionMatch && !locationMatch && !hostCountryMatch && !creditTypeMatch && !jurisdictionMatch) {
        return false;
      }
    }
    
    return true;
  });
  
  // Extract all categories for filter dropdown
  const categories = [...new Set(
    projects.map(project => project.category).filter(Boolean)
  )];
  
  // Calculate Article 6 project count
  const article6ProjectCount = safeFilter(projects, p => p.isArticle6).length;
  
  // For quick testing - create a sample project
  const createSampleProject = async () => {
    try {
      const response = await api.post('/projects', {
        name: `Sample Project ${Math.floor(Math.random() * 1000)}`,
        description: 'This is a test project created for debugging.',
        category: 'Forestry',
        project_type: 'listing',
        location: 'Thailand', // Set to a country with bilateral agreements
        latitude: 15.8700,
        longitude: 100.9925,
        status: 'Draft',
        reduction_target: 5000,
        credit_price: 25.50,
        credit_price_currency: 'USD',
        credit_price_type: 'fixed',
        minimum_purchase: 100
      });
      
      const newProject = response.data;
      console.log('Created sample project:', newProject);
      
      // Refresh the project list
      initialLoadDone.current = false; // Reset to allow refetching
      fetchProjects();
      
    } catch (err) {
      console.error('Error creating sample project:', err);
      alert('Failed to create sample project: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Toggle between map and grid views with a delay
  const handleViewToggle = (value) => {
    console.log(`Toggling view to ${value ? 'map' : 'grid'}`);
    // Use timeout to avoid race conditions with rendering
    setTimeout(() => {
      setShowMap(value);
    }, 50);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // If authenticated but there's an error, show a more helpful error message
  if (isAuthenticated && error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Carbon Projects</h1>
              <p className="text-gray-600">
                Browse carbon reduction projects or create your own
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-300 text-amber-800 px-6 py-5 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-2">Error Loading Projects</h2>
            <p className="mb-4">{error}</p>
            <div className="flex gap-3">
              <button 
                onClick={handleRefresh}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                Log In Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show a login prompt
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Carbon Projects</h1>
              <p className="text-gray-600">
                Browse carbon reduction projects or create your own
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Authentication Required</h2>
            <p className="text-gray-500 mb-6">
              You need to be logged in to view and manage carbon projects.
            </p>
            
            {currentUser ? (
              <div className="mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800 text-sm">
                It looks like you're logged in as {currentUser.email}, but we're having trouble validating your session.
              </div>
            ) : null}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Log In
              </button>
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Refresh Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main content - authenticated and no errors
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Carbon Projects</h1>
            <p className="text-gray-600">
              Browse carbon reduction projects or create your own
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button 
              onClick={handleCreateProject}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Project
            </button>
          </div>
        </div>
        
        {/* Enhanced Filters with Credit Types and Pricing */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            
            {/* Project Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Credit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Type
              </label>
              <select
                value={filters.creditType}
                onChange={(e) => setFilters(prev => ({ ...prev, creditType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Credit Types</option>
                {creditTypes.map(type => (
                  <option key={type.credit_type_code} value={type.credit_type_code}>
                    {type.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Market */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Market
              </label>
              <select
                value={filters.targetMarket}
                onChange={(e) => setFilters(prev => ({ ...prev, targetMarket: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Markets</option>
                <optgroup label="Compliance Markets">
                  {targetMarkets.filter(m => m.market_type === 'compliance').map(market => (
                    <option key={market.market_code} value={market.market_code}>
                      {market.display_name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Voluntary Markets">
                  {targetMarkets.filter(m => m.market_type === 'voluntary').map(market => (
                    <option key={market.market_code} value={market.market_code}>
                      {market.display_name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Project Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Under Review">Under Review</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification
              </label>
              <select
                value={filters.verificationStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, verificationStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Verification</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Not Verified">Not Verified</option>
              </select>
            </div>

            {/* Compliance Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Market Type
              </label>
              <select
                value={filters.complianceType}
                onChange={(e) => setFilters(prev => ({ ...prev, complianceType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Types</option>
                <option value="compliance">Compliance Only</option>
                <option value="voluntary">Voluntary Only</option>
                <option value="both">Both Markets</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search projects..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Credit Price Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Credit Price Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Price Range (per tCO2e)
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={filters.creditPrice.min || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      creditPrice: { ...prev.creditPrice, min: e.target.value === '' ? null : Number(e.target.value) }
                    }))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <span className="text-gray-500 self-center">to</span>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={filters.creditPrice.max || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      creditPrice: { ...prev.creditPrice, max: e.target.value === '' ? null : Number(e.target.value) }
                    }))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Type
              </label>
              <select
                value={filters.creditPriceType}
                onChange={(e) => setFilters(prev => ({ ...prev, creditPriceType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Pricing Types</option>
                <option value="fixed">Fixed Price</option>
                <option value="negotiable">Negotiable</option>
                <option value="auction">Auction-based</option>
                <option value="request_quote">Request Quote</option>
              </select>
            </div>
          </div>

          {/* Range filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Emission Reductions Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Emission Reductions (tCO2e)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.reductionTarget.min || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    reductionTarget: { ...prev.reductionTarget, min: e.target.value === '' ? null : Number(e.target.value) }
                  }))}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.reductionTarget.max || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    reductionTarget: { ...prev.reductionTarget, max: e.target.value === '' ? null : Number(e.target.value) }
                  }))}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range ($)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.budget.min || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    budget: { ...prev.budget, min: e.target.value === '' ? null : Number(e.target.value) }
                  }))}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.budget.max || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    budget: { ...prev.budget, max: e.target.value === '' ? null : Number(e.target.value) }
                  }))}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-between items-center">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Reset All Filters
            </button>
            
            {/* Filter Summary */}
            <div className="text-sm text-gray-500">
              {Object.values(filters).some(v => 
                v !== 'all' && v !== '' && v !== null && v !== true &&
                !(typeof v === 'object' && Object.values(v).every(val => val === null))
              ) ? 'Filters applied' : 'No filters applied'}
            </div>
          </div>
        </div>
        
        {/* View toggle buttons */}
        <div className="flex justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex">
              <button
                onClick={() => handleViewToggle(false)}
                className={`px-4 py-2 rounded-l-md focus:outline-none ${
                  !showMap 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid View
              </button>
              <button
                onClick={() => handleViewToggle(true)}
                className={`px-4 py-2 rounded-r-md focus:outline-none ${
                  showMap 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
                Map View
              </button>
            </div>
            
            <button 
              onClick={() => setShowRealWorldSearch(!showRealWorldSearch)} 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {showRealWorldSearch ? 'Hide Article 6 Search' : 'Advanced Article 6 Search'}
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Include Paris Article 6.2 Projects</span>
              <button
                onClick={toggleArticle6Projects}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
                  filters.showArticle6 ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                    filters.showArticle6 ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 flex items-center">
            Showing {filteredProjects.length} of {projects.length} projects
            {filters.showArticle6 && article6ProjectCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                Including {article6ProjectCount} Paris Article 6.2 Projects
              </span>
            )}
            {/* Credit system status indicator */}
            {creditTypes.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                {creditTypes.length} Credit Types Available
              </span>
            )}
          </div>
        </div>
        
        {/* Advanced Article 6 Projects Search */}
        {showRealWorldSearch && (
          <div className="mb-6">
            <RealWorldProjectsSearch 
              projects={projects} 
              onFilterChange={handleRealWorldFilterChange} 
            />
          </div>
        )}
        
        {/* No projects message */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Projects Found</h2>
            <p className="text-gray-500 mb-4">
              {Object.values(filters).some(v => v !== 'all' && v !== '' && v !== null && v !== true && 
                !(typeof v === 'object' && Object.values(v).every(val => val === null)))
                ? 'No projects match your current filters. Try adjusting your search criteria.'
                : 'There are no projects available at this time.'}
            </p>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset Filters
              </button>
              <button 
                onClick={handleCreateProject}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Create Your First Project
              </button>
              <button 
                onClick={createSampleProject}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Create Sample Project
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Map view */}
            {showMap && (
              <div className="mb-6">
                {/* Using a key ensures the component is fully re-mounted when switching views */}
                <ProjectLocationMap 
                  key={`map-view-${Date.now()}`} 
                  projects={filteredProjects} 
                  activeMarketFilter={filters.complianceMarket !== 'all' ? filters.complianceMarket : null}
                  showArticle6={filters.showArticle6} // Pass Article 6 visibility state
                />
              </div>
            )}
            
            {/* Grid view */}
            {!showMap && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    isSaved={savedProjectIds.has(project.id)}
                    onSave={() => handleSaveProject(project.id)}
                    onRemove={() => handleRemoveSaved(project.id)}
                    isArticle6={project.isArticle6} // Pass Article 6 flag to show badge
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to get country locations for Article 6 projects
const getCountryLocation = (countryName) => {
  const locations = {
    'Ghana': [7.9465, -1.0232],
    'Peru': [-9.1900, -75.0152],
    'Senegal': [14.4974, -14.4524],
    'Thailand': [15.8700, 100.9925],
    'Vanuatu': [-15.3767, 166.9592],
    'Kenya': [0.0236, 37.9062],
    'Morocco': [31.7917, -7.0926],
    'Dominican Republic': [18.7357, -70.1627],
    'Georgia': [42.3154, 43.3569],
    'Costa Rica': [9.7489, -83.7534],
    'Rwanda': [-1.9403, 29.8739],
    'China': [35.8617, 104.1954],
    'Uzbekistan': [41.3775, 64.5853],
    'Indonesia': [-0.7893, 113.9213]
  };
  
  return locations[countryName] || null;
};

export default ProjectsListingPage;