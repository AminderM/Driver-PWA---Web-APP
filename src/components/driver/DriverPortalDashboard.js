import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Truck, MapPin, Package, LogOut, User, RefreshCw } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DriverPortalDashboard = () => {
  const [loads, setLoads] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('driver_user');
    if (!userData) {
      navigate('/driver-portal');
      return;
    }
    setUser(JSON.parse(userData));
    fetchLoads();
  }, [navigate]);

  const fetchLoads = async () => {
    try {
      const token = localStorage.getItem('driver_token');
      const response = await axios.get(`${API_URL}/api/driver/loads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoads(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoads();
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver_user');
    navigate('/driver-portal');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      planned: 'bg-blue-100 text-blue-800',
      in_transit_pickup: 'bg-purple-100 text-purple-800',
      at_pickup: 'bg-cyan-100 text-cyan-800',
      in_transit_delivery: 'bg-purple-100 text-purple-800',
      at_delivery: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Loads</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.full_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/driver-portal/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Profile"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loads assigned</h3>
            <p className="text-gray-600">You don't have any loads assigned at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {loads.map((load) => (
              <div
                key={load.id}
                onClick={() => navigate(`/driver-portal/loads/${load.id}`)}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{load.order_number}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(load.status)}`}>
                        {getStatusLabel(load.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase font-medium">Pickup</p>
                      <p className="text-sm text-gray-900">{load.pickup_city}, {load.pickup_state}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase font-medium">Delivery</p>
                      <p className="text-sm text-gray-900">{load.delivery_city}, {load.delivery_state}</p>
                    </div>
                  </div>
                </div>

                {load.commodity && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Commodity:</span> {load.commodity}
                      {load.weight && ` • ${load.weight} lbs`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DriverPortalDashboard;
