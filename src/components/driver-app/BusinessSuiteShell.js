import React, { useState } from 'react';
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

// Tool cards — Phases 2-6 live; 7 still upcoming
const TOOLS = [
  { id: 'loads',      label: 'Load Management',    icon: '📦', desc: 'Manage loads + scan rate confirmations with AI', phase: 2, live: true  },
  { id: 'calculator', label: 'Load Calculator',    icon: '🧮', desc: 'RPM, fuel cost, net profit per load',            phase: 3, live: true  },
  { id: 'invoices',   label: 'Invoice Generator',  icon: '📄', desc: 'PDF invoices from your load + letterhead',       phase: 4, live: true  },
  { id: 'expenses',   label: 'Expense Recorder',   icon: '🧾', desc: 'Scan receipts, auto-categorize costs',           phase: 5, live: true  },
  { id: 'pl',         label: 'P&L View',           icon: '📊', desc: 'Weekly / monthly / annual profit & loss',        phase: 6, live: true  },
  { id: 'vault',      label: 'Document Vault',      icon: '🗂️', desc: 'CDL, insurance, IFTA — expiry alerts',          phase: 7, live: false },
];

const NAV_TABS = [
  { id: 'home',    label: 'Home',    icon: HomeIcon    },
  { id: 'loads',   label: 'Loads',   icon: LoadsIcon   },
  { id: 'tools',   label: 'Tools',   icon: ToolsIcon   },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
];

// ── Icon components ───────────────────────────────────────────────────────────

