import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

const ENDORSEMENT_LABELS = { H: 'Hazmat', N: 'Tank', X: 'Hazmat+Tank', T: 'Doubles/Triples', P: 'Passenger', S: 'School Bus' };
const LICENSE_TYPE_LABELS = { CDL_A: 'CDL Class A', CDL_B: 'CDL Class B', CDL_C: 'CDL Class C', NON_CDL: 'Non-CDL' };
const ROLE_LABELS = { driver: 'Driver', owner_operator: 'Owner Operator', carrier: 'Carrier' };

const DOC_TYPE_LABELS = {
  drivers_license:      "Driver's License",
  medical_card:         'Medical Card',
  hazmat_cert:          'Hazmat Certification',
  twic_card:            'TWIC Card',
  abstract:             'Driver Abstract',
  sin_card:             'SIN Card',
  void_cheque:          'Void Cheque',
  vehicle_registration: 'Vehicle Registration',
  cvor_certificate:     'CVOR / NSC Certificate',
  cargo_insurance:      'Cargo Insurance',
  liability_insurance:  'Liability Insurance',
  lease_agreement:      'Lease Agreement',
  ifta_license:         'IFTA License',
  business_registration:'Business Registration',
  gst_hst_registration: 'GST/HST Registration',
  operating_authority:  'Operating Authority',
  other:                'Other Document',
};

const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000;
};

const isExpired = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const ExpiryBadge = ({ date }) => {
  if (!date) return null;
  if (isExpired(date)) return <span className="ml-2 text-xs bg-[#CC2222]/20 text-[#FF2020] px-2 py-0.5">EXPIRED</span>;
  if (isExpiringSoon(date)) return <span className="ml-2 text-xs bg-amber-500/20 text-[#D4921A] px-2 py-0.5">EXPIRING SOON</span>;
  return null;
};

const SCAN_DOC_TYPES = [
  { value: 'drivers_license',       label: "Driver's License"       },
  { value: 'medical_card',          label: 'Medical Card'           },
  { value: 'vehicle_registration',  label: 'Vehicle Registration'   },
  { value: 'cargo_insurance',       label: 'Cargo Insurance'        },
  { value: 'liability_insurance',   label: 'Liability Insurance'    },
  { value: 'cvor_certificate',      label: 'CVOR / NSC Certificate' },
  { value: 'ifta_license',          label: 'IFTA License'           },
  { value: 'operating_authority',   label: 'Operating Authority'    },
  { value: 'abstract',              label: 'Driver Abstract'        },
  { value: 'proof_of_delivery',     label: 'Proof of Delivery'      },
  { value: 'other',                 label: 'Other'                  },
];

