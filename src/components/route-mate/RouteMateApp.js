import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Home, Map, Users, Truck, MapPin, BarChart3, Settings,
  Plus, Play, Calendar, TrendingUp
} from 'lucide-react';

// Import sub-components
import RouteMateRoutes from './RouteMateRoutes';
import RouteMateTerritories from './RouteMateTerritories';
import RouteMateCustomers from './RouteMateCustomers';
import RouteMateVehicles from './RouteMateVehicles';
import RouteMateDrivers from './RouteMateDrivers';
import RouteMateAnalytics from './RouteMateAnalytics';

const RouteMateApp = ({ onClose, BACKEND_URL }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = getAuthToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/analytics/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (e) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'routes', label: 'Routes', icon: Map },
    { id: 'territories', label: 'Territories', icon: MapPin },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView data={dashboardData} loading={loading} setActiveView={setActiveView} />;
      case 'routes':
        return <RouteMateRoutes fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
      case 'territories':
        return <RouteMateTerritories fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
      case 'customers':
        return <RouteMateCustomers fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
      case 'vehicles':
        return <RouteMateVehicles fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
      case 'drivers':
        return <RouteMateDrivers fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
      case 'analytics':
        return <RouteMateAnalytics fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
      default:
        return <DashboardView data={dashboardData} loading={loading} setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Route Mate</h1>
              <p className="text-xs text-gray-500">Territory Planner</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onClose}
          >
            ← Back to Admin
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ data, loading, setActiveView }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome to Integrated Route Mate</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Territories</p>
                <p className="text-3xl font-bold text-gray-900">{data?.territories || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Routes</p>
                <p className="text-3xl font-bold text-gray-900">{data?.routes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Map className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-3xl font-bold text-gray-900">{data?.customers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vehicles</p>
                <p className="text-3xl font-bold text-gray-900">{data?.vehicles || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => setActiveView('routes')}
            >
              <Plus className="w-6 h-6" />
              <span>Create New Route</span>
            </Button>
            
            <Button 
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700"
              onClick={() => setActiveView('territories')}
            >
              <MapPin className="w-6 h-6" />
              <span>Design Territory</span>
            </Button>
            
            <Button 
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => setActiveView('routes')}
            >
              <Play className="w-6 h-6" />
              <span>Optimize Routes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Routes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Routes</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recent_routes && data.recent_routes.length > 0 ? (
            <div className="space-y-3">
              {data.recent_routes.map((route) => (
                <div 
                  key={route.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setActiveView('routes')}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Map className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{route.name}</p>
                      <p className="text-sm text-gray-600">
                        {route.metrics?.total_stops || 0} stops • {route.metrics?.total_distance_miles || 0} mi
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      route.status === 'completed' ? 'bg-green-100 text-green-700' :
                      route.status === 'published' ? 'bg-blue-100 text-blue-700' :
                      route.status === 'optimized' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {route.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No routes yet</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => setActiveView('routes')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Route
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      {(!data || (data.territories === 0 && data.routes === 0)) && (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardHeader>
            <CardTitle>🚀 Getting Started with Route Mate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Vehicles & Drivers</p>
                <p className="text-sm text-gray-600">Set up your fleet and team members</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Import Customers</p>
                <p className="text-sm text-gray-600">Add customer locations and requirements</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Design Territories</p>
                <p className="text-sm text-gray-600">Create balanced service areas</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">Optimize Routes</p>
                <p className="text-sm text-gray-600">Let AI create efficient delivery routes</p>
              </div>
            </div>

            <div className="pt-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setActiveView('vehicles')}>
                Start Setup →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouteMateApp;
