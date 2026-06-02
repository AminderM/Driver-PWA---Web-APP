import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useDriverApp } from './DriverAppProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

const EXPENSE_STORAGE_KEY = 'integra_expenses_v1';

// Mirror the payment cache from ManualLoadsScreen
const PAYMENTS_CACHE_KEY = 'integra_payments_v1';
const mergePaymentsIntoLoads = (loads) => {
  try {
    const cache = JSON.parse(localStorage.getItem(PAYMENTS_CACHE_KEY) || '{}');
    return loads.map(l => ({ ...l, paid_amount: cache[l.id] !== undefined ? cache[l.id] : (l.paid_amount || 0) }));
  } catch { return loads; }
};

const loadStoredExpenses = () => {
  try {
    const raw = localStorage.getItem(EXPENSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const PERIODS = [
  { value: 'week',   label: 'This Week'  },
  { value: 'month',  label: 'This Month' },
  { value: 'year',   label: 'This Year'  },
  { value: 'custom', label: 'Custom'     },
];

// ── PDF generation ────────────────────────────────────────────────────────────

const generatePLPdf = async ({
  periodLabel, companyName, generatedDate,
  totalCollected, totalInvoiced, totalOutstanding,
  totalExpenses, netProfit, margin,
  loadCount, avgRate, totalMiles, avgRpm,
  expBreakdown, periodLoads,
}) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc  = new jsPDF({ unit: 'pt', format: 'letter' });
  const W    = doc.internal.pageSize.getWidth();
  const mg   = 48;
  let y      = mg;

  const dark    = [26, 26, 26];
  const black   = [0, 0, 0];
  const gray    = [100, 100, 100];
  const ltGray  = [220, 220, 220];
  const bgLight = [248, 248, 248];

  const fmt = (n) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const divider = () => {
    doc.setDrawColor(...ltGray);
    doc.setLineWidth(0.5);
    doc.line(mg, y, W - mg, y);
    y += 14;
  };

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...black);
  doc.text('PROFIT & LOSS REPORT', mg, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text(`${companyName}   ·   Period: ${periodLabel}   ·   Generated: ${generatedDate}`, mg, y);
  y += 20;

  divider();

  // ── Summary table ─────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('SUMMARY', mg, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: mg, right: mg },
    body: [
      ['Revenue Collected',  fmt(totalCollected),   ''],
      ['Revenue Invoiced',   fmt(totalInvoiced),    ''],
      ['Outstanding',        fmt(totalOutstanding),  totalOutstanding > 0 ? 'Not yet paid' : ''],
      ['Total Expenses',     fmt(totalExpenses),    ''],
      ['Net Profit',         (netProfit < 0 ? '-' : '') + fmt(netProfit), `${margin.toFixed(1)}% margin`],
    ],
    bodyStyles: { fontSize: 11, textColor: dark },
    columnStyles: {
      0: { fontStyle: 'normal', cellWidth: 200, textColor: gray },
      1: { fontStyle: 'bold',   cellWidth: 120, halign: 'right' },
      2: { fontStyle: 'normal', textColor: gray, fontSize: 9 },
    },
    alternateRowStyles: { fillColor: bgLight },
    theme: 'plain',
  });

  y = doc.lastAutoTable.finalY + 18;
  divider();

  // ── Metrics ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('METRICS', mg, y);
  y += 10;

  const metricsRows = [
    ['Loads (delivered / invoiced)', String(loadCount)],
    ['Average Rate per Load',        fmt(avgRate)],
  ];
  if (totalMiles > 0) metricsRows.push(['Total Miles', `${totalMiles.toLocaleString()} mi`]);
  if (avgRpm > 0)     metricsRows.push(['Average Revenue per Mile', `$${avgRpm.toFixed(2)}/mi`]);

  autoTable(doc, {
    startY: y,
    margin: { left: mg, right: mg },
    body: metricsRows,
    bodyStyles: { fontSize: 11, textColor: dark },
    columnStyles: {
      0: { fontStyle: 'normal', cellWidth: 260, textColor: gray },
      1: { fontStyle: 'bold', halign: 'right' },
    },
    alternateRowStyles: { fillColor: bgLight },
    theme: 'plain',
  });

  y = doc.lastAutoTable.finalY + 18;

  // ── Expense Breakdown ─────────────────────────────────────────────────────
  if (expBreakdown.length > 0) {
    divider();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('EXPENSE BREAKDOWN', mg, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      margin: { left: mg, right: mg },
      head: [['Category', 'Amount', '% of Expenses']],
      body: expBreakdown.map(({ cat, total }) => [
        cat.charAt(0).toUpperCase() + cat.slice(1),
        fmt(total),
        totalExpenses > 0 ? `${((total / totalExpenses) * 100).toFixed(1)}%` : '—',
      ]),
      headStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 10, textColor: dark },
      columnStyles: {
        0: { cellWidth: 220 },
        1: { halign: 'right', cellWidth: 120 },
        2: { halign: 'right' },
      },
      alternateRowStyles: { fillColor: bgLight },
      theme: 'striped',
    });

    y = doc.lastAutoTable.finalY + 18;
  }

  // ── Load List ─────────────────────────────────────────────────────────────
  if (periodLoads.length > 0) {
    divider();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text('LOADS', mg, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      margin: { left: mg, right: mg },
      head: [['Route', 'Date', 'Rate', 'Collected', 'Status']],
      body: periodLoads.map(l => {
        const collected = Number(l.paid_amount) || 0;
        const invoiced  = Number(l.rate)        || 0;
        const status    = collected >= invoiced && invoiced > 0 ? 'PAID'
                        : collected > 0 ? 'PARTIAL' : 'UNPAID';
        return [
          `${l.origin || '—'} → ${l.destination || '—'}`,
          l.delivery_date ? new Date(l.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
          fmt(invoiced),
          fmt(collected),
          status,
        ];
      }),
      headStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 9, textColor: dark },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 60 },
        2: { halign: 'right', cellWidth: 80 },
        3: { halign: 'right', cellWidth: 80 },
        4: { halign: 'center', cellWidth: 55 },
      },
      alternateRowStyles: { fillColor: bgLight },
      theme: 'striped',
    });

    y = doc.lastAutoTable.finalY + 18;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...ltGray);
  doc.text('Generated by Integra AI · integratedtech.ca', W / 2, pageH - 20, { align: 'center' });

  return doc;
};

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

