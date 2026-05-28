import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';
import { takePhoto, isNative, hapticSuccess, hapticError } from '../../lib/native';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MC = {
  void:  '#030303', deep:  '#080808', plate: '#161616', rivet: '#1F1F1F',
  red: '#CC2222', white: '#EDE9E3', chromeMid: '#999690', chromeDim: '#555250',
  green: '#2DBB62', amber: '#D4921A', blue: '#2277CC',
};
const FD = "'Barlow Condensed', sans-serif";
const FM = "'Share Tech Mono', monospace";
const FB = "'Barlow', sans-serif";

const STATUS_CONFIG = {
  assigned:          { label: 'ASSIGNED',             color: MC.amber,  next: 'en_route_pickup',   nextLabel: 'START ROUTE TO PICKUP'   },
  en_route_pickup:   { label: 'EN ROUTE TO PICKUP',   color: MC.blue,   next: 'arrived_pickup',    nextLabel: 'ARRIVED AT PICKUP'        },
  arrived_pickup:    { label: 'AT PICKUP',            color: MC.amber,  next: 'loaded',            nextLabel: 'LOADED & DEPARTING'       },
  loaded:            { label: 'LOADED',               color: '#5555cc', next: 'en_route_delivery', nextLabel: 'START ROUTE TO DELIVERY'  },
  en_route_delivery: { label: 'EN ROUTE TO DELIVERY', color: MC.blue,   next: 'arrived_delivery',  nextLabel: 'ARRIVED AT DELIVERY'      },
  arrived_delivery:  { label: 'AT DELIVERY',          color: MC.amber,  next: 'delivered',         nextLabel: 'MARK AS DELIVERED'        },
  delivered:         { label: 'DELIVERED',            color: MC.green,  next: null                                                        },
  problem:           { label: 'PROBLEM REPORTED',     color: MC.red,    next: null                                                        },
  failed:            { label: 'FAILED',               color: '#881111', next: null                                                        },
  cancelled:         { label: 'CANCELLED',            color: '#555555', next: null                                                        },
};

const TIME_CAPTURES = {
  arrived_pickup:   { field: 'actual_pickup_in',   label: 'PICKUP IN TIME'    },
  loaded:           { field: 'actual_pickup_out',  label: 'PICKUP OUT TIME'   },
  arrived_delivery: { field: 'actual_delivery_in', label: 'DELIVERY IN TIME'  },
};

const toDatetimeLocal = (date = new Date()) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const formatApiError = (err, fallback) => {
  const msg = err.message || fallback;
  const code = err.status;
  if (!code) return msg;
  if (code === 401 || code === 403) return `${msg} (auth error ${code} — try logging out and back in)`;
  if (code === 404) return `Load not found on server (404) — contact dispatch`;
  if (code === 409) return `${msg} (conflict ${code} — load may already be updated)`;
  if (code >= 500) return `${msg} (server error ${code} — contact dispatch)`;
  return `${msg} [${code}]`;
};

