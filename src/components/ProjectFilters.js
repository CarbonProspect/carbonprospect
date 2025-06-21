import React, { useState } from 'react';
import { getEligibleMarketsForProject, getBilateralMarketData } from '../ComplianceMarketManager';

const ProjectFilters = ({ filters, setFilters, categories, resetFilters, availableMarkets = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [markets, setMarkets] = useState([]);
  
  // Load available markets if not provided as prop
  React.useEffect(() => {
    if (availableMarkets.length === 0) {
      const marketsData = getBilateralMarketData();
      setMarkets(marketsData);
    } else {
      setMarkets(availableMarkets);
    }
  }, [availableMarkets]);
  
  // Predefined filter options based on the form
  const projectStages = [
    { value: 'concept', label: 'Concept/Idea Stage' },
    { value: 'planning', label: 'Planning & Development' },
    { value: 'implementation', label: 'Implementation' },
    { value: 'monitoring', label: 'Monitoring & Reporting' },
    { value: 'verification', label: 'Verification' },
    { value: 'issuance', label: 'Credit Issuance' },
    { value: 'completed', label: 'Completed' }
  ];
  
  const verificationStatuses = [
    { value: 'unverified', label: 'Not Yet Verified' },
    { value: 'validation', label: 'Validation in Process' },
    { value: 'validated', label: 'Validated' },
    { value: 'verification', label: 'Verification in Process' },
    { value: 'verified', label: 'Verified' },
    { value: 'registered', label: 'Registered & Verified' },
    { value: 'issuance', label: 'Credits Issued' }
  ];
  
  const standardBodies = [
    { value: 'Verra', label: 'Verra (VCS)' },
    { value: 'Gold Standard', label: 'Gold Standard' },
    { value: 'CDM', label: 'Clean Development Mechanism (CDM)' },
    { value: 'CAR', label: 'Climate Action Reserve (CAR)' },
    { value: 'ACR', label: 'American Carbon Registry (ACR)' },
    { value: 'Plan Vivo', label: 'Plan Vivo' },
    { value: 'ART TREES', label: 'ART TREES' },
    { value: 'California ARB', label: 'California ARB' },
    { value: 'ISO 14064', label: 'ISO 14064' },
    { value: 'GHG Protocol', label: 'GHG Protocol' },
    { value: 'Other', label: 'Other' },
    { value: 'None', label: 'None/Not Applicable' }
  ];
  
  const sdgOptions = [
    { id: 1, name: "No Poverty" },
    { id: 2, name: "Zero Hunger" },
    { id: 3, name: "Good Health & Well-being" },
    { id: 4, name: "Quality Education" },
    { id: 5, name: "Gender Equality" },
    { id: 6, name: "Clean Water & Sanitation" },
    { id: 7, name: "Affordable & Clean Energy" },
    { id: 8, name: "Decent Work & Economic Growth" },
    { id: 9, name: "Industry, Innovation & Infrastructure" },
    { id: 10, name: "Reduced Inequalities" },
    { id: 11, name: "Sustainable Cities & Communities" },
    { id: 12, name: "Responsible Consumption & Production" },
    { id: 13, name: "Climate Action" },
    { id: 14, name: "Life Below Water" },
    { id: 15, name: "Life on Land" },
    { id: 16, name: "Peace, Justice & Strong Institutions" },
    { id: 17, name: "Partnerships for the Goals" }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRangeChange = (field, key, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value === '' ? null : Number(value)
      }
    }));
  };
  
  const handleEligibilityChange = (key, checked) => {
    setFilters(prev => ({
      ...prev,
      eligibility: {
        ...prev.eligibility,
        [key]: checked
      }
    }));
  };
  
  const handleSdgChange = (id, checked) => {
    const currentSdgs = [...(filters.sdgGoals || [])];
    const idStr = id.toString();
    
    if (checked && !currentSdgs.includes(idStr)) {
      currentSdgs.push(idStr);
    } else if (!checked && currentSdgs.includes(idStr)) {
      const index = currentSdgs.indexOf(idStr);
      if (index > -1) {
        currentSdgs.splice(index, 1);
      }
    }
    
    setFilters(prev => ({
      ...prev,
      sdgGoals: currentSdgs
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2 md:mb-0">Filter Projects</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-green-600 hover:text-green-800"
          >
            {isExpanded ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
          <button 
            onClick={resetFilters}
            className="text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleChange}
            placeholder="Search by project name, location, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Project Types</option>
            {categories.sort().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Seeking Partners">Seeking Partners</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>
      
      {/* Advanced Filters Section */}
      {isExpanded && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-md font-semibold text-gray-700 mb-4">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Verification Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
              <select
                name="verificationStatus"
                value={filters.verificationStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All</option>
                {verificationStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            
            {/* Project Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Stage</label>
              <select
                name="projectStage"
                value={filters.projectStage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Stages</option>
                {projectStages.map(stage => (
                  <option key={stage.value} value={stage.value}>{stage.label}</option>
                ))}
              </select>
            </div>
            
            {/* NEW: Compliance Market Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Market</label>
              <select
                name="complianceMarket"
                value={filters.complianceMarket || 'all'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Markets</option>
                {markets.map(market => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Standard Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Body</label>
              <select
                name="standardBody"
                value={filters.standardBody}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Standards</option>
                {standardBodies.map(standard => (
                  <option key={standard.value} value={standard.value}>{standard.label}</option>
                ))}
              </select>
            </div>
            
            {/* Reduction Target Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emissions Reduction Target (tCO2e)</label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.reductionTarget.min || ''}
                    onChange={(e) => handleRangeChange('reductionTarget', 'min', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <span className="text-gray-500 self-center">to</span>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.reductionTarget.max || ''}
                    onChange={(e) => handleRangeChange('reductionTarget', 'max', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (USD)</label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.budget.min || ''}
                    onChange={(e) => handleRangeChange('budget', 'min', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <span className="text-gray-500 self-center">to</span>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.budget.max || ''}
                    onChange={(e) => handleRangeChange('budget', 'max', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Eligibility Checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility & Standards</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eligibility.verra"
                  checked={filters.eligibility?.verra || false}
                  onChange={(e) => handleEligibilityChange('verra', e.target.checked)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700" htmlFor="eligibility.verra">
                  Verra Registered
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eligibility.goldStandard"
                  checked={filters.eligibility?.goldStandard || false}
                  onChange={(e) => handleEligibilityChange('goldStandard', e.target.checked)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700" htmlFor="eligibility.goldStandard">
                  Gold Standard
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eligibility.cdm"
                  checked={filters.eligibility?.cdm || false}
                  onChange={(e) => handleEligibilityChange('cdm', e.target.checked)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700" htmlFor="eligibility.cdm">
                  CDM Registered
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eligibility.article6"
                  checked={filters.eligibility?.article6 || false}
                  onChange={(e) => handleEligibilityChange('article6', e.target.checked)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700" htmlFor="eligibility.article6">
                  Paris Article 6.2
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eligibility.corsia"
                  checked={filters.eligibility?.corsia || false}
                  onChange={(e) => handleEligibilityChange('corsia', e.target.checked)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700" htmlFor="eligibility.corsia">
                  CORSIA Eligible
                </label>
              </div>
            </div>
          </div>
          
          {/* SDG Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sustainable Development Goals (SDGs)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {sdgOptions.map(goal => (
                <div key={goal.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`sdg-${goal.id}`}
                    checked={filters.sdgGoals?.includes(goal.id.toString()) || false}
                    onChange={(e) => handleSdgChange(goal.id, e.target.checked)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700" htmlFor={`sdg-${goal.id}`}>
                    {goal.id}. {goal.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;