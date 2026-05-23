import React, { useState, useEffect, useCallback } from 'react';
import { useDriverApp } from './DriverAppProvider';
import RateConScanner from './RateConScanner';
import LoadEntryForm from './LoadEntryForm';

const STATUS_FILTERS = [
  { value: 'all',        label: 'All'        },
  { value: 'upcoming',   label: 'Upcoming'   },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered',  label: 'Delivered'  },
  { value: 'invoiced',   label: 'Invoiced'   },
];

const STATUS_CONFIG = {
  upcoming:   { label: 'UPCOMING',    bg: 'bg-amber-600',  text: 'text-amber-400',  border: 'border-amber-600/30'  },
  in_transit: { label: 'IN TRANSIT',  bg: 'bg-blue-600',   text: 'text-blue-400',   border: 'border-blue-600/30'   },
  delivered:  { label: 'DELIVERED',   bg: 'bg-green-600',  text: 'text-green-400',  border: 'border-green-600/30'  },
  invoiced:   { label: 'INVOICED',    bg: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-600/30' },
};

const ManualLoadsScreen = ({ onBack }) => {
  const { api, theme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-black'         : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#0a0a0a]'     : 'bg-white';
  const text    = isDark ? 'text-white'        : 'text-black';
  const subtext = isDark ? 'text-white/60'     : 'text-black/60';
  const border  = isDark ? 'border-[#262626]'  : 'border-[#e5e5e5]';

  const [loads,        setLoads]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [screen,       setScreen]       = useState('list');  // 'list' | 'scanner' | 'form'
  const [editLoad,     setEditLoad]     = useState(null);
  const [prefillData,  setPrefillData]  = useState({});
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [fetchError,   setFetchError]   = useState('');

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await api('/my-loads');
      setLoads(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError('Could not load your loads. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);

  const handleSave = (result) => {
    if (result === null) {
      // Deleted
      setLoads(prev => prev.filter(l => l.id !== editLoad?.id));
    } else if (editLoad) {
      setLoads(prev => prev.map(l => l.id === result.id ? result : l));
    } else {
      setLoads(prev => [result, ...prev]);
    }
    setScreen('list');
    setEditLoad(null);
    setPrefillData({});
  };

  const handleParsed = (parsed) => {
    setPrefillData(parsed);
    setEditLoad(null);
    setScreen('form');
  };

  const openEdit = (load) => {
    setEditLoad(load);
    setPrefillData({});
    setScreen('form');
  };

  // ── Sub-screens ───────────────────────────────────────────────────────────
  if (screen === 'scanner') {
    return (
      <RateConScanner
        onParsed={handleParsed}
        onCancel={() => { setScreen('form'); setPrefillData({}); }}
      />
    );
  }

  if (screen === 'form') {
    return (
      <LoadEntryForm
        prefill={prefillData}
        existingLoad={editLoad}
        onSave={handleSave}
        onCancel={() => { setScreen('list'); setEditLoad(null); setPrefillData({}); }}
      />
    );
  }

  // ── Load card ─────────────────────────────────────────────────────────────
  const LoadCard = ({ load }) => {
    const cfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.upcoming;
    const rpm = load.rate && load.estimated_miles
      ? `$${(load.rate / load.estimated_miles).toFixed(2)}/mi`
      : null;

    return (
      <button onClick={() => openEdit(load)} className={`w-full text-left ${surface} border ${border} overflow-hidden mb-3`}>
        {/* Status bar */}
        <div className={`${cfg.bg} px-4 py-1.5 flex items-center justify-between`}>
          <span className="text-white text-xs font-bold tracking-widest">{cfg.label}</span>
          {load.pickup_date && (
            <span className="text-white/70 text-xs">
              {new Date(load.pickup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <div className="px-4 py-3">
          {/* Route */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${subtext} tracking-wider`}>FROM</p>
              <p className={`text-sm font-bold truncate ${text}`}>{load.origin || '—'}</p>
            </div>
            <svg className={`w-5 h-5 flex-shrink-0 ${subtext}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex-1 min-w-0 text-right">
              <p className={`text-xs ${subtext} tracking-wider`}>TO</p>
              <p className={`text-sm font-bold truncate ${text}`}>{load.destination || '—'}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className={`grid grid-cols-3 gap-2 mt-2 pt-2 border-t ${border}`}>
            <div className={`text-center p-2 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
              <p className={`text-xs ${subtext} tracking-wider`}>RATE</p>
              <p className={`text-sm font-bold ${text}`}>
                {load.rate ? `$${Number(load.rate).toLocaleString()}` : '—'}
              </p>
            </div>
            <div className={`text-center p-2 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
              <p className={`text-xs ${subtext} tracking-wider`}>MILES</p>
              <p className={`text-sm font-bold ${text}`}>
                {load.estimated_miles ? Number(load.estimated_miles).toLocaleString() : '—'}
              </p>
            </div>
            <div className={`text-center p-2 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
              <p className={`text-xs ${subtext} tracking-wider`}>RPM</p>
              <p className={`text-sm font-bold ${rpm ? 'text-green-400' : text}`}>{rpm || '—'}</p>
            </div>
          </div>

          {/* Broker / commodity */}
          {(load.broker_name || load.commodity) && (
            <p className={`text-xs mt-2 ${subtext} truncate`}>
              {[load.broker_name, load.commodity].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </button>
    );
  };

  // ── Summary counts ────────────────────────────────────────────────────────
  const counts = loads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = loads
    .filter(l => l.status === 'delivered' || l.status === 'invoiced')
    .reduce((sum, l) => sum + (Number(l.rate) || 0), 0);

  // ── Main list ─────────────────────────────────────────────────────────────
  return (
    <div className={`flex-1 flex flex-col font-['Oxanium'] ${bg}`}>
      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <div className="flex items-center justify-between mb-1">
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>MY LOADS</h1>
          <button
            onClick={() => setShowAddSheet(true)}
            className="w-10 h-10 bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Revenue summary */}
        {totalRevenue > 0 && (
          <p className={`text-xs ${subtext}`}>
            Delivered + invoiced: <span className="text-green-400 font-semibold">${totalRevenue.toLocaleString()}</span>
          </p>
        )}

        {/* Status filter tabs */}
        <div className={`flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1`} style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map(f => {
            const count = f.value === 'all' ? loads.length : (counts[f.value] || 0);
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold tracking-wider border transition-colors ${
                  filter === f.value
                    ? 'bg-red-600 border-red-600 text-white'
                    : `${border} ${subtext}`
                }`}
              >
                {f.label.toUpperCase()}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] ${filter === f.value ? 'text-white/70' : subtext}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {fetchError && (
          <div className="bg-red-600/20 border border-red-600/50 p-4 mb-4">
            <p className="text-red-400 text-sm">{fetchError}</p>
            <button onClick={fetchLoads} className="text-red-400 text-xs mt-2 underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${subtext}`}>Loading loads...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className={`w-16 h-16 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'} border ${border} flex items-center justify-center mb-4`}>
              <svg className={`w-8 h-8 ${subtext}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
              </svg>
            </div>
            <p className={`text-base font-bold tracking-wider mb-2 ${text}`}>
              {filter === 'all' ? 'NO LOADS YET' : `NO ${filter.toUpperCase().replace('_', ' ')} LOADS`}
            </p>
            <p className={`text-sm mb-6 ${subtext}`}>
              {filter === 'all'
                ? 'Add your first load manually or scan a rate confirmation.'
                : 'No loads with this status.'}
            </p>
            {filter === 'all' && (
              <button onClick={() => setShowAddSheet(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 tracking-wider transition-colors">
                + ADD LOAD
              </button>
            )}
          </div>
        ) : (
          filtered.map(load => <LoadCard key={load.id} load={load} />)
        )}
      </div>

      {/* Add load bottom sheet */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setShowAddSheet(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className={`relative ${surface} border-t ${border} px-5 pt-5 pb-10`}
            onClick={e => e.stopPropagation()}>
            <div className={`w-10 h-1 ${isDark ? 'bg-white/20' : 'bg-black/20'} mx-auto mb-5`} />
            <p className={`text-xs font-bold tracking-widest mb-4 ${subtext}`}>ADD LOAD</p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowAddSheet(false); setScreen('scanner'); setPrefillData({}); setEditLoad(null); }}
                className={`w-full flex items-center gap-4 p-4 border ${border} hover:border-red-600/50 transition-colors`}
              >
                <div className="w-10 h-10 bg-red-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✨</span>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold tracking-wider ${text}`}>SCAN RATE CONFIRMATION</p>
                  <p className={`text-xs mt-0.5 ${subtext}`}>AI extracts all details automatically</p>
                </div>
              </button>

              <button
                onClick={() => { setShowAddSheet(false); setScreen('form'); setPrefillData({}); setEditLoad(null); }}
                className={`w-full flex items-center gap-4 p-4 border ${border} hover:border-red-600/50 transition-colors`}
              >
                <div className="w-10 h-10 bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold tracking-wider ${text}`}>ENTER MANUALLY</p>
                  <p className={`text-xs mt-0.5 ${subtext}`}>Fill in the form yourself</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualLoadsScreen;
