import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthSystem';

const NavBar = () => {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (profileMenuOpen) setProfileMenuOpen(false);
  };
  
  // Toggle profile menu
  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };
  
  return (
    <nav className="bg-white shadow-md relative z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-2 text-xl font-bold text-green-600">Carbon Prospect</span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/carbon-projects/assessment" className="text-gray-600 hover:text-gray-900">Assessment Tool</Link>
            <Link to="/projects" className="text-gray-600 hover:text-gray-900">Projects</Link>
            <div className="relative group">
              <Link to="/marketplace" className="text-gray-600 hover:text-gray-900 flex items-center">
                Marketplace
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">New</span>
              </Link>
            </div>
            <Link to="/ghg-converter" className="text-gray-600 hover:text-gray-900">GHG Converter</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            
            {/* Auth Links */}
            {currentUser ? (
              <div className="relative">
                <button 
                  className="flex items-center text-gray-600 hover:text-gray-900"
                  onClick={toggleProfileMenu}
                >
                  <span className="mr-2">{currentUser.firstName}</span>
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                    {currentUser.firstName?.charAt(0)}{currentUser.lastName?.charAt(0)}
                  </div>
                </button>
                
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg py-2 z-50">
                    <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Dashboard
                    </Link>
                    <Link 
                      to={currentUser ? `/profile/${currentUser.id}` : '/login'} 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200">
                  Log in
                </Link>
                <Link to="/register" className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700">
                  Sign up
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t">
            <Link to="/" className="block py-2 text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/carbon-projects/assessment" className="block py-2 text-gray-600 hover:text-gray-900">Assessment Tool</Link>
            <Link to="/projects" className="block py-2 text-gray-600 hover:text-gray-900">Projects</Link>
            <Link to="/marketplace" className="flex items-center py-2 text-gray-600 hover:text-gray-900">
              Marketplace
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">New</span>
            </Link>
            <Link to="/ghg-converter" className="block py-2 text-gray-600 hover:text-gray-900">GHG Converter</Link>
            <Link to="/about" className="block py-2 text-gray-600 hover:text-gray-900">About</Link>
            
            {currentUser ? (
              <div>
                <Link to="/dashboard" className="block py-2 text-gray-600 hover:text-gray-900">Dashboard</Link>
                <Link 
                  to={currentUser ? `/profile/${currentUser.id}` : '/login'} 
                  className="block py-2 text-gray-600 hover:text-gray-900"
                >
                  Profile
                </Link>
                <button 
                  onClick={logout}
                  className="block w-full text-left py-2 text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Link to="/login" className="bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200 w-max">
                  Log in
                </Link>
                <Link to="/register" className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700 w-max">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;