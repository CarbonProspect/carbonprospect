import React, { useState, useEffect } from 'react';

// Sample data - in production, this would come from an API
const SAMPLE_TECHNOLOGIES = [
  {
    id: 1,
    name: "GreenSteel™",
    company: "CleanMetals Inc.",
    category: "Green Materials",
    projectTypes: ["construction"],
    emissionsReduction: "75% less CO2 compared to conventional steel",
    emissionsReductionFactor: 0.75,
    price: "Premium of 12% over conventional steel",
    description: "Hydrogen-based direct reduction iron process combined with electric arc furnace technology for ultra-low carbon steel production.",
    contactEmail: "sales@cleanmetals.com",
    verified: true,
    certifications: ["ISO 14001", "Environmental Product Declaration"],
    image: "https://via.placeholder.com/400x250?text=GreenSteel",
    featured: true,
    location: "Europe, North America",
    integrationKey: "steel_green",
    integrationDetails: {
      construction: {
        materialId: "steel_green"
      }
    }
  },
  {
    id: 2,
    name: "FeedX Methane Reducer",
    company: "AgriTech Solutions",
    category: "Livestock Feed Additives",
    projectTypes: ["livestock"],
    emissionsReduction: "Up to 30% enteric methane reduction",
    emissionsReductionFactor: 0.3,
    price: "$5 per head monthly",
    description: "A specialized feed additive that inhibits methane production in ruminant digestive systems without affecting animal health or performance.",
    contactEmail: "info@agritechsolutions.com",
    verified: true,
    certifications: ["FDA Approved", "Carbon Trust Verified"],
    image: "https://via.placeholder.com/400x250?text=FeedX+Additive",
    featured: true,
    location: "Global",
    integrationKey: "feed_additive_premium",
    integrationDetails: {
      livestock: {
        additiveType: "premium",
        reductionFactor: 0.3
      }
    }
  },
  {
    id: 3,
    name: "CarbonCap™ Cement",
    company: "GreenBuild Materials",
    category: "Construction Materials",
    projectTypes: ["construction"],
    emissionsReduction: "60% less CO2 than traditional Portland cement",
    emissionsReductionFactor: 0.6,
    price: "Comparable to premium cement",
    description: "Innovative low-carbon cement alternative that uses industrial byproducts and novel binding agents to dramatically reduce embodied carbon.",
    contactEmail: "sales@greenbuild.com",
    verified: true,
    certifications: ["ASTM Compliant", "Cradle to Cradle Certified"],
    image: "https://via.placeholder.com/400x250?text=LowCarbon+Cement",
    featured: true,
    location: "North America, Asia",
    integrationKey: "concrete_ultralowcarbon",
    integrationDetails: {
      construction: {
        materialId: "concrete_ultralowcarbon"
      }
    }
  },
  {
    id: 4,
    name: "EcoPlastic Resin",
    company: "BioCycle Materials",
    category: "Bioplastics",
    projectTypes: ["construction", "packaging"],
    emissionsReduction: "Carbon-negative materials, -2.5kg CO2e per kg",
    emissionsReductionFactor: 1.0,
    price: "15-20% premium over conventional plastics",
    description: "Fully biodegradable plastic alternatives made from agricultural waste streams that sequester more carbon in production than they emit.",
    contactEmail: "partnerships@biocycle.com",
    verified: false,
    certifications: ["Biodegradable Products Institute", "Pending EPA Certification"],
    image: "https://via.placeholder.com/400x250?text=EcoPlastic",
    featured: false,
    location: "North America, Europe",
    integrationKey: "bioplastic_eco",
    integrationDetails: {
      construction: {
        materialAttribute: "recycledContent",
        factor: 0.9
      }
    }
  },
  {
    id: 5,
    name: "SoilCarbon Pro",
    company: "AgriSoil Technologies",
    category: "Soil Carbon Enhancement",
    projectTypes: ["agriculture", "soil"],
    emissionsReduction: "Increases carbon sequestration by 35% in agricultural soils",
    emissionsReductionFactor: 0.35,
    price: "$80 per hectare annually",
    description: "Advanced biochar and microbial formulation that enhances soil carbon sequestration while improving soil health and crop yields.",
    contactEmail: "info@agrisoil.com",
    verified: true,
    certifications: ["Organic Materials Review Institute", "Carbon Registry Approved"],
    image: "https://via.placeholder.com/400x250?text=SoilCarbon+Pro",
    featured: true,
    location: "Global",
    integrationKey: "soil_enhancer_premium",
    integrationDetails: {
      soil: {
        enhancerType: "biochar_blend",
        sequestrationBoost: 0.35
      }
    }
  },
  {
    id: 6,
    name: "SolarTrack Pro",
    company: "RenewTrack Systems",
    category: "Renewable Energy",
    projectTypes: ["renewable", "solar"],
    emissionsReduction: "Increases solar panel efficiency by 22%",
    emissionsReductionFactor: 0.22,
    price: "$0.08 per watt additional cost",
    description: "Dual-axis solar tracking system with AI-powered optimization that significantly increases energy production from solar installations.",
    contactEmail: "sales@renewtrack.com",
    verified: true,
    certifications: ["UL Certified", "IEC 61215 Compliant"],
    image: "https://via.placeholder.com/400x250?text=SolarTrack+Pro",
    featured: true,
    location: "Global",
    integrationKey: "solar_tracking_advanced",
    integrationDetails: {
      renewable: {
        capacityBoost: 0.22,
        solarOptimization: true
      }
    }
  }
];

