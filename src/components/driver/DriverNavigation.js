import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Navigation as NavigationIcon } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DriverNavigation = () => {
  const { loadId } = useParams();
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRouteInfo();
  }, [loadId]);

  const fetchRouteInfo = async () => {
    try {
      const token = localStorage.getItem('driver_token');
      const response = await axios.get(`${API_URL}/api/driver/loads/${loadId}/route`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRouteInfo(response.data);
    } catch (error) {
      alert('Failed to fetch route information');
      navigate('/driver-portal/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    if (!routeInfo) return;
    const { origin, destination } = routeInfo;
    const originAddress = `${origin.address}, ${origin.city}, ${origin.state}`;
    const destAddress = `${destination.address}, ${destination.city}, ${destination.state}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${encodeURIComponent(destAddress)}&travelmode=driving`;
    window.open(url, '_blank');
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

  if (!routeInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(`/driver-portal/loads/${loadId}`)}
            className="flex items-center gap-2 text-white hover:text-purple-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Load Details</span>
          </button>
          <h1 className="text-2xl font-bold">Navigation</h1>
          <p className="text-sm text-purple-100 mt-1">{routeInfo.order_number}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Overview</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 uppercase">Pickup Location</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">{routeInfo.origin.address}</p>
                  <p className="text-sm text-gray-600">{routeInfo.origin.city}, {routeInfo.origin.state}, {routeInfo.origin.country}</p>
                </div>
              </div>

              <div className="ml-4 border-l-2 border-dashed border-gray-300 h-8"></div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 uppercase">Delivery Location</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">{routeInfo.destination.address}</p>
                  <p className="text-sm text-gray-600">{routeInfo.destination.city}, {routeInfo.destination.state}, {routeInfo.destination.country}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <button
              onClick={openGoogleMaps}
              className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              <NavigationIcon className="w-5 h-5" />
              Open in Google Maps
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Opens Google Maps with turn-by-turn directions
            </p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Navigation Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure GPS is enabled on your device</li>
            <li>• Check traffic conditions before starting</li>
            <li>• Update load status at each checkpoint</li>
            <li>• Contact dispatch if you encounter any issues</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default DriverNavigation;
