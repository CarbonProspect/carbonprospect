import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthSystem';

const ProjectsManagePage = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user's projects
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects/user', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch projects (Status: ${response.status})`);
        }

        const data = await response.json();
        setProjects(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Your Projects</h1>
        <div className="flex space-x-2">
          <Link 
            to="/projects/create/listing" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Project Listing
          </Link>
          <Link 
            to="/carbon-projects" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Use Assessment Tool
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">You haven't created any projects yet</h2>
          <p className="text-gray-600 mb-6">Get started with your carbon reduction journey:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2">List Existing Project</h3>
              <p className="text-gray-600 mb-4">
                Already have a carbon reduction project? Create a listing to showcase it on our platform.
              </p>
              <Link 
                to="/projects/create/listing" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
              >
                Create Project Listing
              </Link>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2">Design with Carbon Assessment Tool</h3>
              <p className="text-gray-600 mb-4">
                Plan and optimize your carbon reduction project using our specialized assessment tools.
              </p>
              <Link 
                to="/carbon-projects" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
              >
                Start Assessment
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                  <div className="flex items-center mb-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      project.status === 'Active' ? 'bg-green-100 text-green-800' : 
                      project.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status || 'Draft'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {project.description || 'No description available.'}
                  </p>
                  <div className="flex justify-between">
                    <Link 
                      to={`/projects/edit/${project.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <Link 
                      to={`/projects/${project.id}`}
                      className="text-green-600 hover:text-green-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManagePage;