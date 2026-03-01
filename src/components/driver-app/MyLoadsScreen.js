import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const STATUS_CONFIG = {
  available: { label: 'AVAILABLE', color: 'bg-green-600' },
  assigned: { label: 'PENDING', color: 'bg-amber-600' },
  pending: { label: 'PENDING', color: 'bg-amber-600' },
  en_route_pickup: { label: 'EN ROUTE', color: 'bg-blue-600' },
  arrived_pickup: { label: 'AT PICKUP', color: 'bg-amber-600' },
  loaded: { label: 'LOADED', color: 'bg-indigo-600' },
  en_route_delivery: { label: 'EN ROUTE', color: 'bg-blue-600' },
  arrived_delivery: { label: 'AT DELIVERY', color: 'bg-amber-600' },
  delivered: { label: 'DELIVERED', color: 'bg-green-600' },
  rejected: { label: 'REJECTED', color: 'bg-red-600' },
};

// Load Offer Card - Uber style with TMS theme
const LoadOfferCard = ({ load, onAccept, onReject, onViewRoute, accepting, theme }) => {
  const isDark = theme === 'dark';
  const estimatedMiles = load.estimated_miles || Math.floor(Math.random() * 300 + 100);
  const estimatedPay = load.rate || (estimatedMiles * 2.5).toFixed(0);
  const estimatedTime = load.estimated_hours || Math.ceil(estimatedMiles / 50);

  return (
    <div className={`border mb-4 animate-slideUp ${isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]'}`}>
      {/* Header */}
      <div className="bg-red-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="text-white font-semibold text-sm tracking-wider">NEW LOAD</span>
        </div>
        <span className="text-white font-bold">{load.order_number || `#${load.id?.slice(0, 6)}`}</span>
      </div>

      {/* Route */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 bg-green-600"></div>
            <div className="w-0.5 h-16 bg-gradient-to-b from-green-600 to-red-600"></div>
            <div className="w-4 h-4 bg-red-600"></div>
          </div>
          
          <div className="flex-1">
            <div className="mb-4">
              <p className={`text-xs font-medium tracking-wider ${isDark ? 'text-white/50' : 'text-black/50'}`}>PICKUP</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {load.pickup_city || load.origin_city}, {load.pickup_state || load.origin_state}
              </p>
              <p className={`text-sm truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {load.pickup_location || 'Address TBD'}
              </p>
            </div>
            
            <div>
              <p className={`text-xs font-medium tracking-wider ${isDark ? 'text-white/50' : 'text-black/50'}`}>DELIVERY</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {load.delivery_city || load.destination_city}, {load.delivery_state || load.destination_state}
              </p>
              <p className={`text-sm truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {load.delivery_location || 'Address TBD'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-3">
        <div className={`p-3 text-center ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>DISTANCE</p>
          <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{estimatedMiles} mi</p>
        </div>
        <div className={`p-3 text-center ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>EST. TIME</p>
          <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{estimatedTime}h</p>
        </div>
        <div className="bg-green-600/20 border border-green-600/50 p-3 text-center">
          <p className="text-xs text-green-500">PAY</p>
          <p className="text-green-500 font-bold text-lg">${estimatedPay}</p>
        </div>
      </div>

      {/* Tags */}
      {(load.equipment_type || load.commodity) && (
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {load.equipment_type && (
            <span className={`text-xs px-3 py-1 ${isDark ? 'bg-[#171717] text-white/70' : 'bg-[#f5f5f5] text-black/70'}`}>
              {load.equipment_type}
            </span>
          )}
          {load.commodity && (
            <span className={`text-xs px-3 py-1 ${isDark ? 'bg-[#171717] text-white/70' : 'bg-[#f5f5f5] text-black/70'}`}>
              {load.commodity}
            </span>
          )}
        </div>
      )}

      {/* View Route */}
      <div className="px-4 pb-3">
        <button
          onClick={() => onViewRoute(load)}
          className={`w-full py-3 flex items-center justify-center gap-2 transition-colors border ${
            isDark 
              ? 'bg-[#171717] hover:bg-[#262626] text-white border-[#262626]' 
              : 'bg-[#f5f5f5] hover:bg-[#e5e5e5] text-black border-[#e5e5e5]'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          VIEW ROUTE ON MAP
        </button>
      </div>

      {/* Actions */}
      <div className={`flex border-t ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button
          onClick={() => onReject(load)}
          className={`flex-1 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
            isDark ? 'hover:bg-red-600/10' : 'hover:bg-red-50'
          } text-red-600`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          REJECT
        </button>
        <div className={`w-px ${isDark ? 'bg-[#262626]' : 'bg-[#e5e5e5]'}`}></div>
        <button
          onClick={() => onAccept(load)}
          disabled={accepting}
          className={`flex-1 py-4 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
            isDark ? 'hover:bg-green-600/10' : 'hover:bg-green-50'
          } text-green-600`}
        >
          {accepting ? (
            <div className="w-5 h-5 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          ACCEPT
        </button>
      </div>
    </div>
  );
};

// Active Load Card
const ActiveLoadCard = ({ load, onViewRoute, onViewDetails, theme }) => {
  const isDark = theme === 'dark';
  const status = STATUS_CONFIG[load.status] || STATUS_CONFIG.assigned;
  
  return (
    <div className={`border mb-3 ${isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]'}`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {load.order_number || `#${load.id?.slice(0, 6)}`}
            </span>
            <span className={`${status.color} text-white text-xs px-2 py-0.5`}>
              {status.label}
            </span>
          </div>
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {load.pickup_city}, {load.pickup_state} → {load.delivery_city}, {load.delivery_state}
          </p>
        </div>
        <svg className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-black/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      
      <div className={`flex border-t ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button
          onClick={() => onViewRoute(load)}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 text-red-600 ${
            isDark ? 'hover:bg-red-600/10' : 'hover:bg-red-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          NAVIGATE
        </button>
        <div className={`w-px ${isDark ? 'bg-[#262626]' : 'bg-[#e5e5e5]'}`}></div>
        <button
          onClick={() => onViewDetails(load)}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            isDark ? 'text-white/60 hover:bg-[#171717]' : 'text-black/60 hover:bg-[#f5f5f5]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          DETAILS
        </button>
      </div>
    </div>
  );
};

const MyLoadsScreen = ({ onNavigate, onSelectLoad, onViewMap }) => {
  const { api, user, theme, toggleTheme } = useDriverApp();
  const [availableLoads, setAvailableLoads] = useState([]);
  const [activeLoads, setActiveLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [tab, setTab] = useState('available');

  const isDark = theme === 'dark';

  const fetchLoads = async () => {
    try {
      const data = await api('/loads');
      const available = data.filter(l => 
        l.status === 'available' || l.status === 'assigned' || l.status === 'pending'
      );
      const active = data.filter(l => 
        !['available', 'assigned', 'pending', 'delivered', 'rejected'].includes(l.status)
      );
      setAvailableLoads(available);
      setActiveLoads(active);
    } catch (err) {
      console.error('Failed to fetch loads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const interval = setInterval(fetchLoads, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (load) => {
    setAccepting(load.id);
    try {
      await api(`/loads/${load.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ accepted: true })
      });
      await fetchLoads();
      setTab('active');
    } catch (err) {
      try {
        await api(`/loads/${load.id}/status`, {
          method: 'POST',
          body: JSON.stringify({ status: 'en_route_pickup', note: 'Load accepted' })
        });
        await fetchLoads();
        setTab('active');
      } catch (e) {
        console.error('Failed to accept:', e);
      }
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (load) => {
    try {
      await api(`/loads/${load.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejected: true, reason: 'Driver rejected' })
      });
      await fetchLoads();
    } catch (err) {
      setAvailableLoads(prev => prev.filter(l => l.id !== load.id));
    }
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col font-['Oxanium'] ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center justify-between border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <div>
          <h1 className={`text-xl font-bold tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>MY LOADS</h1>
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Welcome, {user?.full_name?.split(' ')[0]}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 flex items-center justify-center border ${
              isDark ? 'border-[#262626] text-white' : 'border-[#e5e5e5] text-black'
            }`}
          >
            {isDark ? (
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          {/* Menu */}
          <button
            onClick={() => onNavigate('menu')}
            className={`w-10 h-10 flex items-center justify-center ${isDark ? 'text-white' : 'text-black'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button
          onClick={() => setTab('available')}
          className={`flex-1 py-3 text-sm font-medium tracking-wider transition-colors relative ${
            tab === 'available' 
              ? 'text-red-600' 
              : isDark ? 'text-white/50' : 'text-black/50'
          }`}
        >
          AVAILABLE
          {availableLoads.length > 0 && (
            <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.5">
              {availableLoads.length}
            </span>
          )}
          {tab === 'available' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
        </button>
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-3 text-sm font-medium tracking-wider transition-colors relative ${
            tab === 'active' 
              ? 'text-red-600' 
              : isDark ? 'text-white/50' : 'text-black/50'
          }`}
        >
          ACTIVE
          {activeLoads.length > 0 && (
            <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.5">
              {activeLoads.length}
            </span>
          )}
          {tab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'available' ? (
          availableLoads.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
                <svg className={`w-8 h-8 ${isDark ? 'text-white/30' : 'text-black/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-black'}`}>NO LOADS AVAILABLE</h3>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>New loads will appear here</p>
            </div>
          ) : (
            availableLoads.map(load => (
              <LoadOfferCard
                key={load.id}
                load={load}
                onAccept={handleAccept}
                onReject={handleReject}
                onViewRoute={(l) => onViewMap(l)}
                accepting={accepting === load.id}
                theme={theme}
              />
            ))
          )
        ) : (
          activeLoads.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
                <svg className={`w-8 h-8 ${isDark ? 'text-white/30' : 'text-black/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-black'}`}>NO ACTIVE LOADS</h3>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Accept a load to get started</p>
            </div>
          ) : (
            activeLoads.map(load => (
              <ActiveLoadCard
                key={load.id}
                load={load}
                onViewRoute={(l) => onViewMap(l)}
                onViewDetails={(l) => onSelectLoad(l, 'route')}
                theme={theme}
              />
            ))
          )
        )}
      </div>
    </div>
  );
};

export default MyLoadsScreen;
