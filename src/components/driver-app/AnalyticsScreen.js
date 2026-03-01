import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const StatCard = ({ label, value, sublabel, icon, isDark, highlight }) => (
  <div className={`p-4 border ${isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]'} ${highlight ? 'border-green-600/50' : ''}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-xs tracking-wider ${isDark ? 'text-white/50' : 'text-black/50'}`}>{label}</p>
        <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-green-500' : isDark ? 'text-white' : 'text-black'}`}>
          {value}
        </p>
        {sublabel && (
          <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{sublabel}</p>
        )}
      </div>
      <div className={`w-10 h-10 flex items-center justify-center ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
        {icon}
      </div>
    </div>
  </div>
);

const PeriodSelector = ({ selected, onSelect, isDark }) => {
  const periods = [
    { id: '24h', label: '24H' },
    { id: '7d', label: '7 DAYS' },
    { id: 'weekly', label: 'WEEKLY' },
    { id: 'all', label: 'ALL TIME' },
  ];

  return (
    <div className={`flex border ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => onSelect(period.id)}
          className={`flex-1 py-2 text-xs font-medium tracking-wider transition-colors ${
            selected === period.id
              ? 'bg-red-600 text-white'
              : isDark ? 'text-white/60 hover:bg-[#171717]' : 'text-black/60 hover:bg-[#f5f5f5]'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

const AnalyticsScreen = ({ onBack }) => {
  const { api, theme } = useDriverApp();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api('/analytics');
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const getPeriodData = () => {
    if (!analytics) return { earnings: 0, miles: 0, hours: 0, loads_completed: 0 };
    switch (selectedPeriod) {
      case '24h': return analytics.last_24h;
      case '7d': return analytics.last_7d;
      case 'weekly': return analytics.weekly;
      case 'all': return analytics.all_time;
      default: return analytics.last_7d;
    }
  };

  const periodData = getPeriodData();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center gap-3 border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button onClick={onBack} className={`w-10 h-10 flex items-center justify-center ${isDark ? 'text-white' : 'text-black'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className={`text-xl font-bold tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>MY ANALYTICS</h1>
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Work performance overview</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Period Selector */}
        <div className="px-4 py-4">
          <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} isDark={isDark} />
        </div>

        {/* Main Stats */}
        <div className="px-4 space-y-3">
          {/* Earnings - Highlighted */}
          <StatCard
            label="EARNINGS"
            value={`$${periodData.earnings.toLocaleString()}`}
            sublabel={`${periodData.loads_completed} loads completed`}
            isDark={isDark}
            highlight={true}
            icon={
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Miles & Hours Row */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="MILES DRIVEN"
              value={periodData.miles.toLocaleString()}
              sublabel="miles"
              isDark={isDark}
              icon={
                <svg className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            <StatCard
              label="HOURS DRIVEN"
              value={periodData.hours}
              sublabel="hours"
              isDark={isDark}
              icon={
                <svg className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Loads Completed */}
          <StatCard
            label="LOADS COMPLETED"
            value={periodData.loads_completed}
            sublabel={`${analytics?.active_loads || 0} currently active`}
            isDark={isDark}
            icon={
              <svg className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Averages Section */}
        <div className="px-4 py-4 mt-4">
          <h3 className={`text-sm font-medium tracking-wider mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            PERFORMANCE AVERAGES
          </h3>
          <div className={`border divide-y ${isDark ? 'border-[#262626] divide-[#262626]' : 'border-[#e5e5e5] divide-[#e5e5e5]'}`}>
            <div className={`p-4 flex items-center justify-between ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
              <span className={isDark ? 'text-white/70' : 'text-black/70'}>Avg. Miles per Load</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {analytics?.averages?.miles_per_load || 0} mi
              </span>
            </div>
            <div className={`p-4 flex items-center justify-between ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
              <span className={isDark ? 'text-white/70' : 'text-black/70'}>Avg. Earnings per Load</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                ${analytics?.averages?.earnings_per_load || 0}
              </span>
            </div>
            <div className={`p-4 flex items-center justify-between ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
              <span className={isDark ? 'text-white/70' : 'text-black/70'}>Avg. Earnings per Mile</span>
              <span className="font-bold text-green-500">
                ${analytics?.averages?.earnings_per_mile || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="px-4 pb-8">
          <div className={`p-4 border ${isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>ALL TIME SUMMARY</p>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Your career stats</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-green-500 font-bold text-lg">${analytics?.all_time?.earnings?.toLocaleString() || 0}</p>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>EARNED</p>
              </div>
              <div>
                <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{analytics?.all_time?.miles?.toLocaleString() || 0}</p>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>MILES</p>
              </div>
              <div>
                <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>{analytics?.all_time?.loads_completed || 0}</p>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>LOADS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
