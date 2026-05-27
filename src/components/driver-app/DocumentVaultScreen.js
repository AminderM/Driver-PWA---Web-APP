import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

// ── Document type config ──────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: 'cdl',            label: 'CDL',                    icon: '🪪', hasExpiry: true  },
  { value: 'medical_card',   label: 'Medical Card',           icon: '🏥', hasExpiry: true  },
  { value: 'insurance',      label: 'Insurance Certificate',  icon: '🛡️', hasExpiry: true  },
  { value: 'ifta',           label: 'IFTA License',           icon: '⛽', hasExpiry: true  },
  { value: 'irp',            label: 'IRP Registration',       icon: '📋', hasExpiry: true  },
  { value: 'operating_auth', label: 'Operating Authority',    icon: '📜', hasExpiry: false },
  { value: 'boc3',           label: 'BOC-3',                  icon: '📝', hasExpiry: false },
  { value: 'drug_test',      label: 'Drug Test',              icon: '🧪', hasExpiry: true  },
  { value: 'inspection',     label: 'Annual Inspection',      icon: '🔍', hasExpiry: true  },
  { value: 'other',          label: 'Other',                  icon: '📄', hasExpiry: true  },
];

const DOC_TYPE_MAP = Object.fromEntries(DOC_TYPES.map(d => [d.value, d]));

// ── Expiry helpers ────────────────────────────────────────────────────────────

const WARN_DAYS = 30;

const expiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'no_expiry', label: 'No Expiry', color: 'text-white/40', bg: 'bg-white/10', border: 'border-white/20' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp - today) / 86400000);
  if (diffDays < 0)        return { status: 'expired',       label: 'EXPIRED',          color: 'text-[#FF2020]',    bg: 'bg-[#CC2222]/20',    border: 'border-[#CC2222]/50',    days: diffDays };
  if (diffDays <= WARN_DAYS) return { status: 'expiring_soon', label: `${diffDays}d LEFT`, color: 'text-[#D4921A]',  bg: 'bg-[#D4921A]/20',  border: 'border-amber-600/50',  days: diffDays };
  return                          { status: 'valid',          label: 'VALID',            color: 'text-[#2DBB62]',  bg: 'bg-[#2DBB62]/20',  border: 'border-green-600/50',  days: diffDays };
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Main screen ───────────────────────────────────────────────────────────────

const DocumentVaultScreen = ({ onBack }) => {
  const { api, theme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-[#030303]'        : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#080808]'    : 'bg-white';
  const text    = isDark ? 'text-white'       : 'text-black';
  const subtext = isDark ? 'text-white/60'    : 'text-black/60';
  const border  = isDark ? 'border-[#1F1F1F]' : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC2222] ${
    isDark
      ? 'bg-[#080808] border-[#1F1F1F] text-white placeholder-white/30'
      : 'bg-white border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  const [screen, setScreen]     = useState('list'); // 'list' | 'add' | 'detail'
  const [docs, setDocs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Form state
  const [formDocType,   setFormDocType]   = useState('cdl');
  const [formLabel,     setFormLabel]     = useState('');
  const [formExpiry,    setFormExpiry]    = useState('');
  const [formNotes,     setFormNotes]     = useState('');
  const [formFile,      setFormFile]      = useState(null);
  const [formFileName,  setFormFileName]  = useState('');
  const [formSaving,    setFormSaving]    = useState(false);
  const [formError,     setFormError]     = useState('');
  const [showDelete,    setShowDelete]    = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const fileInputRef = useRef(null);

  // ── Data fetch ────────────────────────────────────────────────────────────

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const data = await api('/vault/documents');
      setDocs(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchErr('Could not load documents. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // ── Alerts summary ────────────────────────────────────────────────────────

  const alerts = docs.filter(d => {
    const s = expiryStatus(d.expiry_date);
    return s.status === 'expired' || s.status === 'expiring_soon';
  });

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setFormDocType('cdl');
    setFormLabel('');
    setFormExpiry('');
    setFormNotes('');
    setFormFile(null);
    setFormFileName('');
    setFormError('');
    setScreen('add');
  };

  const openDetail = (doc) => {
    setSelectedDoc(doc);
    setShowDelete(false);
    setScreen('detail');
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFormFile(f);
    setFormFileName(f.name);
  };

  const handleSave = async () => {
    setFormError('');
    const docTypeCfg = DOC_TYPE_MAP[formDocType];
    if (docTypeCfg?.hasExpiry && !formExpiry) {
      setFormError('Expiry date is required for this document type.');
      return;
    }

    setFormSaving(true);
    try {
      const formData = new FormData();
      formData.append('doc_type', formDocType);
      formData.append('label',    formLabel.trim() || docTypeCfg?.label || '');
      if (formExpiry) formData.append('expiry_date', formExpiry);
      if (formNotes.trim()) formData.append('notes', formNotes.trim());
      if (formFile) formData.append('file', formFile);

      const result = await api('/vault/documents', { method: 'POST', body: formData });
      setDocs(prev => [result, ...prev]);
      setScreen('list');
    } catch (err) {
      setFormError(err.message || 'Failed to save document.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/vault/documents/${selectedDoc.id}`, { method: 'DELETE' });
      setDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
      setScreen('list');
    } catch (err) {
      setFormError(err.message || 'Failed to delete.');
      setDeleting(false);
    }
  };

  const handleViewFile = async (doc) => {
    if (!doc.file_url) return;
    window.open(doc.file_url, '_blank');
  };

  // ── Add form screen ───────────────────────────────────────────────────────

  if (screen === 'add') {
    const docTypeCfg = DOC_TYPE_MAP[formDocType];
    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => setScreen('list')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>ADD DOCUMENT</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {formError && (
            <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4">
              <p className="text-[#FF2020] text-sm">{formError}</p>
            </div>
          )}

          {/* Document type */}
          <div className={`${surface} border ${border} p-4`}>
            <label className={LabelCls(isDark)}>DOCUMENT TYPE</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DOC_TYPES.map(dt => (
                <button key={dt.value} type="button" onClick={() => setFormDocType(dt.value)}
                  className={`py-2.5 px-3 text-xs font-semibold tracking-wider border transition-colors flex items-center gap-2 ${
                    formDocType === dt.value
                      ? 'bg-[#CC2222] border-[#CC2222] text-white'
                      : `${border} ${subtext} hover:border-[#CC2222]/50`
                  }`}>
                  <span>{dt.icon}</span>
                  <span className="truncate">{dt.label.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Label + expiry + notes */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <div>
              <label className={LabelCls(isDark)}>
                CUSTOM LABEL <span className={`font-normal ${subtext}`}>(optional)</span>
              </label>
              <input type="text" value={formLabel} onChange={e => setFormLabel(e.target.value)}
                placeholder={docTypeCfg?.label || 'e.g. John Smith CDL-A'}
                className={inputCls} />
            </div>

            {docTypeCfg?.hasExpiry && (
              <div>
                <label className={LabelCls(isDark)}>EXPIRY DATE</label>
                <input type="date" value={formExpiry} onChange={e => setFormExpiry(e.target.value)}
                  min={todayStr()} className={inputCls} />
              </div>
            )}

            <div>
              <label className={LabelCls(isDark)}>
                NOTES <span className={`font-normal ${subtext}`}>(optional)</span>
              </label>
              <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)}
                placeholder="e.g. Class A, endorsements: HazMat" className={inputCls} />
            </div>
          </div>

          {/* File upload */}
          <div className={`${surface} border ${border} p-4`}>
            <label className={LabelCls(isDark)}>
              DOCUMENT FILE <span className={`font-normal ${subtext}`}>(optional — image or PDF)</span>
            </label>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf"
              onChange={handleFileSelect} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className={`w-full mt-2 border-2 border-dashed ${
                formFile
                  ? 'border-green-600/50 bg-[#2DBB62]/5'
                  : isDark ? 'border-[#1F1F1F] hover:border-[#CC2222]/50' : 'border-[#e5e5e5] hover:border-[#CC2222]/50'
              } py-6 flex flex-col items-center gap-2 transition-colors`}>
              {formFile ? (
                <>
                  <span className="text-2xl">✅</span>
                  <p className={`text-sm font-bold ${text}`}>{formFileName}</p>
                  <p className={`text-xs ${subtext}`}>Tap to change</p>
                </>
              ) : (
                <>
                  <span className="text-2xl">📎</span>
                  <p className={`text-sm font-bold ${text}`}>TAP TO ATTACH FILE</p>
                  <p className={`text-xs ${subtext}`}>PDF or image</p>
                </>
              )}
            </button>
          </div>

          <button onClick={handleSave} disabled={formSaving}
            className="w-full bg-[#CC2222] hover:bg-[#7A1010] disabled:bg-[#CC2222]/50 text-white font-bold py-4 tracking-wider transition-colors">
            {formSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SAVING...
              </span>
            ) : 'SAVE DOCUMENT'}
          </button>
          <div className="h-6" />
        </div>
      </div>
    );
  }

  // ── Detail screen ─────────────────────────────────────────────────────────

  if (screen === 'detail' && selectedDoc) {
    const docCfg = DOC_TYPE_MAP[selectedDoc.doc_type] || DOC_TYPE_MAP.other;
    const status = expiryStatus(selectedDoc.expiry_date);

    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => setScreen('list')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{docCfg.icon}</span>
            <div>
              <h1 className={`text-xl font-bold tracking-wider ${text}`}>
                {selectedDoc.label || docCfg.label}
              </h1>
              <span className={`text-xs font-bold tracking-wider px-2 py-0.5 border ${status.color} ${status.bg} ${status.border}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className={`${surface} border ${border} divide-y ${isDark ? 'divide-[#1a1a1a]' : 'divide-[#f0f0f0]'}`}>
            <DetailRow label="TYPE"        value={docCfg.label}          isDark={isDark} text={text} subtext={subtext} />
            {selectedDoc.expiry_date && (
              <DetailRow label="EXPIRES"
                value={new Date(selectedDoc.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                isDark={isDark} text={text} subtext={subtext}
                valueColor={status.color} />
            )}
            {selectedDoc.notes && (
              <DetailRow label="NOTES" value={selectedDoc.notes} isDark={isDark} text={text} subtext={subtext} />
            )}
            <DetailRow label="ADDED"
              value={new Date(selectedDoc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              isDark={isDark} text={text} subtext={subtext} />
          </div>

          {/* View file */}
          {selectedDoc.file_url && (
            <button onClick={() => handleViewFile(selectedDoc)}
              className={`w-full ${surface} border ${border} py-4 flex items-center justify-center gap-3 hover:border-[#CC2222]/50 transition-colors`}>
              <span className="text-xl">📎</span>
              <span className={`text-sm font-bold tracking-wider ${text}`}>VIEW DOCUMENT FILE</span>
            </button>
          )}

          {/* Expiry warning */}
          {(status.status === 'expired' || status.status === 'expiring_soon') && (
            <div className={`border p-4 flex gap-3 ${status.border} ${status.bg}`}>
              <span className="text-xl">{status.status === 'expired' ? '🚨' : '⚠️'}</span>
              <div>
                <p className={`text-sm font-bold tracking-wider ${status.color}`}>
                  {status.status === 'expired' ? 'DOCUMENT EXPIRED' : 'EXPIRING SOON'}
                </p>
                <p className={`text-xs mt-0.5 ${subtext}`}>
                  {status.status === 'expired'
                    ? `Expired ${Math.abs(status.days)} day${Math.abs(status.days) !== 1 ? 's' : ''} ago. Update this document.`
                    : `Expires in ${status.days} day${status.days !== 1 ? 's' : ''}. Renew before it expires.`}
                </p>
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="pb-6">
            {showDelete ? (
              <div className={`border ${isDark ? 'border-[#CC2222]/50 bg-[#CC2222]/10' : 'border-red-200 bg-red-50'} p-4 space-y-3`}>
                <p className={`text-sm ${isDark ? 'text-[#FF2020]' : 'text-red-700'}`}>Delete this document? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDelete(false)} disabled={deleting}
                    className={`flex-1 border ${border} py-2.5 text-sm tracking-wider ${subtext}`}>CANCEL</button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 bg-[#7A1010] hover:bg-red-800 disabled:opacity-50 text-white text-sm py-2.5 tracking-wider">
                    {deleting ? 'DELETING...' : 'CONFIRM DELETE'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDelete(true)}
                className={`w-full text-sm tracking-wider py-3 ${isDark ? 'text-[#CC2222]/60 hover:text-[#CC2222]' : 'text-[#FF2020] hover:text-[#CC2222]'} transition-colors`}>
                DELETE DOCUMENT
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Document list ─────────────────────────────────────────────────────────

  const sortedDocs = [...docs].sort((a, b) => {
    const sa = expiryStatus(a.expiry_date);
    const sb = expiryStatus(b.expiry_date);
    const order = { expired: 0, expiring_soon: 1, valid: 2, no_expiry: 3 };
    return (order[sa.status] ?? 4) - (order[sb.status] ?? 4);
  });

  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>

      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <div className="flex items-center justify-between mb-1">
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>DOCUMENT VAULT</h1>
          <button onClick={openAdd}
            className="w-10 h-10 bg-[#CC2222] hover:bg-[#7A1010] flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <p className={`text-xs ${subtext}`}>{docs.length} document{docs.length !== 1 ? 's' : ''} stored</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {fetchErr && (
          <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4">
            <p className="text-[#FF2020] text-sm">{fetchErr}</p>
            <button onClick={fetchDocs} className="text-[#FF2020] text-xs mt-2 underline">Retry</button>
          </div>
        )}

        {/* Alert banner */}
        {alerts.length > 0 && (
          <div className={`border border-amber-600/50 bg-[#D4921A]/10 p-4 flex gap-3`}>
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-bold tracking-wider text-[#D4921A]">
                {alerts.length} DOCUMENT{alerts.length > 1 ? 'S' : ''} NEED ATTENTION
              </p>
              <p className={`text-xs mt-0.5 ${subtext}`}>
                {alerts.filter(d => expiryStatus(d.expiry_date).status === 'expired').length > 0
                  ? 'One or more documents have expired.'
                  : 'Some documents are expiring soon.'}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#CC2222] border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${subtext}`}>Loading documents...</p>
          </div>
        ) : sortedDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <p className="text-5xl mb-4">🗂️</p>
            <p className={`text-base font-bold tracking-wider mb-2 ${text}`}>NO DOCUMENTS YET</p>
            <p className={`text-sm mb-6 ${subtext}`}>
              Store your CDL, insurance, IFTA, and other important documents here. Get expiry alerts before they lapse.
            </p>
            <button onClick={openAdd}
              className="bg-[#CC2222] hover:bg-[#7A1010] text-white font-bold px-6 py-3 tracking-wider">
              + ADD DOCUMENT
            </button>
          </div>
        ) : (
          sortedDocs.map(doc => {
            const docCfg = DOC_TYPE_MAP[doc.doc_type] || DOC_TYPE_MAP.other;
            const status = expiryStatus(doc.expiry_date);
            return (
              <button key={doc.id} onClick={() => openDetail(doc)}
                className={`w-full text-left ${surface} border ${border} overflow-hidden hover:border-[#CC2222]/50 transition-colors`}>
                {/* Status stripe */}
                <div className={`h-1 w-full ${
                  status.status === 'expired'       ? 'bg-[#CC2222]' :
                  status.status === 'expiring_soon' ? 'bg-amber-500' :
                  status.status === 'valid'         ? 'bg-[#2DBB62]' : 'bg-white/10'
                }`} />
                <div className="px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">{docCfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${text}`}>
                      {doc.label || docCfg.label}
                    </p>
                    {doc.expiry_date ? (
                      <p className={`text-xs mt-0.5 ${subtext}`}>
                        Expires {new Date(doc.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    ) : (
                      <p className={`text-xs mt-0.5 ${subtext}`}>No expiry date</p>
                    )}
                    {doc.notes && (
                      <p className={`text-xs mt-0.5 truncate ${subtext}`}>{doc.notes}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs font-bold tracking-wider px-2 py-1 border ${status.color} ${status.bg} ${status.border}`}>
                      {status.label}
                    </span>
                    {doc.file_url && (
                      <p className={`text-xs mt-1 ${subtext}`}>📎 file</p>
                    )}
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
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const LabelCls = (isDark) =>
  `block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`;

const DetailRow = ({ label, value, isDark, text, subtext, valueColor }) => (
  <div className="px-4 py-3 flex justify-between items-start gap-4">
    <span className={`text-xs tracking-wider flex-shrink-0 ${subtext}`}>{label}</span>
    <span className={`text-sm text-right ${valueColor || text}`}>{value}</span>
  </div>
);

export default DocumentVaultScreen;
