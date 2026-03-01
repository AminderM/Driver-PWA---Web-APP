import React from 'react';
import { useDriverApp } from './DriverAppProvider';

const ProfileScreen = ({ onBack }) => {
  const { user, currentLocation } = useDriverApp();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-950 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Avatar */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl text-white font-bold">
              {user?.full_name?.charAt(0) || 'D'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
          <p className="text-gray-400">Driver</p>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-500 text-xs mb-1">Email</p>
            <p className="text-white">{user?.email}</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-500 text-xs mb-1">Phone</p>
            <p className="text-white">{user?.phone || 'Not set'}</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-500 text-xs mb-1">Location Tracking</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400">Active</span>
            </div>
            {currentLocation && (
              <p className="text-gray-500 text-xs mt-1">
                Accuracy: ±{Math.round(currentLocation.accuracy_m || 0)}m
              </p>
            )}
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-500 text-xs mb-1">Driver ID</p>
            <p className="text-white font-mono text-sm">{user?.id?.slice(0, 12)}...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
