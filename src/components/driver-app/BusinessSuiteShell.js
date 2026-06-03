import React, { useState, useEffect } from 'react';
import { play } from '../../lib/sounds';
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
import UniversalScanScreen from './UniversalScanScreen';

// ── Design tokens — dark ───────────────────────────────────────────────────────
const MC = {
  void:  '#030303', deep:  '#080808', steel: '#0F0F0F',
  plate: '#161616', rivet: '#1F1F1F', scratch: '#282828',
  red: '#CC2222', redHot: '#FF2020', redDim: '#7A1010',
  white: '#EDE9E3', chromeMid: '#999690', chromeDim: '#555250', chromeGhost: '#2A2926',
  green: '#2DBB62', amber: '#D4921A', blue: '#2277CC',
};

// ── Design tokens — light ──────────────────────────────────────────────────────
const MCL = {
  void:  '#F5F3EF', deep:  '#ECEAE5', steel: '#FFFFFF',
  plate: '#E4E2DC', rivet: '#CECCCA', scratch: '#C0BEBC',
  red: '#CC2222', redHot: '#FF2020', redDim: '#7A1010',
  white: '#1A1814', chromeMid: '#545250', chromeDim: '#70706E', chromeGhost: '#B8B6B2',
  green: '#1A9045', amber: '#A8740E', blue: '#1A5FA8',
};

const FD = "'Barlow Condensed', sans-serif";
const FM = "'Share Tech Mono', monospace";
const FB = "'Barlow', sans-serif";

// 1.5× font size helper
const px = n => `${Math.round(n * 1.5)}px`;

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
  const { theme } = useDriverApp();
  const M = theme === 'dark' ? MC : MCL;
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const D  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const Mo = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const h  = now.getHours().toString().padStart(2,'0');
  const m  = now.getMinutes().toString().padStart(2,'0');
  return <span style={{ fontFamily: FM, fontSize: px(10), color: M.chromeDim }}>{D[now.getDay()]} {now.getDate()} {Mo[now.getMonth()]} · {h}:{m}</span>;
};

// ── Nav icons ─────────────────────────────────────────────────────────────────
const NavIcon = ({ id, active }) => {
  const { theme } = useDriverApp();
  const M = theme === 'dark' ? MC : MCL;
  const c = active ? M.red : M.chromeDim;
  if (id === 'home')    return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (id === 'loads')   return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1"/></svg>;
  if (id === 'tools')   return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (id === 'profile') return <svg width="22" height="22" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
  return null;
};

