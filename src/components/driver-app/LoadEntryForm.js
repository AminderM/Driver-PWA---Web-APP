import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────
const toLocalDT = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr.slice(0, 16);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toISO = (localStr) => {
  if (!localStr) return null;
  return new Date(localStr).toISOString();
};

// ── Static field wrapper (outside component — never remounts inputs) ───────────
const Field = ({ label, children, optional, isDark, subtext }) => (
  <div>
    <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
      {label}{optional && <span className={`ml-1 font-normal ${subtext}`}>(optional)</span>}
    </label>
    {children}
  </div>
);

// ── Location autocomplete field ───────────────────────────────────────────────
const LocationField = ({ label, value, onChange, onSelect, onClear, isDark, subtext, inputCls, api }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [fetching, setFetching]       = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  // Close dropdown on outside tap
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleChange = (text) => {
    onChange(text);
    onClear(); // user is typing → clear stored coords

    clearTimeout(debounceRef.current);
    if (text.length < 2) { setSuggestions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const results = await api(`/maps/autocomplete?input=${encodeURIComponent(text)}`);
        setSuggestions(Array.isArray(results) ? results : []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setFetching(false);
      }
    }, 300);
  };

  const handleSelect = (suggestion) => {
    onChange(suggestion.description);
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
        {label}
      </label>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="City, Province/State"
          className={inputCls}
          autoComplete="off"
          required
        />
        {fetching && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className={`absolute z-50 left-0 right-0 border shadow-lg ${
          isDark ? 'bg-[#0f0f0f] border-[#333]' : 'bg-white border-[#ddd]'
        }`} style={{ top: '100%', maxHeight: 220, overflowY: 'auto' }}>
          {suggestions.map((s, i) => (
            <button
              key={s.place_id || i}
              type="button"
              onMouseDown={() => handleSelect(s)}  // mousedown fires before blur
              className={`w-full text-left px-3 py-2.5 border-b last:border-b-0 ${
                isDark
                  ? 'border-[#222] hover:bg-[#1a1a1a] active:bg-[#222]'
                  : 'border-[#f0f0f0] hover:bg-[#f5f5f5] active:bg-[#ebebeb]'
              }`}
            >
              <p className={`text-sm font-semibold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {s.main_text}
              </p>
              <p className={`text-xs mt-0.5 ${subtext}`}>{s.secondary_text}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Status options ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'upcoming',   label: 'Upcoming'   },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered',  label: 'Delivered'  },
  { value: 'invoiced',   label: 'Invoiced'   },
];

// ── Main form ─────────────────────────────────────────────────────────────────
const LoadEntryForm = ({ prefill = {}, existingLoad = null, onSave, onCancel }) => {
  const { api, theme } = useDriverApp();
  const isDark = theme === 'dark';
  const mode   = existingLoad ? 'edit' : 'create';

  const bg       = isDark ? 'bg-black'        : 'bg-white';
  const text     = isDark ? 'text-white'       : 'text-black';
  const subtext  = isDark ? 'text-white/60'    : 'text-black/60';
  const border   = isDark ? 'border-[#262626]' : 'border-[#e5e5e5]';
  const surface  = isDark ? 'bg-[#0a0a0a]'    : 'bg-[#f5f5f5]';
  const inputCls = `w-full border py-3 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-600 ${
    isDark ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/30'
           : 'bg-white border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  const init = existingLoad || prefill;

  const [status,        setStatus]        = useState(init.status         || 'upcoming');
  const [shipper,       setShipper]       = useState(init.shipper        || '');
  const [consignee,     setConsignee]     = useState(init.consignee      || '');
  const [origin,        setOrigin]        = useState(init.origin         || '');
  const [destination,   setDestination]   = useState(init.destination    || '');
  const [pickupDate,    setPickupDate]    = useState(init.pickup_date   ? toLocalDT(init.pickup_date)   : '');
  const [deliveryDate,  setDeliveryDate]  = useState(init.delivery_date ? toLocalDT(init.delivery_date) : '');
  const [commodity,     setCommodity]     = useState(init.commodity      || '');
  const [weight,        setWeight]        = useState(init.weight         ? String(init.weight) : '');
  const [rate,          setRate]          = useState(init.rate           ? String(init.rate)   : '');
  const [estMiles,      setEstMiles]      = useState(init.estimated_miles ? String(init.estimated_miles) : '');
  const [brokerName,    setBrokerName]    = useState(init.broker_name    || '');
  const [brokerMc,      setBrokerMc]      = useState(init.broker_mc      || '');
  const [brokerContact, setBrokerContact] = useState(init.broker_contact || '');
  const [notes,         setNotes]         = useState(init.notes          || '');

  // Coords from autocomplete selection — null means user typed manually
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords,   setDestCoords]   = useState(null);
  const [durationHint, setDurationHint] = useState('');
  const [distLoading,  setDistLoading]  = useState(false);

  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const hasPrefill = Object.keys(prefill).length > 0;

  // ── Auto-fetch distance when both coords are available ─────────────────────
  useEffect(() => {
    if (!originCoords || !destCoords) return;

    let cancelled = false;
    const fetchDist = async () => {
      setDistLoading(true);
      try {
        const data = await api(
          `/maps/distance?origin_lat=${originCoords.lat}&origin_lon=${originCoords.lon}&dest_lat=${destCoords.lat}&dest_lon=${destCoords.lon}`
        );
        if (!cancelled) {
          setEstMiles(String(Math.round(data.distance_miles)));
          setDurationHint(`~${data.duration_text} driving`);
        }
      } catch {
        // fail silently — user can enter miles manually
      } finally {
        if (!cancelled) setDistLoading(false);
      }
    };
    fetchDist();
    return () => { cancelled = true; };
  }, [originCoords, destCoords]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!origin.trim())      { setError('Origin is required.'); return; }
    if (!destination.trim()) { setError('Destination is required.'); return; }
    if (!rate.trim())        { setError('Rate is required.'); return; }

    setSaving(true);
    setError('');
    try {
      const payload = {
        status,
        shipper:         shipper.trim()       || null,
        consignee:       consignee.trim()      || null,
        origin:          origin.trim(),
        destination:     destination.trim(),
        pickup_date:     toISO(pickupDate),
        delivery_date:   toISO(deliveryDate),
        commodity:       commodity.trim()      || null,
        weight:          weight   ? Number(weight)   : null,
        rate:            Number(rate),
        estimated_miles: estMiles ? Number(estMiles) : null,
        broker_name:     brokerName.trim()     || null,
        broker_mc:       brokerMc.trim()       || null,
        broker_contact:  brokerContact.trim()  || null,
        notes:           notes.trim()          || null,
      };

      let result;
      if (mode === 'edit') {
        result = await api(`/my-loads/${existingLoad.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        result = await api('/my-loads', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSave(result);
    } catch (err) {
      setError(err.message || 'Failed to save load.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/my-loads/${existingLoad.id}`, { method: 'DELETE' });
      onSave(null);
    } catch (err) {
      setError(err.message || 'Failed to delete load.');
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      {/* Header */}
      <div className={`pt-12 pb-5 px-5 border-b ${border}`}>
        <button onClick={onCancel} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>
            {mode === 'edit' ? 'EDIT LOAD' : 'NEW LOAD'}
          </h1>
          {hasPrefill && mode === 'create' && (
            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 tracking-wider">
              ✓ AI PRE-FILLED
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 space-y-5">

          {error && (
            <div className="bg-red-600/20 border border-red-600/50 p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className={`block text-xs font-medium mb-2 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>STATUS</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                  className={`py-2.5 text-sm font-semibold tracking-wider border transition-colors ${
                    status === opt.value
                      ? 'bg-red-600 border-red-600 text-white'
                      : `${border} ${subtext} hover:border-red-600/50`
                  }`}>
                  {opt.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Route */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>ROUTE</p>

            <LocationField
              label="ORIGIN"
              value={origin}
              onChange={setOrigin}
              onSelect={s => setOriginCoords({ lat: s.lat, lon: s.lon })}
              onClear={() => { setOriginCoords(null); setDurationHint(''); }}
              isDark={isDark}
              subtext={subtext}
              inputCls={inputCls}
              api={api}
            />

            <LocationField
              label="DESTINATION"
              value={destination}
              onChange={setDestination}
              onSelect={s => setDestCoords({ lat: s.lat, lon: s.lon })}
              onClear={() => { setDestCoords(null); setDurationHint(''); }}
              isDark={isDark}
              subtext={subtext}
              inputCls={inputCls}
              api={api}
            />

            <Field label="ESTIMATED MILES" optional isDark={isDark} subtext={subtext}>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={estMiles}
                  onChange={e => { setEstMiles(e.target.value); setDurationHint(''); }}
                  placeholder="e.g. 850"
                  className={inputCls}
                  min="0"
                />
                {distLoading && (
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {durationHint && (
                <p className={`text-xs mt-1.5 tracking-wide ${subtext}`}>{durationHint}</p>
              )}
            </Field>
          </div>

          {/* Dates */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>DATES & TIMES</p>
            <Field label="PICKUP DATE & TIME" optional isDark={isDark} subtext={subtext}>
              <input type="datetime-local" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="DELIVERY DATE & TIME" optional isDark={isDark} subtext={subtext}>
              <input type="datetime-local" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Rate & Freight */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>RATE & FREIGHT</p>
            <Field label="TOTAL RATE ($)" isDark={isDark} subtext={subtext}>
              <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                placeholder="e.g. 2500" className={inputCls} required min="0" step="0.01" />
            </Field>
            <Field label="COMMODITY" optional isDark={isDark} subtext={subtext}>
              <input type="text" value={commodity} onChange={e => setCommodity(e.target.value)}
                placeholder="e.g. Dry goods, Auto parts" className={inputCls} />
            </Field>
            <Field label="WEIGHT (LBS)" optional isDark={isDark} subtext={subtext}>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 42000" className={inputCls} min="0" />
            </Field>
          </div>

          {/* Shipper & Consignee */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>SHIPPER & CONSIGNEE</p>
            <Field label="SHIPPER" optional isDark={isDark} subtext={subtext}>
              <input type="text" value={shipper} onChange={e => setShipper(e.target.value)}
                placeholder="Company name" className={inputCls} />
            </Field>
            <Field label="CONSIGNEE" optional isDark={isDark} subtext={subtext}>
              <input type="text" value={consignee} onChange={e => setConsignee(e.target.value)}
                placeholder="Company name" className={inputCls} />
            </Field>
          </div>

          {/* Broker */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>BROKER INFO</p>
            <Field label="BROKER NAME" optional isDark={isDark} subtext={subtext}>
              <input type="text" value={brokerName} onChange={e => setBrokerName(e.target.value)}
                placeholder="e.g. Echo Global Logistics" className={inputCls} />
            </Field>
            <Field label="BROKER MC" optional isDark={isDark} subtext={subtext}>
              <input type="text" value={brokerMc} onChange={e => setBrokerMc(e.target.value)}
                placeholder="MC-123456" className={inputCls} />
            </Field>
            <Field label="BROKER CONTACT" optional isDark={isDark} subtext={subtext}>
              <input type="text" value={brokerContact} onChange={e => setBrokerContact(e.target.value)}
                placeholder="Name, phone, or email" className={inputCls} />
            </Field>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              NOTES <span className={`font-normal ${subtext}`}>(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Special instructions, detention info, etc."
              className={`${inputCls} resize-none`} />
          </div>

          {/* Save */}
          <button type="submit" disabled={saving}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-bold py-4 tracking-wider transition-colors">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SAVING...
              </span>
            ) : mode === 'edit' ? 'SAVE CHANGES' : 'CREATE LOAD'}
          </button>

          {/* Delete (edit mode only) */}
          {mode === 'edit' && (
            <div className="pb-6">
              {showDelete ? (
                <div className={`border ${isDark ? 'border-red-600/50 bg-red-600/10' : 'border-red-200 bg-red-50'} p-4 space-y-3`}>
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>Delete this load? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDelete(false)} disabled={deleting}
                      className={`flex-1 border ${border} py-2.5 text-sm tracking-wider ${subtext}`}>
                      CANCEL
                    </button>
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="flex-1 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm py-2.5 tracking-wider">
                      {deleting ? 'DELETING...' : 'CONFIRM DELETE'}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowDelete(true)}
                  className={`w-full text-sm tracking-wider py-3 ${isDark ? 'text-red-500/60 hover:text-red-500' : 'text-red-400 hover:text-red-600'} transition-colors`}>
                  DELETE LOAD
                </button>
              )}
            </div>
          )}

        </div>
      </form>
    </div>
  );
};

export default LoadEntryForm;
