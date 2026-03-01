import React from 'react';

const SettingsScreen = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-950 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {/* Notifications */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Push Notifications</p>
              <p className="text-gray-500 text-sm">Get notified about new loads</p>
            </div>
            <div className="w-12 h-6 bg-red-600 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Location Tracking</p>
              <p className="text-gray-500 text-sm">Required for app operation</p>
            </div>
            <div className="w-12 h-6 bg-red-600 rounded-full relative opacity-50">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>

          {/* Dark Mode */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Dark Mode</p>
              <p className="text-gray-500 text-sm">Always enabled</p>
            </div>
            <div className="w-12 h-6 bg-red-600 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">Driver TMS Mobile</p>
          <p className="text-gray-700 text-xs mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
