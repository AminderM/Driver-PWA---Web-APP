import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import AppsPage from './components/AppsPage';
import AdminConsole from './components/admin/AdminConsole';
import FeatureLoader from './components/FeatureLoader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { ThemeProvider } from './contexts/ThemeContext';
import DriverPortalAuth from './components/driver/DriverPortalAuth';
import DriverPortalDashboard from './components/driver/DriverPortalDashboard';
import DriverLoadDetails from './components/driver/DriverLoadDetails';
import DriverNavigation from './components/driver/DriverNavigation';
import DriverProfile from './components/driver/DriverProfile';
import DriverMobileApp from './components/driver-app';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('AdminRoute: loading=', loading, 'user=', user?.email, 'role=', user?.role);

  if (loading) {
    console.log('AdminRoute: Still loading auth...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user exists and is platform admin
  if (!user) {
    console.log('AdminRoute: No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = user.role === 'platform_admin';
  console.log('AdminRoute: isAdmin=', isAdmin);

  if (!isAdmin) {
    console.log('AdminRoute: Not admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('AdminRoute: Access granted, rendering Admin Console');
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <FeaturesProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><FeatureLoader><Dashboard /></FeatureLoader></ProtectedRoute>} />
              <Route path="/apps" element={<ProtectedRoute><FeatureLoader><AppsPage /></FeatureLoader></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><FeatureLoader><AdminConsole /></FeatureLoader></AdminRoute>} />
              
              {/* Driver Portal Routes */}
              <Route path="/driver-portal" element={<DriverPortalAuth />} />
              <Route path="/driver-portal/dashboard" element={<DriverPortalDashboard />} />
              <Route path="/driver-portal/loads/:loadId" element={<DriverLoadDetails />} />
              <Route path="/driver-portal/navigation/:loadId" element={<DriverNavigation />} />
              <Route path="/driver-portal/profile" element={<DriverProfile />} />
              
              {/* Mobile Driver App - Self-contained for future extraction */}
              <Route path="/driver-app/*" element={<DriverMobileApp />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </FeaturesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
