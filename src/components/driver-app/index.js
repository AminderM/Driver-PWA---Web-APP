import React, { useState } from 'react';
import { DriverAppProvider, useDriverApp } from './DriverAppProvider';
import DriverLogin from './DriverLogin';
import MyLoadsScreen from './MyLoadsScreen';
import MenuScreen from './MenuScreen';
import AIAssistantScreen from './AIAssistantScreen';
import DocumentsScreen from './DocumentsScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import RouteScreen from './RouteScreen';
import MapScreen from './MapScreen';
import AnalyticsScreen from './AnalyticsScreen';

// Screen management
const DriverAppContent = () => {
  const { user } = useDriverApp();
  const [currentScreen, setCurrentScreen] = useState('loads');
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Not logged in
  if (!user) {
    return <DriverLogin />;
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

  // Screen router
  const goBack = () => {
    setCurrentScreen('loads');
    setSelectedLoad(null);
  };

  const goToLoads = () => {
    setCurrentScreen('loads');
    setSelectedLoad(null);
  };

  switch (currentScreen) {
    case 'ai':
      return <AIAssistantScreen onBack={goBack} />;
    
    case 'analytics':
      return <AnalyticsScreen onBack={goBack} />;
    
    case 'profile':
      return <ProfileScreen onBack={goBack} />;
    
    case 'settings':
      return <SettingsScreen onBack={goBack} />;
    
    case 'map':
      return selectedLoad ? (
        <MapScreen load={selectedLoad} onBack={goBack} />
      ) : (
        <MyLoadsScreen 
          onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
          onSelectLoad={(load, type) => {
            setSelectedLoad(load);
            setCurrentScreen(type);
          }}
          onViewMap={(load) => {
            setSelectedLoad(load);
            setCurrentScreen('map');
          }}
        />
      );
    
    case 'route':
      return selectedLoad ? (
        <RouteScreen 
          load={selectedLoad} 
          onBack={goToLoads}
          onViewMap={() => setCurrentScreen('map')}
        />
      ) : (
        <MyLoadsScreen 
          onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
          onSelectLoad={(load, type) => {
            setSelectedLoad(load);
            setCurrentScreen(type);
          }}
          onViewMap={(load) => {
            setSelectedLoad(load);
            setCurrentScreen('map');
          }}
        />
      );
    
    case 'docs':
      return selectedLoad ? (
        <DocumentsScreen load={selectedLoad} onBack={goToLoads} />
      ) : (
        <MyLoadsScreen 
          onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
          onSelectLoad={(load, type) => {
            setSelectedLoad(load);
            setCurrentScreen(type);
          }}
          onViewMap={(load) => {
            setSelectedLoad(load);
            setCurrentScreen('map');
          }}
        />
      );
    
    case 'loads':
    case 'dashboard':
    default:
      return (
        <MyLoadsScreen 
          onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
          onSelectLoad={(load, type) => {
            setSelectedLoad(load);
            setCurrentScreen(type);
          }}
          onViewMap={(load) => {
            setSelectedLoad(load);
            setCurrentScreen('map');
          }}
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
