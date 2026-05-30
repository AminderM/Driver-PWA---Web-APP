import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';
import { getNetworkStatus, isNative } from '../../lib/native';
import { PENDING_STATUSES, TERMINAL_STATUSES } from './loadConstants';

const STATUS_CONFIG = {
  available:         { label: 'NEW LOAD',    color: 'bg-red-600'    },
  assigned:          { label: 'PENDING',     color: 'bg-amber-600'  },
  pending:           { label: 'PENDING',     color: 'bg-amber-600'  },
  en_route_pickup:   { label: 'EN ROUTE',    color: 'bg-blue-600'   },
  arrived_pickup:    { label: 'AT PICKUP',   color: 'bg-amber-600'  },
  loaded:            { label: 'LOADED',      color: 'bg-indigo-600' },
  en_route_delivery: { label: 'EN ROUTE',    color: 'bg-blue-600'   },
  arrived_delivery:  { label: 'AT DELIVERY', color: 'bg-amber-600'  },
  delivered:         { label: 'DELIVERED',   color: 'bg-green-600'  },
  rejected:          { label: 'REJECTED',    color: 'bg-red-600'    },
};

// Load Offer Card
const LoadOfferCard = ({ load, onAccept, onReject, onViewRoute, accepting, acceptError, theme }) => {
  const isDark = theme === 'dark';

  // Stable values — no Math.random()
  const miles   = load.estimated_miles  || load.distance_miles  || null;
  const pay     = load.rate             || load.total_rate       || null;
  const hours   = load.estimated_hours  || (miles ? Math.ceil(miles / 55) : null);

  return (
    <div className={`border mb-4 ${isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]'}`}>
      {/* Header */}
      <div className="bg-red-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <span className="text-white font-semibold text-base tracking-wider">NEW LOAD</span>
        </div>
        <span className="text-white font-bold tracking-wider">
          {load.order_number || `LD-${load.id?.slice(0, 8).toUpperCase()}`}
        </span>
      </div>

      {/* Route */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-1">
            <div className="w-4 h-4 bg-green-600" />
            <div className="w-0.5 h-14 bg-gradient-to-b from-green-600 to-red-600" />
            <div className="w-4 h-4 bg-red-600" />
          </div>
          <div className="flex-1">
            <div className="mb-4">
              <p className={`text-sm font-medium tracking-wider ${isDark ? 'text-white/50' : 'text-black/50'}`}>PICKUP</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {load.pickup_city || load.origin_city}{load.pickup_state || load.origin_state ? `, ${load.pickup_state || load.origin_state}` : ''}
              </p>
              <p className={`text-base truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {load.pickup_location || load.origin_address || 'Address TBD'}
              </p>
            </div>
            <div>
              <p className={`text-sm font-medium tracking-wider ${isDark ? 'text-white/50' : 'text-black/50'}`}>DELIVERY</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {load.delivery_city || load.destination_city}{load.delivery_state || load.destination_state ? `, ${load.delivery_state || load.destination_state}` : ''}
              </p>
              <p className={`text-base truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {load.delivery_location || load.destination_address || 'Address TBD'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-3">
        <div className={`p-3 text-center ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>DISTANCE</p>
          <p className={`font-bold text-xl ${isDark ? 'text-white' : 'text-black'}`}>
            {miles != null ? `${miles} mi` : '—'}
          </p>
        </div>
        <div className={`p-3 text-center ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>EST. TIME</p>
          <p className={`font-bold text-xl ${isDark ? 'text-white' : 'text-black'}`}>
            {hours != null ? `${hours}h` : '—'}
          </p>
        </div>
        <div className="bg-green-600/20 border border-green-600/50 p-3 text-center">
          <p className="text-sm text-green-500">PAY</p>
          <p className="text-green-500 font-bold text-xl">
            {pay != null ? `$${Number(pay).toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {/* Equipment tags */}
      {(load.equipment_type || load.commodity) && (
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {load.equipment_type && (
            <span className={`text-sm px-3 py-1 ${isDark ? 'bg-[#171717] text-white/70' : 'bg-[#f5f5f5] text-black/70'}`}>
              {load.equipment_type}
            </span>
          )}
          {load.commodity && (
            <span className={`text-sm px-3 py-1 ${isDark ? 'bg-[#171717] text-white/70' : 'bg-[#f5f5f5] text-black/70'}`}>
              {load.commodity}
            </span>
          )}
        </div>
      )}

      {/* View Route button */}
      <div className="px-4 pb-3">
        <button
          onClick={() => onViewRoute(load)}
          className={`w-full py-3 flex items-center justify-center gap-2 border transition-colors ${
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

      {/* Accept error */}
      {acceptError && (
        <div className="mx-4 mb-3 bg-red-600/20 border border-red-600/50 px-4 py-3">
          <p className="text-red-500 text-base">{acceptError}</p>
        </div>
      )}

      {/* Accept / Reject */}
      <div className={`flex border-t ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button
          onClick={() => onReject(load)}
          disabled={accepting}
          className={`flex-1 py-4 font-semibold tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-40 text-red-600 active:scale-95 ${
            isDark ? 'hover:bg-red-600/10 active:bg-red-600/20' : 'hover:bg-red-50 active:bg-red-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          REJECT
        </button>
        <div className={`w-px ${isDark ? 'bg-[#262626]' : 'bg-[#e5e5e5]'}`} />
        <button
          onClick={() => onAccept(load)}
          disabled={accepting}
          className={`flex-1 py-4 font-semibold tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-40 text-green-600 active:scale-95 ${
            isDark ? 'hover:bg-green-600/10 active:bg-green-600/20' : 'hover:bg-green-50 active:bg-green-100'
          }`}
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
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => onViewDetails(load)}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-bold tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
              {load.order_number || `LD-${load.id?.slice(0, 8).toUpperCase()}`}
            </span>
            <span className={`${status.color} text-white text-sm px-2 py-0.5 tracking-wider`}>
              {status.label}
            </span>
          </div>
          <p className={`text-base ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {load.pickup_city || load.origin_city} → {load.delivery_city || load.destination_city}
          </p>
        </div>
        <svg className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-black/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className={`flex border-t ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button
          onClick={() => onViewRoute(load)}
          className={`flex-1 py-3 text-base font-medium tracking-wider transition-colors flex items-center justify-center gap-1 text-red-600 ${
            isDark ? 'hover:bg-red-600/10' : 'hover:bg-red-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          NAVIGATE
        </button>
        <div className={`w-px ${isDark ? 'bg-[#262626]' : 'bg-[#e5e5e5]'}`} />
        <button
          onClick={() => onViewDetails(load)}
          className={`flex-1 py-3 text-base font-medium tracking-wider transition-colors flex items-center justify-center gap-1 ${
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

const MyLoadsScreen = ({ onNavigate, onSelectLoad, onViewMap, hideMenu }) => {
  const { api, user, theme, locationPingFailing } = useDriverApp();
  const [availableLoads, setAvailableLoads] = useState([]);
  const [activeLoads, setActiveLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null); // M25
  const [isOffline, setIsOffline] = useState(false); // M18
  const [accepting, setAccepting] = useState(null);
  const [acceptError, setAcceptError] = useState(null);
  const [tab, setTab] = useState('available');
  const isDark = theme === 'dark';

  const fetchLoads = async () => {
    // M18: check connectivity before making the request
    const net = await getNetworkStatus();
    if (!net.connected) { setIsOffline(true); setLoading(false); return; }
    setIsOffline(false);
    setFetchError(null);
    try {
      const data = await api('/loads');
      const available = data.filter(l => PENDING_STATUSES.includes(l.status));
      const active = data.filter(l =>
        !PENDING_STATUSES.includes(l.status) && !TERMINAL_STATUSES.includes(l.status)
      );
      setAvailableLoads(available);
      setActiveLoads(active);
    } catch (err) {
      console.error('Failed to fetch loads:', err);
      setFetchError(err.message || 'Failed to load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const interval = setInterval(fetchLoads, 30000);

    // M22: pause polling when app is backgrounded to save battery
    let pauseHandle;
    let resumeHandle;
    if (isNative()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('pause', () => clearInterval(interval)).then(h => { pauseHandle = h; });
        App.addListener('resume', fetchLoads).then(h => { resumeHandle = h; });
      });
    }

    return () => {
      clearInterval(interval);
      pauseHandle?.remove();
      resumeHandle?.remove();
    };
  }, []); // eslint-disable-line

  const handleAccept = async (load) => {
    setAccepting(load.id);
    setAcceptError(null);
    try {
      // Try the dedicated accept endpoint first
      await api(`/loads/${load.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ accepted: true }),
      });
      await fetchLoads();
      setTab('active');
      // Navigate to route screen
      onSelectLoad(load, 'route');
    } catch {
      // Fall back to status update
      try {
        await api(`/loads/${load.id}/status`, {
          method: 'POST',
          body: JSON.stringify({ status: 'en_route_pickup', note: 'Load accepted by driver' }),
        });
        await fetchLoads();
        setTab('active');
        onSelectLoad(load, 'route');
      } catch (err2) {
        setAcceptError({ loadId: load.id, message: err2.message || 'Failed to accept load. Please try again.' });
      }
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (load) => {
    try {
      await api(`/loads/${load.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejected: true, reason: 'Driver rejected' }),
      });
      await fetchLoads();
    } catch {
      // Optimistically remove from list if endpoint isn't available
      setAvailableLoads(prev => prev.filter(l => l.id !== load.id));
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center justify-between border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <div>
          <h1 className={`text-2xl font-bold tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>MY LOADS</h1>
        </div>
        {!hideMenu && (
          <button
            onClick={() => onNavigate('menu')}
            aria-label="Open menu"
            className={`w-12 h-12 flex items-center justify-center active:opacity-60 transition-opacity ${isDark ? 'text-white' : 'text-black'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        {[
          { id: 'available', label: 'AVAILABLE', count: availableLoads.length },
          { id: 'active',    label: 'ACTIVE',    count: activeLoads.length    },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-base font-medium tracking-wider transition-colors relative ${
              tab === t.id ? 'text-red-600' : isDark ? 'text-white/50' : 'text-black/50'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 bg-red-600 text-white text-sm px-1.5 py-0.5">{t.count}</span>
            )}
            {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
          </button>
        ))}
      </div>

      {/* Location ping failure warning — C1 */}
      {locationPingFailing && (
        <div className="px-4 py-2 bg-amber-600/20 border-b border-amber-600/30 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <p className="text-amber-400 text-xs tracking-wider">LOCATION UPDATES FAILING — Dispatch may not see your position</p>
        </div>
      )}

      {/* Offline / error banner — M18, M25 */}
      {(isOffline || fetchError) && (
        <div className={`px-4 py-3 flex items-center justify-between ${isOffline ? 'bg-amber-600/20 border-b border-amber-600/30' : 'bg-[#CC2222]/20 border-b border-[#CC2222]/30'}`}>
          <p className={`text-sm font-medium tracking-wider ${isOffline ? 'text-amber-400' : 'text-[#FF5555]'}`}>
            {isOffline ? 'NO CONNECTION — Showing cached data' : fetchError}
          </p>
          <button
            onClick={fetchLoads}
            className={`text-sm font-bold tracking-wider ml-3 shrink-0 ${isOffline ? 'text-amber-400' : 'text-[#FF5555]'}`}
          >
            RETRY
          </button>
        </div>
      )}

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
              <h3 className={`font-medium mb-1 tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>NO LOADS AVAILABLE</h3>
              <p className={`text-base ${isDark ? 'text-white/50' : 'text-black/50'}`}>New loads will appear here</p>
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
                acceptError={acceptError?.loadId === load.id ? acceptError.message : null}
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
              <h3 className={`font-medium mb-1 tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>NO ACTIVE LOADS</h3>
              <p className={`text-base ${isDark ? 'text-white/50' : 'text-black/50'}`}>Accept a load to get started</p>
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
