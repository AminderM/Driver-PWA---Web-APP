import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  
  // Initialize state synchronously from localStorage
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('auth_token') || null;
    } catch {
      return null;
    }
  });
  
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user_data');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false); // Set to false since we load synchronously

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_data');
    }
  }, [user]);

  // Apply company theme on load if present
  useEffect(() => {
    async function applyStoredTheme() {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const storedToken = token;
        if (!storedToken || !user) return;
        
        // Try to fetch company and apply theme
        let res = await fetch(`${backendUrl}/api/companies/current`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (!res.ok) {
          // Fallback for fleet_owner route
          res = await fetch(`${backendUrl}/api/companies/my`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
        }
        if (res.ok) {
          const company = await res.json();
          if (company?.theme) {
            Object.entries(company.theme).forEach(([k, v]) => {
              document.documentElement.style.setProperty(k, v);
            });
          }
        }
      } catch (e) {
        console.error('Error applying theme:', e);
      }
    }
    
    if (token && user) {
      applyStoredTheme();
    }
  }, [token, user]);

  const fetchWithAuth = async (url, options = {}) => {
    console.log('fetchWithAuth: token exists?', !!token, 'token length:', token?.length);
    if (!token) {
      console.error('fetchWithAuth: No authentication token!');
      throw new Error('No authentication token');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    console.log('fetchWithAuth: Making request to', url, 'with token:', token.substring(0, 20) + '...');
    const response = await fetch(url, { ...options, headers });
    console.log('fetchWithAuth: Response status:', response.status, response.ok);
    return response;
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        const { access_token, user: userData } = data;
        
        // Update state (which will automatically update localStorage via useEffect)
        setToken(access_token);
        setUser(userData);
        
        return true;
      } else {
        throw new Error(data.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    fetchWithAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
