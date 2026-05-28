import React, { useState } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MC = {
  void:  '#030303', deep:  '#080808', plate: '#161616', rivet: '#1F1F1F',
  scratch: '#282828', red: '#CC2222', white: '#EDE9E3',
  chromeMid: '#999690', chromeDim: '#555250',
  green: '#2DBB62', amber: '#D4921A',
};
const FD = "'Barlow Condensed', sans-serif";
const FM = "'Share Tech Mono', monospace";
const FB = "'Barlow', sans-serif";

const inp = {
  width: '100%', boxSizing: 'border-box',
  background: MC.deep, border: `1px solid ${MC.rivet}`,
  color: MC.white, fontFamily: FD, fontSize: 16, fontWeight: 600,
  padding: '13px 12px', outline: 'none', letterSpacing: '0.02em',
};

const LoadCalculatorScreen = ({ onBack }) => {
  const [distance,   setDistance]   = useState('');
  const [efficiency, setEfficiency] = useState('6.8');
  const [diesel,     setDiesel]     = useState('');
  const [baseRate,   setBaseRate]   = useState('');

  const dist = parseFloat(distance)   || 0;
  const eff  = parseFloat(efficiency) || 6.8;
  const dp   = parseFloat(diesel)     || 0;
  const base = parseFloat(baseRate)   || 0;

  const fuelCost = (dist / 100) * eff * dp;
  const fscPct   = base > 0 ? (fuelCost / base) * 100 : 0;
  const allIn    = base + fuelCost;
  const hasResult = dist > 0 && dp > 0 && base > 0;

  const fmt = (n) => n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ minHeight: '100vh', background: MC.void, display: 'flex', flexDirection: 'column', fontFamily: FD }}>

      {/* ── Header ── */}
      <div style={{ background: MC.deep, borderBottom: `1px solid ${MC.rivet}`, padding: '44px 16px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, ${MC.red}, transparent)` }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${MC.red}, transparent 60%)` }} />

        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FM, fontSize: 9, letterSpacing: '0.16em', color: MC.chromeDim, marginBottom: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← TOOLS
        </button>
        <p style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.2em', color: MC.red, margin: '0 0 6px', textTransform: 'uppercase' }}>// INTEGRA AI TOOLS</p>
        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 40, textTransform: 'uppercase', lineHeight: 0.92, color: MC.white, margin: 0 }}>
          FUEL SURCHARGE<br />CALCULATOR
        </h1>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 32px' }}>

        {/* Inputs */}
        <div style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, padding: '14px 14px', marginBottom: 8 }}>
          <p style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.18em', color: MC.chromeDim, margin: '0 0 14px', textTransform: 'uppercase' }}>// TRIP DETAILS</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.14em', color: MC.chromeDim, display: 'block', marginBottom: 6 }}>TOTAL DISTANCE (KM)</label>
              <input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="e.g. 2800" style={inp} min="0" />
            </div>
            <div>
              <label style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.14em', color: MC.chromeDim, display: 'block', marginBottom: 6 }}>FUEL EFF. (L/100KM)</label>
              <input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} placeholder="6.8" style={inp} min="0" step="0.1" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.14em', color: MC.chromeDim, display: 'block', marginBottom: 6 }}>DIESEL PRICE ($/L)</label>
              <input type="number" value={diesel} onChange={e => setDiesel(e.target.value)} placeholder="e.g. 1.85" style={inp} min="0" step="0.01" />
            </div>
            <div>
              <label style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.14em', color: MC.chromeDim, display: 'block', marginBottom: 6 }}>BASE RATE NO FSC ($)</label>
              <input type="number" value={baseRate} onChange={e => setBaseRate(e.target.value)} placeholder="e.g. 4200" style={inp} min="0" step="0.01" />
            </div>
          </div>
        </div>

        {/* Result card */}
        {hasResult ? (
          <div style={{ border: `1px solid ${MC.red}`, background: MC.plate, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ background: MC.red, padding: '8px 14px' }}>
              <p style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.18em', color: '#fff', margin: 0, textTransform: 'uppercase' }}>// FUEL SURCHARGE RESULT</p>
            </div>
            <div style={{ padding: '18px 16px 16px' }}>
              <p style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.14em', color: MC.chromeDim, margin: '0 0 4px' }}>TOTAL FUEL SURCHARGE</p>
              <p style={{ fontFamily: FD, fontSize: 54, fontWeight: 900, color: MC.white, lineHeight: 1, margin: '0 0 16px', letterSpacing: '0.02em' }}>
                ${fmt(fuelCost)}
              </p>
              {/* 3-col metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', background: MC.rivet, overflow: 'hidden' }}>
                <div style={{ background: MC.plate, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.1em', color: MC.chromeDim, margin: '0 0 4px' }}>FUEL COST</p>
                  <p style={{ fontFamily: FD, fontSize: 17, fontWeight: 800, color: MC.white, margin: 0 }}>${fmt(fuelCost)}</p>
                </div>
                <div style={{ background: MC.rivet }} />
                <div style={{ background: MC.plate, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.1em', color: MC.chromeDim, margin: '0 0 4px' }}>FSC %</p>
                  <p style={{ fontFamily: FD, fontSize: 17, fontWeight: 800, color: MC.amber, margin: 0 }}>{fscPct.toFixed(1)}%</p>
                </div>
                <div style={{ background: MC.rivet }} />
                <div style={{ background: MC.plate, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.1em', color: MC.chromeDim, margin: '0 0 4px' }}>ALL-IN</p>
                  <p style={{ fontFamily: FD, fontSize: 17, fontWeight: 800, color: MC.green, margin: 0 }}>${fmt(allIn)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, padding: '24px 16px', textAlign: 'center', marginBottom: 8 }}>
            <p style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.16em', color: MC.chromeDim, margin: '0 0 6px' }}>// AWAITING INPUT</p>
            <p style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: MC.white, letterSpacing: '0.04em', margin: '0 0 4px' }}>ENTER TRIP DETAILS ABOVE</p>
            <p style={{ fontFamily: FB, fontSize: 12, color: MC.chromeDim, margin: 0 }}>Results calculate live as you type</p>
          </div>
        )}

        {/* Export */}
        <button disabled={!hasResult}
          style={{ width: '100%', background: hasResult ? MC.red : MC.rivet, border: 'none', color: hasResult ? '#fff' : MC.chromeDim, fontFamily: FD, fontWeight: 800, fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '17px', cursor: hasResult ? 'pointer' : 'not-allowed', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          EXPORT REPORT
        </button>
      </div>
    </div>
  );
};

export default LoadCalculatorScreen;
