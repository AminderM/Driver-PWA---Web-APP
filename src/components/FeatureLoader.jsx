import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FeaturesProvider } from '../contexts/FeaturesContext';

const FeatureLoader = ({ children }) => {
  const { fetchWithAuth } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const [flags, setFlags] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try current route first for non-fleet roles
        let res = await fetchWithAuth(`${BACKEND_URL}/api/companies/current`);
        if (!res.ok) {
          res = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`);
        }
        if (res.ok) {
          const company = await res.json();
          if (!cancelled) setFlags(company.feature_flags || {});
        } else {
          if (!cancelled) setFlags({});
        }
      } catch (e) {
        if (!cancelled) setFlags({});
      }
    })();
    return () => { cancelled = true; };
  }, [BACKEND_URL, fetchWithAuth]);

  if (flags === null) return null; // wait quietly; app already has loaders elsewhere

  return (
    <FeaturesProvider flags={flags}>
      {children}
    </FeaturesProvider>
  );
};

export default FeatureLoader;
