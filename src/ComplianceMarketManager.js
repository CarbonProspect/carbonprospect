// Updated ComplianceMarketManager.js with renamed toggle and improved bilateral agreement display

import React, { useState, useEffect, useCallback } from 'react';
import { getCountryLocation } from './CountryData';

/**
 * Enhanced Bilateral Market Manager Component
 * 
 * This component displays bilateral carbon market agreements on a map,
 * with improved visualization and filtering capabilities.
 */
const ComplianceMarketManager = ({ map, projects, activeMarketFilter = null, onMarketSelect }) => {
  const [showMarkets, setShowMarkets] = useState(false);
  const [displayMode, setDisplayMode] = useState('lines'); // 'lines', 'areas', or 'both'
  const [marketFilters, setMarketFilters] = useState({});
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMouAgreements, setShowMouAgreements] = useState(true); // Add control for MoU agreements
  const layerGroupRef = React.useRef(null);
  const mouLayerGroupRef = React.useRef(null); // Separate layer group for MoU lines
  
  // Fetch market data on component mount
  useEffect(() => {
    // In a production environment, this would be an API call
    setMarkets(getBilateralMarketData());
    setLoading(false);
    
    // Set initial market filter if provided
    if (activeMarketFilter) {
      setMarketFilters({ [activeMarketFilter]: true });
      setShowMarkets(true); // Auto-show markets when filter is active
    }
  }, [activeMarketFilter]);
  
  // Get the highlighted market (if any) from filters
  const getHighlightedMarket = useCallback(() => {
    const selectedMarkets = Object.keys(marketFilters);
    return selectedMarkets.length === 1 ? selectedMarkets[0] : null;
  }, [marketFilters]);
  
  // Find eligible markets for all projects
  const updateProjectsWithMarketEligibility = useCallback(() => {
    if (!projects || !markets) return;
    
    projects.forEach(project => {
      project.eligibleMarkets = getEligibleMarketsForProject(project, markets);
    });
  }, [projects, markets]);
  
  // Set up the market layers when the map, visibility or market data changes
  useEffect(() => {
    if (!map || loading) return;
    
    const L = window.L; // Assuming Leaflet is available globally
    if (!L) {
      console.error('Leaflet (L) is not available globally');
      return;
    }
    
    console.log('Setting up bilateral agreement layers. Show agreements:', showMarkets, 'Display mode:', displayMode);
    
    // Clean up function to remove existing layers
    const cleanupLayers = () => {
      // Remove existing implemented agreement layer group if it exists
      if (layerGroupRef.current) {
        try {
          map.removeLayer(layerGroupRef.current);
        } catch (err) {
          console.error('Error removing existing layer group:', err);
        }
        layerGroupRef.current = null;
      }
      
      // Remove existing MoU layer group if it exists
      if (mouLayerGroupRef.current) {
        try {
          map.removeLayer(mouLayerGroupRef.current);
        } catch (err) {
          console.error('Error removing existing MoU layer group:', err);
        }
        mouLayerGroupRef.current = null;
      }
    };
    
    // Clean up existing layers first
    cleanupLayers();
    
    // If not visible, don't add any layers
    if (!showMarkets) return;
    
    // Create new layer groups
    try {
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      
      const mouLayerGroup = L.layerGroup().addTo(map);
      mouLayerGroupRef.current = mouLayerGroup;
      
      // Get the highlighted market (if any)
      const highlightedMarket = getHighlightedMarket();
      
      // If active market filter is provided from parent component, use that instead
      const activeMarket = activeMarketFilter || highlightedMarket;
      
      // Add each market as a layer
      markets.forEach(market => {
        // Skip if there's an active market filter and this market doesn't match
        if (activeMarket && activeMarket !== market.id) return;
        
        // Get the buying party location using the centralized country data
        const buyingPartyCenter = getCountryLocation(market.buyingParty);
        
        if (!buyingPartyCenter) {
          console.warn(`Could not determine location for buying party: ${market.buyingParty}`);
          return;
        }
        
        // Create a marker for the buying party
        if (buyingPartyCenter && (displayMode === 'lines' || displayMode === 'both')) {
          try {
            // Create a marker for the buying party
            const buyingPartyMarker = L.circleMarker(buyingPartyCenter, {
              radius: 8,
              color: market.color,
              fillColor: market.color,
              fillOpacity: 1,
              weight: 2
            }).addTo(layerGroup);
            
            // Add a popup with information
            buyingPartyMarker.bindPopup(`
              <div class="market-popup">
                <h3 class="font-semibold">${market.buyingParty}</h3>
                <p>Buying country in ${market.name}</p>
                <p>Click to view all bilateral agreements</p>
              </div>
            `);
            
            // Add click handler to select this market
            buyingPartyMarker.on('click', () => {
              if (onMarketSelect) {
                onMarketSelect(market.id);
                // Update local state too
                setMarketFilters({ [market.id]: true });
              }
            });
          } catch (err) {
            console.error(`Error creating marker for ${market.buyingParty}:`, err);
          }
        }
        
        // Process MoU agreements if enabled
        if (showMouAgreements && market.mouCountries && market.mouCountries.length > 0) {
          market.mouCountries.forEach(country => {
            // Get the center of the MoU country
            const hostCenter = getCountryLocation(country.name);
            
            // Skip if we can't determine the center
            if (!hostCenter || !buyingPartyCenter) {
              console.warn(`Could not determine center for MoU country: ${country.name}`);
              return;
            }
            
            // Only render lines for MoUs if in 'lines' or 'both' display mode
            if (displayMode === 'lines' || displayMode === 'both') {
              try {
                // Create a dashed curved line between buying party and MoU country
                // Use a different style for MoU lines (dashed, different opacity)
                const mouLine = createCurvedLine(L, buyingPartyCenter, hostCenter, {
                  color: market.color,
                  weight: 2,
                  opacity: 0.5,
                  dashArray: '5, 5', // Dashed line for MoUs
                  animate: false
                }).addTo(mouLayerGroup);
                
                // Add a popup with MoU information
                mouLine.bindPopup(`
                  <div class="market-popup">
                    <h3 class="font-semibold">${market.name} - MoU</h3>
                    <div class="market-details">
                      <p><strong>Buying Party:</strong> ${market.buyingParty}</p>
                      <p><strong>Host Country:</strong> ${country.name}</p>
                      <p><strong>Status:</strong> Memorandum of Understanding signed</p>
                      <p>${country.details || 'No implementation details available yet'}</p>
                    </div>
                  </div>
                `);
                
                // Create a marker for the MoU host country (smaller and different style)
                const hostMarker = L.circleMarker(hostCenter, {
                  radius: 5,
                  color: market.color,
                  fillColor: market.color,
                  fillOpacity: 0.4,
                  weight: 1
                }).addTo(mouLayerGroup);
                
                // Add a popup with information
                hostMarker.bindPopup(`
                  <div class="market-popup">
                    <h3 class="font-semibold">${country.name}</h3>
                    <p>MoU signed with ${market.buyingParty}</p>
                    <p>No implemented projects yet</p>
                  </div>
                `);
              } catch (err) {
                console.error(`Error creating MoU line between ${market.buyingParty} and ${country.name}:`, err);
              }
            }
          });
        }
        
        // Process implemented agreement host countries
        market.hostCountries.forEach(country => {
          // Get the center of the host country using the centralized country data
          const hostCenter = getCountryLocation(country.name);
          
          // Skip if we can't determine the center
          if (!hostCenter) {
            console.warn(`Could not determine center for ${country.name}`);
            return;
          }
          
          // Add country areas if in 'areas' or 'both' display mode
          if (displayMode === 'areas' || displayMode === 'both') {
            // If we have actual GeoJSON data, use that instead of rectangles
            if (country.geoJson) {
              try {
                // Use actual country shape if available
                const countryLayer = L.geoJSON(country.geoJson, {
                  style: {
                    color: market.color,
                    fillColor: market.color,
                    fillOpacity: 0.1,
                    weight: 1
                  }
                }).addTo(layerGroup);
                
                // Add popup
                countryLayer.bindPopup(`
                  <div class="market-popup">
                    <h3 class="font-semibold text-lg">${country.name}</h3>
                    <div class="market-details">
                      <p><strong>Host Country in:</strong> ${market.name}</p>
                      <p><strong>Buying Party:</strong> ${market.buyingParty}</p>
                      <p><strong>Projects:</strong> ${country.projects || 'None registered'}</p>
                    </div>
                  </div>
                `);
              } catch (err) {
                console.error(`Error creating GeoJSON layer for ${country.name}:`, err);
              }
            } else if (country.boundaries && country.boundaries.length > 0) {
              // Validate boundaries - make sure they're valid lat/lng coordinates
              const validBoundaries = country.boundaries.filter(point => {
                const lat = point[0];
                const lng = point[1];
                return (
                  !isNaN(lat) && !isNaN(lng) && 
                  lat >= -90 && lat <= 90 && 
                  lng >= -180 && lng <= 180
                );
              });
              
              if (validBoundaries.length >= 3) {
                try {
                  const polygon = L.polygon(validBoundaries, {
                    color: market.color,
                    fillColor: market.color,
                    fillOpacity: 0.1,
                    weight: 1
                  }).addTo(layerGroup);
                  
                  // Add a popup with information about the bilateral agreement
                  polygon.bindPopup(`
                    <div class="market-popup">
                      <h3 class="font-semibold text-lg">${country.name}</h3>
                      <div class="market-details">
                        <p><strong>Host Country in:</strong> ${market.name}</p>
                        <p><strong>Buying Party:</strong> ${market.buyingParty}</p>
                        <p><strong>Projects:</strong> ${country.projects || 'None registered'}</p>
                      </div>
                    </div>
                  `);
                } catch (err) {
                  console.error(`Error creating polygon for ${country.name}:`, err);
                }
              } else {
                console.warn(`Not enough valid boundary points for ${country.name}`);
              }
            }
          }
          
          // Draw connection lines between buying party and host country if in 'lines' or 'both' mode
          if (buyingPartyCenter && hostCenter && (displayMode === 'lines' || displayMode === 'both')) {
            try {
              // Create a curved line between buying party and host country
              const curvedLine = createCurvedLine(L, buyingPartyCenter, hostCenter, {
                color: market.color,
                weight: country.projects > 0 ? 2 + Math.min(country.projects / 5, 4) : 2,
                opacity: 0.7,
                dashArray: null, // Solid line for implemented agreements
                animate: true
              }).addTo(layerGroup);
              
              // Add a popup with detailed agreement information
              const agreementDetails = country.agreementDetails || {};
              curvedLine.bindPopup(`
                <div class="market-popup">
                  <h3 class="font-semibold">${market.name}</h3>
                  <div class="market-details">
                    <p><strong>Buying Party:</strong> ${market.buyingParty}</p>
                    <p><strong>Host Country:</strong> ${country.name}</p>
                    <p><strong>Projects:</strong> ${country.projects || 'None registered'}</p>
                    ${agreementDetails.signDate ? `<p><strong>Signed:</strong> ${agreementDetails.signDate}</p>` : ''}
                    ${agreementDetails.implementationDate ? `<p><strong>Implementation:</strong> ${agreementDetails.implementationDate}</p>` : ''}
                    ${agreementDetails.description ? `<p>${agreementDetails.description}</p>` : ''}
                    ${agreementDetails.link ? `<p><a href="${agreementDetails.link}" target="_blank" class="text-blue-600 hover:underline">View Agreement Document</a></p>` : ''}
                  </div>
                </div>
              `);
              
              // Create a marker for the host country
              const hostMarker = L.circleMarker(hostCenter, {
                radius: 6,
                color: market.color,
                fillColor: market.color,
                fillOpacity: 0.7,
                weight: 1
              }).addTo(layerGroup);
              
              // Add a popup with information
              hostMarker.bindPopup(`
                <div class="market-popup">
                  <h3 class="font-semibold">${country.name}</h3>
                  <p>Host country in ${market.name}</p>
                  <p>${country.projects || 'No'} registered projects</p>
                  ${agreementDetails.signDate ? `<p><strong>Agreement Signed:</strong> ${agreementDetails.signDate}</p>` : ''}
                </div>
              `);
              
              // Add click handler to select this market
              hostMarker.on('click', () => {
                if (onMarketSelect) {
                  onMarketSelect(market.id);
                  // Update local state too
                  setMarketFilters({ [market.id]: true });
                }
              });
              
              // If there are projects, add a label with the count
              if (country.projects > 0) {
                const labelIcon = L.divIcon({
                  html: `<div class="project-count-label" style="background-color: ${market.color};">${country.projects}</div>`,
                  className: 'project-count-icon',
                  iconSize: [24, 24]
                });
                
                // Position the label along the line
                const labelPos = getPointAlongLine(buyingPartyCenter, hostCenter, 0.7);
                L.marker(labelPos, { icon: labelIcon }).addTo(layerGroup);
              }
            } catch (err) {
              console.error(`Error creating line between ${market.buyingParty} and ${country.name}:`, err);
            }
          }
        });
      });
      
      // Add custom CSS for the labels if needed
      if (!document.getElementById('compliance-market-styles')) {
        const style = document.createElement('style');
        style.id = 'compliance-market-styles';
        style.innerHTML = `
          .project-count-label {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            color: white;
            font-weight: bold;
            font-size: 10px;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
          }
          .project-count-icon {
            background: none !important;
          }
          
          /* Add legend styles */
          .map-legend {
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
          }
          .legend-color {
            width: 20px;
            height: 3px;
            margin-right: 8px;
          }
          .legend-color.dashed {
            border-top: 2px dashed;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Add a legend to explain line styles
      const legend = L.control({ position: 'bottomright' });
      
      legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px;">Legend</div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #FF0000;"></div>
            <span>Implemented Agreement</span>
          </div>
          <div class="legend-item">
            <div class="legend-color dashed" style="border-color: #FF0000;"></div>
            <span>MoU Only</span>
          </div>
        `;
        return div;
      };
      
      legend.addTo(map);
      
      console.log('Bilateral agreement layers added successfully');
    } catch (err) {
      console.error('Error setting up bilateral agreement layers:', err);
    }
    
    return () => {
      // Clean up on unmount or when dependencies change
      cleanupLayers();
      
      // Remove legend
      const legendElements = document.querySelectorAll('.map-legend');
      legendElements.forEach(el => el.remove());
    };
  }, [map, showMarkets, displayMode, markets, loading, marketFilters, activeMarketFilter, getHighlightedMarket, onMarketSelect, showMouAgreements]);
  
  // Function to handle toggling market visibility
  const handleMarketToggle = () => {
    console.log('Toggling bilateral agreements visibility from', showMarkets, 'to', !showMarkets);
    setShowMarkets(!showMarkets);
    
    // If turning off markets, also notify parent of deselection
    if (showMarkets && onMarketSelect) {
      onMarketSelect(null);
    }
  };
  
  // Function to handle changing display mode
  const handleDisplayModeChange = (mode) => {
    console.log('Changing display mode from', displayMode, 'to', mode);
    setDisplayMode(mode);
  };
  
  // Function to toggle MoU agreements visibility
  const handleMouToggle = () => {
    console.log('Toggling MoU visibility from', showMouAgreements, 'to', !showMouAgreements);
    setShowMouAgreements(!showMouAgreements);
  };
  
  // Function to handle filtering by specific market
  const handleMarketFilterChange = (marketId) => {
    if (marketId === 'all') {
      // Reset all filters to show everything
      setMarketFilters({});
      
      // Notify parent component
      if (onMarketSelect) {
        onMarketSelect(null);
      }
    } else {
      // Toggle this market's visibility
      setMarketFilters(prev => {
        const newFilters = { ...prev };
        
        // If it's already selected, deselect it
        if (newFilters[marketId]) {
          delete newFilters[marketId];
          
          // Notify parent component of deselection
          if (onMarketSelect) {
            onMarketSelect(null);
          }
        } else {
          // Otherwise select it
          newFilters[marketId] = true;
          
          // Notify parent component
          if (onMarketSelect) {
            onMarketSelect(marketId);
          }
        }
        
        return newFilters;
      });
    }
  };
  
  // Call this when projects or markets change
  useEffect(() => {
    updateProjectsWithMarketEligibility();
  }, [updateProjectsWithMarketEligibility]);
  
  // Count how many markets are currently selected
  const selectedMarketsCount = Object.keys(marketFilters).length;
  
  // Controls UI component
  return (
    <div className="mb-4 bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Bilateral Agreements</h3>
      
      {/* Toggle switch for showing bilateral agreements - Renamed from "Show Compliance Markets" */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Show Bilateral Agreements</span>
        <button
          onClick={handleMarketToggle}
          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
            showMarkets ? 'bg-green-600' : 'bg-gray-300'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
              showMarkets ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      
      {/* Only show additional controls if markets are visible */}
      {showMarkets && (
        <>
          {/* Info text about interactions */}
          <div className="bg-blue-50 border border-blue-100 rounded p-2 mb-4 text-xs text-blue-800">
            <p>
              <strong>Tip:</strong> Click on any country marker or line to view detailed information about that bilateral agreement.
            </p>
          </div>
          
          {/* Toggle for MoU Agreements */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Show MoU Agreements</span>
            <button
              onClick={handleMouToggle}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
                showMouAgreements ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                  showMouAgreements ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          {/* Display Mode Selection */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Display Mode:</p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDisplayModeChange('lines')}
                className={`px-3 py-1 rounded-md text-xs font-medium focus:outline-none ${
                  displayMode === 'lines'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Connection Lines
              </button>
              <button
                onClick={() => handleDisplayModeChange('areas')}
                className={`px-3 py-1 rounded-md text-xs font-medium focus:outline-none ${
                  displayMode === 'areas'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Country Areas
              </button>
              <button
                onClick={() => handleDisplayModeChange('both')}
                className={`px-3 py-1 rounded-md text-xs font-medium focus:outline-none ${
                  displayMode === 'both'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Both
              </button>
            </div>
          </div>
  
          {/* Market Filters */}
          <div>
            <div className="mb-2">
              <p className="text-sm text-gray-600">Filter by specific markets:</p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {/* "All Markets" option */}
              <button
                onClick={() => handleMarketFilterChange('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium focus:outline-none ${
                  selectedMarketsCount === 0
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Markets
              </button>
              
              {/* Individual market options */}
              {markets.map(market => (
                <button
                  key={market.id}
                  onClick={() => handleMarketFilterChange(market.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium focus:outline-none ${
                    marketFilters[market.id]
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{
                    borderLeft: `4px solid ${market.color}`
                  }}
                >
                  {market.name}
                </button>
              ))}
            </div>
            
            {selectedMarketsCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Showing {selectedMarketsCount} selected market{selectedMarketsCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// =================== HELPER FUNCTIONS ===================

// Function to create a curved line between two points
const createCurvedLine = (L, from, to, options = {}) => {
  // Validate coordinates
  if (!from || !to || 
      from[0] < -90 || from[0] > 90 || from[1] < -180 || from[1] > 180 ||
      to[0] < -90 || to[0] > 90 || to[1] < -180 || to[1] > 180) {
    console.warn('Invalid coordinates for curved line:', from, to);
    return null;
  }
  
  // Adjust for the antimeridian (180° longitude line)
  let adjustedFrom = [...from];
  let adjustedTo = [...to];
  
  // If the line crosses the international date line, adjust longitudes
  if (Math.abs(from[1] - to[1]) > 180) {
    if (from[1] < 0) adjustedFrom[1] += 360;
    if (to[1] < 0) adjustedTo[1] += 360;
  }
  
  // Create LatLng objects
  const fromLatLng = L.latLng(adjustedFrom[0], adjustedFrom[1]);
  const toLatLng = L.latLng(adjustedTo[0], adjustedTo[1]);
  const latlngs = [fromLatLng, toLatLng];
  
  // For straight lines, just use a regular polyline
  if (options.straight) {
    return L.polyline(latlngs, options);
  }
  
  // For curved lines, we need to calculate control points
  // Get the midpoint
  const midLat = (adjustedFrom[0] + adjustedTo[0]) / 2;
  const midLng = (adjustedFrom[1] + adjustedTo[1]) / 2;
  
  // Calculate the distance between points
  const distance = Math.sqrt(
    Math.pow(adjustedTo[0] - adjustedFrom[0], 2) + 
    Math.pow(adjustedTo[1] - adjustedFrom[1], 2)
  );
  
  // Calculate a point perpendicular to the line for the curve
  // The factor determines how curved the line is
  const curveFactor = Math.min(distance * 0.2, 15); // Reduced max curve
  
  // Calculate perpendicular vector
  const dx = adjustedTo[1] - adjustedFrom[1];
  const dy = -(adjustedTo[0] - adjustedFrom[0]);
  const norm = Math.sqrt(dx * dx + dy * dy);
  
  // Avoid division by zero
  if (norm < 0.000001) {
    return L.polyline(latlngs, options);
  }
  
  const cx = midLng + (dx / norm) * curveFactor;
  const cy = midLat + (dy / norm) * curveFactor;
  
  // Create control point
  const controlPoint = L.latLng(cy, cx);
  
  // Generate points along a quadratic Bezier curve
  const points = [];
  const steps = 20; // Number of points on the curve
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    
    // Quadratic Bezier curve formula: P = (1-t)²P₁ + 2(1-t)tP₂ + t²P₃
    const lat = Math.pow(1 - t, 2) * adjustedFrom[0] + 
               2 * (1 - t) * t * controlPoint.lat + 
               Math.pow(t, 2) * adjustedTo[0];
               
    const lng = Math.pow(1 - t, 2) * adjustedFrom[1] + 
               2 * (1 - t) * t * controlPoint.lng + 
               Math.pow(t, 2) * adjustedTo[1];
    
    // Handle wrapping around the international date line
    let adjustedLng = lng;
    if (adjustedLng > 180) adjustedLng -= 360;
    if (adjustedLng < -180) adjustedLng += 360;
    
    points.push(L.latLng(lat, adjustedLng));
  }
  
  // Create and return the polyline along the curve
  return L.polyline(points, options);
};

// Function to get a point along a line at a given fraction (0-1)
const getPointAlongLine = (from, to, fraction) => {
  return [
    from[0] + (to[0] - from[0]) * fraction,
    from[1] + (to[1] - from[1]) * fraction
  ];
};

// Enhanced bilateral agreement data with more countries and MoU information
// Also includes detailed agreement information
export const getBilateralMarketData = () => {
  return [
    // Switzerland bilateral agreements
    {
      id: 'ch-bilateral',
      name: 'Switzerland Article 6.2',
      buyingParty: 'Switzerland',
      description: 'Bilateral carbon market agreements established by Switzerland under Article 6 of the Paris Agreement',
      color: '#FF0000', // Switzerland red
      hostCountries: [
        {
          name: 'Ghana',
          region: 'Africa',
          subRegion: 'Western Africa',
          projects: 4,
          agreementDetails: {
            signDate: 'November 23, 2020',
            implementationDate: 'January 1, 2021',
            description: 'The agreement aims to reduce emissions from rice cultivation and promote renewable energy.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Peru',
          region: 'Americas',
          subRegion: 'South America',
          projects: 2,
          agreementDetails: {
            signDate: 'October 20, 2020',
            implementationDate: 'January 1, 2021',
            description: 'Focus on energy efficiency improvements and cook stoves projects to reduce deforestation.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Senegal',
          region: 'Africa',
          subRegion: 'Western Africa',
          projects: 3,
          agreementDetails: {
            signDate: 'July 8, 2021',
            implementationDate: 'August 15, 2021',
            description: 'Focuses on electric mobility and biogas development projects.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Thailand',
          region: 'Asia',
          subRegion: 'Southeast Asia',
          projects: 1,
          agreementDetails: {
            signDate: 'May 12, 2022',
            implementationDate: 'July 1, 2022',
            description: 'Promotes solar photovoltaic deployment and energy efficiency projects.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Georgia',
          region: 'Asia',
          subRegion: 'Western Asia',
          projects: 1,
          agreementDetails: {
            signDate: 'October 7, 2022',
            implementationDate: 'January 1, 2023',
            description: 'Agreement covers sustainable building and energy efficiency sectors.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Vanuatu',
          region: 'Oceania',
          subRegion: 'Melanesia',
          projects: 1,
          agreementDetails: {
            signDate: 'November 30, 2022',
            implementationDate: 'February 1, 2023',
            description: 'Focuses on rural electrification through renewable energy technologies.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Dominican Republic',
          region: 'Americas',
          subRegion: 'Caribbean',
          projects: 1,
          agreementDetails: {
            signDate: 'January 15, 2023',
            implementationDate: 'March 1, 2023',
            description: 'Agreement targets sustainable tourism and renewable energy projects.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Tunisia',
          region: 'Africa',
          subRegion: 'Northern Africa',
          projects: 1,
          agreementDetails: {
            signDate: 'February 20, 2023',
            implementationDate: 'May 1, 2023',
            description: 'Focuses on waste management and renewable energy projects.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Chile',
          region: 'Americas',
          subRegion: 'South America', 
          projects: 1,
          agreementDetails: {
            signDate: 'April 2, 2023',
            implementationDate: 'June 15, 2023',
            description: 'Agreement supports sustainable transportation and renewable energy projects.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        },
        {
          name: 'Uruguay',
          region: 'Americas',
          subRegion: 'South America',
          projects: 1,
          agreementDetails: {
            signDate: 'May 17, 2023',
            implementationDate: 'August 1, 2023',
            description: 'Targets sustainable agriculture and renewable energy technologies.',
            link: 'https://www.bafu.admin.ch/bafu/en/home/topics/climate/info-specialists/climate--international-affairs/staatsvertraege-umsetzung-klimauebereinkommen-von-paris-artikel6.html'
          }
        }
      ],
      // Countries with MoUs but not yet implemented agreements
      mouCountries: [
        {
          name: 'Colombia',
          details: 'MoU signed in 2023, implementation in progress'
        },
        {
          name: 'Bhutan',
          details: 'MoU signed in 2024, implementation expected by end of year'
        },
        {
          name: 'Kenya', // Fixed to be part of MoU countries, not incorrectly marked as a project
          details: 'MoU signed in 2023, framework agreement under negotiation'
        }
      ]
    },
    
    // Japan Joint Crediting Mechanism (JCM)
    {
      id: 'jp-jcm',
      name: 'Japan JCM',
      buyingParty: 'Japan',
      description: 'Joint Crediting Mechanism established by Japan with multiple partner countries',
      color: '#BC002D', // Japan red
      hostCountries: [
        {
          name: 'Thailand',
          region: 'Asia',
          subRegion: 'Southeast Asia',
          projects: 18,
          agreementDetails: {
            signDate: 'November 19, 2015',
            implementationDate: 'January 1, 2016',
            description: 'One of the most active JCM partnerships with projects across multiple sectors.',
            link: 'https://www.jcm.go.jp/th-jp'
          }
        },
        {
          name: 'Indonesia',
          region: 'Asia',
          subRegion: 'Southeast Asia',
          projects: 43,
          agreementDetails: {
            signDate: 'August 26, 2013',
            implementationDate: 'October 1, 2013',
            description: 'The largest portfolio of JCM projects, focusing on energy efficiency and renewables.',
            link: 'https://www.jcm.go.jp/id-jp'
          }
        },
        {
          name: 'Vietnam',
          region: 'Asia',
          subRegion: 'Southeast Asia',
          projects: 25,
          agreementDetails: {
            signDate: 'July 2, 2013',
            implementationDate: 'September 1, 2013',
            description: 'Strong focus on energy efficiency and manufacturing improvements.',
            link: 'https://www.jcm.go.jp/vn-jp'
          }
        },
        {
          name: 'Philippines',
          region: 'Asia',
          subRegion: 'Southeast Asia',
          projects: 15,
          agreementDetails: {
            signDate: 'January 12, 2017',
            implementationDate: 'March 1, 2017',
            description: 'Projects primarily in renewable energy and waste management sectors.',
            link: 'https://www.jcm.go.jp/ph-jp'
          }
        },
        {
          name: 'Cambodia',
          region: 'Asia',
          subRegion: 'Southeast Asia',
          projects: 5,
          agreementDetails: {
            signDate: 'April 11, 2014',
            implementationDate: 'June 1, 2014',
            description: 'Focus on renewable energy and energy efficiency improvements.',
            link: 'https://www.jcm.go.jp/kh-jp'
          }
        },
        {
          name: 'Mongolia',
          region: 'Asia', 
          subRegion: 'Eastern Asia',
          projects: 3,
          agreementDetails: {
            signDate: 'January 8, 2013',
            implementationDate: 'March 1, 2013',
            description: 'Projects focus on heating efficiency and renewable energy.',
            link: 'https://www.jcm.go.jp/mn-jp'
          }
        },
        {
          name: 'Chile',
          region: 'Americas',
          subRegion: 'South America',
          projects: 1,
          agreementDetails: {
            signDate: 'May 26, 2015',
            implementationDate: 'August 1, 2015',
            description: 'Projects focus on renewable energy and sustainable technologies.',
            link: 'https://www.jcm.go.jp/cl-jp'
          }
        }
      ],
      // Countries with MoUs but not yet implemented agreements
      mouCountries: [
        {
          name: 'Malaysia',
          details: 'MoU signed in 2022, projects under development'
        },
        {
          name: 'Laos',
          details: 'MoU signed in 2023, implementation procedures in development'
        },
        {
          name: 'Sri Lanka',
          details: 'MoU signed in 2024, methodology development in progress'
        }
      ]
    },
    
    // Singapore bilateral agreements
    {
      id: 'sg-bilateral',
      name: 'Singapore Article 6.2',
      buyingParty: 'Singapore',
      description: 'Bilateral carbon market agreements established by Singapore under Article 6',
      color: '#EF3340', // Singapore red
      hostCountries: [
        {
          name: 'Papua New Guinea',
          region: 'Oceania',
          subRegion: 'Melanesia',
          projects: 1,
          agreementDetails: {
            signDate: 'February 7, 2022',
            implementationDate: 'April 1, 2022',
            description: 'Agreement focuses on sustainable forestry and REDD+ projects.',
            link: 'https://www.nccs.gov.sg/international-cooperation/international-carbon-credits/'
          }
        },
        {
          name: 'Ghana',
          region: 'Africa',
          subRegion: 'Western Africa',
          projects: 1,
          agreementDetails: {
            signDate: 'March 31, 2022',
            implementationDate: 'June 1, 2022',
            description: 'Projects focus on renewable energy and sustainable agriculture.',
            link: 'https://www.nccs.gov.sg/international-cooperation/international-carbon-credits/'
          }
        },
        {
          name: 'Fiji',
          region: 'Oceania',
          subRegion: 'Melanesia',
          projects: 1,
          agreementDetails: {
            signDate: 'July 12, 2022',
            implementationDate: 'September 1, 2022',
            description: 'Agreement centered on blue carbon and marine conservation initiatives.',
            link: 'https://www.nccs.gov.sg/international-cooperation/international-carbon-credits/'
          }
        },
        {
          name: 'Kenya',
          region: 'Africa',
          subRegion: 'Eastern Africa',
          projects: 1,
          agreementDetails: {
            signDate: 'October 7, 2022',
            implementationDate: 'December 1, 2022',
            description: 'Focuses on sustainable agriculture and renewable energy deployment.',
            link: 'https://www.nccs.gov.sg/international-cooperation/international-carbon-credits/'
          }
        },
        {
          name: 'Rwanda',
          region: 'Africa',
          subRegion: 'Eastern Africa',
          projects: 1,
          agreementDetails: {
            signDate: 'January 21, 2023',
            implementationDate: 'March 15, 2023',
            description: 'Agreement covers reforestation and renewable energy projects.',
            link: 'https://www.nccs.gov.sg/international-cooperation/international-carbon-credits/'
          }
        },
        {
          name: 'Cambodia',
          region: 'Asia',
          subRegion: 'Southeast Asia',
          projects: 1,
          agreementDetails: {
            signDate: 'February 18, 2023',
            implementationDate: 'May 1, 2023',
            description: 'Focuses on sustainable forestry and agricultural practices.',
            link: 'https://www.nccs.gov.sg/international-cooperation/international-carbon-credits/'
          }
        },
        {
          name: 'Peru',
          region: 'Americas',
          subRegion: 'South America',
          projects: 1,
          agreementDetails: {
            signDate: 'March 22, 2023',
            implementationDate: 'June 1, 2023',
            description: 'Agreement centered on rainforest conservation and sustainable agriculture.',
            link: 'https://www.nccs.gov.sg/international-cooperation/international-carbon-credits/'
          }
        },
        {
          name: 'Senegal',
          region: 'Africa',
          subRegion: 'Western Africa',
          projects: 1,
          agreementDetails: {
            signDate: 'May 5, 2023',
            implementationDate: 'August 1, 2023',
            description: 'Projects focus on coastal protection and blue carbon initiatives.',
            link: 'https://www.nccs.gov.sg/international-cooperation/international-carbon-credits/'
          }
        }
      ],
      // Countries with MoUs but not yet implemented agreements
      mouCountries: [
        {
          name: 'Chile',
          details: 'MoU signed in 2023, projects in discussion'
        },
        {
          name: 'Mongolia',
          details: 'MoU signed in 2023, project development in progress'
        },
        {
          name: 'Sri Lanka',
          details: 'MoU signed in 2024, framework in development'
        },
        {
          name: 'Philippines',
          details: 'MoU signed in 2022, waiting for implementing agreement'
        },
        {
          name: 'Vietnam',
          details: 'MoU signed in 2021, framework in development'
        },
        {
          name: 'Lao PDR',
          details: 'MoU signed in 2023, capacity building in progress'
        },
        {
          name: 'Colombia',
          details: 'MoU signed in 2024, early discussions underway'
        }
      ]
    },
    
    // Korea bilateral agreements
    {
      id: 'kr-bilateral',
      name: 'Korea Article 6.2',
      buyingParty: 'Republic of Korea',
      description: 'Bilateral carbon market agreements established by South Korea',
      color: '#0047A0', // Korea blue
      hostCountries: [
        {
          name: 'Panama',
          region: 'Americas',
          subRegion: 'Central America',
          projects: 1,
          agreementDetails: {
            signDate: 'September 4, 2022',
            implementationDate: 'November 1, 2022',
            description: 'Agreement focuses on sustainable forestry and protected areas.',
            link: 'https://www.gir.go.kr/eng/index.do'
          }
        }
      ],
      // Countries with MoUs but not yet implemented agreements
      mouCountries: [
        {
          name: 'Indonesia',
          details: 'MoU signed in 2022, project selection in progress'
        },
        {
          name: 'Vietnam',
          details: 'MoU signed in 2023, framework development in progress'
        },
        {
          name: 'Thailand',
          details: 'MoU signed in 2024, framework in discussion'
        }
      ]
    },
    
    // Australia Pacific carbon exchange
    {
      id: 'au-bilateral',
      name: 'Australia IPCOS',
      buyingParty: 'Australia',
      description: 'Indo-Pacific Carbon Offsets Scheme',
      color: '#00843D', // Australia green
      hostCountries: [],
      // Countries with MoUs but not yet implemented agreements
      mouCountries: [
        {
          name: 'Fiji',
          details: 'MoU signed in 2022, methodology development in progress'
        },
        {
          name: 'Papua New Guinea',
          details: 'MoU signed in 2022, institutional arrangements in progress'
        },
        {
          name: 'Indonesia',
          details: 'MoU signed in 2023, framework development in progress'
        }
      ]
    },
    
    // Sweden bilateral agreements
    {
      id: 'se-bilateral',
      name: 'Sweden Article 6.2',
      buyingParty: 'Sweden',
      description: 'Bilateral carbon market agreements established by Sweden',
      color: '#006AA7', // Sweden blue
      hostCountries: [
        {
          name: 'Ghana',
          region: 'Africa',
          subRegion: 'Western Africa',
          projects: 3,
          agreementDetails: {
            signDate: 'May 22, 2022',
            implementationDate: 'August 1, 2022',
            description: 'Agreement focuses on renewable energy and sustainable forestry projects.',
            link: 'https://www.energimyndigheten.se/en/cooperation/international-climate-cooperation/'
          }
        }
      ],
      // Countries with MoUs but not yet implemented agreements
      mouCountries: [
        {
          name: 'Kenya',
          details: 'MoU signed in 2023, project development in progress'
        },
        {
          name: 'Rwanda',
          details: 'MoU signed in 2024, early discussions underway'
        }
      ]
    }
  ];
};

// Function to determine which markets a project is eligible for
export const getEligibleMarketsForProject = (project, markets) => {
  if (!project.location || !markets || markets.length === 0) {
    return [];
  }
  
  const eligibleMarkets = [];
  
  // In a real implementation, this would use proper geolocation
  markets.forEach(market => {
    // Check implemented agreements
    market.hostCountries.forEach(country => {
      // Simple string matching for demo purposes
      if (project.location && project.location.toLowerCase().includes(country.name.toLowerCase())) {
        eligibleMarkets.push({
          id: market.id,
          shortName: market.buyingParty + '-' + country.name,
          name: market.name,
          description: market.description,
          color: market.color,
          buyingParty: market.buyingParty,
          hostCountry: country.name,
          status: 'implemented',
          agreementDetails: country.agreementDetails || {}
        });
      }
    });
    
    // Also check MoU countries
    if (market.mouCountries) {
      market.mouCountries.forEach(country => {
        if (project.location && project.location.toLowerCase().includes(country.name.toLowerCase())) {
          eligibleMarkets.push({
            id: market.id,
            shortName: market.buyingParty + '-' + country.name + ' (MoU)',
            name: market.name,
            description: market.description + ' (MoU only)',
            color: market.color,
            buyingParty: market.buyingParty,
            hostCountry: country.name,
            status: 'mou_only',
            mouDetails: country.details || 'Memorandum of Understanding signed'
          });
        }
      });
    }
  });
  
  return eligibleMarkets;
};

export { ComplianceMarketManager };