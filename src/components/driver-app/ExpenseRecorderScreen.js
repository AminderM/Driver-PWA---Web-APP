import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';
import { takePhoto, isNative } from '../../lib/native';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'fuel',        label: 'Fuel',        icon: '⛽' },
  { value: 'tolls',       label: 'Tolls',       icon: '🛣️' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'lumper',      label: 'Lumper',      icon: '📦' },
  { value: 'detention',   label: 'Detention',   icon: '⏱️' },
  { value: 'meals',       label: 'Meals',       icon: '🍔' },
  { value: 'lodging',     label: 'Lodging',     icon: '🏨' },
  { value: 'scales',      label: 'Scales',      icon: '⚖️' },
  { value: 'permits',     label: 'Permits',     icon: '📋' },
  { value: 'insurance',   label: 'Insurance',   icon: '🛡️' },
  { value: 'other',       label: 'Other',       icon: '➕' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

const FILTER_PERIODS = [
  { value: 'all',    label: 'All Time' },
  { value: 'week',   label: 'This Week' },
  { value: 'month',  label: 'This Month' },
  { value: 'year',   label: 'This Year' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const filterByPeriod = (expenses, period) => {
  if (period === 'all') return expenses;
  const now = new Date();
  const start = new Date();
  if (period === 'week') {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return expenses.filter(e => new Date(e.date) >= start);
};

// ── Storage helpers (localStorage) ───────────────────────────────────────────

const STORAGE_KEY = 'integra_expenses_v1';

const loadExpenses = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveExpenses = (list) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
};

// ── Main screen ───────────────────────────────────────────────────────────────

const ExpenseRecorderScreen = ({ onBack }) => {
  const { api, theme, toggleTheme } = useDriverApp();
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

  const [screen, setScreen] = useState('list'); // 'list' | 'add' | 'scan-capture' | 'scan-preview' | 'scan-parsing' | 'detail'
  const [expenses, setExpenses] = useState(() => loadExpenses());
  const [period, setPeriod] = useState('month');
  const [catFilter, setCatFilter] = useState('all');

  // Scan state
  const [scanFile, setScanFile]       = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanError, setScanError]     = useState('');
  const fileInputRef = useRef(null);

  // Form state
  const [formMode, setFormMode]     = useState('add'); // 'add' | 'edit'
  const [editId, setEditId]         = useState(null);
  const [formDate, setFormDate]     = useState(todayStr());
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('fuel');
  const [formVendor, setFormVendor] = useState('');
  const [formNotes, setFormNotes]   = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Persist on change
  useEffect(() => { saveExpenses(expenses); }, [expenses]);

  const openAdd = (prefill = {}) => {
    setFormMode('add');
    setEditId(null);
    setFormDate(prefill.date || todayStr());
    setFormAmount(prefill.amount ? String(prefill.amount) : '');
    setFormCategory(prefill.category || 'fuel');
    setFormVendor(prefill.vendor || '');
    setFormNotes(prefill.notes || '');
    setShowDeleteConfirm(false);
    setScreen('add');
  };

  const openEdit = (exp) => {
    setFormMode('edit');
    setEditId(exp.id);
    setFormDate(exp.date);
    setFormAmount(String(exp.amount));
    setFormCategory(exp.category);
    setFormVendor(exp.vendor || '');
    setFormNotes(exp.notes || '');
    setShowDeleteConfirm(false);
    setScreen('add');
  };

  const handleFormSave = () => {
    if (!formAmount || parseFloat(formAmount) <= 0) return;
    setFormSaving(true);

    const entry = {
      id:       formMode === 'edit' ? editId : `exp_${Date.now()}`,
      date:     formDate,
      amount:   parseFloat(formAmount),
      category: formCategory,
      vendor:   formVendor.trim() || null,
      notes:    formNotes.trim() || null,
    };

    setExpenses(prev =>
      formMode === 'edit'
        ? prev.map(e => e.id === editId ? entry : e)
        : [entry, ...prev]
    );

    setFormSaving(false);
    setScreen('list');
  };

  const handleDelete = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setScreen('list');
  };

  // ── Receipt scanning ──────────────────────────────────────────────────────

  const handleScanCamera = async () => {
    try {
      const { dataUrl, file } = await takePhoto({ source: 'camera' });
      setScanPreview(dataUrl);
      setScanFile(file);
      setScanError('');
      setScreen('scan-preview');
    } catch (err) {
      if (err.message !== 'cancelled') setScanError('Camera error: ' + err.message);
    }
  };

  const handleScanFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setScanFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScanPreview(ev.target.result);
      setScanError('');
      setScreen('scan-preview');
    };
    reader.readAsDataURL(f);
  };

  const handleScanParse = async () => {
    setScreen('scan-parsing');
    setScanError('');
    try {
      const formData = new FormData();
      formData.append('file', scanFile);
      const result = await api('/receipt/parse', { method: 'POST', body: formData });
      // Pre-fill form from parsed result
      openAdd({
        date:     result.date     || todayStr(),
        amount:   result.amount   || '',
        category: result.category || 'other',
        vendor:   result.vendor   || '',
        notes:    result.notes    || '',
      });
    } catch (err) {
      setScanError(err.message || 'Could not parse receipt. Enter manually.');
      setScreen('scan-preview');
    }
  };

  // ── Filtered data ─────────────────────────────────────────────────────────

  const periodFiltered = filterByPeriod(expenses, period);
  const displayed = catFilter === 'all'
    ? periodFiltered
    : periodFiltered.filter(e => e.category === catFilter);

  const totalAmount = periodFiltered.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: periodFiltered.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Scan capture ──────────────────────────────────────────────────────────
  if (screen === 'scan-capture') return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-5`}>
        <button onClick={() => setScreen('list')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← CANCEL</button>
        <h1 className={`text-xl font-bold tracking-wider ${text}`}>SCAN RECEIPT</h1>
        <p className={`text-xs mt-1 ${subtext}`}>AI extracts amount, vendor, and category</p>
      </div>
      <div className="flex-1 px-5 py-8 space-y-4">
        {scanError && (
          <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4">
            <p className="text-[#FF2020] text-sm">{scanError}</p>
          </div>
        )}
        <button onClick={handleScanCamera}
          className={`w-full border-2 ${isDark ? 'border-[#1F1F1F] hover:border-[#CC2222]/50' : 'border-[#e5e5e5] hover:border-[#CC2222]/50'} py-10 flex flex-col items-center gap-3 transition-colors`}>
          <div className="w-14 h-14 bg-[#CC2222]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#CC2222]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className={`font-bold tracking-wider text-sm ${text}`}>
            {isNative() ? 'TAKE PHOTO' : 'USE CAMERA'}
          </p>
        </button>

        <input ref={fileInputRef} type="file" accept="image/*,application/pdf"
          onChange={handleScanFileSelect} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 ${isDark ? 'border-[#1F1F1F] hover:border-[#CC2222]/50' : 'border-[#e5e5e5] hover:border-[#CC2222]/50'} py-8 flex flex-col items-center gap-3 transition-colors`}>
          <div className="w-14 h-14 bg-blue-600/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className={`font-bold tracking-wider text-sm ${text}`}>UPLOAD FILE</p>
        </button>

        <button onClick={() => openAdd()}
          className={`w-full border ${border} py-3 text-sm tracking-wider ${subtext}`}>
          ENTER MANUALLY INSTEAD
        </button>
      </div>
    </div>
  );

  // ── Scan preview ──────────────────────────────────────────────────────────
  if (screen === 'scan-preview') return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-5`}>
        <button onClick={() => { setScreen('scan-capture'); setScanPreview(null); setScanFile(null); }}
          className={`text-sm tracking-wider mb-4 block ${subtext}`}>← RETAKE</button>
        <h1 className={`text-xl font-bold tracking-wider ${text}`}>CONFIRM RECEIPT</h1>
      </div>
      <div className="flex-1 px-5 py-6 flex flex-col gap-5">
        {scanError && (
          <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4">
            <p className="text-[#FF2020] text-sm">{scanError}</p>
          </div>
        )}
        {scanPreview && (
          scanFile?.type === 'application/pdf' ? (
            <div className={`${surface} border ${border} p-8 flex flex-col items-center gap-3`}>
              <span className="text-4xl">📄</span>
              <p className={`text-sm font-bold tracking-wider ${text}`}>{scanFile.name || 'Receipt PDF'}</p>
              <p className={`text-xs ${subtext}`}>PDF ready to parse</p>
            </div>
          ) : (
            <img src={scanPreview} alt="Receipt" className="w-full object-contain max-h-72 border border-[#1F1F1F]" />
          )
        )}
        <button onClick={handleScanParse}
          className="w-full bg-[#CC2222] hover:bg-[#7A1010] text-white font-bold py-4 tracking-wider flex items-center justify-center gap-2">
          <span>✨</span> PARSE WITH AI
        </button>
        <button onClick={() => openAdd()}
          className={`w-full border ${border} py-3 text-sm tracking-wider ${subtext}`}>
          ENTER MANUALLY INSTEAD
        </button>
      </div>
    </div>
  );

  // ── Parsing spinner ───────────────────────────────────────────────────────
  if (screen === 'scan-parsing') return (
    <div className={`min-h-screen flex flex-col items-center justify-center font-['Barlow_Condensed'] ${bg}`}>
      <div className="w-16 h-16 bg-[#CC2222]/20 flex items-center justify-center mb-6 animate-pulse">
        <span className="text-2xl">✨</span>
      </div>
      <h2 className={`text-lg font-bold tracking-wider mb-2 ${text}`}>READING RECEIPT</h2>
      <p className={`text-sm ${subtext}`}>Claude AI is extracting expense details...</p>
      <div className="mt-8 flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 bg-[#CC2222] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  // ── Add / Edit form ───────────────────────────────────────────────────────
  if (screen === 'add') return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <button onClick={() => setScreen('list')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
        <h1 className={`text-xl font-bold tracking-wider ${text}`}>
          {formMode === 'edit' ? 'EDIT EXPENSE' : 'ADD EXPENSE'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Amount */}
        <div className={`${surface} border ${border} p-4`}>
          <label className={LabelCls(isDark)}>AMOUNT ($)</label>
          <div className="relative mt-1">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${subtext}`}>$</span>
            <input
              type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)}
              placeholder="0.00" min="0" step="0.01" autoFocus
              className={`${inputCls} pl-7 text-lg font-bold`}
            />
          </div>
        </div>

        {/* Category picker */}
        <div className={`${surface} border ${border} p-4`}>
          <label className={LabelCls(isDark)}>CATEGORY</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" onClick={() => setFormCategory(cat.value)}
                className={`py-2 px-1 text-xs font-semibold tracking-wider border transition-colors flex flex-col items-center gap-1 ${
                  formCategory === cat.value
                    ? 'bg-[#CC2222] border-[#CC2222] text-white'
                    : `${border} ${subtext} hover:border-[#CC2222]/50`
                }`}>
                <span className="text-base">{cat.icon}</span>
                {cat.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Date + Vendor */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <div>
            <label className={LabelCls(isDark)}>DATE</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={LabelCls(isDark)}>VENDOR / MERCHANT <span className={`font-normal ${subtext}`}>(optional)</span></label>
            <input type="text" value={formVendor} onChange={e => setFormVendor(e.target.value)}
              placeholder="e.g. Pilot Flying J, McDonald's" className={inputCls} />
          </div>
          <div>
            <label className={LabelCls(isDark)}>NOTES <span className={`font-normal ${subtext}`}>(optional)</span></label>
            <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)}
              placeholder="e.g. Load #1234, Chicago IL" className={inputCls} />
          </div>
        </div>

        {/* Save */}
        <button onClick={handleFormSave} disabled={!formAmount || parseFloat(formAmount) <= 0 || formSaving}
          className="w-full bg-[#CC2222] hover:bg-[#7A1010] disabled:bg-[#CC2222]/50 text-white font-bold py-4 tracking-wider transition-colors">
          {formMode === 'edit' ? 'SAVE CHANGES' : 'ADD EXPENSE'}
        </button>

        {/* Delete */}
        {formMode === 'edit' && (
          <div className="pb-6">
            {showDeleteConfirm ? (
              <div className={`border ${isDark ? 'border-[#CC2222]/50 bg-[#CC2222]/10' : 'border-red-200 bg-red-50'} p-4 space-y-3`}>
                <p className={`text-sm ${isDark ? 'text-[#FF2020]' : 'text-red-700'}`}>Delete this expense?</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className={`flex-1 border ${border} py-2.5 text-sm tracking-wider ${subtext}`}>CANCEL</button>
                  <button onClick={() => handleDelete(editId)}
                    className="flex-1 bg-[#7A1010] hover:bg-red-800 text-white text-sm py-2.5 tracking-wider">CONFIRM</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)}
                className={`w-full text-sm tracking-wider py-3 ${isDark ? 'text-[#CC2222]/60 hover:text-[#CC2222]' : 'text-[#FF2020] hover:text-[#CC2222]'} transition-colors`}>
                DELETE EXPENSE
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Expense list ──────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>

      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className={`text-base tracking-wider ${subtext}`}>← TOOLS</button>
          <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mb-1">
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>EXPENSES</h1>
          <div className="flex gap-2">
            <button onClick={() => { setScanError(''); setScreen('scan-capture'); }}
              className="h-10 px-3 bg-[#CC2222]/20 border border-[#CC2222]/40 text-[#CC2222] text-xs font-bold tracking-wider hover:bg-[#CC2222]/30 transition-colors flex items-center gap-1.5">
              ✨ SCAN
            </button>
            <button onClick={() => openAdd()}
              className="w-10 h-10 bg-[#CC2222] hover:bg-[#7A1010] flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Period filter tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold tracking-wider border transition-colors ${
                period === p.value
                  ? 'bg-[#CC2222] border-[#CC2222] text-white'
                  : `${border} ${subtext}`
              }`}>
              {p.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Summary card */}
        <div className="px-4 pt-4">
          <div className={`${surface} border ${border} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-bold tracking-widest ${subtext}`}>TOTAL SPENT</p>
              <p className={`text-2xl font-bold text-[#CC2222]`}>
                ${fmt(totalAmount)}
              </p>
            </div>
            {categoryTotals.length > 0 && (
              <div className="space-y-1.5">
                {categoryTotals.slice(0, 4).map(cat => (
                  <div key={cat.value} className="flex items-center gap-2">
                    <span className="text-sm w-5">{cat.icon}</span>
                    <div className={`flex-1 h-1.5 ${isDark ? 'bg-[#161616]' : 'bg-[#f0f0f0]'} overflow-hidden`}>
                      <div className="h-full bg-[#CC2222]/70"
                        style={{ width: totalAmount > 0 ? `${(cat.total / totalAmount) * 100}%` : '0%' }} />
                    </div>
                    <span className={`text-xs ${subtext} w-16 text-right`}>${fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category filter chips */}
        <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setCatFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold border transition-colors ${
              catFilter === 'all' ? 'bg-[#CC2222] border-[#CC2222] text-white' : `${border} ${subtext}`
            }`}>
            ALL
          </button>
          {categoryTotals.map(cat => (
            <button key={cat.value} onClick={() => setCatFilter(cat.value)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold border transition-colors flex items-center gap-1 ${
                catFilter === cat.value ? 'bg-[#CC2222] border-[#CC2222] text-white' : `${border} ${subtext}`
              }`}>
              {cat.icon} {cat.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Expense rows */}
        <div className="px-4 py-3 space-y-2">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-4xl mb-4">🧾</p>
              <p className={`text-base font-bold tracking-wider mb-2 ${text}`}>NO EXPENSES</p>
              <p className={`text-sm mb-6 ${subtext}`}>
                {expenses.length === 0
                  ? 'Tap + to log an expense or scan a receipt.'
                  : 'No expenses match the current filter.'}
              </p>
              {expenses.length === 0 && (
                <button onClick={() => openAdd()}
                  className="bg-[#CC2222] hover:bg-[#7A1010] text-white font-bold px-6 py-3 tracking-wider">
                  + ADD EXPENSE
                </button>
              )}
            </div>
          ) : (
            displayed
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(exp => {
                const cat = CAT_MAP[exp.category] || CAT_MAP.other;
                return (
                  <button key={exp.id} onClick={() => openEdit(exp)}
                    className={`w-full text-left ${surface} border ${border} px-4 py-3 flex items-center gap-3 hover:border-[#CC2222]/50 transition-colors`}>
                    <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-[#161616]' : 'bg-[#f5f5f5]'
                    }`}>
                      <span className="text-lg">{cat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${text}`}>{cat.label}</p>
                      <p className={`text-xs ${subtext} truncate`}>
                        {exp.vendor || exp.notes || new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#FF2020]">-${fmt(exp.amount)}</p>
                      <p className={`text-xs ${subtext}`}>
                        {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};

const LabelCls = (isDark) =>
  `block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`;

export default ExpenseRecorderScreen;
