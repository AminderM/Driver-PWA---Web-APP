import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const STATUS_CONFIG = {
  pending:   { label: 'PENDING',   cls: 'text-amber-400 bg-amber-600/20' },
  active:    { label: 'ACTIVE',    cls: 'text-green-400 bg-green-600/20' },
  completed: { label: 'COMPLETED', cls: 'text-white/40 bg-white/10'      },
  cancelled: { label: 'CANCELLED', cls: 'text-red-400 bg-red-600/20'     },
};

const LoadsBoardScreen = ({ onBack }) => {
  const { api, theme, toggleTheme } = useDriverApp();
  const [loads, setLoads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  const bg     = isDark ? 'bg-black'  : 'bg-white';
  const text   = isDark ? 'text-white' : 'text-black';
  const sub    = isDark ? 'text-white/60' : 'text-black/60';
  const card   = isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]';
  const border = isDark ? 'border-[#262626]' : 'border-[#e5e5e5]';

  useEffect(() => {
    setLoading(true);
    api(`/fleet/loads?status=${statusFilter}`)
      .then(data => setLoads(Array.isArray(data) ? data : data?.loads || []))
      .catch(() => setLoads([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const tabs = [
    { id: 'all',       label: 'ALL' },
    { id: 'pending',   label: 'PENDING' },
    { id: 'active',    label: 'ACTIVE' },
    { id: 'completed', label: 'DONE' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center gap-3 border-b ${border}`}>
        <button onClick={onBack} className={`w-10 h-10 flex items-center justify-center ${text}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className={`text-2xl font-bold tracking-wider ${text}`}>LOADS BOARD</h1>
          <p className={`text-base ${sub}`}>Fleet load assignments</p>
        </div>
        <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
      </div>

      {/* Status filter tabs */}
      <div className={`flex border-b ${border}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex-1 py-3 text-sm font-medium tracking-wider transition-colors ${
              statusFilter === tab.id
                ? `border-b-2 border-red-600 ${isDark ? 'text-white' : 'text-black'}`
                : sub
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loads.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-base ${sub}`}>No loads found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loads.map(load => {
              const s = STATUS_CONFIG[load.status] || { label: (load.status || 'UNKNOWN').toUpperCase(), cls: 'text-white/40 bg-white/10' };
              return (
                <div key={load.id} className={`border p-4 space-y-3 ${card}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-semibold tracking-wider text-base ${text}`}>
                        #{load.load_number || load.id?.slice(0, 8)}
                      </p>
                      {load.driver_name && (
                        <p className={`text-sm mt-0.5 ${sub}`}>Driver: {load.driver_name}</p>
                      )}
                    </div>
                    <span className={`text-sm px-2 py-0.5 flex-shrink-0 ${s.cls}`}>{s.label}</span>
                  </div>
                  <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${border}`}>
                    <div>
                      <p className={`text-sm ${sub}`}>Origin</p>
                      <p className={`text-sm font-medium mt-0.5 ${text}`}>{load.origin_city || '—'}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${sub}`}>Destination</p>
                      <p className={`text-sm font-medium mt-0.5 ${text}`}>{load.destination_city || '—'}</p>
                    </div>
                  </div>
                  {load.rate != null && (
                    <p className="text-green-500 text-base font-bold">${load.rate.toLocaleString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadsBoardScreen;
