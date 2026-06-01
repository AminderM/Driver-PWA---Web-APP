import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { getCurrentPosition, watchPosition as nativeWatchPosition, registerForPushNotifications, isNative } from '../../lib/native';

// ── Env guard (C4) ─────────────────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_BACKEND_URL || '';
if (!process.env.REACT_APP_BACKEND_URL && process.env.NODE_ENV === 'production') {
  console.error('[DriverApp] CRITICAL: REACT_APP_BACKEND_URL is not set. All API calls will fail.');
}

// ── Secure storage abstraction (C5) ───────────────────────────────────────────
// Uses @capacitor/preferences on native (encrypted), falls back to localStorage on web
const storage = {
  async getItem(key) {
    try {
      if (isNative()) {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key });
        return value;
      }
    } catch { /* plugin not available, fall through */ }
    return localStorage.getItem(key);
  },
  async setItem(key, value) {
    try {
      if (isNative()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key, value });
        return;
      }
    } catch { /* fall through */ }
    localStorage.setItem(key, value);
  },
  async removeItem(key) {
    try {
      if (isNative()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key });
        return;
      }
    } catch { /* fall through */ }
    localStorage.removeItem(key);
  },
};

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
  <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-[#030303]' : 'bg-white'}`}>
    <div className={`rounded-none p-8 max-w-md text-center border ${theme === 'dark' ? 'bg-[#080808] border-[#1F1F1F]' : 'bg-white border-[#e5e5e5]'}`}>
      <div className="w-20 h-20 bg-[#CC2222]/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[#CC2222]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className={`text-2xl font-bold mb-4 font-['Barlow_Condensed'] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>MOBILE ONLY</h1>
      <p className={`mb-6 ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
        This driver app is designed for mobile devices only. Please open it on your smartphone to continue.
      </p>
      <div className={`p-4 ${theme === 'dark' ? 'bg-[#161616]' : 'bg-[#f5f5f5]'}`}>
        <p className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>Visit this URL on your phone:</p>
        <p className="text-[#CC2222] font-mono text-sm mt-2 break-all">{window.location.href}</p>
      </div>
    </div>
  </div>
);

// Location Permission Screen (uses TMS theme)
const LocationPermissionScreen = ({ onRetry, error, theme }) => (
  <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-[#030303]' : 'bg-white'}`}>
    <div className={`p-8 max-w-md text-center border ${theme === 'dark' ? 'bg-[#080808] border-[#1F1F1F]' : 'bg-white border-[#e5e5e5]'}`}>
      <div className="w-20 h-20 bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[#D4921A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h1 className={`text-2xl font-bold mb-4 font-['Barlow_Condensed'] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>LOCATION REQUIRED</h1>
      <p className={`mb-6 ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
        Location access is required to use this driver app. Your location helps dispatch track deliveries.
      </p>
      
      {error && (
        <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4 mb-6 text-left">
          <p className="text-[#CC2222] font-medium mb-2">Permission Denied</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
            Enable location in your device settings, then tap below.
          </p>
        </div>
      )}
      
      <button
        onClick={onRetry}
        className="w-full bg-[#CC2222] hover:bg-[#7A1010] text-white font-semibold py-4 px-6 transition-colors font-['Barlow_Condensed']"
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
  const [locationPingFailing, setLocationPingFailing] = useState(false); // C1
  const pingFailCount = useRef(0); // C1
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

  // Load auth state — async so secure storage (Capacitor Preferences) can be awaited (C5)
  useEffect(() => {
    const loadAuth = async () => {
      const savedToken = await storage.getItem('driver_app_token');
      const savedUserStr = await storage.getItem('driver_app_user');
      if (savedToken && savedUserStr) {
        const u = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(u);
        const localComplete = await storage.getItem(`driver_profile_complete_${u.id}`) === 'true';
        setProfileComplete(localComplete || u.first_login === false);
      }
    };
    loadAuth();
  }, []);

  const completeProfile = () => {
    if (user) storage.setItem(`driver_profile_complete_${user.id}`, 'true');
    setProfileComplete(true);
  };

  const mergeUserData = (newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      storage.setItem('driver_app_user', JSON.stringify(updated));
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
      // C1: track consecutive failures and warn driver
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        await fetch(`${BASE_URL}/api/driver-mobile/location/ping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ...loc, load_id: activeLoadId }),
          signal: controller.signal,
        });
        pingFailCount.current = 0;
        if (locationPingFailing) setLocationPingFailing(false);
      } catch (err) {
        console.error('Location ping failed:', err);
        pingFailCount.current += 1;
        if (pingFailCount.current >= 2) setLocationPingFailing(true);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let unsubscribe;
    nativeWatchPosition(pingLocation, () => setLocationGranted(false))
      .then(fn => { unsubscribe = fn; });

    return () => { unsubscribe?.(); };
  }, [locationGranted, user, token, activeLoadId]);

  // Helper to finalize session after any login method
  const _finalizeSession = async (data) => {
    setToken(data.access_token);
    setUser(data.user);
    await storage.setItem('driver_app_token', data.access_token);
    await storage.setItem('driver_app_user', JSON.stringify(data.user));
    const localComplete = await storage.getItem(`driver_profile_complete_${data.user.id}`) === 'true';
    setProfileComplete(localComplete || data.user.first_login === false);
    // H13: register for push notifications after login
    registerForPushNotifications().catch(e => console.warn('Push registration failed:', e));
  };

  // Login
  const login = async (email, password) => {
    const response = await fetch(`${BASE_URL}/api/driver-mobile/login`, {
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
    await _finalizeSession(data);
    return data;
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setLocationGranted(false);
    storage.removeItem('driver_app_token');
    storage.removeItem('driver_app_user');
  };

  // API helper — H8: 401 auto-logout, H9: 15s timeout via AbortController
  const api = async (endpoint, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const isFormData = options.body instanceof FormData;
    try {
      const response = await fetch(`${BASE_URL}/api/driver-mobile${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        }
      });

      // H8: expired token — auto logout and surface a clear message
      if (response.status === 401) {
        logout();
        const err = new Error('Session expired. Please sign in again.');
        err.status = 401;
        throw err;
      }

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
        const err = new Error(message);
        err.status = response.status;
        err.detail = rawDetail;
        throw err;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Request timed out. Please check your connection.');
        timeoutErr.status = 0;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const validateInvite = async (inviteCode) => {
    const response = await fetch(
      `${BASE_URL}/api/driver-mobile/invite/${encodeURIComponent(inviteCode)}`
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
    const response = await fetch(`${BASE_URL}/api/driver-mobile/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteCode, phone, password }),
    });
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
    await storage.setItem('driver_app_token', data.access_token);
    await storage.setItem('driver_app_user', JSON.stringify(data.user));
    setProfileComplete(false);
    setInviteToken(null);
    registerForPushNotifications().catch(e => console.warn('Push registration failed:', e));
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

  // Open registration — no invite required (Owner Operator + Carrier)
  const openSignup = async ({ userType, fullName, email, phone, password, companyName, mcDotNumber, logoFile, otp }) => {
    const formData = new FormData();
    formData.append('user_type', userType);
    formData.append('full_name', fullName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('company_name', companyName);
    if (mcDotNumber) formData.append('mc_dot_number', mcDotNumber);
    if (logoFile)    formData.append('logo', logoFile);
    if (otp)         formData.append('otp', otp);

    const response = await fetch(`${BASE_URL}/api/driver-mobile/signup/open`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const detail = err.detail;
      const message = Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join('. ')
        : (typeof detail === 'string' ? detail : 'Registration failed. Please try again.');
      throw new Error(message);
    }
    const data = await response.json();
    setToken(data.access_token);
    setUser(data.user);
    await storage.setItem('driver_app_token', data.access_token);
    await storage.setItem('driver_app_user', JSON.stringify(data.user));
    setProfileComplete(true);
    setInviteToken(null);
    registerForPushNotifications().catch(e => console.warn('Push registration failed:', e));
    return data;
  };

  // Phone OTP login — send code (unauthenticated)
  const loginWithPhoneRequest = async (phone) => {
    const response = await fetch(`${BASE_URL}/api/driver-mobile/auth/phone/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to send verification code.');
    }
  };

  // Phone OTP login — verify code, returns JWT + user
  const loginWithPhoneVerify = async (phone, otp) => {
    const response = await fetch(`${BASE_URL}/api/driver-mobile/auth/phone/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid or expired code.');
    }
    const data = await response.json();
    await _finalizeSession(data);
    return data;
  };

  // Google OAuth — exchange Google ID token for app JWT
  const loginWithGoogle = async (googleIdToken) => {
    const response = await fetch(`${BASE_URL}/api/driver-mobile/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: googleIdToken }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Google sign-in failed.');
    }
    const data = await response.json();
    await _finalizeSession(data);
    return data;
  };

  // Update profile (company name, MC/DOT, logo)
  const updateProfile = async (data) => {
    // Optimistic local save first — text fields persist to localStorage immediately
    // so data survives tab/page changes even if the backend call fails.
    const localUpdate = {};
    if (data.company_name  !== undefined) localUpdate.company_name  = data.company_name;
    if (data.mc_dot_number !== undefined) localUpdate.mc_dot_number = data.mc_dot_number;
    if (Object.keys(localUpdate).length) mergeUserData(localUpdate);

    const isLogoUpload = data.logo instanceof File;
    let body, headers;
    if (isLogoUpload) {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v != null) formData.append(k, v); });
      body = formData;
      headers = {};
    } else {
      body = JSON.stringify(data);
      headers = { 'Content-Type': 'application/json' };
    }
    try {
      const result = await api('/profile', { method: 'PATCH', headers, body });
      if (result?.user) mergeUserData(result.user);
      else if (result && typeof result === 'object') mergeUserData(result);
      return result;
    } catch (err) {
      // Local save already applied above — rethrow so UI can show a warning
      throw err;
    }
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
    locationPingFailing, // C1 — screens can show a warning banner
    profileComplete, completeProfile, mergeUserData,
    inviteToken, setInviteToken, validateInvite, signup,
    openSignup, loginWithPhoneRequest, loginWithPhoneVerify, loginWithGoogle, updateProfile,
    phoneVerified, sendPhoneOTP, verifyPhoneOTP,
    theme, toggleTheme, setTheme
  };

  if (isCheckingDevice) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#030303]' : 'bg-white'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-[#CC2222] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isMobile) return <MobileBlockScreen theme={theme} />;
  
  if (user && !locationGranted && user?.user_type === 'driver') {
    return <LocationPermissionScreen onRetry={requestLocation} error={locationError} theme={theme} />;
  }

  return (
    <DriverAppContext.Provider value={value}>
      {children}
    </DriverAppContext.Provider>
  );
};

export default DriverAppProvider;