// ── Bottom nav ────────────────────────────────────────────────────────────────
const BottomNav = ({ activeTab, onTabChange, onScan }) => {
  const { theme } = useDriverApp();
  const M = theme === 'dark' ? MC : MCL;
  const leftTabs  = ['home', 'loads'];
  const rightTabs = ['tools', 'profile'];
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: M.steel, borderTop: `1px solid ${M.rivet}`, display: 'flex', alignItems: 'flex-end', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {leftTabs.map(id => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => { play('tap'); onTabChange(id); }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 8px', gap: '3px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <NavIcon id={id} active={active} />
            <span style={{ fontFamily: FD, fontSize: px(9), fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? M.red : M.chromeDim }}>
              {id.toUpperCase()}
            </span>
          </button>
        );
      })}

      {/* ── Centre scan button ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 8 }}>
        <button onClick={() => { play('scan'); onScan(); }}
          style={{ width: 52, height: 52, borderRadius: 26, background: M.red, border: `3px solid ${M.steel}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: -18, boxShadow: '0 -2px 12px rgba(204,34,34,0.4)' }}>
          <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        </button>
        <span style={{ fontFamily: FD, fontSize: px(9), fontWeight: 700, letterSpacing: '0.1em', color: M.chromeDim, marginTop: 2 }}>SCAN</span>
      </div>

      {rightTabs.map(id => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => { play('tap'); onTabChange(id); }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 8px', gap: '3px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <NavIcon id={id} active={active} />
            <span style={{ fontFamily: FD, fontSize: px(9), fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? M.red : M.chromeDim }}>
              {id.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ── Screen wrapper ────────────────────────────────────────────────────────────
const Shell = ({ children, activeTab, onTabChange, onScan }) => {
  const { theme } = useDriverApp();
  const M = theme === 'dark' ? MC : MCL;
  return (
    <div style={{ background: M.void, minHeight: '100vh', paddingBottom: '72px' }}>
      {children}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} onScan={onScan} />
    </div>
  );
};

// ── Route progress helpers ─────────────────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8, r = Math.PI / 180;
  const dL = (lat2 - lat1) * r, dG = (lng2 - lng1) * r;
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*r) * Math.cos(lat2*r) * Math.sin(dG/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const STATUS_PROGRESS = {
  en_route_pickup: 8, arrived_pickup: 20, loaded: 28,
  in_transit_pickup: 12, in_transit: 50, in_transit_delivery: 65,
  en_route_delivery: 55, arrived_delivery: 90, problem: 45,
};

const calcProgress = (load, loc) => {
  const oLat = load.origin_lat   || load.pickup_lat;
  const oLng = load.origin_lon   || load.pickup_lon   || load.origin_lng  || load.pickup_lng;
  const dLat = load.destination_lat || load.delivery_lat;
  const dLng = load.destination_lon || load.delivery_lon || load.destination_lng || load.delivery_lng;
  if (oLat && oLng && dLat && dLng && loc) {
    const total  = haversine(oLat, oLng, dLat, dLng);
    const driven = haversine(oLat, oLng, loc.lat, loc.lng);
    return Math.min(Math.max((driven / total) * 100, 0), 100);
  }
  return STATUS_PROGRESS[load.status] ?? 5;
};

// ── Main component ────────────────────────────────────────────────────────────
const BusinessSuiteShell = () => {
  const { user, userType, logout, api, toggleTheme, theme, currentLocation } = useDriverApp();
  const M = theme === 'dark' ? MC : MCL;

  const [activeTab,    setActiveTab]    = useState('home');
  const [loadsSubTab,  setLoadsSubTab]  = useState('dispatched');
  const [loadScreen,   setLoadScreen]   = useState('list');
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [activeTool,   setActiveTool]   = useState(null);
  const [activeLoad,   setActiveLoad]   = useState(null);
  const [showScan,     setShowScan]     = useState(false);

  // Sound-wrapped navigation helpers
  const goBack    = (fn) => () => { play('back'); fn(); };
  const goForward = (fn) => () => { play('tap');  fn(); };

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
      <div style={{ minHeight: '100vh', background: M.void, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px 48px', fontFamily: FD }}>
        {/* Green checkmark circle */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(45,187,98,0.12)', border: `2px solid ${M.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <svg width="34" height="34" fill="none" stroke={M.green} strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Hero */}
        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: px(56), textTransform: 'uppercase', lineHeight: 0.9, margin: '0 0 28px' }}>
          <span style={{ display: 'block', color: M.white }}>YOU'RE IN,</span>
          <span style={{ display: 'block', color: M.red }}>DRIVER.</span>
        </h1>

        {/* Account details table */}
        <div style={{ width: '100%', background: M.plate, border: `1px solid ${M.rivet}`, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ background: M.rivet, padding: '8px 14px', borderBottom: `1px solid ${M.scratch}` }}>
            <p style={{ fontFamily: FM, fontSize: px(9), letterSpacing: '0.18em', color: M.chromeDim, margin: 0 }}>// ACCOUNT DETAILS</p>
          </div>
          {[
            { label: 'NAME',     value: d?.name || user?.full_name || '—' },
            { label: 'ROLE',     value: roleLabel },
            { label: 'PROVINCE', value: d?.province ? d.province.toUpperCase() : '—' },
            { label: 'ACCT ID',  value: acctId },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', borderTop: i > 0 ? `1px solid ${M.rivet}` : 'none' }}>
              <span style={{ fontFamily: FM, fontSize: px(9), letterSpacing: '0.14em', color: M.chromeDim, width: 80, flexShrink: 0 }}>{label}</span>
              <span style={{ fontFamily: FD, fontSize: px(15), fontWeight: 700, color: M.white, letterSpacing: '0.06em' }}>{value}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { localStorage.removeItem('driver_app_new_signup'); setShowWelcome(false); }}
          style={{ width: '100%', background: M.red, border: 'none', color: '#fff', fontFamily: FD, fontWeight: 800, fontSize: px(15), letterSpacing: '0.15em', textTransform: 'uppercase', padding: '18px', cursor: 'pointer' }}>
          GO TO DASHBOARD
        </button>
      </div>
    );
  }

  // ── Tool screens ──────────────────────────────────────────────────────────
  if (activeTool === 'calculator') return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><LoadCalculatorScreen onBack={goBack(() => setActiveTool(null))} /></Shell>;
  if (activeTool === 'invoices')   return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><InvoiceGeneratorScreen onBack={goBack(() => setActiveTool(null))} /></Shell>;
  if (activeTool === 'expenses')   return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><ExpenseRecorderScreen onBack={goBack(() => setActiveTool(null))} /></Shell>;
  if (activeTool === 'pl')         return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><PLScreen onBack={goBack(() => setActiveTool(null))} /></Shell>;
  if (activeTool === 'vault')      return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><DocumentVaultScreen onBack={goBack(() => setActiveTool(null))} /></Shell>;

  // ── Profile tab ───────────────────────────────────────────────────────────
  if (activeTab === 'profile') return (
    <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}>
      <ProfileScreen onBack={goBack(() => setActiveTab('home'))} />
    </Shell>
  );

  if (activeTab === 'settings') return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><SettingsScreen onBack={goBack(() => setActiveTab('home'))} /></Shell>;

  // ── Loads tab ─────────────────────────────────────────────────────────────
  if (activeTab === 'loads') {
    if (loadsSubTab === 'dispatched') {
      if (loadScreen === 'route' && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><RouteScreen load={selectedLoad} onBack={goBack(goToLoadList)} onViewMap={() => setLoadScreen('map')} onOpenChat={l => { setSelectedLoad(l); setLoadScreen('chat'); }} onViewDocs={() => setLoadScreen('docs')} /></Shell>;
      if (loadScreen === 'map'   && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><MapScreen load={selectedLoad} onBack={goBack(() => setLoadScreen('route'))} /></Shell>;
      if (loadScreen === 'chat'  && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><ChatScreen load={selectedLoad} onBack={goBack(() => setLoadScreen('route'))} /></Shell>;
      if (loadScreen === 'docs'  && selectedLoad) return <Shell activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)}><DocumentsScreen load={selectedLoad} onBack={goBack(goToLoadList)} /></Shell>;
    }
    return (
      <div style={{ background: M.void, minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '64px' }}>
        <div style={{ background: M.deep, borderBottom: `1px solid ${M.rivet}`, display: 'flex' }}>
          {[{ id: 'dispatched', label: 'DISPATCHED' }, { id: 'my-loads', label: 'MY LOADS' }].map(t => (
            <button key={t.id} onClick={() => { setLoadsSubTab(t.id); goToLoadList(); }}
              style={{ flex: 1, padding: '13px 0', fontFamily: FD, fontSize: px(11), fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: 'none', borderBottom: loadsSubTab === t.id ? `2px solid ${M.red}` : '2px solid transparent', color: loadsSubTab === t.id ? M.red : M.chromeDim, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadsSubTab === 'dispatched'
            ? <MyLoadsScreen onNavigate={() => {}} onSelectLoad={handleLoadSelect} onViewMap={handleLoadViewMap} hideMenu={true} />
            : <ManualLoadsScreen onBack={() => setActiveTab('home')} />}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)} />
        {showScan && <UniversalScanScreen onClose={() => setShowScan(false)} />}
      </div>
    );
  }

  // ── Home ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: M.void, minHeight: '100vh', paddingBottom: '72px', fontFamily: FB }}>

      {/* ── Header ── */}
      <div style={{ background: M.deep, borderBottom: `1px solid ${M.rivet}`, padding: '44px 16px 14px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, ${M.red}, transparent)` }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${M.red}, transparent 60%)` }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: FM, fontSize: px(9), letterSpacing: '0.18em', color: M.red, textTransform: 'uppercase', margin: '0 0 2px' }}>{greeting}</p>
            <h1 style={{ fontFamily: FD, fontSize: px(34), fontWeight: 900, textTransform: 'uppercase', color: M.white, lineHeight: 1, margin: 0 }}>{displayName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '7px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(45,187,98,0.1)', border: '1px solid rgba(45,187,98,0.25)', padding: '3px 8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: M.green, boxShadow: `0 0 6px ${M.green}` }} />
                <span style={{ fontFamily: FM, fontSize: px(8), letterSpacing: '0.1em', color: M.green, textTransform: 'uppercase' }}>ON DUTY</span>
              </div>
              <LiveClock />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleTheme}
              style={{ width: 38, height: 38, background: 'none', border: `1px solid ${M.rivet}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke={M.chromeDim} strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            {user?.logo_url
              ? <img src={user.logo_url} alt="logo" style={{ width: '44px', height: '44px', objectFit: 'cover', border: `1px solid ${M.rivet}` }} />
              : <div style={{ width: '44px', height: '44px', background: M.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: FD, fontSize: px(18), fontWeight: 900, color: '#FFFFFF' }}>{initials}</span>
                </div>
            }
          </div>
        </div>
      </div>

      {/* ── HOME ─────────────────────────────────────────────────────────── */}
      {(activeTab === 'home' || activeTab === 'tools') && (
        <div style={{ padding: '14px 16px 0' }}>

          {/* Active load route card */}
          {activeLoad ? (() => {
            const progress = calcProgress(activeLoad, currentLocation);
            const originCity = (activeLoad.pickup_city || activeLoad.origin_city || '').toUpperCase();
            const destCity   = (activeLoad.delivery_city || activeLoad.destination_city || '').toUpperCase();
            const estMiles   = Number(activeLoad.estimated_miles) || 0;
            const miCovered  = estMiles > 0 ? Math.round(estMiles * progress / 100) : null;
            return (
              <button onClick={() => { setActiveTab('loads'); setLoadsSubTab('dispatched'); handleLoadSelect(activeLoad, 'route'); }}
                style={{ display: 'block', width: '100%', background: M.plate, border: `1px solid ${M.rivet}`, borderLeft: `3px solid ${M.blue}`, padding: '14px', marginBottom: 8, textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: M.blue, boxShadow: `0 0 6px ${M.blue}` }} />
                    <span style={{ fontFamily: FM, fontSize: px(8), letterSpacing: '0.14em', color: M.blue }}>ACTIVE LOAD</span>
                  </div>
                  {/* Live location badge */}
                  {currentLocation && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(45,187,98,0.08)', border: '1px solid rgba(45,187,98,0.2)', padding: '2px 7px' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: M.green, boxShadow: `0 0 5px ${M.green}` }} />
                      <span style={{ fontFamily: FM, fontSize: px(7), color: M.green, letterSpacing: '0.1em' }}>
                        {currentLocation.lat.toFixed(3)}°, {currentLocation.lng.toFixed(3)}°
                      </span>
                    </div>
                  )}
                </div>

                {/* City names */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontFamily: FD, fontSize: px(24), fontWeight: 900, color: M.white, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>
                    {originCity}
                  </span>
                  <span style={{ fontFamily: FM, fontSize: px(11), color: M.red }}>→</span>
                  <span style={{ fontFamily: FD, fontSize: px(24), fontWeight: 900, color: M.red, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1 }}>
                    {destCity}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ position: 'relative', height: 4, background: M.rivet, marginBottom: 6 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: M.blue, transition: 'width 1.5s ease' }} />
                    {/* Position dot */}
                    <div style={{ position: 'absolute', top: '50%', left: `${Math.max(Math.min(progress, 97), 3)}%`, transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', background: M.blue, border: `2px solid ${M.plate}`, boxShadow: `0 0 6px ${M.blue}`, zIndex: 1 }} />
                    {/* Origin dot */}
                    <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: M.chromeMid }} />
                    {/* Dest dot */}
                    <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: M.red }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: FM, fontSize: px(7), color: M.chromeDim, letterSpacing: '0.08em' }}>
                      {miCovered !== null ? `~${miCovered.toLocaleString()} mi covered` : originCity}
                    </span>
                    <span style={{ fontFamily: FM, fontSize: px(7), color: M.chromeDim, letterSpacing: '0.08em' }}>
                      {estMiles > 0 ? `${estMiles.toLocaleString()} mi total` : 'TAP TO UPDATE →'}
                    </span>
                  </div>
                </div>

              </button>
            );
          })() : (
            <button onClick={() => setActiveTab('loads')}
              style={{ display: 'block', width: '100%', background: M.plate, border: `1px solid ${M.rivet}`, borderLeft: `3px solid ${M.rivet}`, padding: '14px', marginBottom: 8, textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: M.chromeDim }} />
                <span style={{ fontFamily: FM, fontSize: px(8), letterSpacing: '0.14em', color: M.chromeDim }}>ACTIVE LOAD</span>
              </div>
              <p style={{ fontFamily: FD, fontSize: px(20), fontWeight: 800, color: M.chromeDim, margin: '0 0 4px', letterSpacing: '0.04em' }}>NO ACTIVE LOAD</p>
              <p style={{ fontFamily: FM, fontSize: px(8), color: M.blue, margin: 0, letterSpacing: '0.1em' }}>VIEW AVAILABLE LOADS →</p>
            </button>
          )}

          {/* Drive stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', background: M.plate, border: `1px solid ${M.rivet}`, marginBottom: 8, overflow: 'hidden' }}>
            {[
              { label: 'DRIVE HRS', value: '—',  color: M.white },
              { label: 'REMAIN',    value: '—',  color: M.amber },
              { label: 'BREAK',     value: '—',  color: M.white },
            ].map(({ label, value, color }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ background: M.rivet }} />}
                <div style={{ padding: '11px 10px' }}>
                  <div style={{ fontFamily: FM, fontSize: px(7), letterSpacing: '0.1em', color: M.chromeDim, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontFamily: FD, fontSize: px(24), fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Business tools grid */}
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontFamily: FM, fontSize: px(8), letterSpacing: '0.2em', color: M.chromeDim, margin: '0 0 8px', textTransform: 'uppercase' }}>// BUSINESS TOOLS</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TOOLS.map(tool => (
                <button key={tool.id} onClick={() => handleToolOpen(tool.id)}
                  style={{ background: M.plate, border: `1px solid ${M.rivet}`, borderLeft: `3px solid ${M.red}`, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '22px' }}>{tool.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: FD, fontSize: px(14), fontWeight: 800, letterSpacing: '0.06em', color: M.white, textTransform: 'uppercase', margin: '0 0 2px' }}>{tool.label}</p>
                    <p style={{ fontFamily: FB, fontSize: px(11), color: M.chromeDim, margin: 0 }}>{tool.desc}</p>
                  </div>
                  {tool.live && (
                    <span style={{ fontFamily: FM, fontSize: px(7), letterSpacing: '0.1em', color: M.green, background: 'rgba(45,187,98,0.1)', border: '1px solid rgba(45,187,98,0.25)', padding: '2px 6px' }}>LIVE</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Trial notice */}
          {trialDays > 0 && user?.subscription_status !== 'active' && (
            <div style={{ border: `1px solid rgba(212,146,26,0.3)`, borderLeft: `3px solid ${M.amber}`, background: 'rgba(212,146,26,0.05)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: FM, fontSize: px(9), letterSpacing: '0.1em', color: M.amber }}>FREE TRIAL ACTIVE</span>
              <span style={{ fontFamily: FM, fontSize: px(9), color: 'rgba(212,146,26,0.55)' }}>{trialDays} DAYS LEFT</span>
            </div>
          )}

        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onScan={() => setShowScan(true)} />
      {showScan && <UniversalScanScreen onClose={() => setShowScan(false)} />}
    </div>
  );
};

export default BusinessSuiteShell;
