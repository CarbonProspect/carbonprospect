import React, { useState, useEffect, useCallback } from 'react';
import api from '../api-config';
import complianceLegislation from '../utils/complianceLegislation';

// Extract the function from the default export
const { normalizeCountryName } = complianceLegislation;

// Country-specific allowed credit types mapping - STRICT COMPLIANCE RULES
const COUNTRY_CREDIT_MAPPING = {
  'Australia': {
    compliance: ['ACCU'], // ONLY Australian Carbon Credit Units for compliance
    voluntary: ['ACCU', 'VCS', 'Gold_Standard', 'CDM', 'Climate_Active_Eligible'],
    schemes: ['ACCUs Only'], // Compliance is very restrictive
    voluntarySchemes: ['ACCUs', 'VCS', 'Gold Standard', 'CDM', 'Climate Active']
  },
  'Japan': {
    compliance: ['JCM', 'J_Credit'], // Japan-specific credits only
    voluntary: ['JCM', 'J_Credit', 'VCS', 'Gold_Standard', 'CDM'],
    schemes: ['JCM Credits', 'J-Credit Scheme'],
    voluntarySchemes: ['JCM Credits', 'J-Credit Scheme', 'VCS', 'Gold Standard']
  },
  'United States': {
    compliance: ['CCA', 'RGGI', 'ACR_US', 'CAR'], // US state/regional systems only
    voluntary: ['VCS', 'Gold_Standard', 'ACR', 'CAR', 'CDM'],
    schemes: ['California Allowances', 'RGGI Allowances', 'US Registry Credits'],
    voluntarySchemes: ['VCS', 'Gold Standard', 'ACR', 'CAR', 'CDM']
  },
  'European Union': {
    compliance: ['EUA'], // EU Allowances only for EU ETS compliance
    voluntary: ['VCS', 'Gold_Standard', 'Plan_Vivo', 'CDM'],
    schemes: ['EU Allowances Only'],
    voluntarySchemes: ['VCS', 'Gold Standard', 'Plan Vivo', 'CDM']
  },
  'United Kingdom': {
    compliance: ['UK_ETS'], // UK ETS allowances only
    voluntary: ['VCS', 'Gold_Standard', 'Plan_Vivo', 'Woodland_Carbon_Code'],
    schemes: ['UK ETS Allowances Only'],
    voluntarySchemes: ['VCS', 'Gold Standard', 'Plan Vivo', 'Woodland Carbon Code']
  },
  'Canada': {
    compliance: ['Federal_Backstop', 'Provincial_Allowances'], // Canadian systems only
    voluntary: ['VCS', 'Gold_Standard', 'ACR'],
    schemes: ['Canadian Federal/Provincial Credits Only'],
    voluntarySchemes: ['VCS', 'Gold Standard', 'ACR']
  },
  'New Zealand': {
    compliance: ['NZU'], // New Zealand Units only, very limited overseas
    voluntary: ['VCS', 'Gold_Standard', 'Plan_Vivo'],
    schemes: ['New Zealand Units Only'],
    voluntarySchemes: ['VCS', 'Gold Standard', 'Plan Vivo']
  },
  'South Korea': {
    compliance: ['KAU', 'K_Credit'], // Korean system only
    voluntary: ['VCS', 'Gold_Standard', 'K_Credit'],
    schemes: ['Korean Allowances/Credits Only'],
    voluntarySchemes: ['VCS', 'Gold Standard', 'K-Credit']
  },
  'Singapore': {
    compliance: ['Singapore_Eligible_International'], // Very specific international credits only
    voluntary: ['VCS', 'Gold_Standard', 'ACR'],
    schemes: ['Singapore Government Approved International Only'],
    voluntarySchemes: ['VCS', 'Gold Standard', 'ACR']
  },
  'Switzerland': {
    compliance: ['Swiss_Domestic'], // Swiss domestic credits only
    voluntary: ['VCS', 'Gold_Standard', 'Plan_Vivo'],
    schemes: ['Swiss Domestic Credits Only'],
    voluntarySchemes: ['VCS', 'Gold Standard', 'Plan Vivo']
  }
};

