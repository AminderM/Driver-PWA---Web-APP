import React, { useState, useEffect, createContext, useContext } from 'react';
import { getCurrentPosition, watchPosition as nativeWatchPosition } from '../../lib/native';

// Driver App Context
const DriverAppContext = createContext(null);

export const useDriverApp = () => {
  const context = useContext(DriverAppContext);
  if (!context) throw new Error('useDriverApp must be used within DriverAppProvider');
  return context;
};

// Mobile detection with preview bypass
const isMobileDevice = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = urlParams.get('preview') === 'true';
  if (isPreviewMode) return true;
  return window.innerWidth <= 768;
};

// Mobile Block Screen (uses TMS theme)
const MobileBlockScreen = ({ theme }) => (
  <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
    <div className={`rounded-none p-8 max-w-md text-center border ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]'}`}>
      <div className="w-20 h-20 bg-red-600/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className={`text-2xl font-bold mb-4 font-['Oxanium'] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>MOBILE ONLY</h1>
      <p className={`mb-6 ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
        This driver app is designed for mobile devices only. Please open it on your smartphone to continue.
      </p>
      <div className={`p-4 ${theme === 'dark' ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
        <p className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Visit this URL on your phone:</p>
        <p className="text-red-600 font-mono text-sm mt-2 break-all">{window.location.href}</p>
      </div>
    </div>
  </div>
);

// Location Permission Screen (uses TMS theme)
const LocationPermissionScreen = ({ onRetry, error, theme }) => (
  <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
    <div className={`p-8 max-w-md text-center border ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]'}`}>
      <div className="w-20 h-20 bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h1 className={`text-2xl font-bold mb-4 font-['Oxanium'] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>LOCATION REQUIRED</h1>
      <p className={`mb-6 ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
        Location access is required to use this driver app. Your location helps dispatch track deliveries.
      </p>
      
      {error && (
        <div className="bg-red-600/20 border border-red-600/50 p-4 mb-6 text-left">
          <p className="text-red-500 font-medium mb-2">Permission Denied</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
            Enable location in your device settings, then tap below.
          </p>
        </div>
      )}
      
      <button
        onClick={onRetry}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 transition-colors font-['Oxanium']"
      >
        ENABLE LOCATION
      </button>
    </div>
  </div>
);

// Main Provider
export const DriverAppProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(true);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeLoadId, setActiveLoadId] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const userType = user?.user_type || 'driver';
  const [inviteToken, setInviteToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite') || null;
  });
  
  // Theme state - synced with TMS
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('driver-app-theme') || localStorage.getItem('theme-mode') || localStorage.getItem('theme');
    return saved || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('driver-app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Check device type
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(isMobileDevice());
      setIsCheckingDevice(false);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Load auth state
  useEffect(() => {
    const savedToken = localStorage.getItem('driver_app_token');
    const savedUser = localStorage.getItem('driver_app_user');
    if (savedToken && savedUser) {
      const u = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(u);
      const localComplete = localStorage.getItem(`driver_profile_complete_${u.id}`) === 'true';
      setProfileComplete(localComplete || u.first_login === false);
    }
  }, []);

  const completeProfile = () => {
    if (user) localStorage.setItem(`driver_profile_complete_${user.id}`, 'true');
    setProfileComplete(true);
  };

  const mergeUserData = (newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('driver_app_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Request location permission
  const requestLocation = async () => {
    setLocationError(null);
    try {
      const loc = await getCurrentPosition();
      setCurrentLocation(loc);
      setLocationGranted(true);
    } catch (error) {
      setLocationError(error.message);
      setLocationGranted(false);
    }
  };

  // Location tracking
  useEffect(() => {
    if (!locationGranted || !user) return;
    if (user?.user_type === 'carrier') return;

    const pingLocation = async (loc) => {
      setCurrentLocation(loc);
      try {
        await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile/location/ping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...loc, load_id: activeLoadId })
        });
      } catch (err) {
        console.error('Location ping failed:', err);
      }
    };

    let unsubscribe;
    nativeWatchPosition(pingLocation, () => setLocationGranted(false))
      .then(fn => { unsubscribe = fn; });

    return () => { unsubscribe?.(); };
  }, [locationGranted, user, token, activeLoadId]);

  // Login
  const login = async (email, password) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      const detail = error.detail;
      const message = Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join('. ')
        : (typeof detail === 'string' ? detail : 'Login failed');
      throw new Error(message);
    }
    
    const data = await response.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('driver_app_token', data.access_token);
    localStorage.setItem('driver_app_user', JSON.stringify(data.user));
    const localComplete = localStorage.getItem(`driver_profile_complete_${data.user.id}`) === 'true';
    setProfileComplete(localComplete || data.user.first_login === false);
    return data;
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setLocationGranted(false);
    localStorage.removeItem('driver_app_token');
    localStorage.removeItem('driver_app_user');
  };

  // API helper
  const api = async (endpoint, options = {}) => {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile${endpoint}`, {
      ...options,
      headers: {
        // Don't set Content-Type for FormData — browser must set it with the multipart boundary
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      }
    });

    if (!response.ok) {
      let message = 'Request failed';
      let rawDetail = null;
      try {
        const error = await response.json();
        rawDetail = error.detail || error.message || error.error;
        message = typeof rawDetail === 'string' ? rawDetail
          : Array.isArray(rawDetail) ? rawDetail.map(e => e.msg || JSON.stringify(e)).join('. ')
          : message;
      } catch { /* response body not JSON */ }
      // Attach HTTP status so callers can distinguish 401/403/404/409/500
      const err = new Error(message);
      err.status = response.status;
      err.detail = rawDetail;
      throw err;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };

  const validateInvite = async (inviteCode) => {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile/invite/${encodeURIComponent(inviteCode)}`
    );
    if (response.status === 404) {
      throw new Error('Invite code not found, already used, or expired.');
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Could not validate invite code.');
    }
    return response.json();
  };

  const signup = async ({ inviteCode, phone, password }) => {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteCode, phone, password }),
      }
    );
    if (!response.ok) {
      const err = await response.json();
      const detail = err.detail;
      const message = Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join('. ')
        : (typeof detail === 'string' ? detail : 'Signup failed. Please try again.');
      throw new Error(message);
    }
    const data = await response.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('driver_app_token', data.access_token);
    localStorage.setItem('driver_app_user', JSON.stringify(data.user));
    // first_login: true → DocumentScanScreen will show after this
    setProfileComplete(false);
    setInviteToken(null);
    return data;
  };

  const devLogin = () => {
    const mockUser = { id: 'dev-user', full_name: 'Dev Driver', email: 'dev@example.com', role: 'driver', first_login: false, phone_verified: true };
    setUser(mockUser);
    setToken('dev-token');
    setLocationGranted(true);
    localStorage.setItem('driver_profile_complete_dev-user', 'true');
    setProfileComplete(true);
  };

  // Phone OTP — send to the driver's registered phone
  const sendPhoneOTP = async () => {
    await api('/phone/send-otp', { method: 'POST' });
  };

  // Phone OTP — verify the code, merges phone_verified: true into user
  const verifyPhoneOTP = async (otp) => {
    const result = await api('/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp })
    });
    mergeUserData(result?.user || { phone_verified: true });
  };

  // phone_verified: treat undefined (old users / backend not yet returning field) as verified
  const phoneVerified = user ? user.phone_verified !== false : false;

  const value = {
    user, token, login, logout, api, devLogin,
    userType,
    currentLocation, activeLoadId, setActiveLoadId,
    locationGranted, requestLocation,
    profileComplete, completeProfile, mergeUserData,
    inviteToken, setInviteToken, validateInvite, signup,
    phoneVerified, sendPhoneOTP, verifyPhoneOTP,
    theme, toggleTheme, setTheme
  };

  if (isCheckingDevice) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isMobile) return <MobileBlockScreen theme={theme} />;
  
  if (user && !locationGranted && user?.user_type !== 'carrier') {
    return <LocationPermissionScreen onRetry={requestLocation} error={locationError} theme={theme} />;
  }

  return (
    <DriverAppContext.Provider value={value}>
      {children}
    </DriverAppContext.Provider>
  );
};

export default DriverAppProvider;
