import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';
import { 
  Truck, Package, MapPin, Clock, ChevronRight, RefreshCw, 
  AlertCircle, CheckCircle2, Navigation
} from 'lucide-react';

const STATUS_CONFIG = {
  assigned: { label: 'Assigned', color: 'bg-slate-500', icon: Package },
  en_route_pickup: { label: 'En Route to Pickup', color: 'bg-blue-500', icon: Navigation },
  arrived_pickup: { label: 'At Pickup', color: 'bg-amber-500', icon: MapPin },
  loaded: { label: 'Loaded', color: 'bg-indigo-500', icon: Truck },
  en_route_delivery: { label: 'En Route to Delivery', color: 'bg-blue-500', icon: Navigation },
  arrived_delivery: { label: 'At Delivery', color: 'bg-amber-500', icon: MapPin },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle2 },
  problem: { label: 'Problem', color: 'bg-red-500', icon: AlertCircle },
  // Legacy statuses
  planned: { label: 'Planned', color: 'bg-slate-500', icon: Package },
  in_transit_pickup: { label: 'En Route to Pickup', color: 'bg-blue-500', icon: Navigation },
  at_pickup: { label: 'At Pickup', color: 'bg-amber-500', icon: MapPin },
  in_transit_delivery: { label: 'En Route to Delivery', color: 'bg-blue-500', icon: Navigation },
  at_delivery: { label: 'At Delivery', color: 'bg-amber-500', icon: MapPin },
};

const LoadCard = ({ load, onClick }) => {
  const status = STATUS_CONFIG[load.status] || STATUS_CONFIG.assigned;
  const StatusIcon = status.icon;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">
            #{load.order_number || load.id?.slice(0, 8)}
          </span>
          <span className={`${status.color} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500" />
      </div>

      {/* Route */}
      <div className="space-y-2">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {load.pickup_city || load.origin_city}, {load.pickup_state || load.origin_state}
            </p>
            <p className="text-slate-500 text-xs">
              {formatDate(load.pickup_time_planned || load.pickup_date)} {formatTime(load.pickup_time_planned)}
            </p>
          </div>
        </div>

        {/* Connector */}
        <div className="ml-3 w-0.5 h-4 bg-slate-700" />

        {/* Delivery */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {load.delivery_city || load.destination_city}, {load.delivery_state || load.destination_state}
            </p>
            <p className="text-slate-500 text-xs">
              {formatDate(load.delivery_time_planned || load.delivery_date)} {formatTime(load.delivery_time_planned)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      {load.last_status_update && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2 text-slate-500 text-xs">
          <Clock className="w-3 h-3" />
          Updated {new Date(load.last_status_update).toLocaleString()}
        </div>
      )}
    </button>
  );
};

const LoadsList = ({ onSelectLoad }) => {
  const { api, user } = useDriverApp();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoads = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setError(null);

    try {
      const data = await api('/loads');
      // Sort: active loads first, then by date
      const sorted = data.sort((a, b) => {
        const activeStatuses = ['en_route_pickup', 'arrived_pickup', 'loaded', 'en_route_delivery', 'arrived_delivery', 'in_transit_pickup', 'at_pickup', 'in_transit_delivery', 'at_delivery'];
        const aActive = activeStatuses.includes(a.status);
        const bActive = activeStatuses.includes(b.status);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setLoads(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    // Poll every 60 seconds
    const interval = setInterval(() => fetchLoads(), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-white">My Loads</h1>
          <p className="text-slate-500 text-sm">Hello, {user?.full_name?.split(' ')[0]}</p>
        </div>
        <button
          onClick={() => fetchLoads(true)}
          disabled={refreshing}
          className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center"
        >
          <RefreshCw className={`w-5 h-5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {loads.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-white font-medium mb-1">No Loads Assigned</h3>
            <p className="text-slate-500 text-sm">
              Check back later or contact dispatch
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {loads.map((load) => (
              <LoadCard
                key={load.id}
                load={load}
                onClick={() => onSelectLoad(load)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadsList;