function HomeIcon({ active, cls }) {
  return (
    <svg className={`w-6 h-6 ${cls}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21V12h6v9" />
    </svg>
  );
}

function LoadsIcon({ active, cls }) {
  return (
    <svg className={`w-6 h-6 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
    </svg>
  );
}

function ToolsIcon({ active, cls }) {
  return (
    <svg className={`w-6 h-6 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ProfileIcon({ active, cls }) {
  return (
    <svg className={`w-6 h-6 ${cls}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

const BusinessSuiteShell = () => {
  const { user, userType, theme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-black'         : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#0a0a0a]'     : 'bg-white';
  const text    = isDark ? 'text-white'        : 'text-black';
  const subtext = isDark ? 'text-white/60'     : 'text-black/60';
  const border  = isDark ? 'border-[#262626]'  : 'border-[#e5e5e5]';
  const navBg   = isDark ? 'bg-[#0a0a0a]'     : 'bg-white';

  const [activeTab, setActiveTab]       = useState('home');
  const [loadsSubTab, setLoadsSubTab]   = useState('dispatched'); // 'dispatched' | 'my-loads'
  const [loadScreen, setLoadScreen]     = useState('list'); // 'list' | 'route' | 'map' | 'chat' | 'docs'
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [activeTool, setActiveTool]     = useState(null); // 'calculator' | null

  const userTypeLabel = userType === 'owner_operator' ? 'Owner Operator' : 'Carrier';

  // ── Loads sub-navigation (TMS screens reused unchanged) ──────────────────

  const handleLoadSelect  = (load, screenType) => { setSelectedLoad(load); setLoadScreen(screenType || 'route'); };
  const handleLoadViewMap = (load)              => { setSelectedLoad(load); setLoadScreen('map'); };
  const goToLoadList      = ()                  => { setLoadScreen('list'); setSelectedLoad(null); };

  const resetLoadsTab = () => { goToLoadList(); };

  const handleToolOpen = (toolId) => {
    if (toolId === 'loads') { setActiveTab('loads'); setLoadsSubTab('my-loads'); }
    else if (toolId === 'calculator') { setActiveTool('calculator'); }
    else if (toolId === 'invoices')   { setActiveTool('invoices'); }
    else if (toolId === 'expenses')   { setActiveTool('expenses'); }
    else if (toolId === 'pl')         { setActiveTool('pl'); }
  };

  if (activeTab === 'loads') {
    // TMS detail screens (route, map, chat, docs) take over full screen
    if (loadsSubTab === 'dispatched') {
      if (loadScreen === 'route' && selectedLoad) {
        return (
          <div className={`font-['Oxanium'] ${bg} min-h-screen`}>
            <RouteScreen
              load={selectedLoad}
              onBack={goToLoadList}
              onViewMap={() => setLoadScreen('map')}
              onOpenChat={(load) => { setSelectedLoad(load); setLoadScreen('chat'); }}
            />
            <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTab(t); resetLoadsTab(); }}
              isDark={isDark} navBg={navBg} border={border} />
          </div>
        );
      }
      if (loadScreen === 'map' && selectedLoad) {
        return (
          <div className={`font-['Oxanium'] ${bg} min-h-screen`}>
            <MapScreen load={selectedLoad} onBack={() => setLoadScreen('route')} />
            <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTab(t); resetLoadsTab(); }}
              isDark={isDark} navBg={navBg} border={border} />
          </div>
        );
      }
      if (loadScreen === 'chat' && selectedLoad) {
        return (
          <div className={`font-['Oxanium'] ${bg} min-h-screen`}>
            <ChatScreen load={selectedLoad} onBack={() => setLoadScreen('route')} />
            <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTab(t); resetLoadsTab(); }}
              isDark={isDark} navBg={navBg} border={border} />
          </div>
        );
      }
      if (loadScreen === 'docs' && selectedLoad) {
        return (
          <div className={`font-['Oxanium'] ${bg} min-h-screen`}>
            <DocumentsScreen load={selectedLoad} onBack={goToLoadList} />
            <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTab(t); resetLoadsTab(); }}
              isDark={isDark} navBg={navBg} border={border} />
          </div>
        );
      }
    }

    // Loads tab with sub-tab switcher at top
    return (
      <div className={`font-['Oxanium'] ${bg} min-h-screen flex flex-col pb-16`}>
        {/* Sub-tab header */}
        <div className={`${isDark ? 'bg-[#0a0a0a]' : 'bg-white'} border-b ${border} flex`}>
          {[
            { id: 'dispatched', label: 'DISPATCHED' },
            { id: 'my-loads',   label: 'MY LOADS'   },
          ].map(t => (
            <button key={t.id} onClick={() => { setLoadsSubTab(t.id); goToLoadList(); }}
              className={`flex-1 py-3 text-xs font-bold tracking-widest transition-colors ${
                loadsSubTab === t.id
                  ? 'text-red-500 border-b-2 border-red-500'
                  : `${isDark ? 'text-white/40' : 'text-black/40'}`
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadsSubTab === 'dispatched' ? (
            <MyLoadsScreen
              onNavigate={() => {}}
              onSelectLoad={handleLoadSelect}
              onViewMap={handleLoadViewMap}
            />
          ) : (
            <ManualLoadsScreen onBack={() => setActiveTab('home')} />
          )}
        </div>

        <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTab(t); resetLoadsTab(); }}
          isDark={isDark} navBg={navBg} border={border} />
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <div className={`font-['Oxanium'] ${bg} min-h-screen pb-16`}>
        <ProfileScreen onBack={() => setActiveTab('home')} onOpenScanner={() => {}} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab}
          isDark={isDark} navBg={navBg} border={border} />
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className={`font-['Oxanium'] ${bg} min-h-screen pb-16`}>
        <SettingsScreen onBack={() => setActiveTab('home')} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab}
          isDark={isDark} navBg={navBg} border={border} />
      </div>
    );
  }

  if (activeTool === 'calculator') {
    return (
      <div className={`font-['Oxanium'] ${bg} min-h-screen pb-16`}>
        <LoadCalculatorScreen onBack={() => setActiveTool(null)} />
        <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTool(null); setActiveTab(t); }}
          isDark={isDark} navBg={navBg} border={border} />
      </div>
    );
  }

  if (activeTool === 'invoices') {
    return (
      <div className={`font-['Oxanium'] ${bg} min-h-screen pb-16`}>
        <InvoiceGeneratorScreen onBack={() => setActiveTool(null)} />
        <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTool(null); setActiveTab(t); }}
          isDark={isDark} navBg={navBg} border={border} />
      </div>
    );
  }

  if (activeTool === 'expenses') {
    return (
      <div className={`font-['Oxanium'] ${bg} min-h-screen pb-16`}>
        <ExpenseRecorderScreen onBack={() => setActiveTool(null)} />
        <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTool(null); setActiveTab(t); }}
          isDark={isDark} navBg={navBg} border={border} />
      </div>
    );
  }

  if (activeTool === 'pl') {
    return (
      <div className={`font-['Oxanium'] ${bg} min-h-screen pb-16`}>
        <PLScreen onBack={() => setActiveTool(null)} />
        <BottomNav activeTab={activeTab} onTabChange={t => { setActiveTool(null); setActiveTab(t); }}
          isDark={isDark} navBg={navBg} border={border} />
      </div>
    );
  }

  // ── Home / Tools tabs ─────────────────────────────────────────────────────
  return (
    <div className={`font-['Oxanium'] ${bg} min-h-screen pb-16`}>

      {/* Top bar */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-5`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold tracking-wider ${text}`}>
              {user?.full_name?.split(' ')[0]?.toUpperCase() || 'WELCOME'}
            </h1>
            <p className={`text-xs mt-0.5 ${subtext}`}>
              {user?.company_name || userTypeLabel}
              {user?.mc_dot_number ? ` · ${user.mc_dot_number}` : ''}
            </p>
          </div>
          {user?.logo_url ? (
            <img src={user.logo_url} alt="Company logo"
              className="w-12 h-12 object-cover border border-[#262626]" />
          ) : (
            <div className="w-12 h-12 bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {(user?.company_name || user?.full_name || 'A')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Tab switcher: Home / Tools */}
        <div className={`flex mt-5 border-b ${border} -mb-px`}>
          {['home', 'tools'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 text-xs font-bold tracking-widest transition-colors ${
                activeTab === t
                  ? 'text-red-500 border-b-2 border-red-500'
                  : subtext
              }`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Home tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <div className="px-5 py-5 space-y-4">

          {/* Quick stats row */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Dispatched Loads', value: '—', note: 'Tap Loads → Dispatched' },
              { label: 'My Loads',         value: '—', note: 'Tap Loads → My Loads'  },
            ].map(({ label, value, note }) => (
              <button key={label} onClick={() => setActiveTab('loads')}
                className={`text-left ${surface} border ${border} p-4 hover:border-red-600/50 transition-colors`}>
                <p className={`text-xs tracking-wider mb-1 ${subtext}`}>{label.toUpperCase()}</p>
                <p className={`text-2xl font-bold ${text}`}>{value}</p>
                <p className={`text-xs mt-1 ${subtext}`}>{note}</p>
              </button>
            ))}
          </div>

          {/* Subscription notice */}
          <div className={`border ${isDark ? 'border-amber-600/40 bg-amber-600/10' : 'border-amber-500/40 bg-amber-50'} p-4`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">⏳</span>
              <div>
                <p className={`text-sm font-semibold tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  FREE TRIAL ACTIVE
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                  7 days free · Business tools unlock after subscription
                </p>
              </div>
            </div>
          </div>

          {/* Tool cards */}
          <p className={`text-xs font-bold tracking-widest pt-2 ${subtext}`}>BUSINESS TOOLS</p>
          <div className="space-y-3">
            {TOOLS.map(tool => (
              tool.live ? (
                <button key={tool.id} onClick={() => handleToolOpen(tool.id)}
                  className={`w-full text-left ${surface} border ${border} p-4 flex items-center gap-4 hover:border-red-600/50 transition-colors`}>
                  <span className="text-2xl">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold tracking-wider ${text}`}>{tool.label}</p>
                    <p className={`text-xs mt-0.5 ${subtext}`}>{tool.desc}</p>
                  </div>
                  <span className="text-xs tracking-wider px-2 py-1 bg-green-600/20 text-green-400">LIVE</span>
                </button>
              ) : (
                <div key={tool.id} className={`${surface} border ${border} p-4 flex items-center gap-4 opacity-50`}>
                  <span className="text-2xl">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold tracking-wider ${text}`}>{tool.label}</p>
                    <p className={`text-xs mt-0.5 ${subtext}`}>{tool.desc}</p>
                  </div>
                  <span className={`text-xs tracking-wider px-2 py-1 ${
                    isDark ? 'bg-[#1a1a1a] text-white/40' : 'bg-[#f0f0f0] text-black/40'
                  }`}>SOON</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* ── Tools tab ────────────────────────────────────────────────────── */}
      {activeTab === 'tools' && (
        <div className="px-5 py-5">
          <p className={`text-xs font-bold tracking-widest mb-4 ${subtext}`}>BUSINESS TOOLS</p>
          <div className="space-y-3">
            {TOOLS.map(tool => (
              tool.live ? (
                <button key={tool.id} onClick={() => handleToolOpen(tool.id)}
                  className={`w-full text-left ${surface} border ${border} p-5 hover:border-red-600/50 transition-colors`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{tool.icon}</span>
                    <div>
                      <p className={`text-sm font-bold tracking-wider ${text}`}>{tool.label}</p>
                      <span className="text-xs text-green-400">✓ Available now</span>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${subtext}`}>{tool.desc}</p>
                </button>
              ) : (
                <div key={tool.id} className={`${surface} border ${border} p-5 opacity-50`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{tool.icon}</span>
                    <div>
                      <p className={`text-sm font-bold tracking-wider ${text}`}>{tool.label}</p>
                      <span className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                        Coming in Phase {tool.phase}
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${subtext}`}>{tool.desc}</p>
                </div>
              )
            ))}
          </div>
          <p className={`text-xs text-center mt-6 leading-relaxed ${subtext}`}>
            More tools shipping soon · Subscribe to unlock all features
          </p>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab}
        isDark={isDark} navBg={navBg} border={border} />
    </div>
  );
};

// ── Bottom navigation bar ─────────────────────────────────────────────────────

const BottomNav = ({ activeTab, onTabChange, isDark, navBg, border }) => {
  const activeColor = 'text-red-500';
  const inactiveColor = isDark ? 'text-white/40' : 'text-black/40';

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${navBg} border-t ${border} flex`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id || (id === 'tools' && activeTab === 'tools');
        return (
          <button key={id} onClick={() => onTabChange(id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors ${
              active ? activeColor : inactiveColor
            }`}>
            <Icon active={active} cls="" />
            <span className="text-[10px] tracking-wider font-medium">{label.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BusinessSuiteShell;
