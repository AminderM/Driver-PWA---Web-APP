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

// ── Design tokens ─────────────────────────────────────────────────────────────
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
  const D  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const Mo = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const h  = now.getHours().toString().padStart(2,'0');
  const m  = now.getMinutes().toString().padStart(2,'0');
  return <span style={{ fontFamily: FM, fontSize: '10px', color: MC.chromeDim }}>{D[now.getDay()]} {now.getDate()} {Mo[now.getMonth()]} · {h}:{m}</span>;
};

// ── Nav icons ─────────────────────────────────────────────────────────────────
const NavIcon = ({ id, active }) => {
  const c = active ? MC.red : MC.chromeDim;
  if (id === 'home')    return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (id === 'loads')   return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"/></svg>;
  if (id === 'tools')   return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (id === 'profile') return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
  return null;
};

// ── Bottom nav ────────────────────────────────────────────────────────────────
const BottomNav = ({ activeTab, onTabChange }) => (
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: MC.steel, borderTop: `1px solid ${MC.rivet}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
    {['home','loads','tools','profile'].map(id => {
      const active = activeTab === id;
      return (
        <button key={id} onClick={() => onTabChange(id)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 8px', gap: '3px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <NavIcon id={id} active={active} />
          <span style={{ fontFamily: FD, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? MC.red : MC.chromeDim }}>
            {id.toUpperCase()}
          </span>
        </button>
      );
    })}
  </div>
);

// ── Screen wrapper ────────────────────────────────────────────────────────────
const Shell = ({ children, activeTab, onTabChange }) => (
  <div style={{ background: MC.void, minHeight: '100vh', paddingBottom: '64px' }}>
    {children}
    <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const BusinessSuiteShell = () => {
  const { user, userType, logout, api, toggleTheme } = useDriverApp();

  const [activeTab,    setActiveTab]    = useState('home');
  const [loadsSubTab,  setLoadsSubTab]  = useState('dispatched');
  const [loadScreen,   setLoadScreen]   = useState('list');
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [activeTool,   setActiveTool]   = useState(null);
  const [activeLoad,   setActiveLoad]   = useState(null);

  useEffect(() => {
    api('/loads').then(data => {
      const found = Array.isArray(data) ? data.find(l =>
        !['available', 'assigned', 'pending', 'delivered', 'rejected'].includes(l.status)
      ) : null;
      setActiveLoad(found || null);
    }).catch(() => {});
  }, []);

  // Welcome screen — shown once after self-registration
  const [showWelcome,   setShowWelcome]   = useState(() => !!localStorage.getItem('driver_app_new_signup'));
  const [newSignupData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('driver_app_new_signup') || 'null'); } catch { return null; }
  });

  // ── User display helpers ──────────────────────────────────────────────────
  const nameParts = (user?.full_name || 'DRIVER').split(' ').filter(Boolean);
  const displayName = nameParts.length >= 2
    ? `${nameParts[0].toUpperCase()} ${nameParts[nameParts.length - 1][0].toUpperCase()}.`
    : nameParts[0]?.toUpperCase() || 'DRIVER';
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : (nameParts[0]?.[0] || 'D').toUpperCase();

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? '// GOOD MORNING' : greetingHour < 18 ? '// GOOD AFTERNOON' : '// GOOD EVENING';

  const trialDays = user?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at) - Date.now()) / 86400000))
    : 14;

  const goToLoadList      = () => { setLoadScreen('list'); setSelectedLoad(null); };
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

  // ── YOU'RE IN — Welcome screen ────────────────────────────────────────────
  if (showWelcome) {
    const d = newSignupData;
    const roleLabel = d?.role === 'owner_operator' ? 'OWNER OPERATOR'
                    : d?.role === 'carrier'         ? 'CARRIER'
                    : 'DRIVER';
    const acctId = user?.id ? `DRV-${String(user.id).slice(-6).toUpperCase()}` : 'DRV-——';
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px 48px', fontFamily: FD }}>
        {/* Green checkmark circle */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(45,187,98,0.12)', border: `2px solid ${MC.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <svg width="34" height="34" fill="none" stroke={MC.green} strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Hero */}
        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 56, textTransform: 'uppercase', lineHeight: 0.9, margin: '0 0 28px' }}>
          <span style={{ display: 'block', color: MC.white }}>YOU'RE IN,</span>
          <span style={{ display: 'block', color: MC.red }}>DRIVER.</span>
        </h1>

        {/* Account details table */}
        <div style={{ width: '100%', background: MC.plate, border: `1px solid ${MC.rivet}`, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ background: MC.rivet, padding: '8px 14px', borderBottom: `1px solid #2A2A2A` }}>
            <p style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.18em', color: MC.chromeDim, margin: 0 }}>// ACCOUNT DETAILS</p>
          </div>
          {[
            { label: 'NAME',     value: d?.name || user?.full_name || '—' },
            { label: 'ROLE',     value: roleLabel },
            { label: 'PROVINCE', value: d?.province ? d.province.toUpperCase() : '—' },
            { label: 'ACCT ID',  value: acctId },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', borderTop: i > 0 ? `1px solid ${MC.rivet}` : 'none' }}>
              <span style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.14em', color: MC.chromeDim, width: 80, flexShrink: 0 }}>{label}</span>
              <span style={{ fontFamily: FD, fontSize: 15, fontWeight: 700, color: MC.white, letterSpacing: '0.06em' }}>{value}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { localStorage.removeItem('driver_app_new_signup'); setShowWelcome(false); }}
          style={{ width: '100%', background: MC.red, border: 'none', color: '#fff', fontFamily: FD, fontWeight: 800, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '18px', cursor: 'pointer' }}>
          GO TO DASHBOARD
        </button>
      </div>
    );
  }

  // ── Tool screens ──────────────────────────────────────────────────────────
  if (activeTool === 'calculator') return <Shell activeTab={activeTab} onTabChange={handleTabChange}><LoadCalculatorScreen onBack={() => setActiveTool(null)} /></Shell>;
  if (activeTool === 'invoices')   return <Shell activeTab={activeTab} onTabChange={handleTabChange}><InvoiceGeneratorScreen onBack={() => setActiveTool(null)} /></Shell>;
  if (activeTool === 'expenses')   return <Shell activeTab={activeTab} onTabChange={handleTabChange}><ExpenseRecorderScreen onBack={() => setActiveTool(null)} /></Shell>;
  if (activeTool === 'pl')         return <Shell activeTab={activeTab} onTabChange={handleTabChange}><PLScreen onBack={() => setActiveTool(null)} /></Shell>;
  if (activeTool === 'vault')      return <Shell activeTab={activeTab} onTabChange={handleTabChange}><DocumentVaultScreen onBack={() => setActiveTool(null)} /></Shell>;

  // ── Profile tab ───────────────────────────────────────────────────────────
  if (activeTab === 'profile') return (
    <Shell activeTab={activeTab} onTabChange={handleTabChange}>
      <ProfileScreen onBack={() => setActiveTab('home')} />
      <div style={{ padding: '0 16px 32px' }}>
        <button onClick={logout}
          style={{ width: '100%', background: 'none', border: `1px solid ${MC.rivet}`, borderLeft: `3px solid ${MC.red}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontFamily: FD, fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', color: MC.red, textTransform: 'uppercase' }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </Shell>
  );

  if (activeTab === 'settings') return <Shell activeTab={activeTab} onTabChange={handleTabChange}><SettingsScreen onBack={() => setActiveTab('home')} /></Shell>;

  // ── Loads tab ─────────────────────────────────────────────────────────────
  if (activeTab === 'loads') {
    if (loadsSubTab === 'dispatched') {
      if (loadScreen === 'route' && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange}><RouteScreen load={selectedLoad} onBack={goToLoadList} onViewMap={() => setLoadScreen('map')} onOpenChat={l => { setSelectedLoad(l); setLoadScreen('chat'); }} onViewDocs={() => setLoadScreen('docs')} /></Shell>;
      if (loadScreen === 'map'   && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange}><MapScreen load={selectedLoad} onBack={() => setLoadScreen('route')} /></Shell>;
      if (loadScreen === 'chat'  && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange}><ChatScreen load={selectedLoad} onBack={() => setLoadScreen('route')} /></Shell>;
      if (loadScreen === 'docs'  && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange}><DocumentsScreen load={selectedLoad} onBack={goToLoadList} /></Shell>;
    }
    return (
      <div style={{ background: MC.void, minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '64px' }}>
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
            ? <MyLoadsScreen onNavigate={() => {}} onSelectLoad={handleLoadSelect} onViewMap={handleLoadViewMap} hideMenu={true} />
            : <ManualLoadsScreen onBack={() => setActiveTab('home')} />}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  // ── Home + Tools ──────────────────────────────────────────────────────────
  return (
    <div style={{ background: MC.void, minHeight: '100vh', paddingBottom: '64px', fontFamily: FB }}>

      {/* ── Header ── */}
      <div style={{ background: MC.deep, borderBottom: `1px solid ${MC.rivet}`, padding: '44px 16px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, ${MC.red}, transparent)` }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${MC.red}, transparent 60%)` }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <p style={{ fontFamily: FM, fontSize: '9px', letterSpacing: '0.18em', color: MC.red, textTransform: 'uppercase', margin: '0 0 2px' }}>{greeting}</p>
            <h1 style={{ fontFamily: FD, fontSize: '34px', fontWeight: 900, textTransform: 'uppercase', color: MC.white, lineHeight: 1, margin: 0 }}>{displayName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '7px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(45,187,98,0.1)', border: '1px solid rgba(45,187,98,0.25)', padding: '3px 8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: MC.green, boxShadow: `0 0 6px ${MC.green}` }} />
                <span style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.1em', color: MC.green, textTransform: 'uppercase' }}>ON DUTY</span>
              </div>
              <LiveClock />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleTheme}
              style={{ width: 38, height: 38, background: 'none', border: `1px solid ${MC.rivet}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke={MC.chromeDim} strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            {user?.logo_url
              ? <img src={user.logo_url} alt="logo" style={{ width: '44px', height: '44px', objectFit: 'cover', border: `1px solid ${MC.rivet}` }} />
              : <div style={{ width: '44px', height: '44px', background: MC.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: FD, fontSize: '18px', fontWeight: 900, color: MC.white }}>{initials}</span>
                </div>
            }
          </div>
        </div>

        {/* Home / Tools sub-tabs */}
        <div style={{ display: 'flex', marginLeft: '-16px', marginRight: '-16px', borderTop: `1px solid ${MC.rivet}` }}>
          {['home','tools'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ flex: 1, padding: '11px 0', fontFamily: FD, fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'none', border: 'none', borderBottom: activeTab === t ? `2px solid ${MC.red}` : '2px solid transparent', color: activeTab === t ? MC.red : MC.chromeDim, cursor: 'pointer' }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── HOME ─────────────────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <div style={{ padding: '14px 16px 0' }}>

          {/* Active load route card */}
          {activeLoad ? (
            <button onClick={() => { setActiveTab('loads'); setLoadsSubTab('dispatched'); handleLoadSelect(activeLoad, 'route'); }}
              style={{ display: 'block', width: '100%', background: MC.plate, border: `1px solid ${MC.rivet}`, borderLeft: `3px solid ${MC.blue}`, padding: '14px', marginBottom: 8, textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: MC.blue, boxShadow: `0 0 6px ${MC.blue}` }} />
                <span style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.14em', color: MC.blue }}>ACTIVE LOAD</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FD, fontSize: '28px', fontWeight: 900, color: MC.white, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>
                  {(activeLoad.pickup_city || activeLoad.origin_city || '').toUpperCase()}
                </span>
                <span style={{ fontFamily: FM, fontSize: '11px', color: MC.red }}>→</span>
                <span style={{ fontFamily: FD, fontSize: '28px', fontWeight: 900, color: MC.red, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>
                  {(activeLoad.delivery_city || activeLoad.destination_city || '').toUpperCase()}
                </span>
              </div>
              <p style={{ fontFamily: FM, fontSize: '8px', color: MC.chromeDim, margin: '8px 0 0', letterSpacing: '0.1em' }}>
                TAP TO UPDATE STATUS →
              </p>
            </button>
          ) : (
            <button onClick={() => setActiveTab('loads')}
              style={{ display: 'block', width: '100%', background: MC.plate, border: `1px solid ${MC.rivet}`, borderLeft: `3px solid ${MC.rivet}`, padding: '14px', marginBottom: 8, textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: MC.chromeDim }} />
                <span style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.14em', color: MC.chromeDim }}>ACTIVE LOAD</span>
              </div>
              <p style={{ fontFamily: FD, fontSize: '20px', fontWeight: 800, color: MC.chromeDim, margin: '0 0 4px', letterSpacing: '0.04em' }}>NO ACTIVE LOAD</p>
              <p style={{ fontFamily: FM, fontSize: '8px', color: MC.blue, margin: 0, letterSpacing: '0.1em' }}>VIEW AVAILABLE LOADS →</p>
            </button>
          )}

          {/* Drive stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', background: MC.plate, border: `1px solid ${MC.rivet}`, marginBottom: 8, overflow: 'hidden' }}>
            {[
              { label: 'DRIVE HRS', value: '—',  color: MC.white },
              { label: 'REMAIN',    value: '—',  color: MC.amber },
              { label: 'BREAK',     value: '—',  color: MC.white },
            ].map(({ label, value, color }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ background: MC.rivet }} />}
                <div style={{ padding: '11px 10px' }}>
                  <div style={{ fontFamily: FM, fontSize: '7px', letterSpacing: '0.1em', color: MC.chromeDim, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontFamily: FD, fontSize: '24px', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Quick tools 2×2 grid */}
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.2em', color: MC.chromeDim, margin: '0 0 8px', textTransform: 'uppercase' }}>// QUICK TOOLS</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                {
                  id: 'calculator', label: 'FUEL CALC', desc: 'IFTA & surcharge',
                  icon: <svg width="22" height="22" fill="none" stroke={MC.red} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                },
                {
                  id: 'pl', label: 'PAY STATEMENT', desc: 'Generate & export',
                  icon: <svg width="22" height="22" fill="none" stroke={MC.red} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>,
                },
                {
                  id: 'invoices', label: 'INVOICE GEN', desc: 'AI-powered',
                  icon: <svg width="22" height="22" fill="none" stroke={MC.red} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                },
                {
                  id: 'vault', label: 'OVERSIZE', desc: 'Permit fees',
                  icon: <svg width="22" height="22" fill="none" stroke={MC.red} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" /></svg>,
                },
              ].map(tool => (
                <button key={tool.id} onClick={() => handleToolOpen(tool.id)}
                  style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, cursor: 'pointer', textAlign: 'left' }}>
                  {tool.icon}
                  <div>
                    <p style={{ fontFamily: FD, fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', color: MC.white, textTransform: 'uppercase', margin: '0 0 2px' }}>{tool.label}</p>
                    <p style={{ fontFamily: FB, fontSize: '11px', color: MC.chromeDim, margin: 0 }}>{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trial notice */}
          {trialDays > 0 && user?.subscription_status !== 'active' && (
            <div style={{ border: `1px solid rgba(212,146,26,0.3)`, borderLeft: `3px solid ${MC.amber}`, background: 'rgba(212,146,26,0.05)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: FM, fontSize: '9px', letterSpacing: '0.1em', color: MC.amber }}>FREE TRIAL ACTIVE</span>
              <span style={{ fontFamily: FM, fontSize: '9px', color: 'rgba(212,146,26,0.55)' }}>{trialDays} DAYS LEFT</span>
            </div>
          )}

        </div>
      )}

      {/* ── TOOLS ────────────────────────────────────────────────────────── */}
      {activeTab === 'tools' && (
        <div style={{ padding: '14px 16px' }}>
          <p style={{ fontFamily: FM, fontSize: '8px', letterSpacing: '0.2em', color: MC.chromeDim, textTransform: 'uppercase', margin: '0 0 10px' }}>// BUSINESS TOOLS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TOOLS.map(tool => (
              <button key={tool.id} onClick={() => handleToolOpen(tool.id)}
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
