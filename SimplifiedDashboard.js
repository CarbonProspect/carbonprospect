import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthSystem';
import axios from 'axios';

// Use the API base URL as in other components
const API_BASE_URL = 'http://localhost:3001';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [savedProjects, setSavedProjects] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch saved projects for all user types
        const token = localStorage.getItem('token');
        const savedProjectsResponse = await axios.get(`${API_BASE_URL}/api/projects/saved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedProjects(savedProjectsResponse.data);

        // Fetch role-specific data
        if (currentUser.role === 'solutionProvider') {
          // Fetch products/solutions created by this provider
          const productsResponse = await axios.get(`${API_BASE_URL}/api/products/user`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserProducts(productsResponse.data);
        } 
        else if (currentUser.role === 'projectDeveloper') {
          // Fetch projects created by this developer
          const projectsResponse = await axios.get(`${API_BASE_URL}/api/projects/user`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserProjects(projectsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Please log in: </strong>
          <span className="block sm:inline">You need to be logged in to view your dashboard.</span>
          <Link to="/login" className="mt-2 inline-block bg-green-600 text-white px-4 py-2 rounded">Log In</Link>
        </div>
      </div>
    );
  }

  // Render saved projects section (for all user types)
  const renderSavedProjects = () => {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Saved Projects</h2>
        
        {savedProjects.length > 0 ? (
          <div className="space-y-4">
            {savedProjects.map(project => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-150">
                <h3 className="text-lg font-medium">{project.name}</h3>
                <div className="flex items-center mt-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    {project.category}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {project.location}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{project.description.substring(0, 100)}...</p>
                <div className="mt-3">
                  <Link to={`/projects/${project.id}`} className="text-green-600 hover:text-green-800">
                    View Project Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't saved any projects yet</p>
            <Link to="/projects" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Explore Projects
            </Link>
          </div>
        )}
      </div>
    );
  };

  // Render solution provider section (only for solution providers)
  const renderSolutionProviderSection = () => {
    if (currentUser.role !== 'solutionProvider') return null;
    
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Solutions</h2>
        
        {userProducts.length > 0 ? (
          <div className="space-y-4">
            {userProducts.map(product => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-150">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{product.name}</h3>
                  <span className="text-sm text-gray-500">
                    Views: {product.view_count || 0}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {product.category}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{product.description.substring(0, 100)}...</p>
                <div className="mt-3 flex justify-between">
                  <Link to={`/solutions/${product.id}`} className="text-green-600 hover:text-green-800">
                    View Solution Details →
                  </Link>
                  <Link to={`/solutions/edit/${product.id}`} className="text-blue-600 hover:text-blue-800">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't added any solutions yet</p>
            <Link to="/solutions/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Add Your First Solution
            </Link>
          </div>
        )}
      </div>
    );
  };

  // Render project developer section (only for project developers)
  const renderProjectDeveloperSection = () => {
    if (currentUser.role !== 'projectDeveloper') return null;
    
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
        
        {userProjects.length > 0 ? (
          <div className="space-y-4">
            {userProjects.map(project => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-150">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{project.name}</h3>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      project.status === 'Active' ? 'bg-green-100 text-green-800' : 
                      project.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Views: {project.view_count || 0}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">{project.description.substring(0, 100)}...</p>
                <div className="mt-3 flex justify-between">
                  <Link to={`/projects/${project.id}`} className="text-green-600 hover:text-green-800">
                    View Project Details →
                  </Link>
                  <Link to={`/projects/edit/${project.id}`} className="text-blue-600 hover:text-blue-800">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't created any projects yet</p>
            <Link to="/projects/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Create Your First Project
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-4">
          <Link to="/profile" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-800">
            Edit Profile
          </Link>
          {currentUser.role === 'solutionProvider' && (
            <Link to="/solutions/new" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
              Add New Solution
            </Link>
          )}
          {currentUser.role === 'projectDeveloper' && (
            <Link to="/projects/new" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
              Create New Project
            </Link>
          )}
        </div>
      </div>
      
      {/* Welcome message with user type */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium text-green-800">
          Welcome, {currentUser.firstName}!
        </h2>
        <p className="text-green-700">
          {currentUser.role === 'solutionProvider' 
            ? 'You are logged in as a Solution Provider. You can manage your carbon reduction solutions and track engagement.'
            : currentUser.role === 'projectDeveloper'
            ? 'You are logged in as a Project Developer. You can create and manage your carbon reduction projects.'
            : 'You can explore and save carbon reduction projects that interest you.'}
        </p>
      </div>
      
      {/* Render different sections based on user role */}
      {renderSolutionProviderSection()}
      {renderProjectDeveloperSection()}
      {renderSavedProjects()}
    </div>
  );
};

export default Dashboard;