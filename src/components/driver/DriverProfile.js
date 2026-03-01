import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Mail, Phone, Building, CheckCircle, Clock } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DriverProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('driver_token');
      const response = await axios.get(`${API_URL}/api/driver/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/driver-portal');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      verified: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Verified' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending Verification' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: null, label: 'Rejected' },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const statusBadge = getStatusBadge(profile.registration_status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/driver-portal/dashboard')}
            className="flex items-center gap-2 text-white hover:text-blue-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">{profile.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
              <p className="text-sm text-gray-600 uppercase">{profile.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                <p className="text-sm text-gray-900">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                <p className="text-sm text-gray-900">{profile.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {profile.company && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Company Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Company Name</p>
                <p className="text-base font-medium text-gray-900">{profile.company.name}</p>
              </div>
              {profile.company.phone && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Company Phone</p>
                  <p className="text-sm text-gray-900">{profile.company.phone}</p>
                </div>
              )}
              {profile.company.email && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Company Email</p>
                  <p className="text-sm text-gray-900">{profile.company.email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
          <div className={`flex items-center gap-3 p-4 ${statusBadge.bg} rounded-lg`}>
            {StatusIcon && <StatusIcon className={`w-5 h-5 ${statusBadge.text}`} />}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${statusBadge.text}`}>{statusBadge.label}</p>
              {profile.registration_status === 'pending' && (
                <p className="text-xs text-gray-600 mt-1">
                  Your account is pending verification. Please contact your fleet manager or wait for approval.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverProfile;
