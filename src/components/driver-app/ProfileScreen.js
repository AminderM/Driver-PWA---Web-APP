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

const ProfileScreen = ({ onBack, onOpenScanner }) => {
  const { user, currentLocation, api, userType, updateProfile } = useDriverApp();
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
    <div className="min-h-screen bg-gray-950 flex flex-col font-['Barlow_Condensed']">
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

        {/* Avatar / Logo */}
        <div className="text-center mb-2">
          {isBusinessUser && user?.logo_url ? (
            <img src={user.logo_url} alt="Company logo"
              className="w-24 h-24 object-cover mx-auto mb-3 border border-[#1F1F1F]" />
          ) : (
            <div className="w-24 h-24 bg-[#CC2222] flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl text-white font-bold">
                {user?.full_name?.charAt(0) || 'D'}
              </span>
            </div>
          )}
          <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
          {isBusinessUser && user?.company_name && (
            <p className="text-white/70 text-sm mt-0.5">{user.company_name}</p>
          )}
          <p className="text-white/50 text-sm">{ROLE_LABELS[userType] || 'Driver'}</p>
          {user?.home_terminal && (
            <p className="text-white/40 text-xs mt-1">{user.home_terminal}</p>
          )}
          {user?.carrier_name && userType === 'driver' && (
            <p className="text-white/40 text-xs mt-1">{user.carrier_name}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-[#080808] border border-[#1F1F1F] p-4 space-y-3">
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

        {/* Business Info — Owner Operator + Carrier (editable) */}
        {isBusinessUser && (
          <div className="bg-[#080808] border border-[#1F1F1F] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-xs tracking-wider">BUSINESS INFO</p>
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
                  <p className="text-white/50 text-xs mb-1">Company Name</p>
                  <input type="text" value={bizCompany} onChange={e => setBizCompany(e.target.value)}
                    placeholder="Smith Trucking Inc."
                    className="w-full bg-[#161616] border border-[#1F1F1F] text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#CC2222] placeholder-white/30" />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">MC / DOT Number</p>
                  <input type="text" value={bizMcDot} onChange={e => setBizMcDot(e.target.value)}
                    placeholder="MC-123456 or USDOT 1234567"
                    className="w-full bg-[#161616] border border-[#1F1F1F] text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#CC2222] placeholder-white/30 font-mono" />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Company Logo</p>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                  {logoPreview ? (
                    <div className="flex items-center gap-3">
                      <img src={logoPreview} alt="Logo preview" className="w-12 h-12 object-cover border border-[#1F1F1F]" />
                      <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="text-white/40 text-xs hover:text-white/60">Remove</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => logoInputRef.current?.click()}
                      className="w-full border border-dashed border-[#1F1F1F] text-white/40 text-xs py-3 tracking-wider hover:border-[#CC2222]/40 hover:text-white/60 transition-colors">
                      {user?.logo_url ? 'CHANGE LOGO' : 'UPLOAD LOGO'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditingBiz(false)} disabled={bizSaving}
                    className="flex-1 border border-[#1F1F1F] text-white/50 text-sm py-2.5 tracking-wider hover:bg-white/5">
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
                  <p className="text-white/50 text-xs mb-0.5">Company Name</p>
                  <p className="text-white text-sm">{user?.company_name || <span className="text-white/30 italic">Not set — tap Edit</span>}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-0.5">MC / DOT Number</p>
                  <p className="text-white text-sm font-mono">
                    {user?.mc_dot_number || <span className="text-white/30 italic text-sm font-normal">Not set — required for invoicing</span>}
                  </p>
                </div>
                {user?.logo_url && (
                  <div>
                    <p className="text-white/50 text-xs mb-1">Logo</p>
                    <img src={user.logo_url} alt="Company logo" className="w-14 h-14 object-cover border border-[#1F1F1F]" />
                  </div>
                )}
                {/* Legacy fields kept for existing carrier accounts */}
                {user?.company_address && (
                  <div>
                    <p className="text-white/50 text-xs mb-0.5">Address</p>
                    <p className="text-white text-sm">{user.company_address}</p>
                  </div>
                )}
                {(user?.mc_number || user?.dot_number) && !user?.mc_dot_number && (
                  <div>
                    <p className="text-white/50 text-xs mb-0.5">MC / DOT</p>
                    <p className="text-white text-sm font-mono">
                      {[user.mc_number, user.dot_number].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Subscription status — OO + Carrier only */}
        {isBusinessUser && (
          <div className="bg-[#080808] border border-[#1F1F1F] p-4 space-y-3">
            <p className="text-white/40 text-xs tracking-wider">SUBSCRIPTION</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs mb-0.5">Integra AI Vault</p>
                {user?.trial_ends_at && user?.subscription_status !== 'active' && (
                  <p className="text-white/30 text-xs mt-0.5">
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

        {/* License & Certifications — driver and owner_operator only */}
        {userType !== 'carrier' && (
          <div className="bg-[#080808] border border-[#1F1F1F] p-4 space-y-3">
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
                        <span key={e} className="bg-[#CC2222]/20 border border-[#CC2222]/40 text-[#FF2020] text-xs px-2 py-1 tracking-wider">
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
        )}

        {/* Scanned Documents */}
        <div className="bg-[#080808] border border-[#1F1F1F] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-xs tracking-wider">SCANNED DOCUMENTS</p>
            <button
              onClick={onOpenScanner}
              className="text-[#CC2222] text-xs tracking-wider hover:text-[#FF2020]"
            >
              + SCAN
            </button>
          </div>

          {docsLoading ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-[#CC2222] border-t-transparent rounded-full animate-spin" />
              <p className="text-white/30 text-sm">Loading...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-white/30 text-sm mb-3">No documents scanned yet</p>
              <button
                onClick={onOpenScanner}
                className="border border-[#1F1F1F] text-white/50 text-sm px-6 py-3 hover:bg-white/5 tracking-wider"
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
                    className="w-16 h-16 object-cover flex-shrink-0 bg-[#161616]"
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

        {/* Location & Status — driver and owner_operator only */}
        {userType !== 'carrier' && (
          <div className="bg-[#080808] border border-[#1F1F1F] p-4 space-y-3">
            <p className="text-white/40 text-xs tracking-wider">STATUS</p>
            <div>
              <p className="text-white/50 text-xs mb-0.5">Location Tracking</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[#2DBB62] text-sm">Active</span>
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
        )}

        {/* Account ID — carrier only */}
        {userType === 'carrier' && (
          <div className="bg-[#080808] border border-[#1F1F1F] p-4 space-y-3">
            <p className="text-white/40 text-xs tracking-wider">ACCOUNT</p>
            <div>
              <p className="text-white/50 text-xs mb-0.5">Account ID</p>
              <p className="text-white font-mono text-xs">{user?.id}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
