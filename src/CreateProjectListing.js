import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getValidToken } from './AuthSystem';

const CreateProjectListing = () => {
  const navigate = useNavigate();
  const { refreshToken } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    reductionTarget: '',
    budget: '',
    timeline: {
      start: '',
      end: ''
    },
    status: 'Draft'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields like timeline.start
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Get token and validate first
      const token = getValidToken();
      
      if (!token) {
        setError('Authentication required. Please log in to create a project listing.');
        setLoading(false);
        return;
      }
      
      // Use the project listings endpoint
      const response = await fetch('/api/projects/listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        // Try to refresh token
        const refreshed = await refreshToken();
        
        if (refreshed) {
          // Retry with new token
          const newToken = getValidToken();
          const retryResponse = await fetch('/api/projects/listing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`
            },
            body: JSON.stringify(formData)
          });
          
          if (!retryResponse.ok) {
            throw new Error(`Failed to create project listing (Status: ${retryResponse.status})`);
          }
          
          const data = await retryResponse.json();
          navigate(`/projects/${data.id}`);
          return;
        } else {
          throw new Error('Your session has expired. Please log in again.');
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to create project listing (Status: ${response.status})`);
      }
      
      const data = await response.json();
      navigate(`/projects/${data.id}`);
    } catch (err) {
      console.error('Error creating project listing:', err);
      
      if (err.message.includes('session') || err.message.includes('expired') || 
          err.message.includes('401') || err.message.includes('403')) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.message);
      }
      
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Project Listing</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
            {(error.includes('session') || error.includes('Authentication')) && (
              <div className="mt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-500 underline"
                >
                  Log in now
                </button>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
              Project Type *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Project Type</option>
              <option value="Forest Carbon">Forest Carbon</option>
              <option value="REDD+">REDD+</option>
              <option value="Livestock Methane">Livestock Methane</option>
              <option value="Soil Carbon">Soil Carbon</option>
              <option value="Renewable Energy">Renewable Energy</option>
              <option value="Blue Carbon">Blue Carbon</option>
              <option value="Green Construction">Green Construction</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reductionTarget">
              Emissions Reduction Target (tCO2e)
            </label>
            <input
              type="number"
              id="reductionTarget"
              name="reductionTarget"
              value={formData.reductionTarget}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="budget">
              Budget (USD)
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timeline.start">
                Start Date
              </label>
              <input
                type="date"
                id="timeline.start"
                name="timeline.start"
                value={formData.timeline.start}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timeline.end">
                End Date
              </label>
              <input
                type="date"
                id="timeline.end"
                name="timeline.end"
                value={formData.timeline.end}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Seeking Partners">Seeking Partners</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Project Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectListing;