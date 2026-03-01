import React, { createContext, useContext, useMemo } from 'react';

const defaultFlags = {
  live_tracking: true,
  eld_integration: false,
  ai_rate_confirmation: true,
  docs_versioning: true,
  apps_marketplace: true,
  brand_adaptive_theme: true,
  export_downloads: true,
  driver_app: false,
};

const FeaturesContext = createContext(defaultFlags);

export const useFeatures = () => useContext(FeaturesContext);

export const FeaturesProvider = ({ flags, children }) => {
  const merged = useMemo(() => ({ ...defaultFlags, ...(flags || {}) }), [flags]);
  return (
    <FeaturesContext.Provider value={merged}>{children}</FeaturesContext.Provider>
  );
};
