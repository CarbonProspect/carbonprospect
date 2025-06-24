// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthSystem';

// Import NavBar from the correct nested path
import NavBar from './components/common/NavBar';

// Import existing components
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import HomePage from './HomePage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import AboutPage from './AboutPage';
import ProjectsManagePage from './ProjectsManagePage';
import MarketplacePage from './MarketplacePage';
import AddSolutionForm from './AddSolutionForm';
import CombinedConverterPage from './CombinedConverterPage';
import CarbonProjectPage from './CarbonProjectPage';
import CarbonFootprintPage from './CarbonFootprintPage';
import ProfilePage from './ProfilePage';
import ProfileEditPage from './ProfileEdit';
import Dashboard from './Dashboard';
import ProductDetailPage from './components/ProductDetailPage';
import ProductEditPage from './components/marketplace/ProductEditPage';
import ReportsList from './ReportsList';

// Import project-related components
import ProjectsListingPage from './ProjectsListingPage';
import ProjectDetailPage from './ProjectDetailPage';
import ProjectListingForm from './ProjectListingForm';
import ProjectEditPage from './ProjectEditPage';

// Placeholder for missing pages that can be implemented later
const NotFoundPage = () => <div className="container mx-auto px-4 py-8"><h1>Page Not Found</h1></div>;
const ProfileCompletePage = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-4">Profile Completed</h1>
    <p>Your profile has been created successfully. You can now explore the marketplace.</p>
  </div>
);

// Profile redirect component
const ProfileRedirect = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (currentUser) {
      navigate(`/profile/${currentUser.id}`);
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
    </div>
  );
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <NavBar />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              
              {/* Add Solution Form Route */}
              <Route 
                path="/marketplace/add-solution" 
                element={
                  <ProtectedRoute>
                    <AddSolutionForm />
                  </ProtectedRoute>
                }
              />
              
              {/* Product Detail Route */}
              <Route 
                path="/marketplace/solution/:id" 
                element={<ProductDetailPage />}
              />
              
              {/* Product Edit Route */}
              <Route 
                path="/marketplace/product/edit/:id" 
                element={
                  <ProtectedRoute>
                    <ProductEditPage />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/ghg-converter" element={<CombinedConverterPage />} />
              
              {/* Carbon Assessment Project Routes */}
              <Route 
                path="/carbon-project/new" 
                element={
                  <ProtectedRoute>
                    <CarbonProjectPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/carbon-project/:projectId" 
                element={
                  <ProtectedRoute>
                    <CarbonProjectPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Carbon Footprint Assessment Routes */}
              <Route 
                path="/carbon-footprint/new" 
                element={
                  <ProtectedRoute>
                    <CarbonFootprintPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/carbon-footprint/:footprintId" 
                element={
                  <ProtectedRoute>
                    <CarbonFootprintPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Reports Route */}
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <ReportsList />
                  </ProtectedRoute>
                } 
              />
              
              {/* Legacy path for backward compatibility */}
              <Route 
                path="/carbon-footprint/assessment" 
                element={
                  <Navigate to="/carbon-footprint/new" replace />
                } 
              />
              
              {/* Legacy path for backward compatibility */}
              <Route 
                path="/carbon-projects/assessment" 
                element={
                  <Navigate to="/carbon-project/new" replace />
                } 
              />
              
              {/* Protected project management routes - MUST come before dynamic routes */}
              <Route 
                path="/projects/manage" 
                element={
                  <ProtectedRoute>
                    <ProjectsManagePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/new" 
                element={
                  <ProtectedRoute>
                    <ProjectListingForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/edit" 
                element={
                  <ProtectedRoute>
                    <ProjectEditPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Project Listings Page - dynamic routes come after specific routes */}
              <Route path="/projects" element={<ProjectsListingPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              
              {/* IMPORTANT: Profile Edit routes MUST come before general profile routes */}
              {/* Profile Edit Route - More specific route first */}
              <Route 
                path="/profile/edit/:id" 
                element={
                  <ProtectedRoute>
                    <ProfileEditPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/:id/edit" 
                element={
                  <ProtectedRoute>
                    <ProfileEditPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profiles/:id/edit" 
                element={
                  <ProtectedRoute>
                    <ProfileEditPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Profile view routes - General routes after specific ones */}
              <Route 
                path="/profile/:id" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Unified profile route */}
              <Route 
                path="/profiles/:id" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default profile route - redirects to user's profile */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfileRedirect />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile/complete" 
                element={
                  <ProtectedRoute>
                    <ProfileCompletePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect old routes to new unified route */}
              <Route path="/developers/:id" element={<Navigate to={`/profiles/${window.location.pathname.split('/').pop()}`} replace />} />
              <Route path="/providers/:id" element={<Navigate to={`/profiles/${window.location.pathname.split('/').pop()}`} replace />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-xl font-bold text-green-400">Carbon Prospect</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    Connecting carbon reduction solutions with projects globally
                  </p>
                </div>
                <div className="flex space-x-6">
                  <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
                  <Link to="/marketplace" className="text-gray-300 hover:text-white">Marketplace</Link>
                  <Link to="/carbon-project/new" className="text-gray-300 hover:text-white">Assessment Tool</Link>
                  <Link to="/projects" className="text-gray-300 hover:text-white">Projects</Link>
                  <Link to="/ghg-converter" className="text-gray-300 hover:text-white">GHG Converter</Link>
                  <Link to="/about" className="text-gray-300 hover:text-white">About</Link>
                  <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Carbon Prospect. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;