import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const STATUS_CONFIG = {
  assigned: { label: 'Assigned', color: 'bg-gray-600', next: 'en_route_pickup', nextLabel: 'Start Route to Pickup' },
  en_route_pickup: { label: 'En Route to Pickup', color: 'bg-blue-600', next: 'arrived_pickup', nextLabel: 'Arrived at Pickup' },
  arrived_pickup: { label: 'At Pickup', color: 'bg-amber-600', next: 'loaded', nextLabel: 'Loaded & Departing' },
  loaded: { label: 'Loaded', color: 'bg-indigo-600', next: 'en_route_delivery', nextLabel: 'Start Route to Delivery' },
  en_route_delivery: { label: 'En Route to Delivery', color: 'bg-blue-600', next: 'arrived_delivery', nextLabel: 'Arrived at Delivery' },
  arrived_delivery: { label: 'At Delivery', color: 'bg-amber-600', next: 'delivered', nextLabel: 'Mark Delivered' },
  delivered: { label: 'Delivered', color: 'bg-green-600', next: null },
  problem: { label: 'Problem', color: 'bg-red-600', next: null },
};

const RouteScreen = ({ load: initialLoad, onBack }) => {
  const { api, currentLocation, setActiveLoadId } = useDriverApp();
  const [load, setLoad] = useState(initialLoad);
  const [updating, setUpdating] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const [problemNote, setProblemNote] = useState('');

  useEffect(() => {
    setActiveLoadId(load.id);
    return () => setActiveLoadId(null);
  }, [load.id, setActiveLoadId]);

  const refreshLoad = async () => {
    try {
      const data = await api(`/loads/${load.id}`);
      setLoad(data);
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
  };

  const updateStatus = async (newStatus, note = '') => {
    setUpdating(true);
    try {
      await api(`/loads/${load.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          note,
          latitude: currentLocation?.lat,
          longitude: currentLocation?.lng
        })
      });
      await refreshLoad();
      setShowProblem(false);
      setProblemNote('');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const status = STATUS_CONFIG[load.status] || STATUS_CONFIG.assigned;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-gray-950 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{load.order_number || 'Load Details'}</h1>
          <span className={`${status.color} text-white text-xs px-2 py-0.5 rounded-full`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Route Summary */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4">
          {/* Pickup */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div>
              <p className="text-green-400 text-xs font-medium">PICKUP</p>
              <p className="text-white font-medium">{load.pickup_location || 'Address TBD'}</p>
              <p className="text-gray-500 text-sm">{load.pickup_city}, {load.pickup_state}</p>
              <p className="text-gray-600 text-xs mt-1">{formatDateTime(load.pickup_time_planned)}</p>
            </div>
          </div>

          <div className="ml-4 w-0.5 h-6 bg-gray-700 mb-4" />

          {/* Delivery */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div>
              <p className="text-red-400 text-xs font-medium">DELIVERY</p>
              <p className="text-white font-medium">{load.delivery_location || 'Address TBD'}</p>
              <p className="text-gray-500 text-sm">{load.delivery_city}, {load.delivery_state}</p>
              <p className="text-gray-600 text-xs mt-1">{formatDateTime(load.delivery_time_planned)}</p>
            </div>
          </div>
        </div>

        {/* Load Details */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4">
          <h3 className="text-gray-400 text-xs font-medium mb-3">LOAD INFO</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {load.equipment_type && (
              <div>
                <p className="text-gray-500">Equipment</p>
                <p className="text-white">{load.equipment_type}</p>
              </div>
            )}
            {load.weight && (
              <div>
                <p className="text-gray-500">Weight</p>
                <p className="text-white">{load.weight.toLocaleString()} lbs</p>
              </div>
            )}
            {load.commodity && (
              <div className="col-span-2">
                <p className="text-gray-500">Commodity</p>
                <p className="text-white">{load.commodity}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Update */}
        {status.next && (
          <button
            onClick={() => updateStatus(status.next)}
            disabled={updating}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl mb-3 disabled:opacity-50"
          >
            {updating ? 'Updating...' : status.nextLabel}
          </button>
        )}

        {/* Problem Report */}
        {load.status !== 'delivered' && load.status !== 'problem' && (
          <>
            {!showProblem ? (
              <button
                onClick={() => setShowProblem(true)}
                className="w-full bg-red-600/20 border border-red-600/50 text-red-400 py-3 rounded-xl"
              >
                Report Problem
              </button>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-red-600/50 p-4">
                <textarea
                  value={problemNote}
                  onChange={(e) => setProblemNote(e.target.value)}
                  placeholder="Describe the problem..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 mb-3 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowProblem(false)}
                    className="flex-1 bg-gray-700 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateStatus('problem', problemNote)}
                    disabled={!problemNote.trim() || updating}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RouteScreen;