const RouteScreen = ({ load: initialLoad, onBack, onViewMap, onOpenChat, onViewDocs }) => {
  const { api, currentLocation, setActiveLoadId } = useDriverApp();
  const [load, setLoad] = useState(initialLoad);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [showProblem, setShowProblem] = useState(false);
  const [problemNote, setProblemNote] = useState('');

  const [pendingStatus, setPendingStatus] = useState(null);

  const [podStep, setPodStep] = useState(null);
  const [podFile, setPodFile] = useState(null);
  const [podPreviewUrl, setPodPreviewUrl] = useState(null);
  const [podUploaded, setPodUploaded] = useState(false);
  const podInputRef = useRef(null);

  useEffect(() => {
    setActiveLoadId(load.id);
    return () => setActiveLoadId(null);
  }, [load.id, setActiveLoadId]);

  const refreshLoad = async () => {
    try {
      const data = await api(`/loads/${load.id}`);
      setLoad(data);
    } catch (err) {
      console.error('Failed to refresh load:', err);
    }
  };

  const updateStatus = async (newStatus, note = '', extraFields = {}) => {
    setUpdating(true);
    setUpdateError('');
    try {
      await api(`/loads/${load.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          note,
          latitude: currentLocation?.lat,
          longitude: currentLocation?.lng,
          ...extraFields,
        }),
      });
      await refreshLoad();
      setShowProblem(false);
      setProblemNote('');
    } catch (err) {
      hapticError();
      setUpdateError(formatApiError(err, 'Status update failed. Please try again.'));
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusButton = (nextStatus) => {
    const capture = TIME_CAPTURES[nextStatus];
    if (capture) {
      setPendingStatus({ nextStatus, field: capture.field, label: capture.label, timeValue: toDatetimeLocal() });
    } else {
      updateStatus(nextStatus);
    }
  };

  const handleTimeConfirm = async () => {
    if (!pendingStatus) return;
    const { nextStatus, field, timeValue } = pendingStatus;
    const isoTime = new Date(timeValue).toISOString();
    setPendingStatus(null);
    await updateStatus(nextStatus, '', { [field]: isoTime });
  };

  const openPodCamera = async (isRetake = false) => {
    setUpdateError('');
    if (isRetake) setPodUploaded(false);
    if (isNative()) {
      try {
        const { dataUrl, file: photo } = await takePhoto({ source: 'camera' });
        setPodFile(photo);
        setPodPreviewUrl(dataUrl);
        setPodStep('preview');
      } catch { /* user cancelled */ }
    } else {
      podInputRef.current?.click();
    }
  };

  const handlePodFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUpdateError('');
    setPodFile(f);
    setPodPreviewUrl(URL.createObjectURL(f));
    setPodStep('preview');
  };

  const handlePodConfirm = async () => {
    setUpdating(true);
    setUpdateError('');
    if (!podUploaded) {
      try {
        const formData = new FormData();
        formData.append('document', podFile);
        formData.append('document_type', 'proof_of_delivery');
        try {
          await api(`/loads/${load.id}/pod`, { method: 'POST', body: formData });
        } catch {
          await api('/documents/scan', { method: 'POST', body: formData });
        }
        setPodUploaded(true);
      } catch (uploadErr) {
        console.error('POD upload failed, continuing to status update:', uploadErr);
      }
    }
    try {
      await api(`/loads/${load.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'delivered',
          note: 'Delivery confirmed with proof of delivery photo',
          latitude: currentLocation?.lat,
          longitude: currentLocation?.lng,
        }),
      });
      await refreshLoad();
      hapticSuccess();
      setPodStep(null);
      setPodFile(null);
      setPodPreviewUrl(null);
      setPodUploaded(false);
    } catch (err) {
      hapticError();
      setUpdateError(formatApiError(err, 'Could not mark as delivered. Tap RETRY to try again.'));
    } finally {
      setUpdating(false);
    }
  };

  const status = STATUS_CONFIG[load.status] || STATUS_CONFIG.assigned;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatActualTime = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const hasAnyActualTime = load.actual_pickup_in || load.actual_pickup_out || load.actual_delivery_in || load.actual_delivery_out;
  const originCity = load.pickup_city || load.origin_city || 'ORIGIN';
  const destCity   = load.delivery_city || load.destination_city || 'DESTINATION';
  const loadNum    = load.order_number || `LOAD-${load.id?.slice(0, 8).toUpperCase()}`;
  const distKm     = load.estimated_miles ? Math.round(load.estimated_miles * 1.609) : null;
  const ratePerMi  = load.rate && load.estimated_miles ? (load.rate / load.estimated_miles).toFixed(2) : null;

  const Spinner = () => (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );

  return (
    <div style={{ minHeight: '100vh', background: MC.deep, display: 'flex', flexDirection: 'column', fontFamily: FD }}>

      {/* ── Red header bar ── */}
      <div style={{ background: MC.red, padding: '44px 16px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 80, background: 'linear-gradient(270deg, rgba(0,0,0,0.15), transparent)', pointerEvents: 'none' }} />
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FM, fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.65)', marginBottom: 12, padding: 0 }}>
          ← LOADS
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.55)', margin: '0 0 3px' }}>// LOAD DETAIL</p>
            <h1 style={{ fontFamily: FD, fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{loadNum}</h1>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.22)', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.8)' }} />
            <span style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.1em', color: '#fff' }}>{status.label}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>

        {/* Route card */}
        <div style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, padding: '16px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>
            {/* Dot + dashed line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4, minWidth: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: MC.chromeMid, border: `2px solid ${MC.chromeMid}`, flexShrink: 0 }} />
              <div style={{ flex: 1, width: 2, backgroundImage: `repeating-linear-gradient(180deg, ${MC.chromeDim} 0, ${MC.chromeDim} 4px, transparent 4px, transparent 9px)`, minHeight: 36, margin: '5px 0' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: MC.red, border: `2px solid ${MC.red}`, flexShrink: 0 }} />
            </div>

            {/* City + date */}
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: FD, fontSize: 22, fontWeight: 800, color: MC.white, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{originCity}</p>
                <p style={{ fontFamily: FM, fontSize: 9, color: MC.chromeDim, margin: 0, letterSpacing: '0.1em' }}>{formatDateTime(load.pickup_time_planned)}</p>
              </div>
              <div>
                <p style={{ fontFamily: FD, fontSize: 22, fontWeight: 800, color: MC.red, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{destCity}</p>
                <p style={{ fontFamily: FM, fontSize: 9, color: MC.chromeDim, margin: 0, letterSpacing: '0.1em' }}>{formatDateTime(load.delivery_time_planned)}</p>
              </div>
            </div>

            {/* Distance */}
            {distKm && (
              <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontFamily: FD, fontSize: 32, fontWeight: 900, color: MC.white, margin: 0, lineHeight: 1 }}>{distKm}</p>
                <p style={{ fontFamily: FM, fontSize: 8, color: MC.chromeDim, letterSpacing: '0.12em', margin: '3px 0 0', textAlign: 'right' }}>KM</p>
              </div>
            )}
          </div>
        </div>

        {/* Specs grid 2×3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: MC.rivet, border: `1px solid ${MC.rivet}`, marginBottom: 8, overflow: 'hidden' }}>
          {[
            { label: 'COMMODITY',   value: load.commodity || '—' },
            { label: 'WEIGHT',      value: load.weight ? `${Number(load.weight).toLocaleString()} LBS` : '—' },
            { label: 'RATE ALL-IN', value: load.rate ? `$${Number(load.rate).toLocaleString()}` : '—' },
            { label: 'RATE / MILE', value: ratePerMi ? `$${ratePerMi}/MI` : '—' },
            { label: 'TRAILER',     value: load.equipment_type || '—' },
            { label: 'BROKER',      value: load.broker_name || load.shipper || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: MC.plate, padding: '10px 12px' }}>
              <p style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.12em', color: MC.chromeDim, margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: MC.white, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Error banner */}
        {updateError && podStep !== 'preview' && (
          <div style={{ background: 'rgba(204,34,34,0.08)', border: `1px solid rgba(204,34,34,0.35)`, borderLeft: `3px solid ${MC.red}`, padding: '12px 14px', marginBottom: 8 }}>
            <p style={{ fontFamily: FB, fontSize: 13, color: MC.red, margin: '0 0 4px' }}>{updateError}</p>
            <p style={{ fontFamily: FM, fontSize: 9, color: 'rgba(204,34,34,0.55)', margin: 0, letterSpacing: '0.08em' }}>SCREENSHOT & SEND TO DISPATCH — OR USE CHAT BELOW</p>
          </div>
        )}

        {/* Time capture modal */}
        {pendingStatus && (
          <div style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, padding: 16, marginBottom: 8 }}>
            <p style={{ fontFamily: FD, fontSize: 16, fontWeight: 800, color: MC.white, letterSpacing: '0.06em', margin: '0 0 4px', textTransform: 'uppercase' }}>{pendingStatus.label}</p>
            <p style={{ fontFamily: FB, fontSize: 12, color: MC.chromeDim, margin: '0 0 12px' }}>Confirm the actual time. Adjust if needed before recording.</p>
            <input type="datetime-local" value={pendingStatus.timeValue}
              onChange={e => setPendingStatus(prev => ({ ...prev, timeValue: e.target.value }))}
              style={{ width: '100%', background: MC.deep, border: `1px solid ${MC.rivet}`, color: MC.white, fontFamily: FD, fontSize: 14, padding: '12px', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPendingStatus(null)} disabled={updating}
                style={{ flex: 1, background: 'none', border: `1px solid ${MC.rivet}`, color: MC.chromeMid, fontFamily: FD, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', padding: '14px', cursor: 'pointer', opacity: updating ? 0.4 : 1 }}>
                CANCEL
              </button>
              <button onClick={handleTimeConfirm} disabled={updating || !pendingStatus.timeValue}
                style={{ flex: 2, background: (updating || !pendingStatus.timeValue) ? 'rgba(204,34,34,0.45)' : MC.red, border: 'none', color: '#fff', fontFamily: FD, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {updating ? <><Spinner />RECORDING...</> : 'RECORD & CONTINUE'}
              </button>
            </div>
          </div>
        )}

        {/* POD — delivery step */}
        {!pendingStatus && status.next === 'delivered' && load.status !== 'delivered' && load.status !== 'problem' && (
          podStep === null ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ background: 'rgba(212,146,26,0.07)', border: `1px solid rgba(212,146,26,0.3)`, borderLeft: `3px solid ${MC.amber}`, padding: '12px 14px', marginBottom: 8 }}>
                <p style={{ fontFamily: FD, fontSize: 14, fontWeight: 800, color: MC.amber, letterSpacing: '0.08em', margin: '0 0 3px' }}>PROOF OF DELIVERY REQUIRED</p>
                <p style={{ fontFamily: FB, fontSize: 12, color: MC.chromeMid, margin: 0 }}>Photograph the signed delivery receipt before marking as delivered.</p>
              </div>
              <button onClick={() => openPodCamera(false)}
                style={{ width: '100%', background: MC.amber, border: 'none', color: '#fff', fontFamily: FD, fontWeight: 800, fontSize: 14, letterSpacing: '0.12em', padding: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxSizing: 'border-box' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                TAKE POD PHOTO
              </button>
            </div>
          ) : (
            <div style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, padding: 14, marginBottom: 8 }}>
              <p style={{ fontFamily: FD, fontSize: 14, fontWeight: 800, color: MC.white, letterSpacing: '0.08em', margin: '0 0 10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                PROOF OF DELIVERY
                {podUploaded && <span style={{ fontFamily: FM, fontSize: 9, color: MC.green, letterSpacing: '0.1em' }}>✓ UPLOADED</span>}
              </p>
              <img src={podPreviewUrl} alt="Proof of delivery"
                style={{ width: '100%', objectFit: 'cover', border: `1px solid ${MC.rivet}`, maxHeight: 210, marginBottom: 8 }} />
              <p style={{ fontFamily: FB, fontSize: 12, color: MC.chromeDim, margin: '0 0 10px' }}>Make sure the signature and receipt are clearly visible.</p>
              {updateError && (
                <div style={{ background: 'rgba(204,34,34,0.08)', border: `1px solid rgba(204,34,34,0.3)`, padding: '10px 12px', marginBottom: 10 }}>
                  <p style={{ fontFamily: FB, fontSize: 12, color: MC.red, margin: 0 }}>{updateError}</p>
                  {podUploaded && <p style={{ fontFamily: FM, fontSize: 9, color: 'rgba(204,34,34,0.55)', margin: '4px 0 0', letterSpacing: '0.08em' }}>PHOTO ALREADY UPLOADED — TAP RETRY TO CONFIRM</p>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPodStep(null); setPodFile(null); setPodPreviewUrl(null); openPodCamera(true); }} disabled={updating}
                  style={{ flex: 1, background: 'none', border: `1px solid ${MC.rivet}`, color: MC.chromeMid, fontFamily: FD, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', padding: '14px', cursor: 'pointer', opacity: updating ? 0.4 : 1 }}>
                  RETAKE
                </button>
                <button onClick={handlePodConfirm} disabled={updating}
                  style={{ flex: 2, background: updating ? 'rgba(45,187,98,0.45)' : MC.green, border: 'none', color: '#fff', fontFamily: FD, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {updating ? <><Spinner />{podUploaded ? 'CONFIRMING...' : 'UPLOADING...'}</> : (updateError ? 'RETRY' : 'CONFIRM DELIVERY')}
                </button>
              </div>
            </div>
          )
        )}

        {/* Main CTA — UPDATE STATUS / LOG EVENT */}
        {!pendingStatus && status.next && status.next !== 'delivered' && load.status !== 'delivered' && load.status !== 'problem' && (
          <button onClick={() => handleStatusButton(status.next)} disabled={updating}
            style={{ width: '100%', background: updating ? 'rgba(204,34,34,0.45)' : MC.red, border: 'none', color: '#fff', fontFamily: FD, fontWeight: 800, fontSize: 14, letterSpacing: '0.15em', padding: '18px', cursor: updating ? 'not-allowed' : 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxSizing: 'border-box' }}>
            {updating
              ? <><Spinner />UPDATING...</>
              : <><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>UPDATE STATUS / LOG EVENT</>
            }
          </button>
        )}

        {/* Delivered */}
        {load.status === 'delivered' && (
          <div style={{ background: 'rgba(45,187,98,0.07)', border: `1px solid rgba(45,187,98,0.3)`, borderLeft: `3px solid ${MC.green}`, padding: '16px 14px', marginBottom: 8, textAlign: 'center' }}>
            <p style={{ fontFamily: FD, fontSize: 18, fontWeight: 800, color: MC.green, letterSpacing: '0.1em', margin: '0 0 4px' }}>LOAD DELIVERED</p>
            <p style={{ fontFamily: FB, fontSize: 12, color: MC.chromeDim, margin: 0 }}>Great work! This load has been completed.</p>
          </div>
        )}

        {/* VIEW DOCUMENTS */}
        <button onClick={() => onViewDocs?.()}
          style={{ width: '100%', background: MC.plate, border: `1px solid ${MC.rivet}`, color: MC.chromeMid, fontFamily: FD, fontWeight: 700, fontSize: 14, letterSpacing: '0.15em', padding: '16px', cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxSizing: 'border-box' }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          VIEW DOCUMENTS
        </button>

        {/* Problem report */}
        {!pendingStatus && load.status !== 'delivered' && load.status !== 'problem' && (
          !showProblem ? (
            <button onClick={() => setShowProblem(true)}
              style={{ width: '100%', background: 'none', border: `1px solid rgba(204,34,34,0.32)`, color: 'rgba(204,34,34,0.65)', fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', padding: '14px', cursor: 'pointer', marginBottom: 8, boxSizing: 'border-box' }}>
              REPORT A PROBLEM
            </button>
          ) : (
            <div style={{ background: MC.plate, border: `1px solid rgba(204,34,34,0.35)`, padding: 14, marginBottom: 8 }}>
              <p style={{ fontFamily: FD, fontSize: 14, fontWeight: 800, color: MC.white, letterSpacing: '0.06em', margin: '0 0 10px', textTransform: 'uppercase' }}>DESCRIBE THE PROBLEM</p>
              <textarea value={problemNote} onChange={e => setProblemNote(e.target.value)}
                placeholder="What's happening? Include location if relevant..."
                rows={3}
                style={{ width: '100%', background: MC.deep, border: `1px solid ${MC.rivet}`, color: MC.white, fontFamily: FB, fontSize: 13, padding: '12px', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowProblem(false); setProblemNote(''); }}
                  style={{ flex: 1, background: 'none', border: `1px solid ${MC.rivet}`, color: MC.chromeMid, fontFamily: FD, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', padding: '14px', cursor: 'pointer' }}>
                  CANCEL
                </button>
                <button onClick={() => updateStatus('problem', problemNote)} disabled={!problemNote.trim() || updating}
                  style={{ flex: 1, background: (problemNote.trim() && !updating) ? MC.red : 'rgba(204,34,34,0.4)', border: 'none', color: '#fff', fontFamily: FD, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', padding: '14px', cursor: 'pointer' }}>
                  SUBMIT
                </button>
              </div>
            </div>
          )
        )}

        {/* Chat */}
        <button onClick={() => onOpenChat?.(load)}
          style={{ width: '100%', background: 'none', border: `1px solid ${MC.rivet}`, color: MC.chromeDim, fontFamily: FD, fontWeight: 600, fontSize: 13, letterSpacing: '0.12em', padding: '14px', cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          CHAT WITH DISPATCHER
        </button>

        {/* View map */}
        {onViewMap && (
          <button onClick={() => onViewMap()}
            style={{ width: '100%', background: 'none', border: `1px solid ${MC.rivet}`, color: MC.chromeDim, fontFamily: FD, fontWeight: 600, fontSize: 13, letterSpacing: '0.12em', padding: '14px', cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            VIEW ON MAP
          </button>
        )}

        {/* Actual times */}
        {hasAnyActualTime && (
          <div style={{ background: MC.plate, border: `1px solid ${MC.rivet}`, padding: 14 }}>
            <p style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.16em', color: MC.chromeDim, margin: '0 0 10px', textTransform: 'uppercase' }}>// ACTUAL TIMES</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'PICKUP IN',    value: formatActualTime(load.actual_pickup_in)    },
                { label: 'PICKUP OUT',   value: formatActualTime(load.actual_pickup_out)   },
                { label: 'DELIVERY IN',  value: formatActualTime(load.actual_delivery_in)  },
                { label: 'DELIVERY OUT', value: formatActualTime(load.actual_delivery_out) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.1em', color: MC.chromeDim, margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: value ? MC.white : MC.chromeDim, margin: 0 }}>{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden POD file input */}
      <input ref={podInputRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={handlePodFileChange} />
    </div>
  );
};

export default RouteScreen;