// collected = paid_amount; invoiced = rate
const getCollected = (l) => Number(l.paid_amount) || 0;
const getInvoiced  = (l) => Number(l.rate)        || 0;

// Group revenues + expenses into time buckets for the selected period
const buildChartData = (loads, expenses, period) => {
  const now = new Date();

  if (period === 'week') {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const dayLoads = loads.filter(l => {
        const st = (l.status || '').toLowerCase();
        return (st === 'delivered' || st === 'invoiced') && l.delivery_date?.slice(0, 10) === key;
      });
      const collected   = dayLoads.reduce((s, l) => s + getCollected(l), 0);
      const invoiced    = dayLoads.reduce((s, l) => s + getInvoiced(l),  0);
      const expenseAmt  = expenses.filter(e => e.date === key).reduce((s, e) => s + e.amount, 0);
      return { label: weekDayLabel(key), collected, invoiced, expenses: expenseAmt, profit: collected - expenseAmt };
    });
  }

  if (period === 'month') {
    const year = now.getFullYear(), month = now.getMonth();
    const weeks = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const wk = isoWeek(new Date(year, month, day));
      if (!weeks[wk]) weeks[wk] = { label: wk, collected: 0, invoiced: 0, expenses: 0, profit: 0 };
    }
    loads.forEach(l => {
      const st = (l.status || '').toLowerCase();
      if ((st === 'delivered' || st === 'invoiced') && l.delivery_date) {
        const d = new Date(l.delivery_date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const wk = isoWeek(d);
          if (weeks[wk]) { weeks[wk].collected += getCollected(l); weeks[wk].invoiced += getInvoiced(l); }
        }
      }
    });
    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const wk = isoWeek(d);
        if (weeks[wk]) weeks[wk].expenses += e.amount;
      }
    });
    return Object.values(weeks).map(w => ({ ...w, profit: w.collected - w.expenses }));
  }

  // Year — group by month
  const year = now.getFullYear();
  return Array.from({ length: 12 }).map((_, m) => {
    const label     = new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short' });
    const mLoads    = loads.filter(l => {
      const st = (l.status || '').toLowerCase();
      if (st !== 'delivered' && st !== 'invoiced') return false;
      const d = l.delivery_date ? new Date(l.delivery_date) : null;
      return d && d.getFullYear() === year && d.getMonth() === m;
    });
    const collected  = mLoads.reduce((s, l) => s + getCollected(l), 0);
    const invoiced   = mLoads.reduce((s, l) => s + getInvoiced(l),  0);
    const expenseAmt = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === m;
    }).reduce((s, e) => s + e.amount, 0);
    return { label, collected, invoiced, expenses: expenseAmt, profit: collected - expenseAmt };
  });
};