// Article 6.2 requirements by country
const ARTICLE_6_2_REQUIREMENTS = {
  'Switzerland': ['CH'],
  'Japan': ['JP'],
  'Singapore': ['SG'],
  'South Korea': ['KR'],
  'New Zealand': ['NZ']
};

// Enhanced category mapping to match project types
const CATEGORY_TO_CREDIT_MAPPING = {
  // Nature-based Solutions
  'Forest Carbon': ['VCS', 'Gold_Standard', 'CDM', 'Plan_Vivo', 'ACCU'],
  'REDD+': ['VCS', 'Gold_Standard', 'CDM', 'Plan_Vivo'],
  'Afforestation/Reforestation': ['VCS', 'Gold_Standard', 'CDM', 'ACCU'],
  'Livestock Methane': ['VCS', 'Gold_Standard', 'ACR', 'CAR', 'ACCU'],
  'Soil Carbon': ['VCS', 'Gold_Standard', 'ACR', 'CAR', 'ACCU'],
  'Blue Carbon': ['VCS', 'Gold_Standard', 'Plan_Vivo'],
  'Biodiversity Conservation': ['VCS', 'Gold_Standard', 'Plan_Vivo'],
  'Wetland Restoration': ['VCS', 'Gold_Standard', 'Plan_Vivo'],
  
  // Energy & Technology
  'Renewable Energy': ['VCS', 'Gold_Standard', 'CDM', 'ACR', 'CAR', 'JCM', 'J_Credit'],
  'Energy Efficiency': ['VCS', 'Gold_Standard', 'CDM', 'ACR', 'CAR', 'JCM'],
  'Carbon Capture & Storage': ['VCS', 'Gold_Standard', 'CDM'],
  'Green Construction': ['VCS', 'Gold_Standard', 'ACR', 'CAR'],
  'Clean Transportation': ['VCS', 'Gold_Standard', 'CDM', 'ACR', 'CAR'],
  'Waste Management': ['VCS', 'Gold_Standard', 'CDM', 'ACR', 'CAR', 'JCM'],
  'Cookstoves': ['VCS', 'Gold_Standard', 'CDM'],
  'Industrial Processes': ['VCS', 'Gold_Standard', 'CDM', 'ACR', 'CAR', 'JCM'],
  
  // Compliance Market Projects
  'ACCU Projects': ['ACCU'],
  'JCM Projects': ['JCM', 'J_Credit'],
  'EU ETS Projects': ['EUA'],
  'RGGI Projects': ['RGGI'],
  'California Cap-and-Trade': ['CCA'],
  'UK ETS Projects': ['UK_ETS'],
  'New Zealand ETS': ['NZU'],
  'Korean K-ETS': ['KAU', 'K_Credit']
};
function CarbonCreditsBrowser({ 
  isOpen, 
  onClose, 
  applicableSchemes = [], 
  location,
  onSelectProject,
  complianceType = 'voluntary', // 'compliance' or 'voluntary'
  preferredCreditType = null, // NEW: Allow filtering by specific credit type
  preferredCategory = null // NEW: Allow filtering by project category
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [creditQuantities, setCreditQuantities] = useState({}); // Track quantities for each project

  // Enhanced filter state
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [creditTypeFilter, setCreditTypeFilter] = useState('all');

  // Get country-specific applicable schemes
  const getApplicableSchemes = (country, complianceType) => {
    const normalizedCountry = normalizeCountryName(country);
    const countryData = COUNTRY_CREDIT_MAPPING[normalizedCountry];
    
    if (!countryData) {
      console.warn(`No credit mapping found for country: ${normalizedCountry}`);
      return [];
    }
    
    // Return different schemes based on compliance type
    if (complianceType === 'compliance') {
      return countryData.schemes || [];
    } else {
      return countryData.voluntarySchemes || countryData.schemes || [];
    }
  };

  // Get allowed credit types for the country and compliance type
  const getAllowedCreditTypes = (country, complianceType) => {
    const normalizedCountry = normalizeCountryName(country);
    const countryData = COUNTRY_CREDIT_MAPPING[normalizedCountry];
    
    if (!countryData) return [];
    
    return complianceType === 'compliance' 
      ? countryData.compliance 
      : [...countryData.compliance, ...countryData.voluntary];
  };

  // NEW: Check if project matches category and credit type filters
  const matchesFilters = (project) => {
    // Get the actual credit type from the project (handle both naming conventions)
    const projectCreditType = project.credit_type || project.creditType;
    
    // Category filter
    if (categoryFilter !== 'all' && project.category !== categoryFilter) {
      return false;
    }
    
    // Credit type filter - be more flexible
    if (creditTypeFilter !== 'all') {
      // Check both field names and also check if it's mentioned in other fields
      const matchesCreditType = projectCreditType === creditTypeFilter ||
                               project.verification_standard?.includes(creditTypeFilter) ||
                               project.verificationStandard?.includes(creditTypeFilter) ||
                               project.standardBody === creditTypeFilter;
      
      if (!matchesCreditType) {
        return false;
      }
    }
    
    // Preferred filters from props
    if (preferredCategory && project.category !== preferredCategory) {
      return false;
    }
    
    if (preferredCreditType && projectCreditType !== preferredCreditType) {
      return false;
    }
    
    return true;
  };

  // NEW: Enhanced compatibility check
  const isProjectCompatible = (project, country, complianceType) => {
    const allowedCreditTypes = getAllowedCreditTypes(country, complianceType);
    const normalizedCountry = normalizeCountryName(country);
    
    // Get the actual credit type from the project (using credit_type field)
    const projectCreditType = project.credit_type || project.creditType;
    
    // Check credit type compatibility
    if (projectCreditType && !allowedCreditTypes.includes(projectCreditType)) {
      return false;
    }
    
    // Check category compatibility with credit type
    const categoryCredits = CATEGORY_TO_CREDIT_MAPPING[project.category];
    if (categoryCredits && projectCreditType && !categoryCredits.includes(projectCreditType)) {
      return false;
    }
    
    // Check Article 6.2 compliance for countries that require it
    const article6Requirements = ARTICLE_6_2_REQUIREMENTS[normalizedCountry];
    if (article6Requirements && project.article6_compliant) {
      return article6Requirements.some(code => 
        project.article6_compliant === true
      );
    }
    
    // STRICT COMPLIANCE FILTERING - Only country-specific credits allowed
    if (normalizedCountry === 'Australia') {
      // Australia: ONLY ACCUs for compliance, NO international credits
      if (complianceType === 'compliance') {
        // Check credit_type field
        if (projectCreditType === 'ACCU') return true;
        // Check if ACCU is mentioned in name or description
        if (project.name?.toLowerCase().includes('accu')) return true;
        if (project.description?.toLowerCase().includes('accu')) return true;
        // Check verification standard
        if (project.verification_standard?.includes('ACCU')) return true;
        // Check if it's an Australian project
        if (project.credit_jurisdiction === 'Australia' && projectCreditType === 'ACCU') return true;
        // Explicitly reject international projects for Australian compliance
        return false;
      } else {
        // Voluntary: Allow international credits
        if (projectCreditType === 'ACCU') return true;
        if (projectCreditType === 'VCS') return true;
        if (projectCreditType === 'Gold_Standard' || projectCreditType === 'Gold Standard') return true;
        // Also check verification_standard for these types
        if (project.verification_standard?.includes('VCS')) return true;
        if (project.verification_standard?.includes('Gold Standard')) return true;
        return true; // Allow all for voluntary
      }
    }
    
    // Add similar logic for other countries...
    // For now, return true for other countries
    return true;
  };
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // Use the same approach as ProjectsListingPage
      console.log("Fetching all projects...");
      const response = await api.get('/projects');
      
      console.log("Projects fetched:", response.data.length);
      console.log('Raw API response:', response);
      console.log('API response data:', response.data);
      
      let allProjects = response.data;

      // Handle different response formats (same as ProjectsListingPage)
      if (Array.isArray(response.data)) {
        allProjects = response.data;
      } else if (response.data && response.data.projects) {
        allProjects = response.data.projects;
      } else {
        console.warn('Unexpected response format:', response.data);
        allProjects = [];
      }

      console.log('Number of projects from API:', allProjects.length);
      
      // Filter for listing projects (same as ProjectsListingPage)
      const listingProjects = allProjects.filter(project => project.project_type === 'listing');
      console.log(`Filtered to ${listingProjects.length} listing projects`);
      
      if (listingProjects.length > 0) {
        console.log("First listing project:", listingProjects[0]);
        console.log("First project structure:", Object.keys(listingProjects[0]));
      }
      
      // Process the projects to add enhanced credit info (same as ProjectsListingPage)
      const processedProjects = listingProjects.map(project => ({
        ...project,
        isArticle6: project.article6_compliant === true,
        // For compatibility with the existing UI
        buyingParty: project.buying_party || '',
        hostParty: project.host_country || project.location || '',
        // Enhanced credit information
        creditType: project.credit_type || project.creditType || 'VCS',
        targetMarkets: project.target_markets || project.targetMarkets || [],
        eligibleJurisdictions: project.eligible_jurisdictions || [],
        creditTypeName: project.credit_type_name || project.credit_type || project.creditType || 'VCS',
        creditJurisdiction: project.credit_jurisdiction || 'International',
        complianceType: project.compliance_type || 'voluntary',
        registryName: project.registry_name || 'Verra Registry',
        // Ensure we have reduction_target for display
        reduction_target: project.reduction_target || project.reductionTarget || 0,
        // Add available credits for compatibility
        availableCredits: project.reduction_target || project.reductionTarget || project.availableCredits || 0
      }));
      
      console.log('Processed projects:', processedProjects.length);
      if (processedProjects.length > 0) {
        console.log('First processed project:', processedProjects[0]);
      }

      // Now apply the carbon credit filtering based on the compliance type
      let filteredProjects = processedProjects;
      
      if (filter === 'applicable') {
        filteredProjects = processedProjects.filter(project => {
          // First check basic filters
          const matchesBasicFilters = matchesFilters(project);
          
          if (!matchesBasicFilters) {
            return false;
          }
          
          // Then check compliance compatibility
          const isCompatible = isProjectCompatible(project, location, complianceType);
          
          return isCompatible;
        });
        
        console.log(`Applicable filter: ${processedProjects.length} -> ${filteredProjects.length} projects`);
        
        // Additional filtering for compliance vs voluntary
        if (complianceType === 'compliance') {
          const beforeComplianceFilter = filteredProjects.length;
          filteredProjects = filteredProjects.filter(project => {
            return project.complianceEligible !== false;
          });
          console.log(`Compliance filter: ${beforeComplianceFilter} -> ${filteredProjects.length} projects`);
        }
      } else {
        // Show all listing projects when filter is 'all', but still apply category/credit type filters
        const beforeFilterCount = processedProjects.length;
        filteredProjects = processedProjects.filter(project => matchesFilters(project));
        console.log(`Basic filters applied: ${beforeFilterCount} -> ${filteredProjects.length} projects`);
      }

      console.log('=== FINAL RESULTS ===');
      console.log('Final filtered projects count:', filteredProjects.length);
      console.log('Category filter:', categoryFilter);
      console.log('Credit type filter:', creditTypeFilter);
      
      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isAxiosError: error.isAxiosError
      });
      
      // Set empty array on error to prevent UI crashes
      setProjects([]);
      
      // Show user-friendly error
      if (error.response?.status === 404) {
        console.error('Projects endpoint not found. Check server routes.');
      } else if (error.response?.status === 401) {
        console.error('Authentication error. Token may be expired.');
      } else if (error.code === 'SERVER_MISCONFIGURED') {
        console.error('Server is returning HTML instead of JSON. Check API configuration.');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, location, complianceType, categoryFilter, creditTypeFilter, preferredCategory, preferredCreditType]);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen, fetchProjects]);

  // Set initial filters based on props
  useEffect(() => {
    if (preferredCategory) {
      setCategoryFilter(preferredCategory);
    }
    if (preferredCreditType) {
      setCreditTypeFilter(preferredCreditType);
    }
  }, [preferredCategory, preferredCreditType]);

  const handleProjectSelect = (project) => {
    const isSelected = selectedProjects.some(p => p.id === project.id);
    if (isSelected) {
      setSelectedProjects(selectedProjects.filter(p => p.id !== project.id));
      // Remove quantity when deselecting
      const newQuantities = { ...creditQuantities };
      delete newQuantities[project.id];
      setCreditQuantities(newQuantities);
    } else {
      setSelectedProjects([...selectedProjects, project]);
      // Set default quantity to minimum (1) or 10% of available, whichever is larger
      const availableCredits = project.reduction_target || project.reductionTarget || project.availableCredits || 0;
      const defaultQuantity = Math.max(1, Math.floor(availableCredits * 0.1));
      setCreditQuantities({
        ...creditQuantities,
        [project.id]: defaultQuantity
      });
    }
  };

  const handleQuantityChange = (projectId, quantity) => {
    const project = projects.find(p => p.id === projectId);
    const availableCredits = project?.reduction_target || project?.reductionTarget || project?.availableCredits || 0;
    
    // Ensure quantity is within valid range
    const validQuantity = Math.max(1, Math.min(quantity, availableCredits));
    
    setCreditQuantities({
      ...creditQuantities,
      [projectId]: validQuantity
    });
  };

  const handleConfirmSelection = () => {
    // Add quantity information to each selected project
    const projectsWithQuantities = selectedProjects.map(project => ({
      ...project,
      selectedQuantity: creditQuantities[project.id] || 1
    }));
    onSelectProject(projectsWithQuantities);
    onClose();
  };

  if (!isOpen) return null;

  const countrySpecificSchemes = getApplicableSchemes(location, complianceType);
  
  // Get unique categories and credit types for filter dropdowns
  const availableCategories = [...new Set(projects.map(p => p.category).filter(Boolean))];
  const availableCreditTypes = [...new Set(projects.map(p => p.creditType || p.credit_type).filter(Boolean))];
  
  // Debug logging
  console.log('Available categories:', availableCategories);
  console.log('Available credit types:', availableCreditTypes);
  console.log('Current filters:', { categoryFilter, creditTypeFilter });
  console.log('Projects with creditType field:', projects.filter(p => p.creditType || p.credit_type).length);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse Carbon Credits</h2>
              <p className="mt-1 text-sm text-gray-600">
                Select carbon credit projects for {normalizeCountryName(location)} {complianceType} requirements
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Enhanced Filters */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Show:</label>
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                  }}
                  className="rounded-md border-gray-300 text-sm"
                >
                  <option value="all">All Projects</option>
                  <option value="applicable">
                    {normalizeCountryName(location)} Applicable Only
                  </option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-md border-gray-300 text-sm"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Credit Type:</label>
                <select
                  value={creditTypeFilter}
                  onChange={(e) => setCreditTypeFilter(e.target.value)}
                  className="rounded-md border-gray-300 text-sm"
                >
                  <option value="all">All Credit Types</option>
                  {availableCreditTypes.map(creditType => (
                    <option key={creditType} value={creditType}>{creditType}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  complianceType === 'compliance' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {complianceType === 'compliance' ? 'Mandatory Compliance' : 'Voluntary Offsetting'}
                </span>
              </div>
              
              {/* Debug button */}
              <button
                onClick={() => {
                  console.log('=== DEBUG: Current Projects ===');
                  console.log('Total projects:', projects.length);
                  console.log('Sample project:', projects[0]);
                  console.log('Credit types in data:', [...new Set(projects.map(p => p.creditType || p.credit_type))]);
                  console.log('Categories in data:', [...new Set(projects.map(p => p.category))]);
                  console.log('Projects with VCS:', projects.filter(p => (p.creditType || p.credit_type) === 'VCS').length);
                  console.log('Current filter values:', { categoryFilter, creditTypeFilter, filter });
                }}
                className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                Debug
              </button>
            </div>

            {countrySpecificSchemes.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">
                  {normalizeCountryName(location)} applicable schemes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {countrySpecificSchemes.map(scheme => (
                    <span key={scheme} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {scheme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Project List - Adjusted padding bottom for sticky bar */}
        <div className="p-6 overflow-y-auto" style={{ 
          maxHeight: 'calc(90vh - 200px)', 
          paddingBottom: selectedProjects.length > 0 ? '80px' : '24px' 
        }}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No {filter === 'applicable' ? `${normalizeCountryName(location)} applicable` : ''} projects found
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your filters or viewing "All Projects"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(project => {
                const isSelected = selectedProjects.some(p => p.id === project.id);
                const availableCredits = project.reduction_target || project.reductionTarget || project.availableCredits || 0;
                
                return (
                  <div
                    key={project.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <button
                        onClick={() => handleProjectSelect(project)}
                        className={`w-5 h-5 rounded border-2 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">{project.location || 'Location not specified'}</p>
                      
                      {/* Show available fields flexibly */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {project.category && (
                          <span className="text-gray-500">
                            <span className="font-medium">Category:</span> {project.category}
                          </span>
                        )}
                        {(project.credit_type || project.creditType) && (
                          <span className="text-gray-500">
                            <span className="font-medium">Type:</span> {project.credit_type || project.creditType}
                          </span>
                        )}
                        {(project.verification_standard || project.verificationStandard || project.standardBody) && (
                          <span className="text-gray-500">
                            <span className="font-medium">Standard:</span> {project.verification_standard || project.verificationStandard || project.standardBody}
                          </span>
                        )}
                      </div>
                      
                      {/* Available credits and quantity selector */}
                      <div className="mt-2 space-y-2">
                        <div className="text-gray-700">
                          <span className="font-medium">Available:</span> {availableCredits.toLocaleString()} tCO2e
                        </div>
                        
                        {/* Quantity selector - only show when selected */}
                        {isSelected && (
                          <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-300">
                            <label className="text-sm font-medium text-gray-700">Credits to purchase:</label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(project.id, (creditQuantities[project.id] || 1) - 1);
                                }}
                                className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                disabled={creditQuantities[project.id] <= 1}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <input
                                type="number"
                                value={creditQuantities[project.id] || 1}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const value = parseInt(e.target.value) || 1;
                                  handleQuantityChange(project.id, value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-24 text-center border border-gray-300 rounded px-2 py-1"
                                min="1"
                                max={availableCredits}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(project.id, (creditQuantities[project.id] || 1) + 1);
                                }}
                                className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                disabled={creditQuantities[project.id] >= availableCredits}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                              <span className="text-sm text-gray-600 ml-1">tCO2e</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Show price if available */}
                      {(project.pricePerTonne || project.price_per_tonne) && (
                        <div>
                          <p className="text-green-600 font-medium">
                            ${project.pricePerTonne || project.price_per_tonne}/tCO2e
                          </p>
                          {isSelected && creditQuantities[project.id] && (
                            <p className="text-sm text-gray-600">
                              Total: ${((project.pricePerTonne || project.price_per_tonne) * creditQuantities[project.id]).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Show description preview */}
                      {project.description && (
                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">{project.description}</p>
                      )}
                      
                      {/* Show project stage if available */}
                      {(project.projectStage || project.project_stage) && (
                        <p className="text-xs text-gray-500 capitalize">
                          Stage: {project.projectStage || project.project_stage}
                        </p>
                      )}
                      
                      {/* Compliance indicators */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.complianceEligible !== false && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Compliance Eligible
                          </span>
                        )}
                        {(project.article6_compliant || project.article6Compliant || project.eligibility?.article6) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                            Article 6.2
                          </span>
                        )}
                        {(project.eligibility?.corsia) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                            CORSIA
                          </span>
                        )}
                        {project.governmentApproved && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                            Government Approved
                          </span>
                        )}
                        {(project.goldStandard || project.eligibility?.goldStandard || project.credit_type === 'Gold_Standard' || project.creditType === 'Gold_Standard') && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                            Gold Standard
                          </span>
                        )}
                        {(project.eligibility?.verra || project.verification_standard?.includes('Verra')) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Verra
                          </span>
                        )}
                        {project.climateActiveEligible && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Climate Active
                          </span>
                        )}
                        {(project.verificationStatus || project.verification_status) && project.verificationStatus !== 'unverified' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 capitalize">
                            {project.verificationStatus || project.verification_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Selection Bar - Only shows when projects are selected */}
        {selectedProjects.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 p-4 shadow-lg z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
                </div>
                <div className="text-sm text-gray-600">
                  Total: {Object.entries(creditQuantities).reduce((sum, [id, qty]) => sum + qty, 0).toLocaleString()} tCO2e
                </div>
                <button
                  onClick={() => {
                    setSelectedProjects([]);
                    setCreditQuantities({});
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all
                </button>
                {filter === 'applicable' && (
                  <span className="text-xs text-blue-600">
                    All selected credits are {normalizeCountryName(location)} compliant
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSelection}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Calculator
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CarbonCreditsBrowser;