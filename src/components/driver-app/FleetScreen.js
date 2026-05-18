import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const STATUS_CONFIG = {
  active:   { cls: 'text-green-400 bg-green-600/20' },
  on_load:  { cls: 'text-amber-400 bg-amber-600/20' },
  inactive: { cls: 'text-white/40 bg-white/10'       },
};

const FleetScreen = ({ onBack, onNavigate }) => {
  const { api, theme } = useDriverApp();
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  const bg     = isDark ? 'bg-black'  : 'bg-white';
  const text   = isDark ? 'text-white' : 'text-black';
  const sub    = isDark ? 'text-white/60' : 'text-black/60';
  const card   = isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]';
  const border = isDark ? 'border-[#262626]' : 'border-[#e5e5e5]';

  useEffect(() => {
    setLoading(true);
    api(`/fleet/members?type=${filter}`)
      .then(data => setMembers(Array.isArray(data) ? data : data?.members || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const tabs = [
    { id: 'all',            label: 'ALL' },
    { id: 'driver',         label: 'DRIVERS' },
    { id: 'owner_operator', label: 'OWNER OPS' },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center justify-between border-b ${border}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`w-10 h-10 flex items-center justify-center ${text}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className={`text-xl font-bold tracking-wider ${text}`}>MY FLEET</h1>
            <p className={`text-sm ${sub}`}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate?.('loads-board')}
          className="bg-red-600 text-white px-4 py-2 text-xs tracking-wider"
        >
          LOADS BOARD
        </button>
      </div>

      {/* Filter tabs */}
      <div className={`flex border-b ${border}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-3 text-xs font-medium tracking-wider transition-colors ${
              filter === tab.id
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
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-sm ${sub}`}>No fleet members found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(member => {
              const statusKey = member.status || 'inactive';
              const statusCls = STATUS_CONFIG[statusKey]?.cls || STATUS_CONFIG.inactive.cls;
              return (
                <div key={member.id} className={`border p-4 ${card}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className={`font-semibold tracking-wider text-sm ${text}`}>{member.full_name}</p>
                        <p className={`text-xs ${sub}`}>{member.email}</p>
                        <p className={`text-xs mt-0.5 ${sub}`}>
                          {member.user_type === 'owner_operator' ? 'Owner Operator' : 'Driver'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 flex-shrink-0 ${statusCls}`}>
                      {statusKey.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                  {member.current_load_id && (
                    <p className={`text-xs mt-2 pt-2 border-t ${border} ${sub}`}>
                      Load: {member.current_load_id}
                    </p>
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

export default FleetScreen;
