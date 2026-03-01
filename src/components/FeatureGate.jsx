import React from 'react';
import { useFeatures } from '../contexts/FeaturesContext';

const FeatureGate = ({ flag, children, fallback = null }) => {
  const flags = useFeatures();
  if (!flags || flags[flag] === undefined) return fallback;
  return flags[flag] ? children : fallback;
};

export default FeatureGate;
