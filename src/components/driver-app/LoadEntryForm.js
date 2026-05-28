import React, { useState } from 'react';
import { useDriverApp } from './DriverAppProvider';

// Defined outside component so React never remounts inputs on state change
const Field = ({ label, children, optional, isDark, subtext }) => (
  <div>
    <label className={`block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
      {label}{optional && <span className={`ml-1 font-normal ${subtext}`}>(optional)</span>}
    </label>
    {children}
  </div>
);

const STATUS_OPTIONS = [
  { value: 'upcoming',   label: 'Upcoming'   },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered',  label: 'Delivered'  },
  { value: 'invoiced',   label: 'Invoiced'   },
];

// Accepts prefill object from rate con parser, or empty for manual entry
// mode: 'create' | 'edit'
// onSave(loadData): called with final form data
// onCancel(): called when user taps back
const LoadEntryForm = ({ prefill = {}, existingLoad = null, onSave, onCancel }) => {
  const { api, theme } = useDriverApp();
  const isDark = theme === 'dark';
  const mode   = existingLoad ? 'edit' : 'create';

  const bg      = isDark ? 'bg-black'         : 'bg-white';
  const text    = isDark ? 'text-white'        : 'text-black';
  const subtext = isDark ? 'text-white/60'     : 'text-black/60';
  const border  = isDark ? 'border-[#262626]'  : 'border-[#e5e5e5]';
  const surface = isDark ? 'bg-[#0a0a0a]'      : 'bg-[#f5f5f5]';
  const inputCls = `w-full border py-3 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-600 ${
    isDark ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/30'
           : 'bg-white border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  const init = existingLoad || prefill;

  const [status,         setStatus]         = useState(init.status         || 'upcoming');
  const [shipper,        setShipper]        = useState(init.shipper        || '');
  const [consignee,      setConsignee]      = useState(init.consignee      || '');
  const [origin,         setOrigin]         = useState(init.origin         || '');
  const [destination,    setDestination]    = useState(init.destination    || '');
  const [pickupDate,     setPickupDate]     = useState(init.pickup_date    ? init.pickup_date.slice(0, 10) : '');
  const [deliveryDate,   setDeliveryDate]   = useState(init.delivery_date  ? init.delivery_date.slice(0, 10) : '');
  const [commodity,      setCommodity]      = useState(init.commodity      || '');
  const [weight,         setWeight]         = useState(init.weight         ? String(init.weight) : '');
  const [rate,           setRate]           = useState(init.rate           ? String(init.rate)   : '');
  const [estMiles,       setEstMiles]       = useState(init.estimated_miles ? String(init.estimated_miles) : '');
  const [brokerName,     setBrokerName]     = useState(init.broker_name    || '');
  const [brokerMc,       setBrokerMc]       = useState(init.broker_mc      || '');
  const [brokerContact,  setBrokerContact]  = useState(init.broker_contact || '');
  const [notes,          setNotes]          = useState(init.notes          || '');

  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,   setError]   = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const hasPrefill = Object.keys(prefill).length > 0;

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
        shipper:        shipper.trim()       || null,
        consignee:      consignee.trim()     || null,
        origin:         origin.trim(),
        destination:    destination.trim(),
        pickup_date:    pickupDate           || null,
        delivery_date:  deliveryDate         || null,
        commodity:      commodity.trim()     || null,
        weight:         weight   ? Number(weight)   : null,
        rate:           Number(rate),
        estimated_miles: estMiles ? Number(estMiles) : null,
        broker_name:    brokerName.trim()    || null,
        broker_mc:      brokerMc.trim()      || null,
        broker_contact: brokerContact.trim() || null,
        notes:          notes.trim()         || null,
      };

      let result;
      if (mode === 'edit') {
        result = await api(`/my-loads/${existingLoad.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        result = await api('/my-loads', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSave(result);
    } catch (err) {
      setError(err.message || 'Failed to save load.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/my-loads/${existingLoad.id}`, { method: 'DELETE' });
      onSave(null); // null signals deletion to parent
    } catch (err) {
      setError(err.message || 'Failed to delete load.');
      setDeleting(false);
    }
  };

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
            <Field label="ORIGIN" isDark={isDark} subtext={subtext}>
              <input type="text" value={origin} onChange={e => setOrigin(e.target.value)}
                placeholder="City, Province/State" className={inputCls} required />
            </Field>
            <Field label="DESTINATION" isDark={isDark} subtext={subtext}>
              <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                placeholder="City, Province/State" className={inputCls} required />
            </Field>
            <Field label="ESTIMATED MILES" optional isDark={isDark} subtext={subtext}>
              <input type="number" value={estMiles} onChange={e => setEstMiles(e.target.value)}
                placeholder="e.g. 850" className={inputCls} min="0" />
            </Field>
          </div>

          {/* Dates */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>DATES</p>
            <Field label="PICKUP DATE" optional isDark={isDark} subtext={subtext}>
              <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="DELIVERY DATE" optional isDark={isDark} subtext={subtext}>
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Rate & Load Details */}
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
