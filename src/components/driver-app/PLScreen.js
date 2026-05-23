import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useDriverApp } from './DriverAppProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

const EXPENSE_STORAGE_KEY = 'integra_expenses_v1';

const loadStoredExpenses = () => {
  try {
    const raw = localStorage.getItem(EXPENSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const PERIODS = [
  { value: 'week',  label: 'This Week'  },
  { value: 'month', label: 'This Month' },
  { value: 'year',  label: 'This Year'  },
];

const fmt  = (n) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtK = (n) => Math.abs(n) >= 1000 ? `$${(Math.abs(n) / 1000).toFixed(1)}k` : fmt(n);

// Returns ISO week string "YYYY-Www"
const isoWeek = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `Wk ${weekNum}`;
};

const monthLabel = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });

const weekDayLabel = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });

// Group revenues + expenses into time buckets for the selected period
const buildChartData = (loads, expenses, period) => {
  const now = new Date();

  if (period === 'week') {
    // Last 7 days — one bar per day
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const revenue = loads
        .filter(l => (l.status === 'delivered' || l.status === 'invoiced') && l.delivery_date?.slice(0, 10) === key)
        .reduce((s, l) => s + (Number(l.rate) || 0), 0);
      const expenseAmt = expenses
        .filter(e => e.date === key)
        .reduce((s, e) => s + e.amount, 0);
      return { label: weekDayLabel(key), revenue, expenses: expenseAmt, profit: revenue - expenseAmt };
    });
  }

  if (period === 'month') {
    // Current month — group by week
    const year  = now.getFullYear();
    const month = now.getMonth();
    const weeks = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const wk = isoWeek(d);
      if (!weeks[wk]) weeks[wk] = { label: wk, revenue: 0, expenses: 0, profit: 0 };
    }
    loads.forEach(l => {
      if ((l.status === 'delivered' || l.status === 'invoiced') && l.delivery_date) {
        const d = new Date(l.delivery_date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const wk = isoWeek(d);
          if (weeks[wk]) { weeks[wk].revenue += Number(l.rate) || 0; }
        }
      }
    });
    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const wk = isoWeek(d);
        if (weeks[wk]) { weeks[wk].expenses += e.amount; }
      }
    });
    return Object.values(weeks).map(w => ({ ...w, profit: w.revenue - w.expenses }));
  }

  // Year — group by month
  const year = now.getFullYear();
  return Array.from({ length: 12 }).map((_, m) => {
    const label = new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short' });
    const revenue = loads
      .filter(l => {
        if (l.status !== 'delivered' && l.status !== 'invoiced') return false;
        const d = l.delivery_date ? new Date(l.delivery_date) : null;
        return d && d.getFullYear() === year && d.getMonth() === m;
      })
      .reduce((s, l) => s + (Number(l.rate) || 0), 0);
    const expenseAmt = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === m;
      })
      .reduce((s, e) => s + e.amount, 0);
    return { label, revenue, expenses: expenseAmt, profit: revenue - expenseAmt };
  });
};

