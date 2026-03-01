import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Package, TrendingUp, Navigation, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DriverLoadDetails = () => {
  const { loadId } = useParams();
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoadDetails();
  }, [loadId]);

  const fetchLoadDetails = async () => {
    try {
      const token = localStorage.getItem('driver_token');
      const response = await axios.get(`${API_URL}/api/driver/loads/${loadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoad(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/driver-portal');
      } else if (error.response?.status === 404) {
        alert('Load not found');
        navigate('/driver-portal/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLoad = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('driver_token');
      await axios.post(`${API_URL}/api/driver/loads/${loadId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Load accepted successfully!');
      fetchLoadDetails();
    } catch (error) {
      alert('Failed to accept load');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('driver_token');
      await axios.put(
        `${API_URL}/api/driver/loads/${loadId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Status updated successfully!');
      fetchLoadDetails();
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'planned',
      planned: 'in_transit_pickup',
      in_transit_pickup: 'at_pickup',
      at_pickup: 'in_transit_delivery',
      in_transit_delivery: 'at_delivery',
      at_delivery: 'delivered',
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return null;
    return nextStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  if (!load) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/driver-portal/dashboard')}
            className="flex items-center gap-2 text-white hover:text-blue-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Loads</span>
          </button>
          <h1 className="text-2xl font-bold">{load.order_number}</h1>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(load.status)}`}>
            {load.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Route Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-1">Pickup Location</p>
                <p className="text-sm text-gray-700">{load.pickup_location}</p>
                <p className="text-xs text-gray-600 mt-1">{load.pickup_city}, {load.pickup_state}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
              <MapPin className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 mb-1">Delivery Location</p>
                <p className="text-sm text-gray-700">{load.delivery_location}</p>
                <p className="text-xs text-gray-600 mt-1">{load.delivery_city}, {load.delivery_state}</p>
              </div>
            </div>
          </div>
        </div>

        {load.commodity && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Cargo Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Commodity</p>
                <p className="text-base font-medium text-gray-900">{load.commodity}</p>
              </div>
              {load.weight && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Weight</p>
                  <p className="text-base font-medium text-gray-900">{load.weight} lbs</p>
                </div>
              )}
            </div>
          </div>
        )}

        {load.confirmed_rate && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rate Information</h2>
            <div>
              <p className="text-sm text-gray-600 mb-1">Confirmed Rate</p>
              <p className="text-2xl font-bold text-green-600">${load.confirmed_rate}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {load.status === 'pending' && (
            <button
              onClick={handleAcceptLoad}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {updating ? 'Accepting...' : 'Accept Load'}
            </button>
          )}

          {load.status !== 'pending' && load.status !== 'delivered' && getNextStatus(load.status) && (
            <button
              onClick={() => handleUpdateStatus(getNextStatus(load.status))}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="w-5 h-5" />
              {updating ? 'Updating...' : `Update to: ${getNextStatusLabel(load.status)}`}
            </button>
          )}

          {load.status !== 'pending' && (
            <button
              onClick={() => navigate(`/driver-portal/navigation/${load.id}`)}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Navigation className="w-5 h-5" />
              Start Navigation
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverLoadDetails;
