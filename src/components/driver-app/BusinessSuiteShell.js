import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';
import MyLoadsScreen from './MyLoadsScreen';
import ManualLoadsScreen from './ManualLoadsScreen';
import RouteScreen from './RouteScreen';
import MapScreen from './MapScreen';
import ChatScreen from './ChatScreen';
import DocumentsScreen from './DocumentsScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import LoadCalculatorScreen from './LoadCalculatorScreen';
import InvoiceGeneratorScreen from './InvoiceGeneratorScreen';
import ExpenseRecorderScreen from './ExpenseRecorderScreen';
import PLScreen from './PLScreen';
import DocumentVaultScreen from './DocumentVaultScreen';

// ── Mission Control design tokens ─────────────────────────────────────────────
const MC = {
  void:  '#030303', deep:  '#080808', steel: '#0F0F0F',
  plate: '#161616', rivet: '#1F1F1F', scratch: '#282828',
  red: '#CC2222', redHot: '#FF2020', redDim: '#7A1010',
  white: '#EDE9E3', chromeMid: '#999690', chromeDim: '#555250', chromeGhost: '#2A2926',
  green: '#2DBB62', amber: '#D4921A', blue: '#2277CC',
};

const FD = "'Barlow Condensed', sans-serif";
const FM = "'Share Tech Mono', monospace";
const FB = "'Barlow', sans-serif";

// ── Tool catalogue ────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'loads',      label: 'Load Mgmt',   icon: '📦', desc: 'Manage loads + scan rate cons', live: true },
  { id: 'calculator', label: 'Load Calc',   icon: '⛽', desc: 'RPM, fuel cost, net profit',    live: true },
  { id: 'invoices',   label: 'Invoices',    icon: '📄', desc: 'PDF invoices with letterhead',  live: true },
  { id: 'expenses',   label: 'Expenses',    icon: '🧾', desc: 'Scan receipts, track costs',    live: true },
  { id: 'pl',         label: 'P&L View',    icon: '📊', desc: 'Weekly / monthly P&L',          live: true },
  { id: 'vault',      label: 'Doc Vault',   icon: '🗂️', desc: 'CDL, insurance, IFTA alerts',   live: true },
];

// ── Live clock ────────────────────────────────────────────────────────────────
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const D = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const Mo = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const h = now.getHours().toString().padStart(2,'0');
  const m = now.getMinutes().toString().padStart(2,'0');
  return <span style={{ fontFamily: FM, fontSize: '9px', color: MC.chromeDim }}>{D[now.getDay()]} {now.getDate()} {Mo[now.getMonth()]} · {h}:{m}</span>;
};

// ── Eyebrow label ─────────────────────────────────────────────────────────────
const Eyebrow = ({ children }) => (
  <p style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.18em', color: MC.red, textTransform: 'uppercase', margin: '0 0 2px' }}>{children}</p>
);

