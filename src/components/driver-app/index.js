import React, { useState } from 'react';
import { DriverAppProvider, useDriverApp } from './DriverAppProvider';
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
import MapScreen from './MapScreen';
import AnalyticsScreen from './AnalyticsScreen';
import TruckScreen from './TruckScreen';
import FleetScreen from './FleetScreen';
import LoadsBoardScreen from './LoadsBoardScreen';
import ChatScreen from './ChatScreen';
import BusinessSuiteShell from './BusinessSuiteShell';

// Screen management
const DriverAppContent = () => {
  const { user, profileComplete, completeProfile, inviteToken, userType } = useDriverApp();
  const [currentScreen, setCurrentScreen] = useState('loads');
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

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
      return selectedLoad ? <MapScreen load={selectedLoad} onBack={goBack} /> : loadsScreen;

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
      <div className="min-h-screen bg-gray-950">
        <DriverAppContent />
      </div>
    </DriverAppProvider>
  );
};

export default DriverMobileApp;
