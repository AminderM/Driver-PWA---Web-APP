import React from 'react';
import { useDriverApp } from './DriverAppProvider';

const MENU_ITEMS_BY_TYPE = {
  driver: [
    { id: 'ai',        label: 'AI ASSISTANT', sublabel: 'Ask me anything',           icon: '🤖' },
    { id: 'loads',     label: 'MY LOADS',     sublabel: 'View assigned loads',        icon: '📦' },
    { id: 'analytics', label: 'MY ANALYTICS', sublabel: 'Earnings & performance',     icon: '📊' },
    { id: 'profile',   label: 'PROFILE',      sublabel: 'Account details',            icon: '👤' },
    { id: 'settings',  label: 'SETTINGS',     sublabel: 'App preferences',            icon: '⚙️' },
  ],
  owner_operator: [
    { id: 'ai',        label: 'AI ASSISTANT', sublabel: 'Ask me anything',           icon: '🤖' },
    { id: 'loads',     label: 'MY LOADS',     sublabel: 'View assigned loads',        icon: '📦' },
    { id: 'analytics', label: 'MY ANALYTICS', sublabel: 'Earnings & performance',     icon: '📊' },
    { id: 'truck',     label: 'MY TRUCK',     sublabel: 'Vehicle & insurance info',   icon: '🚛' },
    { id: 'profile',   label: 'PROFILE',      sublabel: 'Account details',            icon: '👤' },
    { id: 'settings',  label: 'SETTINGS',     sublabel: 'App preferences',            icon: '⚙️' },
  ],
  carrier: [
    { id: 'fleet',       label: 'MY FLEET',    sublabel: 'Drivers & owner operators', icon: '👥' },
    { id: 'loads-board', label: 'LOADS BOARD', sublabel: 'Fleet load assignments',    icon: '📋' },
    { id: 'analytics',   label: 'ANALYTICS',   sublabel: 'Fleet performance',         icon: '📊' },
    { id: 'profile',     label: 'PROFILE',     sublabel: 'Account details',           icon: '👤' },
    { id: 'settings',    label: 'SETTINGS',    sublabel: 'App preferences',           icon: '⚙️' },
  ],
};

const MenuScreen = ({ onNavigate, onClose }) => {
  const { user, logout, theme, toggleTheme, userType } = useDriverApp();
  const isDark = theme === 'dark';

  const menuItems = MENU_ITEMS_BY_TYPE[userType] || MENU_ITEMS_BY_TYPE.driver;

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center justify-between border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <div>
          <h1 className={`text-2xl font-bold tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>MENU</h1>
          <p className={`text-base ${isDark ? 'text-white/60' : 'text-black/60'}`}>{user?.full_name}</p>
        </div>
        <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        <button onClick={onClose} className={`w-10 h-10 flex items-center justify-center ${isDark ? 'text-white' : 'text-black'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              onClose();
            }}
            className={`w-full border p-4 flex items-center gap-4 active:scale-[0.98] transition-transform ${
              isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]'
            }`}
          >
            <div className="w-12 h-12 bg-red-600 flex items-center justify-center text-2xl">
              {item.icon}
            </div>
            <div className="text-left flex-1">
              <p className={`font-medium tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>{item.label}</p>
              <p className={`text-base ${isDark ? 'text-white/60' : 'text-black/60'}`}>{item.sublabel}</p>
            </div>
            <svg className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-black/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-4 pb-8">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600/20 border border-red-600/50 text-red-600 py-4 flex items-center justify-center gap-2 font-medium tracking-wider"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default MenuScreen;
