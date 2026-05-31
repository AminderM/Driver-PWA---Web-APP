import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';
import RateConScanner from './RateConScanner';
import LoadEntryForm from './LoadEntryForm';

const STATUS_FILTERS = [
  { value: 'all',        label: 'All'        },
  { value: 'upcoming',   label: 'Upcoming'   },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered',  label: 'Delivered'  },
  { value: 'invoiced',   label: 'Invoiced'   },
];

const STATUS_CONFIG = {
  upcoming:   { label: 'UPCOMING',   bg: 'bg-[#1a1a1a]', text: 'text-amber-400' },
  in_transit: { label: 'IN TRANSIT', bg: 'bg-[#1a1a1a]', text: 'text-sky-400'   },
  delivered:  { label: 'DELIVERED',  bg: 'bg-[#1a1a1a]', text: 'text-green-400' },
  invoiced:   { label: 'INVOICED',   bg: 'bg-[#1a1a1a]', text: 'text-white/70'  },
};

// ── Load card (module-level so React never remounts it) ────────────────────────
const LoadCard = ({ load, onEdit, onPay, onAttach, isDark, surface, border, text, subtext }) => {
  const status = (load.status || '').toLowerCase();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
  const fileInputRef = useRef(null);
  const [attachState, setAttachState] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [attachError, setAttachError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachState('uploading');
    setAttachError('');
    try {
      await onAttach(load.id, file);
      setAttachState('success');
      setTimeout(() => setAttachState(null), 3000);
    } catch (err) {
      setAttachError(err.message || 'Upload failed. Please try again.');
      setAttachState('error');
    }
    e.target.value = '';
  };

  const rpm = load.rate && load.estimated_miles
    ? `$${(load.rate / load.estimated_miles).toFixed(2)}/mi`
    : null;
  const isPayable   = status === 'delivered' || status === 'invoiced';
  const rate        = Number(load.rate) || 0;
  const paid        = Number(load.paid_amount) || 0;
  const isFullyPaid = paid > 0 && paid >= rate;
  const isPartial   = paid > 0 && paid < rate;
  const outstanding = rate - paid;

  return (
    <div className={`${surface} border ${border} overflow-hidden mb-3`}>
      {/* Tappable card body → opens edit form */}
      <button onClick={() => onEdit(load)} className="w-full text-left">
        {/* Status bar */}
        <div className={`${cfg.bg} px-4 py-1.5 flex items-center justify-between`}>
          <span className={`${cfg.text} text-sm font-bold tracking-widest`}>{cfg.label}</span>
          <div className="flex items-center gap-2">
            {isPayable && (
              <span className={`text-xs font-bold tracking-widest px-2 py-0.5 ${
                isFullyPaid ? 'bg-green-600/30 text-green-300'
                : isPartial  ? 'bg-amber-600/30 text-amber-300'
                : 'bg-white/10 text-white/60'
              }`}>
                {isFullyPaid ? '✓ PAID' : isPartial ? '½ PARTIAL' : 'UNPAID'}
              </span>
            )}
            {load.pickup_date && (
              <span className="text-white/70 text-sm">
                {new Date(load.pickup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${subtext} tracking-wider`}>FROM</p>
              <p className={`text-base font-bold truncate ${text}`}>{load.origin || '—'}</p>
            </div>
            <svg className={`w-5 h-5 flex-shrink-0 ${subtext}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex-1 min-w-0 text-right">
              <p className={`text-sm ${subtext} tracking-wider`}>TO</p>
              <p className={`text-base font-bold truncate ${text}`}>{load.destination || '—'}</p>
            </div>
          </div>

          <div className={`grid grid-cols-3 gap-2 mt-2 pt-2 border-t ${border}`}>
            <div className={`text-center p-2 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
              <p className={`text-sm ${subtext} tracking-wider`}>RATE</p>
              <p className={`text-base font-bold ${text}`}>
                {load.rate ? `$${Number(load.rate).toLocaleString()}` : '—'}
              </p>
            </div>
            <div className={`text-center p-2 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
              <p className={`text-sm ${subtext} tracking-wider`}>MILES</p>
              <p className={`text-base font-bold ${text}`}>
                {load.estimated_miles ? Number(load.estimated_miles).toLocaleString() : '—'}
              </p>
            </div>
            <div className={`text-center p-2 ${isDark ? 'bg-[#171717]' : 'bg-[#f5f5f5]'}`}>
              <p className={`text-sm ${subtext} tracking-wider`}>RPM</p>
              <p className={`text-base font-bold ${rpm ? 'text-green-400' : text}`}>{rpm || '—'}</p>
            </div>
          </div>

          {/* Payment collected bar */}
          {isPayable && rate > 0 && (
            <div className={`mt-3 pt-2 border-t ${border}`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-xs tracking-wider ${subtext}`}>COLLECTED</span>
                <span className={`text-sm font-bold ${isFullyPaid ? 'text-green-400' : isPartial ? 'text-amber-400' : subtext}`}>
                  ${paid.toLocaleString()} <span className={`font-normal ${subtext}`}>of ${rate.toLocaleString()}</span>
                </span>
              </div>
              <div className={`h-1.5 w-full ${isDark ? 'bg-[#222]' : 'bg-[#e8e8e8]'}`}>
                <div className={`h-full transition-all ${isFullyPaid ? 'bg-green-500' : isPartial ? 'bg-amber-400' : 'bg-transparent'}`}
                  style={{ width: rate > 0 ? `${Math.min((paid / rate) * 100, 100)}%` : '0%' }} />
              </div>
            </div>
          )}

          {(load.broker_name || load.commodity) && (
            <p className={`text-sm mt-2 ${subtext} truncate`}>
              {[load.broker_name, load.commodity].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </button>

      {/* ── Payment action row (outside the edit button) ── */}
      {isPayable && !isFullyPaid && (
        <button
          type="button"
          onClick={() => onPay(load)}
          className={`w-full flex items-center justify-center gap-2 py-3 border-t-2 ${isDark ? 'border-green-800 bg-green-900/10 hover:bg-green-900/20' : 'border-green-200 bg-green-50 hover:bg-green-100'} text-sm font-bold tracking-wider transition-colors text-green-400`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isPartial
            ? `RECORD MORE — $${outstanding.toLocaleString()} OUTSTANDING`
            : 'RECORD PAYMENT'}
        </button>
      )}
      {isPayable && isFullyPaid && (
        <div className={`w-full flex items-center justify-center gap-2 py-2.5 border-t ${border} text-sm font-bold tracking-wider text-green-400`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          FULLY PAID
        </div>
      )}

      {/* ── Attach paperwork row ── */}
      <div className={`border-t ${border}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => { setAttachError(''); fileInputRef.current?.click(); }}
          disabled={attachState === 'uploading'}
          className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-wider transition-colors ${
            attachState === 'success' ? 'text-green-400' :
            attachState === 'error'   ? 'text-red-400'   :
            subtext
          }`}
        >
          {attachState === 'uploading' ? (
            <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /><span>UPLOADING...</span></>
          ) : attachState === 'success' ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>DOCUMENT ATTACHED</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{attachState === 'error' ? 'RETRY ATTACH' : 'ATTACH PAPERWORK'}</span>
            </>
          )}
        </button>
        {attachState === 'error' && attachError && (
          <p className="text-center text-red-400 text-xs pb-2 px-4">{attachError}</p>
        )}
      </div>
    </div>
  );
};

const ManualLoadsScreen = ({ onBack }) => {
  const { api, theme, toggleTheme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-black'         : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#0a0a0a]'     : 'bg-white';
  const text    = isDark ? 'text-white'        : 'text-black';
  const subtext = isDark ? 'text-white/60'     : 'text-black/60';
  const border  = isDark ? 'border-[#262626]'  : 'border-[#e5e5e5]';

  const [loads,        setLoads]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [screen,       setScreen]       = useState('list');  // 'list' | 'scanner' | 'form'
  const [editLoad,     setEditLoad]     = useState(null);
  const [prefillData,  setPrefillData]  = useState({});
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [fetchError,   setFetchError]   = useState('');

  // ── Payment sheet state ───────────────────────────────────────────────────
  const [paymentLoad,  setPaymentLoad]  = useState(null);
  const [payAmount,    setPayAmount]    = useState('');
  const [payLoading,   setPayLoading]   = useState(false);
  const [payError,     setPayError]     = useState('');

  const openPaymentSheet = (load) => {
    setPaymentLoad(load);
    setPayAmount(String(load.paid_amount || ''));
    setPayError('');
  };

  const handleRecordPayment = async (amount) => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) { setPayError('Enter a valid amount.'); return; }
    const rate = Number(paymentLoad.rate) || 0;
    if (parsed > rate) { setPayError(`Amount cannot exceed the load rate ($${rate.toLocaleString()}).`); return; }
    setPayLoading(true);
    setPayError('');
    try {
      await api(`/my-loads/${paymentLoad.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ paid_amount: parsed }),
      });
      setLoads(prev => prev.map(l => l.id === paymentLoad.id ? { ...l, paid_amount: parsed } : l));
      setPaymentLoad(null);
    } catch (err) {
      setPayError(err.message || 'Failed to record payment.');
    } finally {
      setPayLoading(false);
    }
  };

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await api('/my-loads');
      setLoads(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError('Could not load your loads. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);

  const handleSave = (result) => {
    if (result === null) {
      // Deleted
      setLoads(prev => prev.filter(l => l.id !== editLoad?.id));
    } else if (editLoad) {
      setLoads(prev => prev.map(l => l.id === result.id ? result : l));
    } else {
      setLoads(prev => [result, ...prev]);
    }
    setScreen('list');
    setEditLoad(null);
    setPrefillData({});
  };

  const handleParsed = (parsed) => {
    setPrefillData(parsed);
    setEditLoad(null);
    setScreen('form');
  };

  const openEdit = (load) => {
    setEditLoad(load);
    setPrefillData({});
    setScreen('form');
  };

  const handleAttach = async (loadId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'load_paperwork');
    await api(`/my-loads/${loadId}/documents`, { method: 'POST', body: formData });
  };

  // ── Sub-screens ───────────────────────────────────────────────────────────
  if (screen === 'scanner') {
    return (
      <RateConScanner
        onParsed={handleParsed}
        onCancel={() => { setScreen('form'); setPrefillData({}); }}
      />
    );
  }

  if (screen === 'form') {
    return (
      <LoadEntryForm
        prefill={prefillData}
        existingLoad={editLoad}
        onSave={handleSave}
        onCancel={() => { setScreen('list'); setEditLoad(null); setPrefillData({}); }}
      />
    );
  }


  // ── Summary counts ────────────────────────────────────────────────────────
  const counts = loads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = loads
    .filter(l => l.status === 'delivered' || l.status === 'invoiced')
    .reduce((sum, l) => sum + (Number(l.rate) || 0), 0);

  // ── Main list ─────────────────────────────────────────────────────────────
  return (
    <div className={`flex-1 flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <div className="flex items-center justify-between mb-1">
          <h1 className={`text-2xl font-bold tracking-wider ${text}`}>MY LOADS</h1>
          <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <button
            onClick={() => setShowAddSheet(true)}
            className="w-10 h-10 bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Revenue summary */}
        {totalRevenue > 0 && (
          <p className={`text-sm ${subtext}`}>
            Delivered + invoiced: <span className="text-green-400 font-semibold">${totalRevenue.toLocaleString()}</span>
          </p>
        )}

        {/* Status filter tabs */}
        <div className={`flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1`} style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map(f => {
            const count = f.value === 'all' ? loads.length : (counts[f.value] || 0);
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-shrink-0 px-3 py-1.5 text-sm font-semibold tracking-wider border transition-colors ${
                  filter === f.value
                    ? 'bg-red-600 border-red-600 text-white'
                    : `${border} ${subtext}`
                }`}
              >
                {f.label.toUpperCase()}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] ${filter === f.value ? 'text-white/70' : subtext}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {fetchError && (
          <div className="bg-red-600/20 border border-red-600/50 p-4 mb-4">
            <p className="text-red-400 text-base">{fetchError}</p>
            <button onClick={fetchLoads} className="text-red-400 text-sm mt-2 underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className={`text-base ${subtext}`}>Loading loads...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className={`w-16 h-16 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'} border ${border} flex items-center justify-center mb-4`}>
              <svg className={`w-8 h-8 ${subtext}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
              </svg>
            </div>
            <p className={`text-lg font-bold tracking-wider mb-2 ${text}`}>
              {filter === 'all' ? 'NO LOADS YET' : `NO ${filter.toUpperCase().replace('_', ' ')} LOADS`}
            </p>
            <p className={`text-base mb-6 ${subtext}`}>
              {filter === 'all'
                ? 'Add your first load manually or scan a rate confirmation.'
                : 'No loads with this status.'}
            </p>
            {filter === 'all' && (
              <button onClick={() => setShowAddSheet(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 tracking-wider transition-colors">
                + ADD LOAD
              </button>
            )}
          </div>
        ) : (
          filtered.map(load => (
            <LoadCard
              key={load.id}
              load={load}
              onEdit={openEdit}
              onPay={openPaymentSheet}
              onAttach={handleAttach}
              isDark={isDark}
              surface={surface}
              border={border}
              text={text}
              subtext={subtext}
            />
          ))
        )}
      </div>

      {/* ── Payment sheet ─────────────────────────────────────────────────── */}
      {paymentLoad && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setPaymentLoad(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className={`relative ${surface} border-t-2 border-green-500 px-5 pt-5 pb-10`}
            onClick={e => e.stopPropagation()}>
            <div className={`w-10 h-1 ${isDark ? 'bg-white/20' : 'bg-black/20'} mx-auto mb-5`} />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-xs tracking-widest font-bold text-green-400 mb-0.5`}>RECORD PAYMENT</p>
                <p className={`text-base font-bold ${text}`}>
                  {paymentLoad.origin} → {paymentLoad.destination}
                </p>
              </div>
              <p className={`text-xl font-bold ${text}`}>
                ${Number(paymentLoad.rate).toLocaleString()}
              </p>
            </div>

            {/* Current payment status */}
            {(() => {
              const paid = Number(paymentLoad.paid_amount) || 0;
              const rate = Number(paymentLoad.rate) || 0;
              const outstanding = rate - paid;
              return (
                <div className={`${isDark ? 'bg-[#0f0f0f]' : 'bg-[#f5f5f5]'} border ${border} p-3 mb-4`}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={subtext}>Collected</span>
                    <span className="text-green-400 font-bold">${paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={subtext}>Outstanding</span>
                    <span className={`font-bold ${outstanding > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                      ${outstanding.toLocaleString()}
                    </span>
                  </div>
                  <div className={`h-1.5 w-full ${isDark ? 'bg-[#222]' : 'bg-[#e0e0e0]'} mt-1`}>
                    <div className="h-full bg-green-500 transition-all"
                      style={{ width: rate > 0 ? `${Math.min((paid / rate) * 100, 100)}%` : '0%' }} />
                  </div>
                </div>
              );
            })()}

            {payError && (
              <p className="text-red-400 text-sm mb-3">{payError}</p>
            )}

            {/* Quick full-pay button */}
            <button
              onClick={() => handleRecordPayment(String(paymentLoad.rate))}
              disabled={payLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3.5 tracking-wider mb-3 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              MARK FULLY PAID — ${Number(paymentLoad.rate).toLocaleString()}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex-1 h-px ${isDark ? 'bg-[#222]' : 'bg-[#e5e5e5]'}`} />
              <span className={`text-xs tracking-widest ${subtext}`}>OR PARTIAL AMOUNT</span>
              <div className={`flex-1 h-px ${isDark ? 'bg-[#222]' : 'bg-[#e5e5e5]'}`} />
            </div>

            {/* Partial payment input */}
            <div className="flex gap-2">
              <div className={`flex-1 flex items-center border ${border} ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                <span className={`pl-3 text-sm ${subtext}`}>$</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`flex-1 py-3 px-2 text-sm bg-transparent focus:outline-none ${text}`}
                />
              </div>
              <button
                onClick={() => handleRecordPayment(payAmount)}
                disabled={payLoading || !payAmount}
                className="bg-[#CC2222] hover:bg-[#7A1010] disabled:opacity-40 text-white font-bold px-5 tracking-wider text-sm">
                {payLoading ? '...' : 'RECORD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add load bottom sheet */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setShowAddSheet(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className={`relative ${surface} border-t ${border} px-5 pt-5 pb-10`}
            onClick={e => e.stopPropagation()}>
            <div className={`w-10 h-1 ${isDark ? 'bg-white/20' : 'bg-black/20'} mx-auto mb-5`} />
            <p className={`text-sm font-bold tracking-widest mb-4 ${subtext}`}>ADD LOAD</p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowAddSheet(false); setScreen('scanner'); setPrefillData({}); setEditLoad(null); }}
                className={`w-full flex items-center gap-4 p-4 border ${border} hover:border-red-600/50 transition-colors`}
              >
                <div className="w-10 h-10 bg-red-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">✨</span>
                </div>
                <div className="text-left">
                  <p className={`text-base font-bold tracking-wider ${text}`}>SCAN RATE CONFIRMATION</p>
                  <p className={`text-sm mt-0.5 ${subtext}`}>AI extracts all details automatically</p>
                </div>
              </button>

              <button
                onClick={() => { setShowAddSheet(false); setScreen('form'); setPrefillData({}); setEditLoad(null); }}
                className={`w-full flex items-center gap-4 p-4 border ${border} hover:border-red-600/50 transition-colors`}
              >
                <div className="w-10 h-10 bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className={`text-base font-bold tracking-wider ${text}`}>ENTER MANUALLY</p>
                  <p className={`text-sm mt-0.5 ${subtext}`}>Fill in the form yourself</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualLoadsScreen;