const ProfileScreen = ({ onBack }) => {
  const { user, currentLocation, api, userType, updateProfile, theme, toggleTheme, logout } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-[#030303]'        : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#080808]'        : 'bg-white';
  const text    = isDark ? 'text-white'           : 'text-black';
  const subtext = isDark ? 'text-white/50'        : 'text-black/50';
  const border  = isDark ? 'border-[#1F1F1F]'    : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC2222] ${
    isDark
      ? 'bg-[#161616] border-[#1F1F1F] text-white placeholder-white/30'
      : 'bg-[#f5f5f5] border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  const [showLogout, setShowLogout] = useState(false);
  const [documents, setDocuments]     = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);

  // Business info edit state (OO + Carrier only)
  const [editingBiz, setEditingBiz]       = useState(false);
  const [bizCompany, setBizCompany]       = useState('');
  const [bizMcDot, setBizMcDot]           = useState('');
  const [bizSaving, setBizSaving]         = useState(false);
  const [bizError, setBizError]           = useState('');
  const [logoPreview, setLogoPreview]     = useState(null);
  const [logoFile, setLogoFile]           = useState(null);
  const logoInputRef                      = useRef(null);

  // Document scan state
  const scanFileInputRef                  = useRef(null);
  const [scanFile, setScanFile]           = useState(null);
  const [scanFileName, setScanFileName]   = useState('');
  const [scanDocType, setScanDocType]     = useState('drivers_license');
  const [scanSaving, setScanSaving]       = useState(false);
  const [scanError, setScanError]         = useState('');
  const [scanSheet, setScanSheet]         = useState(false);

  const handleScanClick = () => {
    setScanError('');
    scanFileInputRef.current?.click();
  };

  const handleScanFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanFile(file);
    setScanFileName(file.name);
    setScanDocType('drivers_license');
    setScanError('');
    setScanSheet(true);
    e.target.value = '';
  };

  const submitScan = async () => {
    if (!scanFile) return;
    setScanSaving(true);
    setScanError('');
    try {
      const formData = new FormData();
      formData.append('document_type', scanDocType);
      formData.append('file', scanFile);
      const result = await api('/documents/scan', { method: 'POST', body: formData });
      setDocuments(prev => [result, ...prev]);
      setScanSheet(false);
      setScanFile(null);
      setScanFileName('');
    } catch (err) {
      setScanError(err.message || 'Scan failed. Please try again.');
    } finally {
      setScanSaving(false);
    }
  };

  const isBusinessUser = userType === 'owner_operator' || userType === 'carrier';

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

  const openBizEdit = () => {
    setBizCompany(user?.company_name || '');
    setBizMcDot(user?.mc_dot_number || '');
    setLogoFile(null);
    setLogoPreview(null);
    setBizError('');
    setEditingBiz(true);
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleBizSave = async () => {
    setBizSaving(true);
    setBizError('');
    try {
      await updateProfile({
        company_name: bizCompany.trim() || null,
        mc_dot_number: bizMcDot.trim() || null,
        ...(logoFile ? { logo: logoFile } : {}),
      });
      setEditingBiz(false);
    } catch (err) {
      setBizError(err.message || 'Failed to save. Please try again.');
    } finally {
      setBizSaving(false);
    }
  };

  const hasLicenseData = user?.license_number || user?.license_type || user?.license_expiry;

  const subscriptionLabel = () => {
    const s = user?.subscription_status;
    if (s === 'active') return { text: 'ACTIVE', cls: 'text-[#2DBB62] bg-[#2DBB62]/20' };
    if (s === 'cancelled') return { text: 'CANCELLED', cls: 'text-[#FF2020] bg-[#CC2222]/20' };
    if (s === 'past_due') return { text: 'PAST DUE', cls: 'text-[#D4921A] bg-[#D4921A]/20' };
    return { text: 'FREE TRIAL', cls: 'text-[#D4921A] bg-[#D4921A]/20' };
  };

  return (
    <div className={`min-h-screen ${bg} flex flex-col font-['Barlow_Condensed'] relative`}>

      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <div className="flex items-center justify-between mb-1">
          <button onClick={onBack} className={`text-sm tracking-wider ${subtext}`}>← BACK</button>
          <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
        <h1 className={`text-xl font-bold tracking-wider ${text}`}>PROFILE</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Avatar / Logo */}
        <div className="text-center mb-2">
          {isBusinessUser && user?.logo_url ? (
            <img src={user.logo_url} alt="Company logo"
              className={`w-24 h-24 object-cover mx-auto mb-3 border ${border}`} />
          ) : (
            <div className="w-24 h-24 bg-[#CC2222] flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl text-white font-bold">
                {user?.full_name?.charAt(0) || 'D'}
              </span>
            </div>
          )}
          <h2 className={`text-xl font-bold ${text}`}>{user?.full_name}</h2>
          {isBusinessUser && user?.company_name && (
            <p className={`text-sm mt-0.5 ${subtext}`}>{user.company_name}</p>
          )}
          <p className={`text-sm ${subtext}`}>{ROLE_LABELS[userType] || 'Driver'}</p>
          {user?.home_terminal && (
            <p className={`text-xs mt-1 ${subtext}`}>{user.home_terminal}</p>
          )}
          {user?.carrier_name && userType === 'driver' && (
            <p className={`text-xs mt-1 ${subtext}`}>{user.carrier_name}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <p className={`text-xs tracking-wider ${subtext}`}>CONTACT</p>
          <div>
            <p className={`text-xs mb-0.5 ${subtext}`}>Email</p>
            <p className={`text-sm ${text}`}>{user?.email}</p>
          </div>
          <div>
            <p className={`text-xs mb-0.5 ${subtext}`}>Phone</p>
            <p className={`text-sm ${text}`}>{user?.phone || '—'}</p>
          </div>
          {user?.hire_date && (
            <div>
              <p className={`text-xs mb-0.5 ${subtext}`}>Hire Date</p>
              <p className={`text-sm ${text}`}>{new Date(user.hire_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Business Info — Owner Operator + Carrier (editable) */}
        {isBusinessUser && (
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs tracking-wider ${subtext}`}>BUSINESS INFO</p>
              {!editingBiz && (
                <button onClick={openBizEdit} className="text-[#CC2222] text-xs tracking-wider hover:text-[#FF2020]">
                  EDIT
                </button>
              )}
            </div>

            {editingBiz ? (
              <div className="space-y-3">
                {bizError && (
                  <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-3">
                    <p className="text-[#FF2020] text-xs">{bizError}</p>
                  </div>
                )}
                <div>
                  <p className={`text-xs mb-1 ${subtext}`}>Company Name</p>
                  <input type="text" value={bizCompany} onChange={e => setBizCompany(e.target.value)}
                    placeholder="Smith Trucking Inc." className={inputCls} />
                </div>
                <div>
                  <p className={`text-xs mb-1 ${subtext}`}>MC / DOT Number</p>
                  <input type="text" value={bizMcDot} onChange={e => setBizMcDot(e.target.value)}
                    placeholder="MC-123456 or USDOT 1234567"
                    className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <p className={`text-xs mb-1 ${subtext}`}>Company Logo</p>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                  {logoPreview ? (
                    <div className="flex items-center gap-3">
                      <img src={logoPreview} alt="Logo preview" className={`w-12 h-12 object-cover border ${border}`} />
                      <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className={`text-xs ${subtext} hover:text-[#FF2020]`}>Remove</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => logoInputRef.current?.click()}
                      className={`w-full border border-dashed ${border} ${subtext} text-xs py-3 tracking-wider hover:border-[#CC2222]/40 transition-colors`}>
                      {user?.logo_url ? 'CHANGE LOGO' : 'UPLOAD LOGO'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditingBiz(false)} disabled={bizSaving}
                    className={`flex-1 border ${border} ${subtext} text-sm py-2.5 tracking-wider`}>
                    CANCEL
                  </button>
                  <button onClick={handleBizSave} disabled={bizSaving}
                    className="flex-1 bg-[#CC2222] hover:bg-[#7A1010] disabled:bg-[#CC2222]/50 text-white text-sm py-2.5 tracking-wider transition-colors">
                    {bizSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        SAVING...
                      </span>
                    ) : 'SAVE'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className={`text-xs mb-0.5 ${subtext}`}>Company Name</p>
                  <p className={`text-sm ${text}`}>{user?.company_name || <span className={`italic ${subtext}`}>Not set — tap Edit</span>}</p>
                </div>
                <div>
                  <p className={`text-xs mb-0.5 ${subtext}`}>MC / DOT Number</p>
                  <p className={`text-sm font-mono ${text}`}>
                    {user?.mc_dot_number || <span className={`italic text-sm font-normal ${subtext}`}>Not set — required for invoicing</span>}
                  </p>
                </div>
                {user?.logo_url && (
                  <div>
                    <p className={`text-xs mb-1 ${subtext}`}>Logo</p>
                    <img src={user.logo_url} alt="Company logo" className={`w-14 h-14 object-cover border ${border}`} />
                  </div>
                )}
                {user?.company_address && (
                  <div>
                    <p className={`text-xs mb-0.5 ${subtext}`}>Address</p>
                    <p className={`text-sm ${text}`}>{user.company_address}</p>
                  </div>
                )}
                {(user?.mc_number || user?.dot_number) && !user?.mc_dot_number && (
                  <div>
                    <p className={`text-xs mb-0.5 ${subtext}`}>MC / DOT</p>
                    <p className={`text-sm font-mono ${text}`}>
                      {[user.mc_number, user.dot_number].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Subscription status */}
        {isBusinessUser && (
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider ${subtext}`}>SUBSCRIPTION</p>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs mb-0.5 ${subtext}`}>Integra AI Vault</p>
                {user?.trial_ends_at && user?.subscription_status !== 'active' && (
                  <p className={`text-xs mt-0.5 ${subtext}`}>
                    Trial ends {new Date(user.trial_ends_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className={`text-xs px-2 py-1 tracking-wider font-semibold ${subscriptionLabel().cls}`}>
                {subscriptionLabel().text}
              </span>
            </div>
          </div>
        )}

        {/* License & Certifications */}
        {userType !== 'carrier' && (
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider ${subtext}`}>LICENSE & CERTIFICATIONS</p>
            {hasLicenseData ? (
              <>
                {user.license_number && (
                  <div>
                    <p className={`text-xs mb-0.5 ${subtext}`}>License Number</p>
                    <p className={`text-sm font-mono ${text}`}>{user.license_number}</p>
                  </div>
                )}
                {user.license_type && (
                  <div>
                    <p className={`text-xs mb-0.5 ${subtext}`}>License Type</p>
                    <p className={`text-sm ${text}`}>{LICENSE_TYPE_LABELS[user.license_type] || user.license_type}</p>
                  </div>
                )}
                {user.license_state && (
                  <div>
                    <p className={`text-xs mb-0.5 ${subtext}`}>License State</p>
                    <p className={`text-sm ${text}`}>{user.license_state}</p>
                  </div>
                )}
                {user.license_expiry && (
                  <div>
                    <p className={`text-xs mb-0.5 ${subtext}`}>License Expiry</p>
                    <div className="flex items-center">
                      <p className={`text-sm ${text}`}>{new Date(user.license_expiry).toLocaleDateString()}</p>
                      <ExpiryBadge date={user.license_expiry} />
                    </div>
                  </div>
                )}
                {user.medical_card_expiry && (
                  <div>
                    <p className={`text-xs mb-0.5 ${subtext}`}>Medical Card Expiry</p>
                    <div className="flex items-center">
                      <p className={`text-sm ${text}`}>{new Date(user.medical_card_expiry).toLocaleDateString()}</p>
                      <ExpiryBadge date={user.medical_card_expiry} />
                    </div>
                  </div>
                )}
                {user.endorsements?.length > 0 && (
                  <div>
                    <p className={`text-xs mb-1 ${subtext}`}>Endorsements</p>
                    <div className="flex flex-wrap gap-2">
                      {user.endorsements.map(e => (
                        <span key={e} className="bg-[#CC2222]/20 border border-[#CC2222]/40 text-[#FF2020] text-xs px-2 py-1 tracking-wider">
                          {e} — {ENDORSEMENT_LABELS[e] || e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className={`text-sm ${subtext}`}>No license details on file.</p>
            )}
          </div>
        )}

        {/* Scanned Documents */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs tracking-wider ${subtext}`}>SCANNED DOCUMENTS</p>
            <button onClick={handleScanClick} className="text-[#CC2222] text-xs tracking-wider hover:text-[#FF2020]">
              + SCAN
            </button>
          </div>

          {docsLoading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-[#CC2222] border-t-transparent rounded-full animate-spin" />
              <p className={`text-sm ${subtext}`}>Loading...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-4 text-center">
              <p className={`text-sm mb-3 ${subtext}`}>No documents scanned yet</p>
              <button onClick={handleScanClick}
                className={`border ${border} ${subtext} text-sm px-6 py-3 tracking-wider hover:border-[#CC2222]/40 transition-colors`}>
                SCAN A DOCUMENT
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className={`flex gap-3 border ${border} p-3`}>
                  <img src={doc.document_url} alt={DOC_TYPE_LABELS[doc.document_type] || 'Document'}
                    className={`w-16 h-16 object-cover flex-shrink-0 ${isDark ? 'bg-[#161616]' : 'bg-[#f0f0f0]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold tracking-wider ${text}`}>
                      {DOC_TYPE_LABELS[doc.document_type] || 'Document'}
                    </p>
                    <p className={`text-xs mt-1 ${subtext}`}>
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location & Status */}
        {userType !== 'carrier' && (
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider ${subtext}`}>STATUS</p>
            <div>
              <p className={`text-xs mb-0.5 ${subtext}`}>Location Tracking</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[#2DBB62] text-sm">Active</span>
              </div>
              {currentLocation && (
                <p className={`text-xs mt-1 ${subtext}`}>Accuracy: ±{Math.round(currentLocation.accuracy_m || 0)}m</p>
              )}
            </div>
            <div>
              <p className={`text-xs mb-0.5 ${subtext}`}>Driver ID</p>
              <p className={`font-mono text-xs ${text}`}>{user?.id}</p>
            </div>
          </div>
        )}

        {/* Account ID — carrier only */}
        {userType === 'carrier' && (
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider ${subtext}`}>ACCOUNT</p>
            <div>
              <p className={`text-xs mb-0.5 ${subtext}`}>Account ID</p>
              <p className={`font-mono text-xs ${text}`}>{user?.id}</p>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <div className={`${surface} border-l-2 border-l-[#CC2222] border-t border-r border-b ${border} p-4`}>
          <button onClick={() => setShowLogout(true)}
            className="flex items-center gap-3 text-[#CC2222] text-sm font-bold tracking-wider w-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            SIGN OUT
          </button>
        </div>

        <div className="h-6" />
      </div>

      {/* Hidden file input */}
      <input ref={scanFileInputRef} type="file" accept="image/*,application/pdf"
        onChange={handleScanFileSelected} className="hidden" />

      {/* Logout confirm */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowLogout(false)} />
          <div className={`relative ${surface} border ${border} p-6 w-full max-w-sm`}>
            <h3 className={`text-lg font-bold tracking-wider mb-2 ${text}`}>SIGN OUT?</h3>
            <p className={`text-sm mb-6 ${subtext}`}>Location tracking will stop.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)}
                className={`flex-1 border ${border} ${subtext} py-3 text-sm tracking-wider`}>
                CANCEL
              </button>
              <button onClick={() => { logout(); setShowLogout(false); }}
                className="flex-1 bg-[#CC2222] text-white py-3 text-sm tracking-wider">
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document scan bottom sheet */}
      {scanSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => !scanSaving && setScanSheet(false)} />
          <div className="relative bg-[#0a0a0a] border-t border-[#1F1F1F] px-5 pt-5 pb-8 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white text-lg font-bold tracking-wider">SCAN DOCUMENT</h2>
              {!scanSaving && (
                <button onClick={() => setScanSheet(false)} className="text-white/40 text-xl">✕</button>
              )}
            </div>
            <p className="text-white/50 text-sm truncate">📎 {scanFileName}</p>
            {scanError && (
              <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-3">
                <p className="text-[#FF2020] text-sm">{scanError}</p>
              </div>
            )}
            <div>
              <label className="block text-white/60 text-xs tracking-wider mb-2">DOCUMENT TYPE</label>
              <select value={scanDocType} onChange={e => setScanDocType(e.target.value)} disabled={scanSaving}
                className="w-full bg-[#161616] border border-[#1F1F1F] text-white text-sm py-3 px-3 focus:outline-none focus:border-[#CC2222]">
                {SCAN_DOC_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>
            <button onClick={submitScan} disabled={scanSaving}
              className="w-full bg-[#CC2222] hover:bg-[#7A1010] disabled:bg-[#CC2222]/50 text-white font-bold py-4 tracking-wider transition-colors">
              {scanSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SCANNING...
                </span>
              ) : 'UPLOAD & SCAN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
