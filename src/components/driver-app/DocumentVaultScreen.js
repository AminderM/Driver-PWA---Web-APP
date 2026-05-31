import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

// ── Document type catalogue ───────────────────────────────────────────────────
const DOC_TYPES = [
  // Load documents
  { value: 'bol',               label: 'Bill of Lading',         icon: '📦', hasExpiry: false, folder: 'bol'     },
  { value: 'rate_confirmation', label: 'Rate Confirmation',       icon: '📋', hasExpiry: false, folder: 'rate_con'},
  // Safety & compliance
  { value: 'drivers_license',   label: "Driver's License",        icon: '🪪', hasExpiry: true,  folder: 'safety'  },
  { value: 'medical_card',      label: 'Medical Card',            icon: '🏥', hasExpiry: true,  folder: 'safety'  },
  { value: 'hazmat_cert',       label: 'Hazmat Certification',    icon: '☢️', hasExpiry: true,  folder: 'safety'  },
  { value: 'twic_card',         label: 'TWIC Card',               icon: '🪪', hasExpiry: true,  folder: 'safety'  },
  { value: 'abstract',          label: 'Driver Abstract',         icon: '📋', hasExpiry: false, folder: 'safety'  },
  { value: 'cvor_certificate',  label: 'CVOR / NSC Certificate',  icon: '📜', hasExpiry: true,  folder: 'safety'  },
  { value: 'cargo_insurance',   label: 'Cargo Insurance',         icon: '🛡️', hasExpiry: true,  folder: 'safety'  },
  { value: 'liability_insurance',label:'Liability Insurance',     icon: '🛡️', hasExpiry: true,  folder: 'safety'  },
  { value: 'operating_authority',label:'Operating Authority',     icon: '📜', hasExpiry: false, folder: 'safety'  },
  // Business & banking
  { value: 'void_cheque',       label: 'Void / Cancelled Cheque', icon: '🏦', hasExpiry: false, folder: 'business'},
  { value: 'sin_card',          label: 'SIN Card',                icon: '🪪', hasExpiry: false, folder: 'business'},
  { value: 'vehicle_registration',label:'Vehicle Registration',   icon: '🚛', hasExpiry: true,  folder: 'business'},
  { value: 'lease_agreement',   label: 'Lease Agreement',         icon: '📝', hasExpiry: false, folder: 'business'},
  { value: 'ifta_license',      label: 'IFTA License',            icon: '⛽', hasExpiry: true,  folder: 'business'},
  { value: 'business_registration',label:'Business Registration', icon: '🏢', hasExpiry: false, folder: 'business'},
  { value: 'gst_hst_registration',label:'GST/HST Registration',  icon: '🏢', hasExpiry: false, folder: 'business'},
  { value: 'expense_receipt',   label: 'Expense Receipt',         icon: '🧾', hasExpiry: false, folder: 'expenses'},
  { value: 'other',             label: 'Other',                   icon: '📄', hasExpiry: false, folder: 'other'   },
];

const DOC_TYPE_MAP = Object.fromEntries(DOC_TYPES.map(d => [d.value, d]));

// ── Folder catalogue ──────────────────────────────────────────────────────────
const FOLDERS = [
  { id: 'invoices', label: 'Invoices',           icon: '🧾', desc: 'Processed & paid invoice history', color: '#CC2222', virtual: true  },
  { id: 'bol',      label: 'Bills of Lading',    icon: '📦', desc: 'BOL documents for your loads',     color: '#2277CC', docTypes: ['bol']               },
  { id: 'rate_con', label: 'Rate Confirmations', icon: '📋', desc: 'Signed rate confirmations',        color: '#D4921A', docTypes: ['rate_confirmation'] },
  { id: 'safety',   label: 'Safety & Compliance',icon: '🛡️', desc: 'CDL, insurance, certifications',  color: '#2DBB62',
    docTypes: ['drivers_license','medical_card','hazmat_cert','twic_card','abstract','cvor_certificate','cargo_insurance','liability_insurance','operating_authority'] },
  { id: 'business', label: 'Business Docs',      icon: '🏢', desc: 'Registration, IFTA, banking',     color: '#8B5CF6',
    docTypes: ['void_cheque','sin_card','vehicle_registration','lease_agreement','ifta_license','business_registration','gst_hst_registration'] },
  { id: 'expenses', label: 'Expense Receipts',   icon: '🧾', desc: 'Fuel, tolls, meals & other expenses', color: '#D4921A', docTypes: ['expense_receipt'] },
  { id: 'other',    label: 'Other',              icon: '📄', desc: 'Miscellaneous documents',         color: '#555250', docTypes: ['other'] },
];