// ── Custom tooltip ────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  const bg  = isDark ? '#0f0f0f' : '#fff';
  const bdr = isDark ? '#262626' : '#e5e5e5';
  return (
    <div style={{ background: bg, border: `1px solid ${bdr}`, padding: '10px 14px', fontFamily: 'Oxanium, sans-serif', fontSize: 12 }}>
      <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginBottom: 6, letterSpacing: 2 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name.toUpperCase()}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const PLScreen = ({ onBack }) => {
  const { api, theme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-black'        : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#0a0a0a]'    : 'bg-white';
  const text    = isDark ? 'text-white'       : 'text-black';
  const subtext = isDark ? 'text-white/60'    : 'text-black/60';
  const border  = isDark ? 'border-[#262626]' : 'border-[#e5e5e5]';

  const [period, setPeriod]   = useState('month');
  const [loads, setLoads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'

  const expenses = loadStoredExpenses();

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/my-loads');
      setLoads(Array.isArray(data) ? data : []);
    } catch { /* show zeros */ }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  // ── Derived metrics ───────────────────────────────────────────────────────

  const now = new Date();

  const inPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      return d >= weekAgo;
    }
    if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return d.getFullYear() === now.getFullYear();
  };

  const periodLoads = loads.filter(l =>
    (l.status === 'delivered' || l.status === 'invoiced') && inPeriod(l.delivery_date)
  );
  const periodExpenses = expenses.filter(e => inPeriod(e.date));

  const totalRevenue  = periodLoads.reduce((s, l) => s + (Number(l.rate) || 0), 0);
  const totalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit     = totalRevenue - totalExpenses;
  const margin        = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const loadCount     = periodLoads.length;
  const avgRate       = loadCount > 0 ? totalRevenue / loadCount : 0;

  const totalMiles = periodLoads.reduce((s, l) => s + (Number(l.estimated_miles) || 0), 0);
  const avgRpm     = totalMiles > 0 ? totalRevenue / totalMiles : 0;

  const chartData = buildChartData(loads, expenses, period);

  // Expense breakdown by category
  const expByCat = periodExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const expBreakdown = Object.entries(expByCat)
    .map(([cat, total]) => ({ cat, total }))
    .sort((a, b) => b.total - a.total);

  const CAT_ICONS = {
    fuel: '⛽', tolls: '🛣️', maintenance: '🔧', lumper: '📦',
    detention: '⏱️', meals: '🍔', lodging: '🏨', scales: '⚖️',
    permits: '📋', insurance: '🛡️', other: '➕',
  };

  const profitColor  = netProfit >= 0 ? '#22c55e' : '#ef4444';
  const marginColor  = margin >= 20 ? '#22c55e' : margin >= 10 ? '#f59e0b' : '#ef4444';
  const chartColors  = { revenue: '#ef4444', expenses: isDark ? '#374151' : '#d1d5db', profit: '#22c55e' };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>

      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <button onClick={onBack} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-xl font-bold tracking-wider ${text}`}>P&L VIEW</h1>
            <p className={`text-xs mt-0.5 ${subtext}`}>Profit & loss summary</p>
          </div>
          {loading && (
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Period tabs */}
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`flex-1 py-2 text-xs font-bold tracking-widest border transition-colors ${
                period === p.value
                  ? 'bg-red-600 border-red-600 text-white'
                  : `${border} ${subtext}`
              }`}>
              {p.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* KPI summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="REVENUE"  value={fmt(totalRevenue)}  color="text-green-400" surface={surface} border={border} subtext={subtext} />
          <KpiCard label="EXPENSES" value={fmt(totalExpenses)} color="text-red-400"   surface={surface} border={border} subtext={subtext} />

          <div className={`col-span-2 ${surface} border ${border} p-4 flex items-center justify-between`}>
            <div>
              <p className={`text-xs tracking-wider mb-1 ${subtext}`}>NET PROFIT</p>
              <p className={`text-3xl font-bold`} style={{ color: profitColor }}>
                {netProfit < 0 ? '-' : ''}{fmt(netProfit)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs tracking-wider mb-1 ${subtext}`}>MARGIN</p>
              <p className={`text-2xl font-bold`} style={{ color: marginColor }}>
                {margin.toFixed(1)}%
              </p>
            </div>
          </div>

          <KpiCard label="LOADS"    value={String(loadCount)}   color={text}          surface={surface} border={border} subtext={subtext} sub="delivered / invoiced" />
          <KpiCard label="AVG RATE" value={fmt(avgRate)}        color={text}          surface={surface} border={border} subtext={subtext} sub="per load" />
          {totalMiles > 0 && (
            <KpiCard label="TOTAL MILES" value={totalMiles.toLocaleString()} color={text} surface={surface} border={border} subtext={subtext} />
          )}
          {avgRpm > 0 && (
            <KpiCard label="AVG RPM" value={`$${avgRpm.toFixed(2)}`} color={text}    surface={surface} border={border} subtext={subtext} sub="rate per mile" />
          )}
        </div>

        {/* Chart */}
        <div className={`${surface} border ${border} p-4`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-xs font-bold tracking-widest ${subtext}`}>REVENUE VS EXPENSES</p>
            <div className="flex gap-1">
              {['bar', 'line'].map(t => (
                <button key={t} onClick={() => setChartType(t)}
                  className={`px-2.5 py-1 text-xs tracking-wider border transition-colors ${
                    chartType === t ? 'bg-red-600 border-red-600 text-white' : `${border} ${subtext}`
                  }`}>
                  {t === 'bar' ? '▬' : '〜'}
                </button>
              ))}
            </div>
          </div>

          {chartData.some(d => d.revenue > 0 || d.expenses > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              {chartType === 'bar' ? (
                <BarChart data={chartData} barGap={2} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a1a1a' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontFamily: 'Oxanium' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontFamily: 'Oxanium' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip isDark={isDark} />} />
                  <Bar dataKey="revenue"  name="Revenue"  fill={chartColors.revenue}  radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill={chartColors.expenses} radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a1a1a' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontFamily: 'Oxanium' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontFamily: 'Oxanium' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip isDark={isDark} />} />
                  <Line type="monotone" dataKey="revenue"  name="Revenue"  stroke={chartColors.revenue}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="profit"   name="Profit"   stroke={chartColors.profit}   strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center">
              <p className={`text-sm ${subtext}`}>No data for this period yet</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-3 justify-center">
            <LegendDot color={chartColors.revenue}  label="Revenue" />
            <LegendDot color={chartColors.expenses} label="Expenses" />
            {chartType === 'line' && <LegendDot color={chartColors.profit} label="Profit" />}
          </div>
        </div>

        {/* Net profit chart */}
        {chartData.some(d => d.profit !== 0) && (
          <div className={`${surface} border ${border} p-4`}>
            <p className={`text-xs font-bold tracking-widest mb-4 ${subtext}`}>NET PROFIT PER PERIOD</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a1a1a' : '#f0f0f0'} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontFamily: 'Oxanium' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontFamily: 'Oxanium' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip isDark={isDark} />} />
                <Bar dataKey="profit" name="Profit" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expense breakdown */}
        {expBreakdown.length > 0 && (
          <div className={`${surface} border ${border} p-4`}>
            <p className={`text-xs font-bold tracking-widest mb-3 ${subtext}`}>EXPENSE BREAKDOWN</p>
            <div className="space-y-2">
              {expBreakdown.map(({ cat, total }) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-base w-6">{CAT_ICONS[cat] || '➕'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className={`text-xs font-semibold tracking-wider ${text}`}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </span>
                      <span className="text-xs text-red-400">{fmt(total)}</span>
                    </div>
                    <div className={`h-1.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'}`}>
                      <div className="h-full bg-red-600/60"
                        style={{ width: totalExpenses > 0 ? `${(total / totalExpenses) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Load list for period */}
        {periodLoads.length > 0 && (
          <div className={`${surface} border ${border} p-4`}>
            <p className={`text-xs font-bold tracking-widest mb-3 ${subtext}`}>
              LOADS THIS PERIOD ({loadCount})
            </p>
            <div className={`divide-y ${isDark ? 'divide-[#1a1a1a]' : 'divide-[#f0f0f0]'}`}>
              {periodLoads.map(l => (
                <div key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${text}`}>
                      {l.origin || '—'} → {l.destination || '—'}
                    </p>
                    {l.delivery_date && (
                      <p className={`text-xs ${subtext}`}>
                        {new Date(l.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {l.estimated_miles ? ` · ${Number(l.estimated_miles).toLocaleString()} mi` : ''}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-green-400 flex-shrink-0">
                    {l.rate ? fmt(Number(l.rate)) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && periodLoads.length === 0 && expBreakdown.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-4">📊</p>
            <p className={`text-base font-bold tracking-wider mb-2 ${text}`}>NO DATA YET</p>
            <p className={`text-sm ${subtext}`}>
              Mark loads as delivered and log expenses to see your P&L.
            </p>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, color, surface, border, subtext, sub }) => (
  <div className={`${surface} border ${border} p-4`}>
    <p className={`text-xs tracking-wider mb-1 ${subtext}`}>{label}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    {sub && <p className={`text-xs mt-0.5 ${subtext}`}>{sub}</p>}
  </div>
);

const LegendDot = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5" style={{ background: color }} />
    <span style={{ fontSize: 10, color: 'rgba(150,150,150,0.8)', fontFamily: 'Oxanium', letterSpacing: 1 }}>
      {label.toUpperCase()}
    </span>
  </div>
);

export default PLScreen;