// Sample carbon projects data - for demo purposes
const SAMPLE_PROJECTS = [
  {
    id: 1,
    name: "Amazon Rainforest Conservation",
    type: "REDD+",
    location: "Brazil",
    size: "100,000 hectares",
    developer: "Green Earth Initiative",
    creditVolume: 500000,
    creditPrice: 25,
    description: "Protecting vital rainforest from deforestation, supporting indigenous communities and preserving biodiversity hotspots.",
    contactEmail: "projects@greenearth.org",
    verified: true,
    verificationStandard: "Verra VCS",
    image: "https://via.placeholder.com/400x250?text=Amazon+Forest+Project",
    featured: true
  },
  {
    id: 2,
    name: "Sustainable Grasslands Project",
    type: "Livestock Methane Reduction",
    location: "Montana, USA",
    size: "25,000 cattle",
    developer: "Sustainable Ranching Co",
    creditVolume: 120000,
    creditPrice: 18,
    description: "Implementing feed additives and improved grazing management to reduce enteric methane emissions from cattle operations.",
    contactEmail: "info@sustainableranching.com",
    verified: true,
    verificationStandard: "Gold Standard",
    image: "https://via.placeholder.com/400x250?text=Grasslands+Project",
    featured: true
  },
  {
    id: 3,
    name: "Solar Farms for Communities",
    type: "Renewable Energy",
    location: "Kenya",
    size: "50 MW",
    developer: "SunPower Africa",
    creditVolume: 75000,
    creditPrice: 15,
    description: "Building solar installations to replace diesel generators in rural communities, providing clean energy access.",
    contactEmail: "projects@sunpowerafrica.org",
    verified: false,
    verificationStandard: "Pending Gold Standard",
    image: "https://via.placeholder.com/400x250?text=Solar+Project",
    featured: false
  },
  {
    id: 4,
    name: "Mangrove Restoration Initiative",
    type: "Blue Carbon",
    location: "Indonesia",
    size: "5,000 hectares",
    developer: "Blue Ocean Trust",
    creditVolume: 200000,
    creditPrice: 30,
    description: "Restoring degraded mangrove ecosystems to sequester carbon and protect coastal communities from storms and sea-level rise.",
    contactEmail: "restoration@blueocean.org",
    verified: true,
    verificationStandard: "Plan Vivo",
    image: "https://via.placeholder.com/400x250?text=Mangrove+Project",
    featured: true
  }
];

// Available regions for filtering
const AVAILABLE_REGIONS = [
  "Global",
  "North America",
  "Europe",
  "Asia",
  "South America",
  "Africa",
  "Australia & Oceania"
];