// ── Custom tooltip ────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  const bg  = isDark ? '#0f0f0f' : '#fff';
  const bdr = isDark ? '#262626' : '#e5e5e5';
  return (
    <div style={{ background: bg, border: `1px solid ${bdr}`, padding: '10px 14px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14 }}>
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
  const { api, user, theme, toggleTheme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-[#030303]'        : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#080808]'    : 'bg-white';
  const text    = isDark ? 'text-white'       : 'text-black';
  const subtext = isDark ? 'text-white/60'    : 'text-black/60';
  const border  = isDark ? 'border-[#1F1F1F]' : 'border-[#e5e5e5]';

  const [period, setPeriod]       = useState('month');
  const [loads, setLoads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'
  const [exporting, setExporting] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(todayStr);

  const expenses = loadStoredExpenses();

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active loads + history (invoiced) in parallel
      const [activeData, historyData] = await Promise.allSettled([
        api('/my-loads'),
        api('/my-loads/history'),
      ]);
      const active  = activeData.status  === 'fulfilled' && Array.isArray(activeData.value)  ? activeData.value  : [];
      const history = historyData.status === 'fulfilled' && Array.isArray(historyData.value) ? historyData.value : [];
      setLoads(mergePaymentsIntoLoads([...active, ...history]));
    } catch { /* show zeros */ }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  // Refresh whenever the tab becomes visible again (returning from ManualLoadsScreen)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchLoads(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchLoads]);

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
    if (period === 'custom') {
      const from = customFrom ? new Date(customFrom) : null;
      const to   = customTo   ? new Date(customTo + 'T23:59:59') : null;
      return (!from || d >= from) && (!to || d <= to);
    }
    return d.getFullYear() === now.getFullYear();
  };

  const periodLabel = (() => {
    if (period === 'week')  return 'This Week';
    if (period === 'month') return `${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    if (period === 'year')  return String(now.getFullYear());
    return `${customFrom} to ${customTo}`;
  })();

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const doc = await generatePLPdf({
        periodLabel,
        companyName: user?.company_name || 'Integra AI Driver',
        generatedDate: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        totalCollected, totalInvoiced, totalOutstanding,
        totalExpenses, netProfit, margin,
        loadCount, avgRate, totalMiles, avgRpm,
        expBreakdown, periodLoads,
      });
      const filename = `PL-Report-${period === 'custom' ? `${customFrom}-${customTo}` : period}-${now.toISOString().slice(0, 10)}.pdf`;
      const blob = doc.output('blob');
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error('P&L PDF error', err);
    } finally {
      setExporting(false);
    }
  };

  const periodLoads = loads.filter(l => {
    const st = (l.status || '').toLowerCase();
    return (st === 'delivered' || st === 'invoiced') && inPeriod(l.delivery_date);
  });
  const periodExpenses = expenses.filter(e => inPeriod(e.date));

  const totalCollected  = periodLoads.reduce((s, l) => s + getCollected(l), 0);
  const totalInvoiced   = periodLoads.reduce((s, l) => s + getInvoiced(l),  0);
  const totalOutstanding = totalInvoiced - totalCollected;
  const totalExpenses   = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit       = totalCollected - totalExpenses;
  const margin          = totalCollected > 0 ? (netProfit / totalCollected) * 100 : 0;
  const loadCount       = periodLoads.length;
  const avgRate         = loadCount > 0 ? totalInvoiced / loadCount : 0;

  const totalMiles = periodLoads.reduce((s, l) => s + (Number(l.estimated_miles) || 0), 0);
  const avgRpm     = totalMiles > 0 ? totalCollected / totalMiles : 0;

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
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>

      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <button onClick={onBack} className={`text-base tracking-wider mb-4 block ${subtext}`}>← BACK</button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-wider ${text}`}>P&L VIEW</h1>
            <p className={`text-sm mt-0.5 ${subtext}`}>Profit & loss summary</p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <div className="w-5 h-5 border-2 border-[#CC2222] border-t-transparent rounded-full animate-spin" />}
            <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex gap-1.5 mb-3">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`flex-1 py-2 text-xs font-bold tracking-wider border transition-colors ${
                period === p.value
                  ? 'bg-[#CC2222] border-[#CC2222] text-white'
                  : `${border} ${subtext}`
              }`}>
              {p.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Custom date range — shown when CUSTOM is selected */}
        {period === 'custom' && (
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <p className={`text-xs tracking-wider mb-1 ${subtext}`}>FROM</p>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className={`w-full border py-2 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC2222] ${
                  isDark ? 'bg-[#080808] border-[#1F1F1F] text-white' : 'bg-white border-[#e5e5e5] text-black'
                }`} />
            </div>
            <div className="flex-1">
              <p className={`text-xs tracking-wider mb-1 ${subtext}`}>TO</p>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className={`w-full border py-2 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC2222] ${
                  isDark ? 'bg-[#080808] border-[#1F1F1F] text-white' : 'bg-white border-[#e5e5e5] text-black'
                }`} />
            </div>
          </div>
        )}

        {/* Download PDF — full-width, always visible */}
        <button onClick={handleExportPdf} disabled={exporting || loading}
          className={`w-full flex items-center justify-center gap-2 py-3 border font-bold tracking-wider text-sm transition-colors ${
            exporting || loading
              ? `${border} ${subtext} cursor-not-allowed`
              : 'border-[#CC2222] text-[#CC2222] hover:bg-[#CC2222] hover:text-white'
          }`}>
          {exporting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {exporting ? 'GENERATING PDF...' : `DOWNLOAD P&L REPORT — ${periodLabel.toUpperCase()}`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* KPI summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="COLLECTED"   value={fmt(totalCollected)}   color="text-[#2DBB62]" surface={surface} border={border} subtext={subtext} sub="cash received" />
          <KpiCard label="EXPENSES"    value={fmt(totalExpenses)}    color="text-[#FF2020]" surface={surface} border={border} subtext={subtext} />
          <KpiCard label="INVOICED"    value={fmt(totalInvoiced)}    color={text}           surface={surface} border={border} subtext={subtext} sub="total billed" />
          <KpiCard label="OUTSTANDING" value={fmt(totalOutstanding)} color={totalOutstanding > 0 ? 'text-amber-400' : 'text-[#2DBB62]'} surface={surface} border={border} subtext={subtext} sub="not yet paid" />

          <div className={`col-span-2 ${surface} border ${border} p-4 flex items-center justify-between`}>
            <div>
              <p className={`text-sm tracking-wider mb-1 ${subtext}`}>NET PROFIT</p>
              <p className={`text-4xl font-bold`} style={{ color: profitColor }}>
                {netProfit < 0 ? '-' : ''}{fmt(netProfit)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm tracking-wider mb-1 ${subtext}`}>MARGIN</p>
              <p className={`text-3xl font-bold`} style={{ color: marginColor }}>
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
            <p className={`text-sm font-bold tracking-widest ${subtext}`}>REVENUE VS EXPENSES</p>
            <div className="flex gap-1">
              {['bar', 'line'].map(t => (
                <button key={t} onClick={() => setChartType(t)}
                  className={`px-2.5 py-1 text-sm tracking-wider border transition-colors ${
                    chartType === t ? 'bg-[#CC2222] border-[#CC2222] text-white' : `${border} ${subtext}`
                  }`}>
                  {t === 'bar' ? '▬' : '〜'}
                </button>
              ))}
            </div>
          </div>

          {chartData.some(d => d.collected > 0 || d.expenses > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              {chartType === 'bar' ? (
                <BarChart data={chartData} barGap={2} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a1a1a' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip isDark={isDark} />} />
                  <Bar dataKey="collected" name="Collected" fill={chartColors.revenue}  radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses"  name="Expenses" fill={chartColors.expenses} radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a1a1a' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip isDark={isDark} />} />
                  <Line type="monotone" dataKey="collected" name="Collected" stroke={chartColors.revenue}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="profit"   name="Profit"   stroke={chartColors.profit}   strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center">
              <p className={`text-base ${subtext}`}>No data for this period yet</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-3 justify-center">
            <LegendDot color={chartColors.revenue}  label="Collected" />
            <LegendDot color={chartColors.expenses} label="Expenses" />
            {chartType === 'line' && <LegendDot color={chartColors.profit} label="Profit" />}
          </div>
        </div>

        {/* Net profit chart */}
        {chartData.some(d => d.profit !== 0) && (
          <div className={`${surface} border ${border} p-4`}>
            <p className={`text-sm font-bold tracking-widest mb-4 ${subtext}`}>NET PROFIT PER PERIOD</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a1a1a' : '#f0f0f0'} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif" }} axisLine={false} tickLine={false} width={40} />
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
            <p className={`text-sm font-bold tracking-widest mb-3 ${subtext}`}>EXPENSE BREAKDOWN</p>
            <div className="space-y-2">
              {expBreakdown.map(({ cat, total }) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-lg w-6">{CAT_ICONS[cat] || '➕'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm font-semibold tracking-wider ${text}`}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </span>
                      <span className="text-sm text-[#FF2020]">{fmt(total)}</span>
                    </div>
                    <div className={`h-1.5 ${isDark ? 'bg-[#161616]' : 'bg-[#f0f0f0]'}`}>
                      <div className="h-full bg-[#CC2222]/60"
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
            <p className={`text-sm font-bold tracking-widest mb-3 ${subtext}`}>
              LOADS THIS PERIOD ({loadCount})
            </p>
            <div className={`divide-y ${isDark ? 'divide-[#1a1a1a]' : 'divide-[#f0f0f0]'}`}>
              {periodLoads.map(l => {
                const collected   = getCollected(l);
                const invoiced    = getInvoiced(l);
                const isFullyPaid = collected > 0 && collected >= invoiced;
                const isPartial   = collected > 0 && collected < invoiced;
                return (
                  <div key={l.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-base font-bold truncate ${text}`}>
                        {l.origin || '—'} → {l.destination || '—'}
                      </p>
                      {l.delivery_date && (
                        <p className={`text-sm ${subtext}`}>
                          {new Date(l.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {l.estimated_miles ? ` · ${Number(l.estimated_miles).toLocaleString()} mi` : ''}
                        </p>
                      )}
                      {/* Payment progress bar */}
                      <div className={`h-1 w-full mt-1.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#e8e8e8]'}`}>
                        <div className={`h-full ${isFullyPaid ? 'bg-green-500' : isPartial ? 'bg-amber-400' : 'bg-transparent'}`}
                          style={{ width: invoiced > 0 ? `${Math.min((collected / invoiced) * 100, 100)}%` : '0%' }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold ${isFullyPaid ? 'text-[#2DBB62]' : isPartial ? 'text-amber-400' : subtext}`}>
                        {fmt(collected)}
                      </p>
                      {!isFullyPaid && invoiced > 0 && (
                        <p className={`text-xs ${subtext}`}>of {fmt(invoiced)}</p>
                      )}
                      <p className={`text-xs font-bold tracking-wider ${
                        isFullyPaid ? 'text-green-400' : isPartial ? 'text-amber-400' : subtext
                      }`}>
                        {isFullyPaid ? '✓ PAID' : isPartial ? 'PARTIAL' : 'UNPAID'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && periodLoads.length === 0 && expBreakdown.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-4">📊</p>
            <p className={`text-lg font-bold tracking-wider mb-2 ${text}`}>NO DATA YET</p>
            <p className={`text-base ${subtext}`}>
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
    <p className={`text-sm tracking-wider mb-1 ${subtext}`}>{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className={`text-sm mt-0.5 ${subtext}`}>{sub}</p>}
  </div>
);

const LegendDot = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5" style={{ background: color }} />
    <span style={{ fontSize: 12, color: 'rgba(150,150,150,0.8)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
      {label.toUpperCase()}
    </span>
  </div>
);

export default PLScreen;