// ── Nav icons ─────────────────────────────────────────────────────────────────
const NavIcon = ({ id, active }) => {
  const c = active ? MC.red : MC.chromeDim;
  if (id === 'home') return <svg width="22" height="22" fill={active ? c : 'none'} stroke={c} strokeWidth={active ? 0 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21V12h6v9"/></svg>;
  if (id === 'loads') return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"/></svg>;
  if (id === 'tools') return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (id === 'profile') return <svg width="22" height="22" fill={active ? c : 'none'} stroke={c} strokeWidth={active ? 0 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
  return null;
};

// ── Bottom nav ────────────────────────────────────────────────────────────────
const BottomNav = ({ activeTab, onTabChange }) => (
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: MC.steel, borderTop: `1px solid ${MC.rivet}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
    {['home','loads','tools','profile'].map(id => {
      const active = activeTab === id;
      const label = id.charAt(0).toUpperCase() + id.slice(1);
      return (
        <button key={id} onClick={() => onTabChange(id)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 8px', gap: '3px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <NavIcon id={id} active={active} />
          <span style={{ fontFamily: FD, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? MC.red : MC.chromeDim }}>{label}</span>
        </button>
      );
    })}
  </div>
);

// ── Screen wrapper ────────────────────────────────────────────────────────────
const Shell = ({ children, activeTab, onTabChange }) => (
  <div style={{ background: MC.void, minHeight: '100vh', paddingBottom: '64px' }}>
    <div className="mc-top-stripe" />
    {children}
    <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const BusinessSuiteShell = () => {
  const { user, userType } = useDriverApp();

  const [activeTab,     setActiveTab]     = useState('home');
  const [loadsSubTab,   setLoadsSubTab]   = useState('dispatched');
  const [loadScreen,    setLoadScreen]    = useState('list');
  const [selectedLoad,  setSelectedLoad]  = useState(null);
  const [activeTool,    setActiveTool]    = useState(null);

  const userTypeLabel = userType === 'owner_operator' ? 'Owner Operator' : 'Carrier';
  const firstName     = user?.full_name?.split(' ')[0]?.toUpperCase() || 'DRIVER';
  const initials      = (user?.company_name || user?.full_name || 'A')[0].toUpperCase();
  const trialDays     = user?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at) - Date.now()) / 86400000))
    : 14;

  const goToLoadList  = () => { setLoadScreen('list'); setSelectedLoad(null); };
  const handleLoadSelect  = (load, type) => { setSelectedLoad(load); setLoadScreen(type || 'route'); };
  const handleLoadViewMap = (load)        => { setSelectedLoad(load); setLoadScreen('map'); };

  const handleToolOpen = (toolId) => {
    if      (toolId === 'loads')      { setActiveTab('loads'); setLoadsSubTab('my-loads'); }
    else if (toolId === 'calculator') setActiveTool('calculator');
    else if (toolId === 'invoices')   setActiveTool('invoices');
    else if (toolId === 'expenses')   setActiveTool('expenses');
    else if (toolId === 'pl')         setActiveTool('pl');
    else if (toolId === 'vault')      setActiveTool('vault');
  };

  const handleTabChange = (t) => { setActiveTool(null); setActiveTab(t); goToLoadList(); };

  // Tool screens
  if (activeTool === 'calculator') return <Shell activeTab={activeTab} onTabChange={handleTabChange}><LoadCalculatorScreen onBack={() => setActiveTool(null)} /></Shell>;
  if (activeTool === 'invoices')   return <Shell activeTab={activeTab} onTabChange={handleTabChange}><InvoiceGeneratorScreen onBack={() => setActiveTool(null)} /></Shell>;
  if (activeTool === 'expenses')   return <Shell activeTab={activeTab} onTabChange={handleTabChange}><ExpenseRecorderScreen onBack={() => setActiveTool(null)} /></Shell>;
  if (activeTool === 'pl')         return <Shell activeTab={activeTab} onTabChange={handleTabChange}><PLScreen onBack={() => setActiveTool(null)} /></Shell>;
  if (activeTool === 'vault')      return <Shell activeTab={activeTab} onTabChange={handleTabChange}><DocumentVaultScreen onBack={() => setActiveTool(null)} /></Shell>;

  // Profile / Settings
  if (activeTab === 'profile') return <Shell activeTab={activeTab} onTabChange={handleTabChange}><ProfileScreen onBack={() => setActiveTab('home')} onOpenScanner={() => {}} /></Shell>;
  if (activeTab === 'settings') return <Shell activeTab={activeTab} onTabChange={handleTabChange}><SettingsScreen onBack={() => setActiveTab('home')} /></Shell>;

  // Loads tab
  if (activeTab === 'loads') {
    if (loadsSubTab === 'dispatched') {
      if (loadScreen === 'route' && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange}><RouteScreen load={selectedLoad} onBack={goToLoadList} onViewMap={() => setLoadScreen('map')} onOpenChat={l => { setSelectedLoad(l); setLoadScreen('chat'); }} /></Shell>;
      if (loadScreen === 'map'   && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange}><MapScreen load={selectedLoad} onBack={() => setLoadScreen('route')} /></Shell>;
      if (loadScreen === 'chat'  && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange}><ChatScreen load={selectedLoad} onBack={() => setLoadScreen('route')} /></Shell>;
      if (loadScreen === 'docs'  && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange}><DocumentsScreen load={selectedLoad} onBack={goToLoadList} /></Shell>;
    }
    return (
      <div style={{ background: MC.void, minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '64px' }}>
        <div className="mc-top-stripe" />
        <div style={{ background: MC.deep, borderBottom: `1px solid ${MC.rivet}`, display: 'flex' }}>
          {[{ id: 'dispatched', label: 'DISPATCHED' }, { id: 'my-loads', label: 'MY LOADS' }].map(t => (
            <button key={t.id} onClick={() => { setLoadsSubTab(t.id); goToLoadList(); }}
              style={{ flex: 1, padding: '13px 0', fontFamily: FD, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: 'none', borderBottom: loadsSubTab === t.id ? `2px solid ${MC.red}` : '2px solid transparent', color: loadsSubTab === t.id ? MC.red : MC.chromeDim, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadsSubTab === 'dispatched'
            ? <MyLoadsScreen onNavigate={() => {}} onSelectLoad={handleLoadSelect} onViewMap={handleLoadViewMap} />
            : <ManualLoadsScreen onBack={() => setActiveTab('home')} />}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  // ── Home + Tools ──────────────────────────────────────────────────────────
  return (
    <div style={{ background: MC.void, minHeight: '100vh', paddingBottom: '64px', fontFamily: FB }}>
      <div className="mc-top-stripe" />

      {/* Header */}
      <div style={{ background: MC.deep, borderBottom: `1px solid ${MC.rivet}`, padding: '40px 16px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, ${MC.red}, transparent)` }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${MC.red}, transparent 60%)` }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <Eyebrow>// Driver Dashboard</Eyebrow>
            <h1 style={{ fontFamily: FD, fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', color: MC.white, lineHeight: 1, margin: 0 }}>{firstName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(45,187,98,0.1)', border: '1px solid rgba(45,187,98,0.25)', padding: '3px 8px' }}>
                <div className="mc-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: MC.green, boxShadow: `0 0 6px ${MC.green}` }} />
                <span style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.1em', color: MC.green, textTransform: 'uppercase' }}>{userTypeLabel}</span>
              </div>
              <LiveClock />
            </div>
          </div>
          {user?.logo_url
            ? <img src={user.logo_url} alt="logo" style={{ width: '48px', height: '48px', objectFit: 'cover', border: `1px solid ${MC.rivet}` }} />
            : <div style={{ width: '48px', height: '48px', background: MC.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: FD, fontSize: '22px', fontWeight: 900, color: MC.white }}>{initials}</span>
              </div>
          }
        </div>

        {/* Home / Tools sub-tabs */}
        <div style={{ display: 'flex', marginLeft: '-16px', marginRight: '-16px', borderBottom: `1px solid ${MC.rivet}` }}>
          {['home','tools'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ flex: 1, padding: '11px 0', fontFamily: FD, fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'none', border: 'none', borderBottom: activeTab === t ? `2px solid ${MC.red}` : '2px solid transparent', color: activeTab === t ? MC.red : MC.chromeDim, cursor: 'pointer' }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* HOME */}
      {activeTab === 'home' && (
        <div style={{ padding: '12px 14px 0' }}>

          {/* Company card */}
          <div className="mc-card-1" style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, borderLeft: `3px solid ${MC.red}`, padding: '10px 12px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontFamily: FD, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', color: MC.redDim, pointerEvents: 'none' }}>ON DUTY</div>
            <Eyebrow>// Company</Eyebrow>
            <p style={{ fontFamily: FD, fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', color: MC.white, margin: 0, lineHeight: 1 }}>{user?.company_name || firstName}</p>
            {user?.mc_dot_number && <p style={{ fontFamily: FM, fontSize: '9px', color: MC.chromeMid, margin: '3px 0 0' }}>{user.mc_dot_number}</p>}
          </div>

          {/* Stats strip */}
          <div className="mc-card-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', background: MC.plate, border: `1px solid ${MC.rivet}`, marginBottom: '8px', overflow: 'hidden' }}>
            {[
              { k: 'Loads Today', v: '—', color: MC.white,   action: () => setActiveTab('loads') },
              { k: 'This Week',   v: '—', color: MC.white,   action: () => setActiveTab('loads') },
              { k: 'Expenses',    v: '—', color: MC.amber,   action: () => handleToolOpen('expenses') },
            ].map(({ k, v, color, action }, i) => (
              <React.Fragment key={k}>
                {i > 0 && <div style={{ background: MC.rivet }} />}
                <button onClick={action} style={{ padding: '10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontFamily: FM, fontSize: '7px', letterSpacing: '0.1em', color: MC.chromeDim, textTransform: 'uppercase', marginBottom: '3px' }}>{k}</div>
                  <div style={{ fontFamily: FD, fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{v}</div>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Quick tools grid */}
          <div className="mc-card-3" style={{ marginBottom: '8px' }}>
            <p style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.18em', color: MC.chromeDim, textTransform: 'uppercase', margin: '0 0 6px' }}>// Business Tools</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
              {TOOLS.filter(t => t.id !== 'loads').slice(0,4).map(tool => (
                <button key={tool.id} onClick={() => handleToolOpen(tool.id)}
                  style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, padding: '10px 4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <span style={{ fontSize: '18px' }}>{tool.icon}</span>
                  <span style={{ fontFamily: FD, fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em', color: MC.chromeMid, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trial notice */}
          <div className="mc-card-4" style={{ border: `1px solid rgba(212,146,26,0.35)`, borderLeft: `3px solid ${MC.amber}`, background: 'rgba(212,146,26,0.07)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>⏳</span>
            <div>
              <p style={{ fontFamily: FD, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: MC.amber, textTransform: 'uppercase', margin: 0 }}>FREE TRIAL ACTIVE</p>
              <p style={{ fontFamily: FM, fontSize: '8px', color: 'rgba(212,146,26,0.7)', margin: '2px 0 0' }}>{trialDays} days remaining · Upgrade to unlock all features</p>
            </div>
          </div>

          {/* Active load shortcut */}
          <div className="mc-card-5" style={{ marginBottom: '8px' }}>
            <p style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.18em', color: MC.chromeDim, textTransform: 'uppercase', margin: '0 0 6px' }}>// Active Load</p>
            <button onClick={() => setActiveTab('loads')}
              style={{ width: '100%', background: MC.plate, border: `1px solid ${MC.rivet}`, borderLeft: `3px solid ${MC.blue}`, padding: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: FD, fontSize: '15px', fontWeight: 700, color: MC.white, textTransform: 'uppercase', margin: 0 }}>View Dispatched Loads</p>
                <p style={{ fontFamily: FM, fontSize: '8px', color: MC.chromeDim, margin: '2px 0 0' }}>Tap to open load list</p>
              </div>
              <span style={{ fontFamily: FD, fontSize: '20px', color: MC.red }}>→</span>
            </button>
          </div>

          {/* P&L + Vault shortcuts */}
          <div className="mc-card-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
            {[
              { id: 'pl',    label: 'P&L View',  icon: '📊', accent: MC.green },
              { id: 'vault', label: 'Doc Vault',  icon: '🗂️',  accent: MC.amber },
            ].map(({ id, label, icon, accent }) => (
              <button key={id} onClick={() => handleToolOpen(id)}
                style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, borderTop: `2px solid ${accent}`, padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <span style={{ fontFamily: FD, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', color: MC.white, textTransform: 'uppercase' }}>{label}</span>
              </button>
            ))}
          </div>

        </div>
      )}

      {/* TOOLS */}
      {activeTab === 'tools' && (
        <div style={{ padding: '14px' }}>
          <p style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.2em', color: MC.chromeDim, textTransform: 'uppercase', margin: '0 0 10px' }}>// Business Tools</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TOOLS.map((tool, i) => (
              <button key={tool.id} onClick={() => handleToolOpen(tool.id)}
                className={`mc-card-${i + 1}`}
                style={{ width: '100%', background: MC.plate, border: `1px solid ${MC.rivet}`, borderLeft: `3px solid ${MC.red}`, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{tool.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FD, fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: MC.white, margin: 0 }}>{tool.label}</p>
                  <p style={{ fontFamily: FB, fontSize: '11px', color: MC.chromeMid, margin: '2px 0 0' }}>{tool.desc}</p>
                </div>
                <span style={{ fontFamily: FM, fontSize: '7px', letterSpacing: '0.1em', color: MC.green, background: 'rgba(45,187,98,0.1)', border: '1px solid rgba(45,187,98,0.25)', padding: '2px 6px', flexShrink: 0 }}>LIVE</span>
              </button>
            ))}
          </div>
          <p style={{ fontFamily: FM, fontSize: '8px', textAlign: 'center', marginTop: '20px', color: MC.chromeGhost, letterSpacing: '0.15em' }}>MORE TOOLS SHIPPING SOON</p>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default BusinessSuiteShell;
