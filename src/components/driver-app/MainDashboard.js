import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const STATUS_COLORS = {
  assigned: 'bg-gray-600',
  pending: 'bg-yellow-600',
  en_route_pickup: 'bg-blue-600',
  arrived_pickup: 'bg-amber-600',
  loaded: 'bg-indigo-600',
  en_route_delivery: 'bg-blue-600',
  arrived_delivery: 'bg-amber-600',
  delivered: 'bg-green-600',
  in_transit: 'bg-blue-600',
  problem: 'bg-red-600'
};

const STATUS_LABELS = {
  assigned: 'Pending',
  pending: 'Pending',
  en_route_pickup: 'In Transit',
  arrived_pickup: 'At Pickup',
  loaded: 'Loaded',
  en_route_delivery: 'In Transit',
  arrived_delivery: 'At Delivery',
  delivered: 'Delivered',
  in_transit: 'In Transit',
  in_transit_pickup: 'In Transit',
  in_transit_delivery: 'In Transit',
  problem: 'Problem'
};

const LoadCard = ({ load, onRoute, onDocs }) => {
  const status = load.status || 'assigned';
  const statusColor = STATUS_COLORS[status] || 'bg-gray-600';
  const statusLabel = STATUS_LABELS[status] || status;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/30 to-gray-900 px-4 py-3 flex items-center justify-between">
        <span className="text-white font-bold">{load.order_number || `ORD-${load.id?.slice(0, 3)}`}</span>
        <span className={`${statusColor} text-white text-xs px-3 py-1 rounded-full font-medium`}>
          {statusLabel}
        </span>
      </div>
      
      {/* Route Info */}
      <div className="px-4 py-3">
        <p className="text-gray-400 text-sm">
          {load.pickup_city || load.origin_city}, {load.pickup_state || load.origin_state} → {load.delivery_city || load.destination_city}, {load.delivery_state || load.destination_state}
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="flex border-t border-gray-800">
        <button
          onClick={() => onRoute(load)}
          className="flex-1 py-3 text-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-r border-gray-800 text-sm font-medium"
        >
          Route
        </button>
        <button
          onClick={() => onDocs(load)}
          className="flex-1 py-3 text-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          Docs
        </button>
      </div>
    </div>
  );
};

const MainDashboard = ({ onNavigate, onSelectLoad }) => {
  const { api, user } = useDriverApp();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoads = async () => {
    try {
      const data = await api('/loads');
      setLoads(data);
    } catch (err) {
      console.error('Failed to fetch loads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const interval = setInterval(fetchLoads, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/50 to-gray-950 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Driver TMS</h1>
          <p className="text-gray-400 text-sm">Welcome, {user?.full_name?.split(' ')[0]}</p>
        </div>
        <button
          onClick={() => onNavigate('menu')}
          className="w-10 h-10 flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Loads List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loads.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-1">No Loads Assigned</h3>
            <p className="text-gray-500 text-sm">Check back later</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {loads.map((load) => (
              <LoadCard
                key={load.id}
                load={load}
                onRoute={() => onSelectLoad(load, 'route')}
                onDocs={() => onSelectLoad(load, 'docs')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDashboard;
