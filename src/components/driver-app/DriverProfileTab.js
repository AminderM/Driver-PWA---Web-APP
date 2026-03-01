import React, { useState } from 'react';
import { useDriverApp } from './DriverAppProvider';
import { User, Phone, Mail, LogOut, MapPin, Shield, ChevronRight } from 'lucide-react';

const DriverProfile = () => {
  const { user, logout, currentLocation } = useDriverApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Profile Card */}
        <div className="bg-slate-800 rounded-xl p-6 text-center mb-4">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">{user?.full_name}</h2>
          <p className="text-slate-400 text-sm mt-1">Driver</p>
        </div>

        {/* Info */}
        <div className="bg-slate-800 rounded-xl divide-y divide-slate-700">
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-500 text-xs">Email</p>
              <p className="text-white">{user?.email}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-500 text-xs">Phone</p>
              <p className="text-white">{user?.phone || 'Not set'}</p>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-500 text-xs">Location Status</p>
              <p className="text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Tracking Active
              </p>
              {currentLocation && (
                <p className="text-slate-500 text-xs mt-1">
                  Accuracy: {Math.round(currentLocation.accuracy_m || 0)}m
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-xs">Fleet Marketplace Driver App</p>
          <p className="text-slate-700 text-xs mt-1">Version 1.0.0</p>
        </div>
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-semibold text-white mb-2">Sign Out?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to sign out? Location tracking will stop.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-slate-700 text-white py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfile;
