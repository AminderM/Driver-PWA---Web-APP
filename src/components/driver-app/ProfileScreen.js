import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const ENDORSEMENT_LABELS = { H: 'Hazmat', N: 'Tank', X: 'Hazmat+Tank', T: 'Doubles/Triples', P: 'Passenger', S: 'School Bus' };

const LICENSE_TYPE_LABELS = { CDL_A: 'CDL Class A', CDL_B: 'CDL Class B', CDL_C: 'CDL Class C', NON_CDL: 'Non-CDL' };

const DOC_TYPE_LABELS = {
  drivers_license: "Driver's License",
  medical_card: 'Medical Card',
  hazmat_cert: 'Hazmat Certification',
  twic_card: 'TWIC Card',
  other: 'Other Document',
};

const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000; // within 60 days
};

const isExpired = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const ExpiryBadge = ({ date }) => {
  if (!date) return null;
  if (isExpired(date)) return <span className="ml-2 text-xs bg-red-600/20 text-red-400 px-2 py-0.5">EXPIRED</span>;
  if (isExpiringSoon(date)) return <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5">EXPIRING SOON</span>;
  return null;
};

const ProfileScreen = ({ onBack, onOpenScanner }) => {
  const { user, currentLocation, api } = useDriverApp();
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await api('/documents');
        setDocuments(Array.isArray(data) ? data : []);
      } catch {
        setDocuments([]);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, [api]);

  const hasLicenseData = user?.license_number || user?.license_type || user?.license_expiry;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-['Oxanium']">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-950 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white tracking-wider">PROFILE</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Avatar */}
        <div className="text-center mb-2">
          <div className="w-24 h-24 bg-red-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl text-white font-bold">
              {user?.full_name?.charAt(0) || 'D'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
          <p className="text-white/50 text-sm">Driver</p>
          {user?.home_terminal && (
            <p className="text-white/40 text-xs mt-1">{user.home_terminal}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-[#0a0a0a] border border-[#262626] p-4 space-y-3">
          <p className="text-white/40 text-xs tracking-wider">CONTACT</p>
          <div>
            <p className="text-white/50 text-xs mb-0.5">Email</p>
            <p className="text-white text-sm">{user?.email}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs mb-0.5">Phone</p>
            <p className="text-white text-sm">{user?.phone || '—'}</p>
          </div>
          {user?.hire_date && (
            <div>
              <p className="text-white/50 text-xs mb-0.5">Hire Date</p>
              <p className="text-white text-sm">{new Date(user.hire_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* License & Certifications */}
        <div className="bg-[#0a0a0a] border border-[#262626] p-4 space-y-3">
          <p className="text-white/40 text-xs tracking-wider">LICENSE & CERTIFICATIONS</p>

          {hasLicenseData ? (
            <>
              {user.license_number && (
                <div>
                  <p className="text-white/50 text-xs mb-0.5">License Number</p>
                  <p className="text-white text-sm font-mono">{user.license_number}</p>
                </div>
              )}
              {user.license_type && (
                <div>
                  <p className="text-white/50 text-xs mb-0.5">License Type</p>
                  <p className="text-white text-sm">{LICENSE_TYPE_LABELS[user.license_type] || user.license_type}</p>
                </div>
              )}
              {user.license_state && (
                <div>
                  <p className="text-white/50 text-xs mb-0.5">License State</p>
                  <p className="text-white text-sm">{user.license_state}</p>
                </div>
              )}
              {user.license_expiry && (
                <div>
                  <p className="text-white/50 text-xs mb-0.5">License Expiry</p>
                  <div className="flex items-center">
                    <p className="text-white text-sm">{new Date(user.license_expiry).toLocaleDateString()}</p>
                    <ExpiryBadge date={user.license_expiry} />
                  </div>
                </div>
              )}
              {user.medical_card_expiry && (
                <div>
                  <p className="text-white/50 text-xs mb-0.5">Medical Card Expiry</p>
                  <div className="flex items-center">
                    <p className="text-white text-sm">{new Date(user.medical_card_expiry).toLocaleDateString()}</p>
                    <ExpiryBadge date={user.medical_card_expiry} />
                  </div>
                </div>
              )}
              {user.endorsements?.length > 0 && (
                <div>
                  <p className="text-white/50 text-xs mb-1">Endorsements</p>
                  <div className="flex flex-wrap gap-2">
                    {user.endorsements.map(e => (
                      <span key={e} className="bg-red-600/20 border border-red-600/40 text-red-400 text-xs px-2 py-1 tracking-wider">
                        {e} — {ENDORSEMENT_LABELS[e] || e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-white/30 text-sm">No license details on file.</p>
          )}
        </div>

        {/* Scanned Documents */}
        <div className="bg-[#0a0a0a] border border-[#262626] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-xs tracking-wider">SCANNED DOCUMENTS</p>
            <button
              onClick={onOpenScanner}
              className="text-red-500 text-xs tracking-wider hover:text-red-400"
            >
              + SCAN
            </button>
          </div>

          {docsLoading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/30 text-sm">Loading...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-white/30 text-sm mb-3">No documents scanned yet</p>
              <button
                onClick={onOpenScanner}
                className="border border-[#262626] text-white/50 text-sm px-6 py-3 hover:bg-white/5 tracking-wider"
              >
                SCAN A DOCUMENT
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex gap-3 border border-[#1a1a1a] p-3">
                  <img
                    src={doc.document_url}
                    alt={DOC_TYPE_LABELS[doc.document_type] || 'Document'}
                    className="w-16 h-16 object-cover flex-shrink-0 bg-[#1a1a1a]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold tracking-wider">
                      {DOC_TYPE_LABELS[doc.document_type] || 'Document'}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location & Status */}
        <div className="bg-[#0a0a0a] border border-[#262626] p-4 space-y-3">
          <p className="text-white/40 text-xs tracking-wider">STATUS</p>
          <div>
            <p className="text-white/50 text-xs mb-0.5">Location Tracking</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm">Active</span>
            </div>
            {currentLocation && (
              <p className="text-white/30 text-xs mt-1">Accuracy: ±{Math.round(currentLocation.accuracy_m || 0)}m</p>
            )}
          </div>
          <div>
            <p className="text-white/50 text-xs mb-0.5">Driver ID</p>
            <p className="text-white font-mono text-xs">{user?.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
