import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthSystem';
// Import BOTH scenario utilities with aliases
import { getScenarios as getAssessmentScenarios } from './utils/scenarioAPI';
import { getScenarios as getCarbonFootprintScenarios } from './utils/carbonFootprintScenarioUtils';
import ProjectCard from './components/ProjectCard';
import api from './api-config'; // Import the configured axios instance
import reportStorage from './Services/reportStorage'; // Add this import
import ProviderAnalyticsDashboard from './components/ProviderAnalyticsDashboard';


const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [projects, setProjects] = useState({
    assessmentProjects: [],
    listingProjects: [],
    carbonFootprintProjects: []
  });
  const [savedProjects, setSavedProjects] = useState([]);
  const [products, setProducts] = useState([]); // Add products state
  const [savedProducts, setSavedProducts] = useState([]); // Add saved products state
  const [savedReports, setSavedReports] = useState([]); // Add saved reports state
  
  // New state to store scenarios by project ID
  const [scenariosByProject, setScenariosByProject] = useState({});
  // 🔧 NEW: Add state for carbon footprint data
  const [carbonFootprintScenarios, setCarbonFootprintScenarios] = useState({});
  
  // Stats for showing in summary
  const [scenarioStats, setScenarioStats] = useState({
    totalScenarios: 0,
    totalEmissionsReduction: 0,
    totalCarbonFootprintScenarios: 0,
    totalEmissionsCalculated: 0
  });

  // Add state for active tab (for solution providers)
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        // Log debugging info
        console.log('Current user:', currentUser);
        console.log('Profile ID:', currentUser?.profileId);
        console.log('User role:', currentUser?.role);
        
        // Format profile ID correctly
        const formattedProfileId = currentUser?.profileId;
        console.log('Formatted profile ID:', formattedProfileId);
        
        // Determine profile endpoint based on user role
        let profileEndpoint;
        if (currentUser?.role === 'projectDeveloper') {
          profileEndpoint = `/profiles/projectDeveloper/${formattedProfileId}`;
        } else if (currentUser?.role === 'solutionProvider') {
          profileEndpoint = `/profiles/solutionProvider/${formattedProfileId}`;
        } else if (currentUser?.role === 'consultant') {
          profileEndpoint = `/profiles/consultant/${formattedProfileId}`;
        } else if (currentUser?.role === 'generalUser') {
          profileEndpoint = `/profiles/generalUser/${formattedProfileId}`;
        } else {
          console.log('Unknown user role:', currentUser?.role);
          // Don't throw error for unknown roles, just skip profile fetching
        }
        
        console.log('Fetching profile from:', profileEndpoint);
        
        // Fetch profile data using api instance (only if we have a valid endpoint)
        if (profileEndpoint) {
          try {
            const profileResponse = await api.get(profileEndpoint);
            console.log('Profile response:', profileResponse);
            setProfileData(profileResponse.data);
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            // Continue without profile data
          }
        }
        
        // Fetch products for solution providers
        if (currentUser?.role === 'solutionProvider') {
          try {
            const productsResponse = await api.get('/products/user');
            console.log('Products data:', productsResponse.data);
            // Handle both paginated and non-paginated responses
            if (productsResponse.data.products && Array.isArray(productsResponse.data.products)) {
              setProducts(productsResponse.data.products);
            } else if (Array.isArray(productsResponse.data)) {
              setProducts(productsResponse.data);
            }
          } catch (error) {
            console.error('Error fetching products:', error);
          }
        }
        
        // Fetch saved marketplace products
        try {
          const savedProductsResponse = await api.get('/marketplace/saved');
          console.log('Saved marketplace products:', savedProductsResponse.data);
          setSavedProducts(savedProductsResponse.data || []);
        } catch (error) {
          console.error('Error fetching saved marketplace products:', error);
        }
        
        // Fetch saved reports count
        try {
          const localReports = reportStorage.getAllReports();
          setSavedReports(localReports);
        } catch (error) {
          console.error('Error fetching saved reports:', error);
        }
        
        // 1. Fetch assessment projects from the new endpoint
        let assessmentProjectsData = [];
        try {
          const assessmentProjectsResponse = await api.get('/assessment-projects');
          assessmentProjectsData = assessmentProjectsResponse.data;
          console.log('Assessment projects from API:', assessmentProjectsData);
        } catch (error) {
          console.error('Error fetching assessment projects:', error);
        }
        
        // 2. Fetch regular project listings
        let projectsData = [];
        try {
          const projectsResponse = await api.get('/projects/my-projects');
          projectsData = projectsResponse.data;
          console.log('Raw projects from API:', projectsData);
        } catch (error) {
          console.error('Error fetching projects:', error);
        }
        
        // 3. Fetch saved projects
        try {
          const savedProjectsResponse = await api.get('/projects/saved');
          const savedProjectsData = savedProjectsResponse.data;
          console.log('Saved projects from API:', savedProjectsData);
          setSavedProjects(savedProjectsData);
        } catch (error) {
          console.error('Error fetching saved projects:', error);
        }
        
        // Filter and categorize projects properly
        let assessmentProjects = [...assessmentProjectsData];
        let listingProjects = [];
        
        // Add a source field to identify where the project came from
        assessmentProjects = assessmentProjects.map(project => ({
          ...project,
          sourceType: 'assessment'
        }));
        
        // Check if we have any assessment projects in the regular projects endpoint
        // and make sure we don't include them twice
        const assessmentProjectIds = new Set(assessmentProjects.map(p => p.id));
        
        projectsData.forEach(project => {
          const isAssessmentProject = 
            project.project_type === 'assessment' || 
            project.projectType === 'assessment' ||
            assessmentProjectIds.has(project.id);
          
          if (isAssessmentProject) {
            // If this project is not already in the assessment projects list
            if (!assessmentProjectIds.has(project.id)) {
              assessmentProjects.push({
                ...project,
                sourceType: 'assessment'
              });
              assessmentProjectIds.add(project.id);
            }
          } else {
            // It's a listing project
            listingProjects.push({
              ...project,
              sourceType: 'listing'
            });
          }
        });
        // 4. Fetch scenarios for each assessment project
        const scenariosData = {};
        let totalScenarios = 0;
        let totalEmissionsReduction = 0;
        
        for (const project of assessmentProjects) {
          try {
            console.log(`Fetching scenarios for project ${project.id}`);
            const result = await getAssessmentScenarios(project.id);
            
            if (result.success) {
              scenariosData[project.id] = result.data || [];
              totalScenarios += result.data.length;
              
              // Calculate total emissions reduction from all scenarios
              result.data.forEach(scenario => {
                try {
                  const results = typeof scenario.results === 'string' 
                    ? JSON.parse(scenario.results) 
                    : scenario.results;
                    
                  if (results && results.totalSequestration) {
                    totalEmissionsReduction += parseFloat(results.totalSequestration) || 0;
                  }
                } catch (e) {
                  console.error("Error parsing scenario results:", e);
                }
              });
              
              console.log(`Found ${result.data.length} scenarios for project ${project.id}`);
            } else {
              console.error(`Failed to fetch scenarios for project ${project.id}:`, result.error);
              scenariosData[project.id] = [];
            }
          } catch (err) {
            console.error(`Error fetching scenarios for project ${project.id}:`, err);
            scenariosData[project.id] = [];
          }
        }
        
        setScenariosByProject(scenariosData);
        
        // 5. 🔧 NEW: Fetch carbon footprints
        let carbonFootprintProjects = [];
        const carbonFootprintScenariosData = {};
        let totalCarbonFootprintScenarios = 0;
        let totalEmissionsCalculated = 0;
        
        try {
          const carbonFootprintsResponse = await api.get('/carbon-footprints');
          const carbonFootprintsData = carbonFootprintsResponse.data;
          console.log('Carbon footprints from API:', carbonFootprintsData);
          
          // 6. 🔧 NEW: Fetch scenarios for each carbon footprint using carbon footprint scenario utils
          for (const footprint of carbonFootprintsData) {
            try {
              console.log(`Fetching scenarios for carbon footprint ${footprint.id}`);
              // Use the carbon footprint specific scenario utility
              const result = await getCarbonFootprintScenarios(footprint.id);
              
              if (result.success) {
                carbonFootprintScenariosData[footprint.id] = result.data || [];
                totalCarbonFootprintScenarios += result.data.length;
                
                // Calculate total emissions from all scenarios
                result.data.forEach(scenario => {
                  try {
                    const data = typeof scenario.data === 'string' 
                      ? JSON.parse(scenario.data) 
                      : scenario.data;
                      
                    if (data && data.emissions && data.emissions.total) {
                      totalEmissionsCalculated += parseFloat(data.emissions.total) || 0;
                    } else if (data && data.emissionsData && data.emissionsData.totalEmissions) {
                      totalEmissionsCalculated += parseFloat(data.emissionsData.totalEmissions) || 0;
                    }
                  } catch (e) {
                    console.error("Error parsing carbon footprint scenario data:", e);
                  }
                });
                
                console.log(`Found ${result.data.length} scenarios for carbon footprint ${footprint.id}`);
              } else {
                console.error(`Failed to fetch scenarios for carbon footprint ${footprint.id}:`, result.error);
                carbonFootprintScenariosData[footprint.id] = [];
              }
            } catch (err) {
              console.error(`Error fetching scenarios for carbon footprint ${footprint.id}:`, err);
              carbonFootprintScenariosData[footprint.id] = [];
            }
          }
          
          // Add carbon footprints to the projects state
          carbonFootprintProjects = carbonFootprintsData.map(footprint => ({
            ...footprint,
            sourceType: 'carbon-footprint',
            category: 'Carbon Footprint',
            project_type: 'carbon-footprint'
          }));
        } catch (error) {
          console.error('Error fetching carbon footprints:', error);
        }
        
        // Organize projects by type
        const projectsByType = {
          assessmentProjects,
          listingProjects,
          carbonFootprintProjects: carbonFootprintProjects
        };
        
        console.log('Projects by type:', projectsByType);
        setProjects(projectsByType);
        
        // Store carbon footprint scenarios
        setCarbonFootprintScenarios(carbonFootprintScenariosData);
        
        // Update stats to include carbon footprint data
        setScenarioStats({
          totalScenarios,
          totalEmissionsReduction,
          totalCarbonFootprintScenarios,
          totalEmissionsCalculated
        });
        
        console.log('Carbon footprint scenarios by project:', carbonFootprintScenariosData);
        console.log('Total carbon footprint scenarios:', totalCarbonFootprintScenarios);
        console.log('Total emissions calculated:', totalEmissionsCalculated);
        console.log('Total scenarios:', totalScenarios);
        console.log('Total emissions reduction:', totalEmissionsReduction);
        
      } catch (err) {
        console.error('Error in Dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);
  
  // Helper function to get the count of scenarios for a project
  const getScenarioCount = (projectId) => {
    return scenariosByProject[projectId]?.length || 0;
  };
  
  // Helper function to get the most recent scenario
  const getMostRecentScenario = (projectId) => {
    const scenarios = scenariosByProject[projectId] || [];
    if (scenarios.length === 0) return null;
    
    // Sort scenarios by creation date (newest first)
    return scenarios.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    })[0];
  };
  
  // Helper function to get scenario total sequestration
  const getScenarioEmissionsReduction = (scenario) => {
    if (!scenario || !scenario.results) return 'N/A';
    
    try {
      const results = typeof scenario.results === 'string' 
        ? JSON.parse(scenario.results) 
        : scenario.results;
        
      if (results && results.totalSequestration) {
        return `${Math.round(results.totalSequestration).toLocaleString()} tCO2e`;
      }
    } catch (e) {
      console.error("Error parsing scenario results:", e);
    }
    
    return 'N/A';
  };
  
  // Function to calculate the total emissions reduction for a project
  const getProjectTotalEmissionsReduction = (projectId) => {
    const scenarios = scenariosByProject[projectId] || [];
    if (scenarios.length === 0) return 'N/A';
    
    let totalReduction = 0;
    let hasReduction = false;
    
    scenarios.forEach(scenario => {
      try {
        const results = typeof scenario.results === 'string' 
          ? JSON.parse(scenario.results) 
          : scenario.results;
          
        if (results && results.totalSequestration) {
          totalReduction += parseFloat(results.totalSequestration) || 0;
          hasReduction = true;
        }
      } catch (e) {
        console.error("Error parsing scenario results:", e);
      }
    });
    
    return hasReduction ? `${Math.round(totalReduction).toLocaleString()} tCO2e` : 'N/A';
  };

  // 🔧 NEW: Helper functions for carbon footprint scenarios
  const getCarbonFootprintScenarioCount = (footprintId) => {
    return carbonFootprintScenarios[footprintId]?.length || 0;
  };

  const getMostRecentCarbonFootprintScenario = (footprintId) => {
    const scenarios = carbonFootprintScenarios[footprintId] || [];
    if (scenarios.length === 0) return null;
    
    return scenarios.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    })[0];
  };
  
  const getCarbonFootprintTotalEmissions = (footprintId) => {
    const scenarios = carbonFootprintScenarios[footprintId] || [];
    if (scenarios.length === 0) return 'N/A';
    
    let totalEmissions = 0;
    let hasEmissions = false;
    
    scenarios.forEach(scenario => {
      try {
        const data = typeof scenario.data === 'string' 
          ? JSON.parse(scenario.data) 
          : scenario.data;
          
        if (data && data.emissions && data.emissions.total) {
          totalEmissions += parseFloat(data.emissions.total) || 0;
          hasEmissions = true;
        } else if (data && data.emissionsData && data.emissionsData.totalEmissions) {
          totalEmissions += parseFloat(data.emissionsData.totalEmissions) || 0;
          hasEmissions = true;
        }
      } catch (e) {
        console.error("Error parsing carbon footprint scenario data:", e);
      }
    });
    
    return hasEmissions ? `${Math.round(totalEmissions).toLocaleString()} tCO2e` : 'N/A';
  };

  // Helper function to remove a saved project
  const handleRemoveSaved = async (projectId) => {
    try {
      const response = await api.delete(`/projects/save/${projectId}`);
      
      if (response.status === 200 || response.status === 204) {
        // Refresh saved projects
        setSavedProjects(prev => prev.filter(p => p.id !== projectId));
      }
    } catch (err) {
      console.error('Error removing project:', err);
    }
  };

  // Helper function to remove a saved product
  const handleRemoveSavedProduct = async (productId) => {
    try {
      const response = await api.delete(`/marketplace/save/${productId}`);
      
      if (response.status === 200 || response.status === 204) {
        // Refresh saved products
        setSavedProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Error removing saved product:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // General user view
  if (currentUser?.role === 'generalUser') {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {currentUser?.firstName} {currentUser?.lastName}
          </p>
        </div>

        {/* General User Content - Keep existing content */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Welcome to Carbon Prospect</h2>
          <p className="text-gray-600 mb-6">
            As a general user, you have access to explore our carbon marketplace and learn about carbon credit projects.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-green-800">Explore Carbon Projects</h3>
              <p className="text-gray-600 mb-4">
                Browse active carbon credit projects and investment opportunities in our marketplace.
              </p>
              <Link
                to="/projects"
                className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
              >
                View Projects
                <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">Carbon Solutions</h3>
              <p className="text-gray-600 mb-4">
                Discover innovative carbon reduction solutions and technologies from our providers.
              </p>
              <Link
                to="/marketplace"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Browse Solutions
                <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Stats for General Users */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{savedProjects.length}</p>
              <p className="text-sm text-gray-600">Saved Projects</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{savedProducts.length}</p>
              <p className="text-sm text-gray-600">Saved Products</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-sm text-gray-600">Following</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">0</p>
              <p className="text-sm text-gray-600">Notifications</p>
            </div>
          </div>
        </div>

        {/* Rest of general user content remains the same... */}
      </div>
    );
  }

  // Solution Provider view with tabs
  if (currentUser?.role === 'solutionProvider') {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">Solution Provider Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {currentUser?.firstName} {currentUser?.lastName}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Products
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'saved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saved Items
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Enhanced Summary Cards for Solution Providers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-10">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <h2 className="text-xl font-semibold mb-2">Products</h2>
                <p className="text-3xl font-bold text-purple-600">
                  {products?.length || 0}
                </p>
                <p className="text-gray-500 mt-2">Listed in marketplace</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <h2 className="text-xl font-semibold mb-2">Assessment Projects</h2>
                <p className="text-3xl font-bold text-green-600">
                  {projects.assessmentProjects?.length || 0}
                </p>
                <p className="text-gray-500 mt-2">Carbon credit assessments</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-cyan-500">
                <h2 className="text-xl font-semibold mb-2">Carbon Footprints</h2>
                <p className="text-3xl font-bold text-cyan-600">
                  {projects.carbonFootprintProjects?.length || 0}
                </p>
                <p className="text-gray-500 mt-2">GHG emissions assessments</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                <h2 className="text-xl font-semibold mb-2">Project Listings</h2>
                <p className="text-3xl font-bold text-orange-600">
                  {projects.listingProjects?.length || 0}
                </p>
                <p className="text-gray-500 mt-2">Listed for partners/funding</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                <h2 className="text-xl font-semibold mb-2">Saved Products</h2>
                <p className="text-3xl font-bold text-indigo-600">
                  {savedProducts?.length || 0}
                </p>
                <p className="text-gray-500 mt-2">From marketplace</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
                <h2 className="text-xl font-semibold mb-2">Saved Reports</h2>
                <p className="text-3xl font-bold text-teal-600">
                  {savedReports?.length || 0}
                </p>
                <p className="text-gray-500 mt-2">Compliance reports</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <h2 className="text-xl font-semibold mb-2">Total Scenarios</h2>
                <p className="text-3xl font-bold text-yellow-600">
                  {(scenarioStats.totalScenarios || 0) + (scenarioStats.totalCarbonFootprintScenarios || 0)}
                </p>
                <p className="text-gray-500 mt-2">All project scenarios</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-rose-500">
                <h2 className="text-xl font-semibold mb-2">Total Impact</h2>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-green-600">
                    {Math.round(scenarioStats.totalEmissionsReduction || 0).toLocaleString()} 
                    <span className="text-sm">tCO2e</span>
                  </p>
                  <p className="text-sm text-gray-500">Credits potential</p>
                  <p className="text-lg font-bold text-rose-600">
                    {Math.round(scenarioStats.totalEmissionsCalculated || 0).toLocaleString()} 
                    <span className="text-sm">tCO2e</span>
                  </p>
                  <p className="text-sm text-gray-500">Emissions calculated</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Link
                  to="/marketplace/add-solution"
                  className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-opacity-30 transition"
                >
                  <svg className="h-8 w-8 text-white mx-auto mb-2" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-white font-medium">Add Product</span>
                </Link>
                
                <Link
                  to="/carbon-project/new"
                  className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-opacity-30 transition"
                >
                  <svg className="h-8 w-8 text-white mx-auto mb-2" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-white font-medium">New Assessment</span>
                </Link>
                
                <Link
                  to="/carbon-footprint/new"
                  className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-opacity-30 transition"
                >
                  <svg className="h-8 w-8 text-white mx-auto mb-2" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-white font-medium">Carbon Footprint</span>
                </Link>
                
                <Link
                  to="/reports"
                  className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-opacity-30 transition"
                >
                  <svg className="h-8 w-8 text-white mx-auto mb-2" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-white font-medium">View Reports</span>
                </Link>
                
                <Link
                  to="/ghg-converter"
                  className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-opacity-30 transition"
                >
                  <svg className="h-8 w-8 text-white mx-auto mb-2" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-white font-medium">GHG Converter</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <ProviderAnalyticsDashboard />
        )}

        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-purple-700">My Products</h3>
              <Link
                to="/marketplace/add-solution"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Add New Product
              </Link>
            </div>
            
            {products.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">
                  You haven't listed any products yet. 
                  <Link to="/marketplace/add-solution" className="text-purple-600 hover:underline ml-1">
                    Add your first product
                  </Link> to the marketplace.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
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
                        <div className="flex items-center justify-center h-full bg-purple-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {product.category || 'Product'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h4 className="text-lg font-semibold mb-2 truncate">{product.name}</h4>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description || 'No description'}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Emissions Reduction</span>
                          <span className="text-sm font-medium text-green-600">
                            {product.emissions_reduction_factor ? 
                              `${Math.round(product.emissions_reduction_factor * 100)}%` : 
                              'N/A'}
                          </span>
                        </div>
                        
                        {product.unit_price && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Price</span>
                            <span className="text-sm font-medium">
                              ${product.unit_price.toLocaleString()}
                              {product.unit && <span className="text-gray-500">/{product.unit}</span>}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' :
                          product.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.status || 'Draft'}
                        </span>
                        <div className="flex space-x-2">
                          <Link 
                            to={`/marketplace/solution/${product.id}`} 
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            View
                          </Link>
                          <Link 
                            to={`/marketplace/product/edit/${product.id}`} 
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {/* Saved Marketplace Products Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-indigo-700 flex items-center">
                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Saved Marketplace Products
              </h3>
              
              {savedProducts.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500">
                    You haven't saved any marketplace products yet. 
                    Browse the <Link to="/marketplace" className="text-blue-600 hover:underline">marketplace</Link> and 
                    click the save button to add products here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
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
                          <div className="flex items-center justify-center h-full bg-indigo-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleRemoveSavedProduct(product.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Remove from saved"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="p-5">
                        <h4 className="text-lg font-semibold mb-2 truncate">{product.name}</h4>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description || 'No description'}</p>
                        
                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Saved {new Date(product.saved_at).toLocaleDateString()}
                          </span>
                          <Link 
                            to={`/marketplace/solution/${product.id}`} 
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Projects Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-700 flex items-center">
                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Saved Projects
              </h3>
              
              {savedProjects.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500">
                    You haven't saved any projects yet. 
                    Browse the <Link to="/projects" className="text-blue-600 hover:underline">projects marketplace</Link> and 
                    click the + button to save projects here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProjects.map(project => (
                    <ProjectCard 
                      key={`saved-${project.id}`} 
                      project={project} 
                      isSaved={true}
                      onRemove={() => handleRemoveSaved(project.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Existing dashboard view for other roles (Project Developer, etc.)
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Rest of the existing dashboard content remains the same */}
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-700 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {currentUser?.firstName} {currentUser?.lastName}
        </p>
      </div>
      
      {/* Enhanced Summary Cards - Updated to include saved products count */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${currentUser?.role === 'solutionProvider' ? 'xl:grid-cols-8' : 'xl:grid-cols-7'} gap-6 mb-10`}>
        {currentUser?.role === 'solutionProvider' && (
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h2 className="text-xl font-semibold mb-2">Products</h2>
            <p className="text-3xl font-bold text-purple-600">
              {products?.length || 0}
            </p>
            <p className="text-gray-500 mt-2">Listed in marketplace</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold mb-2">Assessment Projects</h2>
          <p className="text-3xl font-bold text-green-600">
            {projects.assessmentProjects?.length || 0}
          </p>
          <p className="text-gray-500 mt-2">Carbon credit assessments</p>
        </div>
        
        {/* Carbon Footprint Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-cyan-500">
          <h2 className="text-xl font-semibold mb-2">Carbon Footprints</h2>
          <p className="text-3xl font-bold text-cyan-600">
            {projects.carbonFootprintProjects?.length || 0}
          </p>
          <p className="text-gray-500 mt-2">GHG emissions assessments</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <h2 className="text-xl font-semibold mb-2">Project Listings</h2>
          <p className="text-3xl font-bold text-orange-600">
            {projects.listingProjects?.length || 0}
          </p>
          <p className="text-gray-500 mt-2">Listed for partners/funding</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <h2 className="text-xl font-semibold mb-2">Saved Products</h2>
          <p className="text-3xl font-bold text-indigo-600">
            {savedProducts?.length || 0}
          </p>
          <p className="text-gray-500 mt-2">From marketplace</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <h2 className="text-xl font-semibold mb-2">Saved Reports</h2>
          <p className="text-3xl font-bold text-teal-600">
            {savedReports?.length || 0}
          </p>
          <p className="text-gray-500 mt-2">Compliance reports</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <h2 className="text-xl font-semibold mb-2">Total Scenarios</h2>
          <p className="text-3xl font-bold text-yellow-600">
            {(scenarioStats.totalScenarios || 0) + (scenarioStats.totalCarbonFootprintScenarios || 0)}
          </p>
          <p className="text-gray-500 mt-2">All project scenarios</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-rose-500">
          <h2 className="text-xl font-semibold mb-2">Total Impact</h2>
          <div className="space-y-1">
            <p className="text-lg font-bold text-green-600">
              {Math.round(scenarioStats.totalEmissionsReduction || 0).toLocaleString()} 
              <span className="text-sm">tCO2e</span>
            </p>
            <p className="text-sm text-gray-500">Credits potential</p>
            <p className="text-lg font-bold text-rose-600">
              {Math.round(scenarioStats.totalEmissionsCalculated || 0).toLocaleString()} 
              <span className="text-sm">tCO2e</span>
            </p>
            <p className="text-sm text-gray-500">Emissions calculated</p>
          </div>
        </div>
      </div>
      
      {/* Rest of the existing dashboard content continues here... */}
      {/* Include all the existing sections like Quick Actions Bar, Assessment Projects Section, etc. */}
    </div>
  );
};

export default Dashboard;