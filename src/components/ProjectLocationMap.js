import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { ComplianceMarketManager } from '../ComplianceMarketManager';
import { getEligibleMarketsForProject, getBilateralMarketData } from '../ComplianceMarketManager';
import { getCountryLocation } from '../CountryData';
import BilateralAgreementsList from './BilateralAgreementsList';
import ARTICLE_6_PROJECTS from './article-6-projects-data';

const ProjectLocationMap = ({ projects, activeMarketFilter = null }) => {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(activeMarketFilter);
  const [showRealWorldProjects, setShowRealWorldProjects] = useState(false);
  const [article6Projects, setArticle6Projects] = useState([]);
  const [article6Markers, setArticle6Markers] = useState([]);
  
  // Initialize Article 6 projects
  useEffect(() => {
    setArticle6Projects(ARTICLE_6_PROJECTS);
  }, []);
  
  // Pass selected market changes up to parent component if needed
  const handleMarketSelection = (marketId) => {
    setSelectedMarket(marketId);
    // If you need to notify parent component about the selection, you can add a callback prop
  };
  
  // Toggle real-world projects visibility
  const toggleRealWorldProjects = () => {
    setShowRealWorldProjects(!showRealWorldProjects);
    
    // If turning on, add markers
    // If turning off, remove markers
    if (!showRealWorldProjects) {
      // Will trigger the useEffect that adds markers
    } else {
      // Remove Article 6 project markers
      if (mapInstance.current && article6Markers.length > 0) {
        article6Markers.forEach(marker => {
          mapInstance.current.removeLayer(marker);
        });
        setArticle6Markers([]);
      }
    }
  };
  
  // Add Article 6 project markers when showRealWorldProjects changes
  useEffect(() => {
    if (!mapInstance.current || !showRealWorldProjects || !article6Projects.length) return;
    
    // Clear existing Article 6 markers
    article6Markers.forEach(marker => {
      mapInstance.current.removeLayer(marker);
    });
    
    const newMarkers = [];
    const L = window.L;
    
    // Filter projects if a market is selected
    let filteredProjects = [...article6Projects];
    if (selectedMarket) {
      const marketData = getBilateralMarketData().find(m => m.id === selectedMarket);
      if (marketData) {
        filteredProjects = filteredProjects.filter(p => p.buyingParty === marketData.buyingParty);
      }
    }
    
    // Create project locations from Article 6 projects
    filteredProjects.forEach(project => {
      // Skip projects without location data
      // Use the centralized CountryData.js for locations
      const location = getCountryLocation(project.country);
      if (!location) return;
      
      try {
        // Create a custom icon for Article 6 projects
        const icon = L.divIcon({
          html: `<div class="article6-marker" style="background-color: #FF6B6B; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white;">A6</div>`,
          className: 'article6-custom-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        
        // Create the marker
        const marker = L.marker(location, { icon })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div class="article6-popup">
              <div class="font-semibold">${project.name}</div>
              <div class="text-sm">${project.type}</div>
              <div class="text-sm">${project.country}</div>
              <div class="text-xs text-gray-500">${project.estimatedEmissionReductions.toLocaleString()} tCO₂e</div>
              <div class="text-xs mt-1"><strong>Status:</strong> ${project.status}</div>
              <div class="mt-2">
                <a href="${project.projectLink}" target="_blank" class="text-green-600 hover:text-green-800 text-xs">
                  View Project Details →
                </a>
              </div>
            </div>
          `);
        
        newMarkers.push(marker);
      } catch (err) {
        console.error(`Error adding Article 6 marker for ${project.name}:`, err);
      }
    });
    
    setArticle6Markers(newMarkers);
    
  }, [showRealWorldProjects, article6Projects, selectedMarket, article6Markers]);
  
  // Initialize map on component mount
  useEffect(() => {
    let map = null;
    let markers = [];
    let cleanup = false;
    
    // Function to safely initialize the map
    const initializeMap = async () => {
      try {
        // Make sure we have the DOM element
        if (!mapContainerRef.current || cleanup) return;
        
        // Check if Leaflet is available
        if (typeof window.L === 'undefined') {
          // Import Leaflet dynamically if not available globally
          const L = await import('leaflet');
          window.L = L.default;
        }
        
        // Fix the default icon issue
        delete window.L.Icon.Default.prototype._getIconUrl;
        window.L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
        });
        
        // Create a new map instance - make sure mapContainerRef.current still exists
        if (!mapContainerRef.current || cleanup) return;
        
        // Create the map
        map = window.L.map(mapContainerRef.current, {
          center: [20, 0], // More centered initial view
          zoom: 2,
          zoomControl: true,
          attributionControl: true,
          // Disable animations to prevent some Leaflet errors
          fadeAnimation: false,
          zoomAnimation: false,
          markerZoomAnimation: false,
          // Set min zoom to prevent zooming out too far
          minZoom: 2
        });
        
        // Save the map instance to the ref
        mapInstance.current = map;
        
        // Add tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Wait for the map to be ready
        map.whenReady(() => {
          if (cleanup) return;
          
          // Force a resize after initialization to ensure proper rendering
          setTimeout(() => {
            if (map && !cleanup) {
              map.invalidateSize();
              addMarkers();
              setMapReady(true);
            }
          }, 300);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };
    
    // Function to add markers to the map
    const addMarkers = () => {
      if (!mapInstance.current || !projects || cleanup) return;
      
      // Remove any existing markers
      markers.forEach(marker => {
        if (mapInstance.current) mapInstance.current.removeLayer(marker);
      });
      markers = [];
      
      // Filter to projects with valid coordinates
      const validProjects = projects.filter(project => 
        project.latitude && project.longitude && 
        !isNaN(parseFloat(project.latitude)) && 
        !isNaN(parseFloat(project.longitude)) &&
        // Ensure coordinates are within valid ranges
        parseFloat(project.latitude) >= -90 && 
        parseFloat(project.latitude) <= 90 &&
        parseFloat(project.longitude) >= -180 && 
        parseFloat(project.longitude) <= 180
      );
      
      if (validProjects.length === 0) return;
      
      // Create bounds for zooming
      const bounds = window.L.latLngBounds();
      
      validProjects.forEach(project => {
        try {
          const lat = parseFloat(project.latitude);
          const lng = parseFloat(project.longitude);
          
          const marker = window.L.marker([lat, lng])
            .addTo(mapInstance.current)
            .bindPopup(`
              <div class="project-popup">
                <div class="font-semibold">${project.name || 'Unnamed Project'}</div>
                <div class="text-sm">${project.category || 'Uncategorized'}</div>
                <div class="text-sm text-gray-500">${project.location || ''}</div>
                <a href="/projects/${project.id}" class="text-green-600 hover:text-green-800">
                  View Details
                </a>
              </div>
            `);
          
          markers.push(marker);
          bounds.extend([lat, lng]);
        } catch (err) {
          console.error(`Error adding marker for project ${project.id}:`, err);
        }
      });
      
      // Zoom to fit all markers if we have more than one
      if (validProjects.length > 1 && !cleanup) {
        try {
          mapInstance.current.fitBounds(bounds, { 
            padding: [50, 50],
            maxZoom: 6,
            animate: false
          });
        } catch (err) {
          console.error('Error fitting bounds:', err);
          // Fallback to a default view
          mapInstance.current.setView([20, 0], 2, { animate: false });
        }
      } else if (validProjects.length === 1 && !cleanup) {
        // Single project - center on it
        const project = validProjects[0];
        mapInstance.current.setView(
          [parseFloat(project.latitude), parseFloat(project.longitude)], 
          6,
          { animate: false }
        );
      }
    };
    
    // Initialize the map with a timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!cleanup) initializeMap();
    }, 300);
    
    // Update markers when projects change
    if (mapInstance.current && projects) {
      addMarkers();
    }
    
    // Clean up function
    return () => {
      cleanup = true;
      clearTimeout(timer);
      
      // Remove map instance
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      
      setMapReady(false);
    };
  }, [projects]); // Re-run when projects change
  
  // Update selected market when activeMarketFilter changes
  useEffect(() => {
    setSelectedMarket(activeMarketFilter);
  }, [activeMarketFilter]);
  
  return (
    <div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Project Locations</h3>
          
          {/* Toggle for Article 6 projects */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Show Article 6 Projects</span>
            <button
              onClick={toggleRealWorldProjects}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
                showRealWorldProjects ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                  showRealWorldProjects ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
        
        {/* Map Container - Keep this above the controls for z-index order */}
        <div 
          ref={mapContainerRef} 
          className="w-full relative"
          style={{ height: '500px' }}
          id="project-location-map"
        />
        
        {/* Market Controls - Only render when map is ready */}
        {mapReady && mapInstance.current && (
          <div className="px-4 pt-2 pb-2">
            <ComplianceMarketManager 
              map={mapInstance.current} 
              projects={projects}
              activeMarketFilter={selectedMarket}
              onMarketSelect={handleMarketSelection}
            />
          </div>
        )}
        
        <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600 flex justify-between items-center">
          <div>
            {projects.filter(p => p.latitude && p.longitude).length} projects with location data
          </div>
          
          {showRealWorldProjects && (
            <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
              Showing {article6Markers.length} Article 6 Projects
            </div>
          )}
        </div>
      </div>
      
      {/* Bilateral Agreements List */}
      <BilateralAgreementsList 
        activeMarketFilter={selectedMarket}
        projects={projects} 
      />
    </div>
  );
};

export default ProjectLocationMap;