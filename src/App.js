import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import ResetPasswordScreen from './components/driver-app/ResetPasswordScreen';

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

const InviteRedirect = () => {
  const { inviteToken } = useParams();
  return <Navigate to={`/driver-app?invite=${encodeURIComponent(inviteToken)}`} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <FeaturesProvider>
            <Routes>
              {/* Driver PWA — / and /auth redirect to the driver app login */}
              <Route path="/" element={<Navigate to="/driver-app" replace />} />
              <Route path="/auth" element={<Navigate to="/driver-app" replace />} />

              {/* TMS platform routes (fleet owners, admins) */}
              <Route path="/tms" element={<LandingPage />} />
              <Route path="/tms/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><FeatureLoader><Dashboard /></FeatureLoader></ProtectedRoute>} />
              <Route path="/apps" element={<ProtectedRoute><FeatureLoader><AppsPage /></FeatureLoader></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><FeatureLoader><AdminConsole /></FeatureLoader></AdminRoute>} />

              {/* Driver Portal Routes */}
              <Route path="/driver-portal" element={<DriverPortalAuth />} />
              <Route path="/driver-portal/dashboard" element={<DriverPortalDashboard />} />
              <Route path="/driver-portal/loads/:loadId" element={<DriverLoadDetails />} />
              <Route path="/driver-portal/navigation/:loadId" element={<DriverNavigation />} />
              <Route path="/driver-portal/profile" element={<DriverProfile />} />

              {/* Invite links — redirect to driver app with token in query string */}
              <Route path="/invite/:inviteToken" element={<InviteRedirect />} />
              <Route path="/driver-setup/:inviteToken" element={<InviteRedirect />} />

              {/* Password reset — driver arrives here from email link */}
              <Route path="/reset-password/:resetToken" element={<ResetPasswordScreen />} />

              {/* Mobile Driver App */}
              <Route path="/driver-app" element={<DriverMobileApp />} />
              <Route path="/driver-app/*" element={<DriverMobileApp />} />

              <Route path="*" element={<Navigate to="/driver-app" replace />} />
            </Routes>
          </FeaturesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
