import React, { useState, useEffect } from 'react';
import ARTICLE_6_PROJECTS from './article-6-projects-data';

const RealWorldProjectsSearch = ({ onFilterChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realWorldProjects, setRealWorldProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('all');

  useEffect(() => {
    // In a real application, this would be an API call
    // Here we're using the local data file
    try {
      setLoading(true);
      setRealWorldProjects(ARTICLE_6_PROJECTS);
      setError(null);
    } catch (err) {
      console.error('Failed to load Article 6 projects:', err);
      setError('Failed to load real-world projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    
    // Apply filter using the callback
    onFilterChange({
      type: 'applyRealWorldProjectFilter',
      projectType: project.type,
      countryName: project.country,
      bilateralMarket: getBilateralMarketId(project.buyingParty, project.country)
    });
  };

  // Helper function to simulate getting bilateral market ID
  const getBilateralMarketId = (buyingParty, hostCountry) => {
    return `bilateral-${hostCountry.toLowerCase()}`;
  };

  // Get unique project types for filtering
  const projectTypes = ['all', ...new Set(realWorldProjects.map(project => project.type))];

  // Filter projects based on search term and selected type
  const filteredProjects = realWorldProjects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedProjectType === 'all' || project.type === selectedProjectType;
    
    return matchesSearch && matchesType;
  });

  // Group projects by country for better organization
  const projectsByCountry = filteredProjects.reduce((acc, project) => {
    if (!acc[project.country]) {
      acc[project.country] = [];
    }
    acc[project.country].push(project);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-300 text-amber-800 px-6 py-5 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Error Loading Projects</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Real-World Article 6 Projects</h2>
        <p className="text-gray-600 mb-4">
          These are actual carbon reduction projects operating under Article 6 of the Paris Agreement. 
          Select a project to find similar projects in our marketplace.
        </p>
        
        {/* Search and filter controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
              Search Projects
            </label>
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, country, or description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="md:w-1/3">
            <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">
              Project Type
            </label>
            <select
              id="projectType"
              value={selectedProjectType}
              onChange={(e) => setSelectedProjectType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              {projectTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {filteredProjects.length === 0 ? (
        <div className="p-4 border border-gray-200 rounded-md">
          <p className="text-gray-500">No Article 6 projects matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 mb-3">
            Showing {filteredProjects.length} of {realWorldProjects.length} projects
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(projectsByCountry).map(([country, projects]) => (
              <div key={country} className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium text-gray-700 mb-2 flex justify-between items-center">
                  <span>{country}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                  </span>
                </h3>
                <ul className="space-y-2">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <button
                        onClick={() => handleProjectSelect(project)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                          selectedProject?.id === project.id
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>{project.type}</span>
                          <span>{project.estimatedEmissionReductions.toLocaleString()} tCO<sub>2</sub>e</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
      
      {selectedProject && (
        <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">
            Selected Project: {selectedProject.name}
          </h3>
          <div className="text-sm text-green-700 mb-4">
            <p className="mb-2">{selectedProject.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <div><strong>Country:</strong> {selectedProject.country}</div>
              <div><strong>Type:</strong> {selectedProject.type}</div>
              <div><strong>Status:</strong> {selectedProject.status}</div>
              <div><strong>Emission Reductions:</strong> {selectedProject.estimatedEmissionReductions.toLocaleString()} tCO<sub>2</sub>e</div>
            </div>
          </div>
          <p className="text-sm text-green-700 mb-2">
            The marketplace has been filtered to show projects similar to this Article 6 project.
          </p>
          <button
            onClick={() => {
              setSelectedProject(null);
              onFilterChange({ type: 'resetFilters' });
            }}
            className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default RealWorldProjectsSearch;