const FOLDER_MAP = Object.fromEntries(FOLDERS.map(f => [f.id, f]));

// ── Expiry helpers ────────────────────────────────────────────────────────────
const WARN_DAYS = 30;
const expiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'no_expiry', label: 'No Expiry', color: 'text-white/40', bg: 'bg-white/10', border: 'border-white/20' };
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp - today) / 86400000);
  if (diffDays < 0)          return { status: 'expired',       label: 'EXPIRED',           color: 'text-[#FF2020]', bg: 'bg-[#CC2222]/20', border: 'border-[#CC2222]/50', days: diffDays };
  if (diffDays <= WARN_DAYS) return { status: 'expiring_soon', label: `${diffDays}d LEFT`, color: 'text-[#D4921A]', bg: 'bg-[#D4921A]/20', border: 'border-amber-600/50', days: diffDays };
  return                       { status: 'valid',             label: 'VALID',              color: 'text-[#2DBB62]', bg: 'bg-[#2DBB62]/20', border: 'border-green-600/50', days: diffDays };
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate  = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ── Main screen ───────────────────────────────────────────────────────────────
const DocumentVaultScreen = ({ onBack }) => {
  const { api, theme, toggleTheme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-[#030303]'     : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#080808]'     : 'bg-white';
  const text    = isDark ? 'text-white'        : 'text-black';
  const subtext = isDark ? 'text-white/60'     : 'text-black/60';
  const border  = isDark ? 'border-[#1F1F1F]' : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC2222] ${
    isDark ? 'bg-[#080808] border-[#1F1F1F] text-white placeholder-white/30'
           : 'bg-white border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  // screen: 'folders' | 'folder-detail' | 'invoices' | 'add' | 'detail'
  const [screen,       setScreen]      = useState('folders');
  const [activeFolder, setActiveFolder]= useState(null);
  const [docs,         setDocs]        = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [fetchErr,     setFetchErr]    = useState('');
  const [selectedDoc,  setSelectedDoc] = useState(null);
  const [invoicedLoads,setInvoicedLoads]=useState([]);
  const [loadsLoading, setLoadsLoading]= useState(false);

  // Add form state
  const [formDocType,  setFormDocType]  = useState('bol');
  const [formLabel,    setFormLabel]    = useState('');
  const [formExpiry,   setFormExpiry]   = useState('');
  const [formNotes,    setFormNotes]    = useState('');
  const [formFile,     setFormFile]     = useState(null);
  const [formFileName, setFormFileName] = useState('');
  const [formSaving,   setFormSaving]   = useState(false);
  const [formError,    setFormError]    = useState('');
  const [showDelete,   setShowDelete]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const fileInputRef = useRef(null);

  // ── Fetch docs ─────────────────────────────────────────────────────────────
  const fetchDocs = useCallback(async () => {
    setLoading(true); setFetchErr('');
    try {
      const data = await api('/vault/documents');
      setDocs(Array.isArray(data) ? data : []);
    } catch { setFetchErr('Could not load documents.'); }
    finally  { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // ── Fetch invoiced loads (for invoice folder) ──────────────────────────────
  const fetchInvoicedLoads = useCallback(async () => {
    setLoadsLoading(true);
    try {
      const data = await api('/my-loads');
      setInvoicedLoads(Array.isArray(data)
        ? data.filter(l => l.status === 'invoiced' || (l.paid_amount && Number(l.paid_amount) > 0))
        : []);
    } catch { /* silent */ }
    finally  { setLoadsLoading(false); }
  }, [api]);

  // ── Folder helpers ─────────────────────────────────────────────────────────
  const docsInFolder = (folderId) => {
    const f = FOLDER_MAP[folderId];
    if (!f || f.virtual) return [];
    return docs.filter(d => f.docTypes?.includes(d.doc_type));
  };

  const alertCount = (folderId) =>
    docsInFolder(folderId).filter(d => {
      const s = expiryStatus(d.expiry_date);
      return s.status === 'expired' || s.status === 'expiring_soon';
    }).length;

  const totalAlerts = docs.filter(d => {
    const s = expiryStatus(d.expiry_date);
    return s.status === 'expired' || s.status === 'expiring_soon';
  }).length;

  // ── Open folder ────────────────────────────────────────────────────────────
  const openFolder = (folder) => {
    setActiveFolder(folder);
    if (folder.virtual && folder.id === 'invoices') {
      fetchInvoicedLoads();
      setScreen('invoices');
    } else {
      setScreen('folder-detail');
    }
  };

  // ── Open add form, pre-scoped to folder ────────────────────────────────────
  const openAdd = (folder) => {
    const defaultType = folder?.docTypes?.[0] || 'other';
    setFormDocType(defaultType);
    setFormLabel(''); setFormExpiry(''); setFormNotes('');
    setFormFile(null); setFormFileName(''); setFormError('');
    setScreen('add');
  };

  // ── Save doc ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError('');
    const cfg = DOC_TYPE_MAP[formDocType];
    if (cfg?.hasExpiry && !formExpiry) { setFormError('Expiry date is required for this document type.'); return; }
    setFormSaving(true);
    try {
      const fd = new FormData();
      fd.append('doc_type', formDocType);
      fd.append('label',    formLabel.trim() || cfg?.label || '');
      if (formExpiry)       fd.append('expiry_date', formExpiry);
      if (formNotes.trim()) fd.append('notes', formNotes.trim());
      if (formFile)         fd.append('file', formFile);
      const result = await api('/vault/documents', { method: 'POST', body: fd });
      setDocs(prev => [result, ...prev]);
      activeFolder ? setScreen('folder-detail') : setScreen('folders');
    } catch (err) { setFormError(err.message || 'Failed to save document.'); }
    finally       { setFormSaving(false); }
  };

  // ── Delete doc ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/vault/documents/${selectedDoc.id}`, { method: 'DELETE' });
      setDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
      activeFolder ? setScreen('folder-detail') : setScreen('folders');
    } catch (err) { setFormError(err.message || 'Failed to delete.'); setDeleting(false); }
  };

  // ── Add form screen ────────────────────────────────────────────────────────
  if (screen === 'add') {
    const cfg = DOC_TYPE_MAP[formDocType];
    const folderDocTypes = activeFolder?.docTypes || DOC_TYPES.map(d => d.value);
    const availableTypes = DOC_TYPES.filter(d => folderDocTypes.includes(d.value));

    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => activeFolder ? setScreen('folder-detail') : setScreen('folders')}
            className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>
            ADD TO {activeFolder ? activeFolder.label.toUpperCase() : 'VAULT'}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {formError && <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4"><p className="text-[#FF2020] text-sm">{formError}</p></div>}

          <div className={`${surface} border ${border} p-4`}>
            <label className={LabelCls(isDark)}>DOCUMENT TYPE</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {availableTypes.map(dt => (
                <button key={dt.value} type="button" onClick={() => setFormDocType(dt.value)}
                  className={`py-2.5 px-3 text-xs font-semibold tracking-wider border transition-colors flex items-center gap-2 ${
                    formDocType === dt.value ? 'bg-[#CC2222] border-[#CC2222] text-white' : `${border} ${subtext} hover:border-[#CC2222]/50`
                  }`}>
                  <span>{dt.icon}</span>
                  <span className="truncate">{dt.label.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <div>
              <label className={LabelCls(isDark)}>CUSTOM LABEL <span className={`font-normal ${subtext}`}>(optional)</span></label>
              <input type="text" value={formLabel} onChange={e => setFormLabel(e.target.value)}
                placeholder={cfg?.label || ''} className={inputCls} />
            </div>
            {cfg?.hasExpiry && (
              <div>
                <label className={LabelCls(isDark)}>EXPIRY DATE</label>
                <input type="date" value={formExpiry} onChange={e => setFormExpiry(e.target.value)} min={todayStr()} className={inputCls} />
              </div>
            )}
            <div>
              <label className={LabelCls(isDark)}>NOTES <span className={`font-normal ${subtext}`}>(optional)</span></label>
              <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)}
                placeholder="e.g. Load #1234, endorsements" className={inputCls} />
            </div>
          </div>

          <div className={`${surface} border ${border} p-4`}>
            <label className={LabelCls(isDark)}>FILE <span className={`font-normal ${subtext}`}>(image or PDF)</span></label>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) { setFormFile(f); setFormFileName(f.name); }}} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className={`w-full mt-2 border-2 border-dashed ${formFile ? 'border-green-600/50 bg-[#2DBB62]/5' : isDark ? 'border-[#1F1F1F] hover:border-[#CC2222]/50' : 'border-[#e5e5e5] hover:border-[#CC2222]/50'} py-6 flex flex-col items-center gap-2 transition-colors`}>
              {formFile ? (
                <><span className="text-2xl">✅</span><p className={`text-sm font-bold ${text}`}>{formFileName}</p><p className={`text-xs ${subtext}`}>Tap to change</p></>
              ) : (
                <><span className="text-2xl">📎</span><p className={`text-sm font-bold ${text}`}>TAP TO ATTACH FILE</p><p className={`text-xs ${subtext}`}>PDF or image</p></>
              )}
            </button>
          </div>

          <button onClick={handleSave} disabled={formSaving}
            className="w-full bg-[#CC2222] hover:bg-[#7A1010] disabled:bg-[#CC2222]/50 text-white font-bold py-4 tracking-wider transition-colors">
            {formSaving ? <span className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />SAVING...</span> : 'SAVE DOCUMENT'}
          </button>
          <div className="h-6" />
        </div>
      </div>
    );
  }

  // ── Document detail screen ─────────────────────────────────────────────────
  if (screen === 'detail' && selectedDoc) {
    const docCfg = DOC_TYPE_MAP[selectedDoc.doc_type] || DOC_TYPE_MAP.other;
    const status = expiryStatus(selectedDoc.expiry_date);
    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => setScreen(activeFolder ? (activeFolder.id === 'invoices' ? 'invoices' : 'folder-detail') : 'folders')}
            className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{docCfg.icon}</span>
            <div>
              <h1 className={`text-xl font-bold tracking-wider ${text}`}>{selectedDoc.label || docCfg.label}</h1>
              <span className={`text-xs font-bold tracking-wider px-2 py-0.5 border ${status.color} ${status.bg} ${status.border}`}>{status.label}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className={`${surface} border ${border} divide-y ${isDark ? 'divide-[#1a1a1a]' : 'divide-[#f0f0f0]'}`}>
            <DetailRow label="TYPE"    value={docCfg.label}          isDark={isDark} text={text} subtext={subtext} />
            {selectedDoc.expiry_date && <DetailRow label="EXPIRES" value={fmtDate(selectedDoc.expiry_date)} isDark={isDark} text={text} subtext={subtext} valueColor={status.color} />}
            {selectedDoc.notes       && <DetailRow label="NOTES"   value={selectedDoc.notes}    isDark={isDark} text={text} subtext={subtext} />}
            <DetailRow label="ADDED"   value={fmtDate(selectedDoc.created_at)} isDark={isDark} text={text} subtext={subtext} />
          </div>

          {selectedDoc.file_url && (
            <button onClick={() => window.open(selectedDoc.file_url, '_blank')}
              className={`w-full ${surface} border ${border} py-4 flex items-center justify-center gap-3 hover:border-[#CC2222]/50 transition-colors`}>
              <span className="text-xl">📎</span>
              <span className={`text-sm font-bold tracking-wider ${text}`}>VIEW DOCUMENT FILE</span>
            </button>
          )}

          {(status.status === 'expired' || status.status === 'expiring_soon') && (
            <div className={`border p-4 flex gap-3 ${status.border} ${status.bg}`}>
              <span className="text-xl">{status.status === 'expired' ? '🚨' : '⚠️'}</span>
              <div>
                <p className={`text-sm font-bold tracking-wider ${status.color}`}>{status.status === 'expired' ? 'DOCUMENT EXPIRED' : 'EXPIRING SOON'}</p>
                <p className={`text-xs mt-0.5 ${subtext}`}>
                  {status.status === 'expired'
                    ? `Expired ${Math.abs(status.days)} day${Math.abs(status.days) !== 1 ? 's' : ''} ago.`
                    : `Expires in ${status.days} day${status.days !== 1 ? 's' : ''}. Renew soon.`}
                </p>
              </div>
            </div>
          )}

          <div className="pb-6">
            {showDelete ? (
              <div className={`border ${isDark ? 'border-[#CC2222]/50 bg-[#CC2222]/10' : 'border-red-200 bg-red-50'} p-4 space-y-3`}>
                <p className={`text-sm ${isDark ? 'text-[#FF2020]' : 'text-red-700'}`}>Delete this document? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDelete(false)} disabled={deleting} className={`flex-1 border ${border} py-2.5 text-sm tracking-wider ${subtext}`}>CANCEL</button>
                  <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-[#7A1010] hover:bg-red-800 disabled:opacity-50 text-white text-sm py-2.5 tracking-wider">
                    {deleting ? 'DELETING...' : 'CONFIRM DELETE'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDelete(true)} className={`w-full text-sm tracking-wider py-3 ${isDark ? 'text-[#CC2222]/60 hover:text-[#CC2222]' : 'text-[#FF2020] hover:text-[#CC2222]'} transition-colors`}>
                DELETE DOCUMENT
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Invoice history folder ─────────────────────────────────────────────────
  if (screen === 'invoices') {
    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => setScreen('folders')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← VAULT</button>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🧾</span>
            <h1 className={`text-xl font-bold tracking-wider ${text}`}>INVOICES</h1>
          </div>
          <p className={`text-xs ${subtext}`}>Processed & paid load invoices</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loadsLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-[#CC2222] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : invoicedLoads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-4xl mb-4">🧾</p>
              <p className={`text-base font-bold tracking-wider mb-2 ${text}`}>NO INVOICES YET</p>
              <p className={`text-sm ${subtext}`}>Loads you've invoiced or received payment on will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoicedLoads.map(load => {
                const rate = Number(load.rate) || 0;
                const paid = Number(load.paid_amount) || 0;
                const isFullyPaid = paid >= rate && paid > 0;
                return (
                  <div key={load.id} className={`${surface} border ${border} overflow-hidden`}>
                    <div className={`h-1 w-full ${isFullyPaid ? 'bg-green-500' : 'bg-[#CC2222]'}`} />
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${text}`}>{load.origin || '—'} → {load.destination || '—'}</p>
                          {load.broker_name && <p className={`text-xs ${subtext}`}>{load.broker_name}</p>}
                          {load.delivery_date && <p className={`text-xs ${subtext}`}>{fmtDate(load.delivery_date)}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-base font-bold ${isFullyPaid ? 'text-green-400' : 'text-[#2DBB62]'}`}>
                            ${rate.toLocaleString()}
                          </p>
                          <span className={`text-xs font-bold tracking-wider px-2 py-0.5 ${isFullyPaid ? 'bg-green-600/20 text-green-400' : 'bg-[#CC2222]/20 text-[#FF2020]'}`}>
                            {isFullyPaid ? '✓ PAID' : paid > 0 ? `$${paid.toLocaleString()} PARTIAL` : 'INVOICED'}
                          </span>
                        </div>
                      </div>
                      {rate > 0 && (
                        <div>
                          <div className={`h-1.5 w-full ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#e8e8e8]'}`}>
                            <div className={`h-full ${isFullyPaid ? 'bg-green-500' : paid > 0 ? 'bg-amber-400' : 'bg-transparent'}`}
                              style={{ width: `${Math.min((paid / rate) * 100, 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Folder detail screen ───────────────────────────────────────────────────
  if (screen === 'folder-detail' && activeFolder) {
    const folderDocs = docsInFolder(activeFolder.id);
    const sorted = [...folderDocs].sort((a, b) => {
      const order = { expired: 0, expiring_soon: 1, valid: 2, no_expiry: 3 };
      return (order[expiryStatus(a.expiry_date).status] ?? 4) - (order[expiryStatus(b.expiry_date).status] ?? 4);
    });

    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => setScreen('folders')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← VAULT</button>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeFolder.icon}</span>
              <h1 className={`text-xl font-bold tracking-wider ${text}`}>{activeFolder.label.toUpperCase()}</h1>
            </div>
            <button onClick={() => openAdd(activeFolder)}
              className="w-10 h-10 bg-[#CC2222] hover:bg-[#7A1010] flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <p className={`text-xs ${subtext}`}>{folderDocs.length} document{folderDocs.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <span className="text-5xl mb-4">{activeFolder.icon}</span>
              <p className={`text-base font-bold tracking-wider mb-2 ${text}`}>NO DOCUMENTS YET</p>
              <p className={`text-sm mb-6 ${subtext}`}>{activeFolder.desc}</p>
              <button onClick={() => openAdd(activeFolder)} className="bg-[#CC2222] hover:bg-[#7A1010] text-white font-bold px-6 py-3 tracking-wider">
                + ADD DOCUMENT
              </button>
            </div>
          ) : (
            sorted.map(doc => {
              const docCfg = DOC_TYPE_MAP[doc.doc_type] || DOC_TYPE_MAP.other;
              const status = expiryStatus(doc.expiry_date);
              return (
                <button key={doc.id} onClick={() => { setSelectedDoc(doc); setScreen('detail'); }}
                  className={`w-full text-left ${surface} border ${border} overflow-hidden hover:border-[#CC2222]/50 transition-colors`}>
                  <div className={`h-1 w-full ${status.status === 'expired' ? 'bg-[#CC2222]' : status.status === 'expiring_soon' ? 'bg-amber-500' : status.status === 'valid' ? 'bg-[#2DBB62]' : 'bg-white/10'}`} />
                  <div className="px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{docCfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${text}`}>{doc.label || docCfg.label}</p>
                      {doc.expiry_date ? <p className={`text-xs mt-0.5 ${subtext}`}>Expires {fmtDate(doc.expiry_date)}</p> : <p className={`text-xs mt-0.5 ${subtext}`}>No expiry date</p>}
                      {doc.notes && <p className={`text-xs mt-0.5 truncate ${subtext}`}>{doc.notes}</p>}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-xs font-bold tracking-wider px-2 py-1 border ${status.color} ${status.bg} ${status.border}`}>{status.label}</span>
                      {doc.file_url && <p className={`text-xs mt-1 ${subtext}`}>📎 file</p>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
          <div className="h-6" />
        </div>
      </div>
    );
  }

  // ── Vault home — folder grid ───────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className={`text-base tracking-wider ${subtext}`}>← TOOLS</button>
          <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
        </div>
        <h1 className={`text-xl font-bold tracking-wider ${text}`}>DOCUMENT VAULT</h1>
        <p className={`text-xs mt-0.5 ${subtext}`}>{docs.length} document{docs.length !== 1 ? 's' : ''} stored</p>

        {totalAlerts > 0 && (
          <div className="mt-3 border border-amber-600/50 bg-[#D4921A]/10 p-3 flex gap-3">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <p className="text-xs font-bold tracking-wider text-[#D4921A]">
              {totalAlerts} DOCUMENT{totalAlerts > 1 ? 'S' : ''} NEED ATTENTION
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {fetchErr && (
          <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4 mb-4">
            <p className="text-[#FF2020] text-sm">{fetchErr}</p>
            <button onClick={fetchDocs} className="text-[#FF2020] text-xs mt-2 underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#CC2222] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {FOLDERS.map(folder => {
              const count   = folder.virtual
                ? (folder.id === 'invoices' ? invoicedLoads.length : 0)
                : docsInFolder(folder.id).length;
              const alerts  = folder.virtual ? 0 : alertCount(folder.id);
              return (
                <button key={folder.id} onClick={() => openFolder(folder)}
                  className={`${surface} border ${border} p-4 text-left hover:border-[#CC2222]/40 transition-colors relative overflow-hidden`}
                  style={{ borderLeft: `3px solid ${folder.color}` }}>
                  {alerts > 0 && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{alerts}</span>
                    </div>
                  )}
                  <span className="text-2xl block mb-2">{folder.icon}</span>
                  <p className={`text-sm font-bold tracking-wider leading-tight ${text}`}>{folder.label.toUpperCase()}</p>
                  <p className={`text-xs mt-1 ${subtext}`}>{count > 0 ? `${count} item${count !== 1 ? 's' : ''}` : folder.desc}</p>
                </button>
              );
            })}
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const LabelCls = (isDark) => `block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`;

const DetailRow = ({ label, value, isDark, text, subtext, valueColor }) => (
  <div className="px-4 py-3 flex justify-between items-start gap-4">
    <span className={`text-xs tracking-wider flex-shrink-0 ${subtext}`}>{label}</span>
    <span className={`text-sm text-right ${valueColor || text}`}>{value}</span>
  </div>
);

export default DocumentVaultScreen;
