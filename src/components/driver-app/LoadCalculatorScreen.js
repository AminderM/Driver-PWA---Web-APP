import React, { useState, useCallback } from 'react';
import { useDriverApp } from './DriverAppProvider';

const EXPENSE_TEMPLATES = [
  { label: 'Tolls',      icon: '🛣️' },
  { label: 'Lumper',     icon: '📦' },
  { label: 'Detention',  icon: '⏱️' },
  { label: 'Scale',      icon: '⚖️' },
  { label: 'Other',      icon: '➕' },
];

let nextExpenseId = 1;

const LoadCalculatorScreen = ({ onBack }) => {
  const { user, userType, theme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg       = isDark ? 'bg-[#030303]'        : 'bg-[#f5f5f5]';
  const surface  = isDark ? 'bg-[#080808]'    : 'bg-white';
  const text     = isDark ? 'text-white'       : 'text-black';
  const subtext  = isDark ? 'text-white/60'    : 'text-black/60';
  const border   = isDark ? 'border-[#1F1F1F]' : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC2222] ${
    isDark
      ? 'bg-[#080808] border-[#1F1F1F] text-white placeholder-white/30'
      : 'bg-white border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  // ── Inputs ────────────────────────────────────────────────────────────────
  const [loadRate,      setLoadRate]      = useState('');
  const [totalMiles,    setTotalMiles]    = useState('');
  const [fuelPrice,     setFuelPrice]     = useState('');
  const [truckMpg,      setTruckMpg]      = useState(user?.truck_mpg ? String(user.truck_mpg) : '6.5');
  const [driverPayPct,  setDriverPayPct]  = useState(user?.driver_pay_pct ? String(user.driver_pay_pct) : '');
  const [expenses,      setExpenses]      = useState([]); // { id, label, amount }
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpLabel,   setNewExpLabel]   = useState('');
  const [newExpAmt,     setNewExpAmt]     = useState('');

  const isOwnerOperator = userType === 'owner_operator';

  // ── Live calculations ─────────────────────────────────────────────────────
  const calc = useCallback(() => {
    const rate  = parseFloat(loadRate)   || 0;
    const miles = parseFloat(totalMiles) || 0;
    const fuel  = parseFloat(fuelPrice)  || 0;
    const mpg   = parseFloat(truckMpg)   || 6.5;
    const payPct = parseFloat(driverPayPct) || 0;

    const rpm          = miles > 0 ? rate / miles : 0;
    const gallonsNeeded = miles > 0 && mpg > 0 ? miles / mpg : 0;
    const fuelCost     = gallonsNeeded * fuel;
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const driverPay    = isOwnerOperator && payPct > 0 ? rate * (payPct / 100) : 0;
    const netProfit    = rate - fuelCost - totalExpenses - driverPay;
    const margin       = rate > 0 ? (netProfit / rate) * 100 : 0;

    return { rate, miles, rpm, fuelCost, gallonsNeeded, totalExpenses, driverPay, netProfit, margin };
  }, [loadRate, totalMiles, fuelPrice, truckMpg, expenses, driverPayPct, isOwnerOperator]);

  const results = calc();
  const hasEnoughData = results.rate > 0 && results.miles > 0;

  // ── Expense helpers ───────────────────────────────────────────────────────
  const addExpense = (label, amount) => {
    if (!label.trim() || !amount) return;
    setExpenses(prev => [...prev, { id: nextExpenseId++, label: label.trim(), amount }]);
    setNewExpLabel('');
    setNewExpAmt('');
    setShowAddExpense(false);
  };

  const removeExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  const quickAddExpense = (template) => {
    setNewExpLabel(template.label);
    setShowAddExpense(true);
  };

  // ── Result color helpers ──────────────────────────────────────────────────
  const profitColor = results.netProfit >= 0 ? 'text-[#2DBB62]' : 'text-[#CC2222]';
  const marginColor = results.margin >= 20 ? 'text-[#2DBB62]'
    : results.margin >= 10 ? 'text-[#D4921A]'
    : 'text-[#CC2222]';

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>

      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <button onClick={onBack} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
        <h1 className={`text-xl font-bold tracking-wider ${text}`}>LOAD CALCULATOR</h1>
        <p className={`text-xs mt-0.5 ${subtext}`}>Live profitability analysis per load</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Live results panel — shown when enough data entered */}
        {hasEnoughData && (
          <div className={`${isDark ? 'bg-[#0f0f0f]' : 'bg-white'} border ${border} overflow-hidden`}>
            <div className="bg-[#CC2222] px-4 py-2">
              <p className="text-white text-xs font-bold tracking-widest">LIVE RESULTS</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y ${isDark ? 'divide-[#262626]' : 'divide-[#e5e5e5]'}">

              <ResultCell label="RATE PER MILE" value={`$${fmt(results.rpm)}/mi`}
                isDark={isDark} text={text} subtext={subtext}
                highlight={results.rpm >= 2.5 ? 'text-[#2DBB62]' : results.rpm >= 1.8 ? 'text-[#D4921A]' : 'text-[#CC2222]'} />

              <ResultCell label="FUEL COST" value={`-$${fmt(results.fuelCost)}`}
                isDark={isDark} text={text} subtext={subtext}
                highlight={results.fuelCost > 0 ? 'text-[#FF2020]' : text}
                sub={results.gallonsNeeded > 0 ? `${fmt(results.gallonsNeeded)} gal` : null} />

              <ResultCell label="NET PROFIT" value={`$${fmt(results.netProfit)}`}
                isDark={isDark} text={text} subtext={subtext}
                highlight={profitColor} large />

              <ResultCell label="PROFIT MARGIN" value={`${fmt(results.margin)}%`}
                isDark={isDark} text={text} subtext={subtext}
                highlight={marginColor} large />

              {results.totalExpenses > 0 && (
                <ResultCell label="OTHER EXPENSES" value={`-$${fmt(results.totalExpenses)}`}
                  isDark={isDark} text={text} subtext={subtext}
                  highlight="text-[#FF2020]" />
              )}

              {isOwnerOperator && results.driverPay > 0 && (
                <ResultCell label="DRIVER PAY" value={`-$${fmt(results.driverPay)}`}
                  isDark={isDark} text={text} subtext={subtext}
                  highlight="text-[#D4921A]"
                  sub={`${driverPayPct}% of rate`} />
              )}
            </div>
          </div>
        )}

        {/* Load inputs */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <p className={`text-xs tracking-wider font-bold ${subtext}`}>LOAD DETAILS</p>

          <div>
            <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              TOTAL RATE ($)
            </label>
            <input type="number" value={loadRate} onChange={e => setLoadRate(e.target.value)}
              placeholder="e.g. 2500" className={inputCls} min="0" step="0.01" />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              TOTAL MILES
            </label>
            <input type="number" value={totalMiles} onChange={e => setTotalMiles(e.target.value)}
              placeholder="e.g. 850" className={inputCls} min="0" />
          </div>
        </div>

        {/* Fuel inputs */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <p className={`text-xs tracking-wider font-bold ${subtext}`}>FUEL</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                FUEL PRICE ($/GAL)
              </label>
              <input type="number" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)}
                placeholder="e.g. 4.20" className={inputCls} min="0" step="0.01" />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                TRUCK MPG
              </label>
              <input type="number" value={truckMpg} onChange={e => setTruckMpg(e.target.value)}
                placeholder="e.g. 6.5" className={inputCls} min="0" step="0.1" />
            </div>
          </div>

          {results.fuelCost > 0 && results.miles > 0 && (
            <p className={`text-xs ${subtext}`}>
              Est. {fmt(results.gallonsNeeded)} gallons needed for {results.miles.toLocaleString()} miles at {truckMpg} MPG
            </p>
          )}
        </div>

        {/* Driver pay % — Owner Operator only */}
        {isOwnerOperator && (
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>DRIVER PAY</p>
            <div>
              <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                DRIVER PAY (% OF RATE) <span className={`font-normal ${subtext}`}>(optional)</span>
              </label>
              <input type="number" value={driverPayPct} onChange={e => setDriverPayPct(e.target.value)}
                placeholder="e.g. 25" className={inputCls} min="0" max="100" step="0.5" />
            </div>
            {results.driverPay > 0 && (
              <p className={`text-xs ${subtext}`}>
                Driver receives <span className="text-[#D4921A]">${fmt(results.driverPay)}</span> ({driverPayPct}% of ${fmt(results.rate)})
              </p>
            )}
          </div>
        )}

        {/* Additional expenses */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>ADDITIONAL EXPENSES</p>
            {expenses.length > 0 && (
              <p className={`text-xs text-[#FF2020]`}>-${fmt(results.totalExpenses)} total</p>
            )}
          </div>

          {/* Quick-add templates */}
          <div className="flex flex-wrap gap-2">
            {EXPENSE_TEMPLATES.map(t => (
              <button key={t.label} onClick={() => quickAddExpense(t)}
                className={`px-3 py-1.5 text-xs border ${border} ${subtext} hover:border-[#CC2222]/50 transition-colors`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Expense list */}
          {expenses.length > 0 && (
            <div className={`border ${border} divide-y ${isDark ? 'divide-[#1a1a1a]' : 'divide-[#f0f0f0]'}`}>
              {expenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between px-3 py-2.5 gap-3">
                  <span className={`text-sm flex-1 ${text}`}>{exp.label}</span>
                  <span className="text-sm text-[#FF2020]">-${fmt(parseFloat(exp.amount) || 0)}</span>
                  <button onClick={() => removeExpense(exp.id)}
                    className={`text-xs ${subtext} hover:text-[#CC2222] transition-colors ml-1`}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Inline add form */}
          {showAddExpense && (
            <div className={`border ${border} p-3 space-y-2`}>
              <input type="text" value={newExpLabel} onChange={e => setNewExpLabel(e.target.value)}
                placeholder="Expense name" className={inputCls} autoFocus />
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${subtext}`}>$</span>
                  <input type="number" value={newExpAmt} onChange={e => setNewExpAmt(e.target.value)}
                    placeholder="0.00" min="0" step="0.01"
                    onKeyDown={e => { if (e.key === 'Enter') addExpense(newExpLabel, newExpAmt); }}
                    className={`${inputCls} pl-6`} />
                </div>
                <button onClick={() => addExpense(newExpLabel, newExpAmt)}
                  className="px-4 bg-[#CC2222] text-white text-sm font-bold tracking-wider">
                  ADD
                </button>
                <button onClick={() => { setShowAddExpense(false); setNewExpLabel(''); setNewExpAmt(''); }}
                  className={`px-3 border ${border} text-sm ${subtext}`}>
                  ✕
                </button>
              </div>
            </div>
          )}

          {!showAddExpense && (
            <button onClick={() => setShowAddExpense(true)}
              className={`w-full border ${border} py-2.5 text-xs tracking-wider ${subtext} hover:border-[#CC2222]/50 transition-colors`}>
              + ADD CUSTOM EXPENSE
            </button>
          )}
        </div>

        {/* Empty state nudge */}
        {!hasEnoughData && (
          <div className={`${surface} border ${border} p-6 text-center`}>
            <p className="text-3xl mb-3">🧮</p>
            <p className={`text-sm font-bold tracking-wider ${text}`}>ENTER LOAD DETAILS ABOVE</p>
            <p className={`text-xs mt-1 ${subtext}`}>Results update live as you type</p>
          </div>
        )}

        {/* Breakdown summary (shown when enough data) */}
        {hasEnoughData && (
          <div className={`${surface} border ${border} p-4`}>
            <p className={`text-xs font-bold tracking-widest mb-3 ${subtext}`}>FULL BREAKDOWN</p>
            <div className="space-y-2">
              <BreakdownRow label="Load Rate"        value={`$${fmt(results.rate)}`}      color="text-[#2DBB62]" />
              {results.fuelCost > 0 && (
                <BreakdownRow label="Fuel Cost"       value={`-$${fmt(results.fuelCost)}`}  color="text-[#FF2020]" />
              )}
              {results.totalExpenses > 0 && (
                <BreakdownRow label="Other Expenses"  value={`-$${fmt(results.totalExpenses)}`} color="text-[#FF2020]" />
              )}
              {isOwnerOperator && results.driverPay > 0 && (
                <BreakdownRow label="Driver Pay"      value={`-$${fmt(results.driverPay)}`} color="text-[#D4921A]" />
              )}
              <div className={`border-t ${border} pt-2 mt-2`} />
              <BreakdownRow label="Net Profit"
                value={`$${fmt(results.netProfit)}`}
                color={profitColor}
                bold />
              <BreakdownRow label="Profit Margin"
                value={`${fmt(results.margin)}%`}
                color={marginColor}
                bold />
              <BreakdownRow label="Rate Per Mile"
                value={`$${fmt(results.rpm)}/mi`}
                color={results.rpm >= 2.5 ? 'text-[#2DBB62]' : results.rpm >= 1.8 ? 'text-[#D4921A]' : 'text-[#CC2222]'}
                bold />
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const ResultCell = ({ label, value, highlight, sub, isDark, text, subtext, large }) => (
  <div className={`p-4 ${isDark ? 'bg-[#080808]' : 'bg-white'} border border-transparent`}>
    <p className={`text-xs tracking-wider mb-1 ${subtext}`}>{label}</p>
    <p className={`${large ? 'text-2xl' : 'text-base'} font-bold ${highlight || text}`}>{value}</p>
    {sub && <p className={`text-xs mt-0.5 ${subtext}`}>{sub}</p>}
  </div>
);

const BreakdownRow = ({ label, value, color, bold }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${bold ? 'font-bold tracking-wider' : ''} text-current opacity-70`}>{label}</span>
    <span className={`text-sm ${bold ? 'font-bold' : ''} ${color}`}>{value}</span>
  </div>
);

export default LoadCalculatorScreen;