// Available project types for filtering
const PROJECT_TYPES = [
  { id: "construction", name: "Construction" },
  { id: "livestock", name: "Livestock" },
  { id: "renewable", name: "Renewable Energy" },
  { id: "forestry", name: "Forestry" },
  { id: "soil", name: "Soil Carbon" },
  { id: "bluecarbon", name: "Blue Carbon" },
  { id: "redd", name: "REDD+" },
  { id: "packaging", name: "Packaging" },
  { id: "agriculture", name: "Agriculture" }
];

function CarbonSolutionsMarketplace({ onProductSelectionChange, selectedProducts = {}, currentProjectType = '' }) {
  // State variables
  const [activeTab, setActiveTab] = useState('technologies');
  const [technologies, setTechnologies] = useState(SAMPLE_TECHNOLOGIES);
  const [projects, setProjects] = useState(SAMPLE_PROJECTS);
  const [filteredTechnologies, setFilteredTechnologies] = useState(SAMPLE_TECHNOLOGIES);
  const [filteredProjects, setFilteredProjects] = useState(SAMPLE_PROJECTS);
  
  // Filter states
  const [technologyFilters, setTechnologyFilters] = useState({
    category: 'all',
    region: 'all',
    projectType: currentProjectType || 'all',
    verified: 'all',
    featured: false
  });
  
  const [projectFilters, setProjectFilters] = useState({
    type: 'all',
    region: 'all',
    verified: 'all',
    featured: false
  });
  
  const [showTechnologyForm, setShowTechnologyForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Effect to filter technologies when filters change
  useEffect(() => {
    let filtered = [...technologies];
    
    if (technologyFilters.category !== 'all') {
      filtered = filtered.filter(tech => tech.category.includes(technologyFilters.category));
    }
    
    if (technologyFilters.region !== 'all') {
      filtered = filtered.filter(tech => tech.location && tech.location.includes(technologyFilters.region));
    }
    
    if (technologyFilters.projectType !== 'all') {
      filtered = filtered.filter(tech => 
        tech.projectTypes && tech.projectTypes.includes(technologyFilters.projectType)
      );
    }
    
    if (technologyFilters.verified !== 'all') {
      const isVerified = technologyFilters.verified === 'verified';
      filtered = filtered.filter(tech => tech.verified === isVerified);
    }
    
    if (technologyFilters.featured) {
      filtered = filtered.filter(tech => tech.featured);
    }
    
    setFilteredTechnologies(filtered);
  }, [technologies, technologyFilters]);
  
  // Effect to filter projects when filters change
  useEffect(() => {
    let filtered = [...projects];
    
    if (projectFilters.type !== 'all') {
      filtered = filtered.filter(project => project.type.includes(projectFilters.type));
    }
    
    if (projectFilters.region !== 'all') {
      filtered = filtered.filter(project => project.location.includes(projectFilters.region));
    }
    
    if (projectFilters.verified !== 'all') {
      const isVerified = projectFilters.verified === 'verified';
      filtered = filtered.filter(project => project.verified === isVerified);
    }
    
    if (projectFilters.featured) {
      filtered = filtered.filter(project => project.featured);
    }
    
    setFilteredProjects(filtered);
  }, [projects, projectFilters]);

  // Init with project type from prop
  useEffect(() => {
    if (currentProjectType) {
      setTechnologyFilters(prev => ({
        ...prev,
        projectType: currentProjectType
      }));
    }
  }, [currentProjectType]);
  
  // Function to handle technology filter changes
  const handleTechnologyFilterChange = (filterType, value) => {
    setTechnologyFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Function to handle project filter changes
  const handleProjectFilterChange = (filterType, value) => {
    setProjectFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Function to handle adding a technology to the project
  const handleIntegrateTechnology = (tech) => {
    if (onProductSelectionChange) {
      const updatedProducts = {
        ...selectedProducts,
        [tech.id]: tech
      };
      onProductSelectionChange(updatedProducts);
      
      // Show confirmation
      alert(`Technology "${tech.name}" has been integrated into your project. It will apply its emissions reduction factors automatically.`);
    } else {
      alert(`Integration functionality is not available in standalone mode. Please access this page from your project calculator.`);
    }
  };

  // Function to handle removing a technology from the project
  const handleRemoveTechnology = (techId) => {
    if (onProductSelectionChange) {
      const updatedProducts = { ...selectedProducts };
      delete updatedProducts[techId];
      onProductSelectionChange(updatedProducts);
      
      // Show confirmation
      alert(`Technology has been removed from your project.`);
    }
  };

  // Check if a technology is already selected
  const isTechnologySelected = (techId) => {
    return selectedProducts && Object.keys(selectedProducts).includes(techId.toString());
  };

  // Render integration button based on selection state
  const renderIntegrationButton = (tech) => {
    const isSelected = isTechnologySelected(tech.id);
    
    if (isSelected) {
      return (
        <button
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          onClick={() => handleRemoveTechnology(tech.id)}
        >
          Remove from Project
        </button>
      );
    } else {
      return (
        <button
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          onClick={() => handleIntegrateTechnology(tech)}
        >
          Add to Project
        </button>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <span className="bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
                Carbon Solutions Marketplace
              </span>
            </h1>
            <p className="mt-2 text-gray-600">
              Discover verified carbon projects and innovative low-carbon technologies to integrate with your projects
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => activeTab === 'technologies' ? setShowTechnologyForm(true) : setShowProjectForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {activeTab === 'technologies' ? 'List Your Technology' : 'List Your Project'}
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Calculator
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('technologies')}
              className={`${
                activeTab === 'technologies'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Climate Technologies
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`${
                activeTab === 'projects'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Carbon Projects
            </button>
          </nav>
        </div>
        
        {/* Technologies Tab Content */}
        {activeTab === 'technologies' && (
          <div>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Technologies</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="tech-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    id="tech-category"
                    value={technologyFilters.category}
                    onChange={(e) => handleTechnologyFilterChange('category', e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Green Materials">Green Materials</option>
                    <option value="Livestock">Livestock Solutions</option>
                    <option value="Construction">Construction Materials</option>
                    <option value="Renewable">Renewable Energy</option>
                    <option value="Bioplastics">Bioplastics</option>
                    <option value="Carbon Capture">Carbon Capture</option>
                    <option value="Energy Efficiency">Energy Efficiency</option>
                    <option value="Soil Carbon">Soil Carbon</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tech-region" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    id="tech-region"
                    value={technologyFilters.region}
                    onChange={(e) => handleTechnologyFilterChange('region', e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Regions</option>
                    {AVAILABLE_REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tech-project-type" className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                  <select
                    id="tech-project-type"
                    value={technologyFilters.projectType}
                    onChange={(e) => handleTechnologyFilterChange('projectType', e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Project Types</option>
                    {PROJECT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="certification-status" className="block text-sm font-medium text-gray-700 mb-1">Certification Status</label>
                  <select
                    id="certification-status"
                    value={technologyFilters.verified}
                    onChange={(e) => handleTechnologyFilterChange('verified', e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Technologies</option>
                    <option value="verified">Certified Only</option>
                    <option value="unverified">Pending Certification</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={technologyFilters.featured}
                      onChange={(e) => handleTechnologyFilterChange('featured', e.target.checked)}
                      className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Technologies Only</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Selected Technologies Summary (If any) */}
            {Object.keys(selectedProducts).length > 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-md font-medium text-green-700 mb-3">Selected Technologies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(selectedProducts).map(tech => (
                    <div key={tech.id} className="bg-white p-3 rounded-lg border border-green-100 flex items-center">
                      <div className="flex-grow">
                        <h4 className="font-medium">{tech.name}</h4>
                        <p className="text-sm text-gray-600">{tech.emissionsReduction}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveTechnology(tech.id)}
                        className="ml-2 p-1 text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Technologies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTechnologies.length > 0 ? (
                filteredTechnologies.map(tech => (
                  <div key={tech.id} className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 
                    ${isTechnologySelected(tech.id) ? 'ring-2 ring-green-500' : ''}`}>
                    <div className="h-48 overflow-hidden">
                      <img src={tech.image} alt={tech.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900">{tech.name}</h3>
                        {tech.featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">{tech.company}</div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {tech.category}
                      </div>
                      <div className="mt-2 flex items-center text-sm font-medium text-green-700">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        {tech.emissionsReduction}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-700">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tech.price}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-700">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {tech.location}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 line-clamp-3">{tech.description}</p>
                      </div>
                      <div className="mt-3">
                        {tech.certifications.map((cert, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                            {cert}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between">
                        <button
                          className="inline-flex items-center px-3 py-1 border border-green-600 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none"
                          onClick={() => window.location.href = `mailto:${tech.contactEmail}?subject=Interest in ${tech.name}`}
                        >
                          Contact Supplier
                        </button>
                        {renderIntegrationButton(tech)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No technologies found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later for new technologies.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Projects Tab Content */}
        {activeTab === 'projects' && (
          <div>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="project-type" className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                  <select
                    id="project-type"
                    value={projectFilters.type}
                    onChange={(e) => handleProjectFilterChange('type', e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Types</option>
                    <option value="REDD+">REDD+</option>
                    <option value="Forestry">Forestry</option>
                    <option value="Livestock">Livestock</option>
                    <option value="Renewable">Renewable Energy</option>
                    <option value="Soil">Soil Carbon</option>
                    <option value="Blue Carbon">Blue Carbon</option>
                    <option value="Construction">Green Construction</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="project-region" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    id="project-region"
                    value={projectFilters.region}
                    onChange={(e) => handleProjectFilterChange('region', e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Regions</option>
                    <option value="Africa">Africa</option>
                    <option value="Asia">Asia</option>
                    <option value="Europe">Europe</option>
                    <option value="North America">North America</option>
                    <option value="South America">South America</option>
                    <option value="Australia">Australia & Oceania</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="verification-status" className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                  <select
                    id="verification-status"
                    value={projectFilters.verified}
                    onChange={(e) => handleProjectFilterChange('verified', e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Projects</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Pending Verification</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={projectFilters.featured}
                      onChange={(e) => handleProjectFilterChange('featured', e.target.checked)}
                      className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Projects Only</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.length > 0 ? (
                filteredProjects.map(project => (
                  <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="h-48 overflow-hidden">
                      <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        {project.featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {project.type}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {project.location}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {project.size}
                      </div>
                      <div className="mt-2 flex items-center text-sm font-medium">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        {project.creditVolume.toLocaleString()} tCO2e available
                      </div>
                      <div className="mt-1 flex items-center text-sm font-medium text-gray-900">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${project.creditPrice} per tCO2e
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 line-clamp-3">{project.description}</p>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {project.verified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {project.verificationStandard}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Verification Pending
                            </span>
                          )}
                        </div>
                        <button
                          className="inline-flex items-center px-3 py-1 border border-green-600 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none"
                          onClick={() => window.location.href = `mailto:${project.contactEmail}?subject=Interest in ${project.name} Carbon Project`}
                        >
                          Contact Developer
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later for new projects.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Footer Content */}
        <div className="mt-16 mb-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-green-800 to-green-700 px-6 py-4">
              <h2 className="text-lg font-medium text-white">Why List Your Project or Technology?</h2>
              <p className="text-green-100 text-sm">Connect with buyers, partners, and integrate your solutions with carbon projects</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <h3 className="font-medium text-green-800 mb-2">For Project Developers</h3>
                  <p className="text-sm text-gray-600 mb-3">List your carbon project to connect with interested buyers and increase visibility in the voluntary carbon market.</p>
                  <button
                    onClick={() => {
                      setActiveTab('projects');
                      setShowProjectForm(true);
                    }}
                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                  >
                    List your project
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2">For Technology Providers</h3>
                  <p className="text-sm text-gray-600 mb-3">Showcase your low-carbon technologies and get them integrated into carbon project assessment calculators.</p>
                  <button
                    onClick={() => {
                      setActiveTab('technologies');
                      setShowTechnologyForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    List your technology
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <h3 className="font-medium text-purple-800 mb-2">For Project Developers</h3>
                  <p className="text-sm text-gray-600 mb-3">Discover innovative technologies to enhance your carbon projects and improve your environmental and financial outcomes.</p>
                  <button
                    onClick={() => window.history.back()}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center"
                  >
                    Go to Calculator
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarbonSolutionsMarketplace;