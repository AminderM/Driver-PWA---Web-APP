import React, { useState, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

// ── Expense localStorage (shared with ExpenseRecorderScreen) ──────────────────
const EXPENSE_KEY = 'integra_expenses_v1';
const loadExpenses = () => { try { return JSON.parse(localStorage.getItem(EXPENSE_KEY) || '[]'); } catch { return []; } };
const saveExpenses = (list) => { try { localStorage.setItem(EXPENSE_KEY, JSON.stringify(list)); } catch {} };

// ── Readable labels for identified document types ─────────────────────────────
const DOC_LABELS = {
  expense_receipt:       { label: 'Expense Receipt',       icon: '🧾', folder: 'expenses'  },
  rate_confirmation:     { label: 'Rate Confirmation',     icon: '📋', folder: 'rate_con'  },
  bol:                   { label: 'Bill of Lading',        icon: '📦', folder: 'bol'       },
  drivers_license:       { label: "Driver's License",      icon: '🪪', folder: 'safety'    },
  medical_card:          { label: 'Medical Card',          icon: '🏥', folder: 'safety'    },
  hazmat_cert:           { label: 'Hazmat Certification',  icon: '☢️', folder: 'safety'    },
  twic_card:             { label: 'TWIC Card',             icon: '🪪', folder: 'safety'    },
  cargo_insurance:       { label: 'Cargo Insurance',       icon: '🛡️', folder: 'safety'    },
  liability_insurance:   { label: 'Liability Insurance',   icon: '🛡️', folder: 'safety'    },
  vehicle_registration:  { label: 'Vehicle Registration',  icon: '🚛', folder: 'business'  },
  ifta_license:          { label: 'IFTA License',          icon: '⛽', folder: 'business'  },
  other:                 { label: 'Other Document',        icon: '📄', folder: 'other'     },
};

const EXPENSE_CATEGORIES = ['fuel','tolls','maintenance','lumper','detention','meals','lodging','scales','permits','insurance','other'];

const UniversalScanScreen = ({ onClose }) => {
  const { api, theme } = useDriverApp();
  const isDark = theme !== 'light';
  const bg      = isDark ? '#030303' : '#f5f5f5';
  const surface = isDark ? '#080808' : '#ffffff';
  const rivet   = isDark ? '#1F1F1F' : '#e5e5e5';
  const textCol = isDark ? '#EDE9E3' : '#1A1814';
  const dimCol  = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  const fileInputRef = useRef(null);
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState(null); // data URL for image preview
  const [step,      setStep]      = useState('capture'); // capture | identifying | confirm | saving | done | error
  const [result,    setResult]    = useState(null);  // AI response
  const [saveError, setSaveError] = useState('');
  const [errMsg,    setErrMsg]    = useState('');

  // Editable confirm fields
  const [docType,   setDocType]   = useState('');
  const [docLabel,  setDocLabel]  = useState('');
  const [amount,    setAmount]    = useState('');
  const [vendor,    setVendor]    = useState('');
  const [date,      setDate]      = useState('');
  const [category,  setCategory]  = useState('');
  const [expiry,    setExpiry]    = useState('');

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null); // PDF — no visual preview
    }
    setStep('preview');
    e.target.value = '';
  };

  const handleIdentify = async () => {
    setStep('identifying');
    setErrMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api('/scan/identify', { method: 'POST', body: fd });
      setResult(res);
      // Pre-fill editable fields from AI result
      setDocType(res.document_type || 'other');
      setDocLabel(res.label || DOC_LABELS[res.document_type]?.label || 'Scanned Document');
      setAmount(String(res.extracted?.amount || ''));
      setVendor(res.extracted?.vendor || '');
      setDate(res.extracted?.date || new Date().toISOString().slice(0, 10));
      setCategory(res.extracted?.category || 'other');
      setExpiry(res.extracted?.expiry_date || '');
      setStep('confirm');
    } catch (err) {
      setErrMsg(err.message || 'Could not identify document. Please try again.');
      setStep('preview');
    }
  };

  const handleSave = async () => {
    setSaveError('');
    setStep('saving');
    try {
      const isExpense = docType === 'expense_receipt';

      // 1. Upload file to vault
      const fd = new FormData();
      fd.append('doc_type', docType);
      fd.append('label', docLabel.trim() || DOC_LABELS[docType]?.label || 'Scanned Document');
      if (expiry)  fd.append('expiry_date', expiry);
      if (vendor)  fd.append('notes', vendor);
      fd.append('file', file);
      await api('/vault/documents', { method: 'POST', body: fd });

      // 2. If expense — also save to expenses localStorage for P&L
      if (isExpense) {
        const parsed = parseFloat(amount);
        if (!isNaN(parsed) && parsed > 0) {
          const expenses = loadExpenses();
          expenses.unshift({
            id:       Date.now().toString(),
            date:     date || new Date().toISOString().slice(0, 10),
            amount:   parsed,
            category: category || 'other',
            vendor:   vendor.trim(),
            notes:    docLabel.trim(),
          });
          saveExpenses(expenses);
        }
      }

      setStep('done');
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Please try again.');
      setStep('confirm');
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setResult(null);
    setDocType(''); setDocLabel(''); setAmount(''); setVendor('');
    setDate(''); setCategory(''); setExpiry(''); setSaveError(''); setErrMsg('');
    setStep('capture');
  };

  const FD = "'Barlow Condensed', sans-serif";
  const FB = "'Barlow', sans-serif";
  const px = n => `${n}px`;

  // ── Capture step ─────────────────────────────────────────────────────────────
  if (step === 'capture') return (
    <div style={{ position: 'fixed', inset: 0, background: bg, display: 'flex', flexDirection: 'column', fontFamily: FD, zIndex: 100 }}>
      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${rivet}`, padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: dimCol }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div>
          <p style={{ fontFamily: FD, fontSize: px(18), fontWeight: 700, letterSpacing: '0.12em', color: textCol, margin: 0 }}>SMART SCAN</p>
          <p style={{ fontFamily: FB, fontSize: px(12), color: dimCol, margin: 0 }}>AI identifies & files any document</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: '#CC2222', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <svg width="36" height="36" fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontFamily: FD, fontSize: px(14), color: dimCol, letterSpacing: '0.08em', textAlign: 'center', margin: 0 }}>
          Snap or upload any document.<br/>AI will identify and file it automatically.
        </p>

        <p style={{ fontFamily: FD, fontSize: px(11), color: dimCol, letterSpacing: '0.08em', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.6 }}>
          RECEIPTS · BOL · RATE CONS · LICENCES · INSURANCE · AND MORE
        </p>

        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} style={{ display: 'none' }} />

        <button onClick={() => fileInputRef.current?.click()}
          style={{ width: '100%', maxWidth: 320, background: '#CC2222', color: '#fff', border: 'none', padding: '16px 0', fontFamily: FD, fontSize: px(16), fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
          TAKE PHOTO / SELECT FILE
        </button>
      </div>
    </div>
  );

  // ── Preview step ─────────────────────────────────────────────────────────────
  if (step === 'preview') return (
    <div style={{ position: 'fixed', inset: 0, background: bg, display: 'flex', flexDirection: 'column', fontFamily: FD, zIndex: 100 }}>
      <div style={{ background: surface, borderBottom: `1px solid ${rivet}`, padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: dimCol }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <p style={{ fontFamily: FD, fontSize: px(18), fontWeight: 700, letterSpacing: '0.12em', color: textCol, margin: 0 }}>PREVIEW</p>
          <p style={{ fontFamily: FB, fontSize: px(12), color: dimCol, margin: 0 }}>{file?.name}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {preview ? (
          <img src={preview} alt="Document preview" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', background: '#111', border: `1px solid ${rivet}` }} />
        ) : (
          <div style={{ background: surface, border: `1px solid ${rivet}`, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 40, margin: '0 0 8px' }}>📄</p>
            <p style={{ fontFamily: FD, fontSize: px(14), color: dimCol, margin: 0 }}>{file?.name}</p>
          </div>
        )}

        {errMsg && (
          <div style={{ background: 'rgba(204,34,34,0.15)', border: '1px solid rgba(204,34,34,0.4)', padding: 14 }}>
            <p style={{ fontFamily: FB, fontSize: px(13), color: '#FF4444', margin: 0 }}>{errMsg}</p>
          </div>
        )}
      </div>

      <div style={{ background: surface, borderTop: `1px solid ${rivet}`, padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={handleIdentify}
          style={{ width: '100%', background: '#CC2222', color: '#fff', border: 'none', padding: '16px 0', fontFamily: FD, fontSize: px(16), fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer' }}>
          IDENTIFY DOCUMENT
        </button>
        <button onClick={reset}
          style={{ width: '100%', background: 'none', color: dimCol, border: `1px solid ${rivet}`, padding: '12px 0', fontFamily: FD, fontSize: px(14), fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>
          RESCAN
        </button>
      </div>
    </div>
  );

  // ── Identifying step ─────────────────────────────────────────────────────────
  if (step === 'identifying') return (
    <div style={{ position: 'fixed', inset: 0, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FD, zIndex: 100, gap: 20 }}>
      <div style={{ width: 56, height: 56, borderRadius: 28, border: '3px solid #CC2222', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: px(18), fontWeight: 700, letterSpacing: '0.12em', color: textCol, margin: 0 }}>IDENTIFYING...</p>
      <p style={{ fontSize: px(13), color: dimCol, letterSpacing: '0.08em', margin: 0 }}>AI IS READING YOUR DOCUMENT</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Confirm step ─────────────────────────────────────────────────────────────
  if (step === 'confirm') {
    const isExpense = docType === 'expense_receipt';
    const meta = DOC_LABELS[docType] || DOC_LABELS.other;
    const inputStyle = { width: '100%', border: `1px solid ${rivet}`, padding: '10px 12px', fontSize: px(14), fontFamily: "'Barlow', sans-serif", background: surface, color: textCol, boxSizing: 'border-box', outline: 'none' };
    const labelStyle = { fontFamily: FD, fontSize: px(12), letterSpacing: '0.1em', color: dimCol, display: 'block', marginBottom: 4 };

    return (
      <div style={{ position: 'fixed', inset: 0, background: bg, display: 'flex', flexDirection: 'column', fontFamily: FD, zIndex: 100 }}>
        {/* Header */}
        <div style={{ background: surface, borderBottom: `1px solid ${rivet}`, padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setStep('preview')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: dimCol }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <p style={{ fontFamily: FD, fontSize: px(18), fontWeight: 700, letterSpacing: '0.12em', color: textCol, margin: 0 }}>CONFIRM & SAVE</p>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: px(12), color: '#2DBB62', margin: 0 }}>
              {meta.icon} AI identified: {meta.label}
              {result?.confidence ? ` · ${Math.round(result.confidence * 100)}% confidence` : ''}
            </p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Document type selector */}
          <div>
            <label style={labelStyle}>DOCUMENT TYPE</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              {Object.entries(DOC_LABELS).map(([v, d]) => (
                <option key={v} value={v}>{d.icon} {d.label}</option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label style={labelStyle}>LABEL / DESCRIPTION</label>
            <input value={docLabel} onChange={e => setDocLabel(e.target.value)} style={inputStyle} placeholder="e.g. Pilot Flying J - Fuel Receipt" />
          </div>

          {/* Expense-specific fields */}
          {isExpense && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>AMOUNT ($)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div>
                  <label style={labelStyle}>DATE</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>VENDOR</label>
                <input value={vendor} onChange={e => setVendor(e.target.value)} style={inputStyle} placeholder="e.g. Pilot Flying J" />
              </div>
              <div>
                <label style={labelStyle}>CATEGORY</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Expiry date for docs that need it */}
          {!isExpense && (
            <div>
              <label style={labelStyle}>EXPIRY DATE (if applicable)</label>
              <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} style={inputStyle} />
            </div>
          )}

          {/* Destination folder */}
          <div style={{ background: 'rgba(45,187,98,0.08)', border: '1px solid rgba(45,187,98,0.25)', padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" fill="none" stroke="#2DBB62" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: px(12), color: '#2DBB62', margin: 0 }}>
              Will be filed under <strong>{isExpense ? 'Expense Receipts' : (DOC_LABELS[docType]?.folder?.replace('_', ' ').toUpperCase() || 'OTHER')}</strong> in Document Vault
              {isExpense && ' · P&L will be updated automatically'}
            </p>
          </div>

          {saveError && (
            <div style={{ background: 'rgba(204,34,34,0.15)', border: '1px solid rgba(204,34,34,0.4)', padding: 14 }}>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: px(13), color: '#FF4444', margin: 0 }}>{saveError}</p>
            </div>
          )}
        </div>

        <div style={{ background: surface, borderTop: `1px solid ${rivet}`, padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <button onClick={handleSave}
            style={{ width: '100%', background: '#CC2222', color: '#fff', border: 'none', padding: '16px 0', fontFamily: FD, fontSize: px(16), fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer' }}>
            SAVE DOCUMENT
          </button>
        </div>
      </div>
    );
  }

  // ── Saving step ──────────────────────────────────────────────────────────────
  if (step === 'saving') return (
    <div style={{ position: 'fixed', inset: 0, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FD, zIndex: 100, gap: 20 }}>
      <div style={{ width: 56, height: 56, borderRadius: 28, border: '3px solid #CC2222', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: px(18), fontWeight: 700, letterSpacing: '0.12em', color: textCol, margin: 0 }}>SAVING...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Done step ────────────────────────────────────────────────────────────────
  if (step === 'done') {
    const isExpense = docType === 'expense_receipt';
    return (
      <div style={{ position: 'fixed', inset: 0, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FD, zIndex: 100, padding: 32, gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: 'rgba(45,187,98,0.15)', border: '2px solid #2DBB62', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" fill="none" stroke="#2DBB62" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ fontSize: px(22), fontWeight: 700, letterSpacing: '0.12em', color: textCol, margin: 0 }}>SAVED</p>
        <p style={{ fontSize: px(13), color: dimCol, letterSpacing: '0.08em', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
          {docLabel || 'Document'} filed under{' '}
          <span style={{ color: '#2DBB62' }}>{isExpense ? 'Expense Receipts' : (DOC_LABELS[docType]?.folder?.replace(/_/g, ' ') || 'Other').toUpperCase()}</span>
          {isExpense && amount ? ` · $${parseFloat(amount).toFixed(2)} added to P&L` : ''}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, marginTop: 12 }}>
          <button onClick={reset}
            style={{ width: '100%', background: '#CC2222', color: '#fff', border: 'none', padding: '16px 0', fontFamily: "'Barlow Condensed', sans-serif", fontSize: px(16), fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer' }}>
            SCAN ANOTHER
          </button>
          <button onClick={onClose}
            style={{ width: '100%', background: 'none', color: dimCol, border: `1px solid ${rivet}`, padding: '12px 0', fontFamily: "'Barlow Condensed', sans-serif", fontSize: px(14), fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>
            DONE
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default UniversalScanScreen;
