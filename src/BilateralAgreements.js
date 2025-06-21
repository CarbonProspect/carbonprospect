import React, { useState, useEffect } from 'react';
import { getBilateralMarketData } from '../ComplianceMarketManager';

// Component to display bilateral agreements in a separate section below the map
const BilateralAgreementsList = ({ activeMarketFilter = null, projects = [] }) => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMarkets, setExpandedMarkets] = useState({});
  const [projectsByCountry, setProjectsByCountry] = useState({});
  
  // Fetch market data on component mount
  useEffect(() => {
    // In a production environment, this would be an API call
    const marketData = getBilateralMarketData();
    setMarkets(marketData);
    
    // If there's an active filter, automatically expand that market
    if (activeMarketFilter) {
      setExpandedMarkets({ [activeMarketFilter]: true });
    }
    
    // Process projects to organize by country
    organizeProjectsByCountry(projects);
    
    setLoading(false);
  }, [activeMarketFilter, projects]);
  
  // Organize projects by country for quick lookup
  const organizeProjectsByCountry = (projectsList) => {
    const projectMap = {};
    
    projectsList.forEach(project => {
      if (project.location) {
        // Create a standardized key
        const locationKey = project.location.toLowerCase().trim();
        
        if (!projectMap[locationKey]) {
          projectMap[locationKey] = [];
        }
        
        projectMap[locationKey].push(project);
      }
    });
    
    setProjectsByCountry(projectMap);
  };
  
  // Toggle expansion for a market
  const toggleMarketExpansion = (marketId) => {
    setExpandedMarkets(prev => ({
      ...prev,
      [marketId]: !prev[marketId]
    }));
  };
  
  // Calculate total projects for a market
  const getTotalProjects = (market) => {
    return market.hostCountries.reduce((total, country) => total + (country.projects || 0), 0);
  };
  
  // Get actual project count for a country from our project data
  const getActualProjectCount = (countryName) => {
    // Create standardized keys for lookup
    const standardizedName = countryName.toLowerCase().trim();
    const variations = [
      standardizedName,
      // Add common variations, e.g., "United States" vs "USA"
      standardizedName === "united states" ? "usa" : null,
      standardizedName === "usa" ? "united states" : null
    ].filter(Boolean);
    
    // Check all variations for projects
    let count = 0;
    variations.forEach(variant => {
      if (projectsByCountry[variant]) {
        count += projectsByCountry[variant].length;
      }
    });
    
    return count;
  };
  
  // Filter markets based on activeMarketFilter
  const filteredMarkets = activeMarketFilter 
    ? markets.filter(market => market.id === activeMarketFilter) 
    : markets;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Bilateral Carbon Agreements</h3>
      
      {filteredMarkets.length === 0 ? (
        <p className="text-gray-500 italic">No bilateral agreements found.</p>
      ) : (
        <div className="space-y-4">
          {filteredMarkets.map(market => (
            <div key={market.id} className="border rounded-lg overflow-hidden">
              {/* Market header */}
              <div 
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleMarketExpansion(market.id)}
                style={{ borderLeft: `4px solid ${market.color}` }}
              >
                <div>
                  <h4 className="font-medium text-gray-800">{market.name}</h4>
                  <p className="text-sm text-gray-600">Buying Party: {market.buyingParty}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 px-2 py-1 rounded text-sm">
                    <span className="font-medium">{market.hostCountries.length}</span> Host {market.hostCountries.length === 1 ? 'Country' : 'Countries'}
                  </div>
                  <div className="bg-gray-100 px-2 py-1 rounded text-sm">
                    <span className="font-medium">{getTotalProjects(market)}</span> {getTotalProjects(market) === 1 ? 'Project' : 'Projects'}
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transform transition-transform ${expandedMarkets[market.id] ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Expanded content */}
              {expandedMarkets[market.id] && (
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <p className="text-sm text-gray-600 mb-3">{market.description}</p>
                  
                  <h5 className="font-medium text-gray-700 mb-2">Host Countries:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {market.hostCountries.map(country => {
                      // Get actual count from our projects data
                      const actualProjectCount = getActualProjectCount(country.name);
                      // Use either the actual count or the count from the market data
                      const displayedCount = actualProjectCount > 0 ? actualProjectCount : country.projects;
                      
                      return (
                        <div 
                          key={`${market.id}-${country.name}`} 
                          className="bg-white border rounded-md p-3 hover:shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h6 className="font-medium text-gray-800">{country.name}</h6>
                              <p className="text-xs text-gray-500">{country.region}, {country.subRegion}</p>
                            </div>
                            {displayedCount > 0 ? (
                              <div 
                                className="rounded-full w-7 h-7 flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: market.color }}
                              >
                                {displayedCount}
                              </div>
                            ) : (
                              <div className="rounded-full px-2 py-1 bg-gray-100 text-gray-600 text-xs">
                                No projects
                              </div>
                            )}
                          </div>
                          
                          {/* Show projects if they exist */}
                          {actualProjectCount > 0 && (
                            <div className="mt-3 pt-2 border-t">
                              <h6 className="text-xs font-medium text-gray-700 mb-2">Projects in {country.name}:</h6>
                              <div className="space-y-2">
                                {projectsByCountry[country.name.toLowerCase().trim()]?.slice(0, 3).map(project => (
                                  <div key={project.id} className="text-xs border-l-2 pl-2" style={{ borderColor: market.color }}>
                                    <a 
                                      href={`/projects/${project.id}`}
                                      className="font-medium text-gray-800 hover:text-green-600"
                                    >
                                      {project.name}
                                    </a>
                                    <p className="text-gray-500 truncate">{project.category || 'Uncategorized'}</p>
                                  </div>
                                ))}
                                
                                {actualProjectCount > 3 && (
                                  <div className="text-xs text-center">
                                    <button 
                                      className="text-green-600 hover:text-green-800 font-medium"
                                      onClick={() => window.location.href = `/projects?location=${country.name}`}
                                    >
                                      View all {actualProjectCount} projects in {country.name}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Show actions even if no actual projects but the agreement states there are projects */}
                          {actualProjectCount === 0 && country.projects > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-xs text-gray-600">
                                <p>This agreement reports {country.projects} projects, but none are registered in the platform yet.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t text-xs text-gray-500">
        <p><strong>Note:</strong> Project counts reflect both registered projects in our platform and official data from bilateral agreements. The geographic representations are approximate. For official boundaries and exact project locations, please refer to the official agreement documentation.</p>
      </div>
    </div>
  );
};

export default BilateralAgreementsList;