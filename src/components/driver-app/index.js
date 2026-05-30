import React, { useState, useEffect, Component } from 'react';
import { DriverAppProvider, useDriverApp } from './DriverAppProvider';
import { isNative } from '../../lib/native';

// ── Error Boundary (C3) ────────────────────────────────────────────────────────
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[DriverApp] Uncaught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'rgba(204,34,34,0.15)', border: '1px solid rgba(204,34,34,0.4)', borderRadius: 8, padding: 24, maxWidth: 320, width: '100%', textAlign: 'center' }}>
            <p style={{ color: '#CC2222', fontWeight: 700, fontSize: 18, margin: '0 0 8px', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>SOMETHING WENT WRONG</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 20px', fontFamily: "'Barlow', sans-serif" }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ background: '#CC2222', color: '#fff', border: 'none', padding: '14px 0', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.12em', width: '100%', marginBottom: 10, fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              TRY AGAIN
            </button>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 0', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.12em', width: '100%', fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              SIGN OUT &amp; RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import DriverLogin from './DriverLogin';
import DriverSignupScreen from './DriverSignupScreen';
import DocumentScanScreen from './DocumentScanScreen';
import MyLoadsScreen from './MyLoadsScreen';
import MenuScreen from './MenuScreen';
import AIAssistantScreen from './AIAssistantScreen';
import DocumentsScreen from './DocumentsScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import RouteScreen from './RouteScreen';
import AnalyticsScreen from './AnalyticsScreen';
import TruckScreen from './TruckScreen';
import FleetScreen from './FleetScreen';
import LoadsBoardScreen from './LoadsBoardScreen';
import ChatScreen from './ChatScreen';
import BusinessSuiteShell from './BusinessSuiteShell';

// L27/L33: lazy-load MapScreen so Leaflet (~200KB) is not in the initial bundle
const MapScreen = React.lazy(() => import('./MapScreen'));

// Screen management
const DriverAppContent = () => {
  const { user, profileComplete, completeProfile, inviteToken, userType } = useDriverApp();
  const [currentScreen, setCurrentScreen] = useState('loads');
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // ── Android hardware back button (H10) ──────────────────────────────────────
  useEffect(() => {
    if (!isNative()) return;
    let listenerHandle;
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', ({ canGoBack }) => {
        if (showMenu) { setShowMenu(false); return; }
        if (currentScreen !== 'loads') { setCurrentScreen('loads'); setSelectedLoad(null); return; }
        if (!canGoBack) App.exitApp();
      }).then(handle => { listenerHandle = handle; });
    });
    return () => { listenerHandle?.remove(); };
  }, [currentScreen, showMenu]);

  // Owner Operators and Carriers get the Business Suite shell
  // (includes TMS loads + business tools nav)
  if (user && profileComplete && (userType === 'owner_operator' || userType === 'carrier')) {
    return <BusinessSuiteShell />;
  }

  const homeScreen = 'loads';

  // Not logged in
  if (!user) {
    if (inviteToken) {
      return <DriverSignupScreen inviteToken={inviteToken} />;
    }
    return <DriverLogin />;
  }

  // First login — show document scan flow
  if (!profileComplete) {
    return (
      <DocumentScanScreen
        onComplete={completeProfile}
        requiredDocs={user.required_documents || []}
      />
    );
  }

  // Menu overlay
  if (showMenu) {
    return (
      <MenuScreen
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          setShowMenu(false);
        }}
        onClose={() => setShowMenu(false)}
      />
    );
  }

  const goBack = () => {
    setCurrentScreen(homeScreen);
    setSelectedLoad(null);
  };

  const goToLoads = goBack;

  const loadsScreen = (
    <MyLoadsScreen
      onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
      onSelectLoad={(load, type) => { setSelectedLoad(load); setCurrentScreen(type); }}
      onViewMap={(load) => { setSelectedLoad(load); setCurrentScreen('map'); }}
    />
  );

  switch (currentScreen) {
    case 'ai':
      return <AIAssistantScreen onBack={goBack} />;

    case 'analytics':
      return <AnalyticsScreen onBack={goBack} />;

    case 'scan':
      return <DocumentScanScreen onComplete={() => setCurrentScreen('profile')} />;

    case 'profile':
      return <ProfileScreen onBack={goBack} onOpenScanner={() => setCurrentScreen('scan')} />;

    case 'settings':
      return <SettingsScreen onBack={goBack} />;

    case 'truck':
      return <TruckScreen onBack={goBack} />;

    case 'fleet':
      return (
        <FleetScreen
          onBack={goBack}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />
      );

    case 'loads-board':
      return <LoadsBoardScreen onBack={goBack} />;

    case 'map':
      return selectedLoad ? (
        <React.Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
          <MapScreen load={selectedLoad} onBack={goBack} />
        </React.Suspense>
      ) : loadsScreen;

    case 'chat':
      return selectedLoad ? (
        <ChatScreen load={selectedLoad} onBack={() => setCurrentScreen('route')} />
      ) : null;

    case 'route':
      return selectedLoad ? (
        <RouteScreen
          load={selectedLoad}
          onBack={goToLoads}
          onViewMap={() => setCurrentScreen('map')}
          onOpenChat={(load) => { setSelectedLoad(load); setCurrentScreen('chat'); }}
        />
      ) : loadsScreen;

    case 'docs':
      return selectedLoad ? <DocumentsScreen load={selectedLoad} onBack={goToLoads} /> : loadsScreen;

    case 'loads':
    case 'dashboard':
    default:
      return (
        <MyLoadsScreen
          onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
          onSelectLoad={(load, type) => { setSelectedLoad(load); setCurrentScreen(type); }}
          onViewMap={(load) => { setSelectedLoad(load); setCurrentScreen('map'); }}
        />
      );
  }
};

// Main wrapper
const DriverMobileApp = () => {
  return (
    <DriverAppProvider>
      <AppErrorBoundary>
        <div className="min-h-screen bg-gray-950">
          <DriverAppContent />
        </div>
      </AppErrorBoundary>
    </DriverAppProvider>
  );
};

export default DriverMobileApp;
