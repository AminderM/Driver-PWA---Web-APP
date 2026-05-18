import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

const STATUS_CONFIG = {
  assigned:          { label: 'ASSIGNED',            color: 'bg-amber-600',  next: 'en_route_pickup',   nextLabel: 'START ROUTE TO PICKUP'   },
  en_route_pickup:   { label: 'EN ROUTE TO PICKUP',  color: 'bg-blue-600',   next: 'arrived_pickup',    nextLabel: 'ARRIVED AT PICKUP'        },
  arrived_pickup:    { label: 'AT PICKUP',           color: 'bg-amber-600',  next: 'loaded',            nextLabel: 'LOADED & DEPARTING'       },
  loaded:            { label: 'LOADED',              color: 'bg-indigo-600', next: 'en_route_delivery', nextLabel: 'START ROUTE TO DELIVERY'  },
  en_route_delivery: { label: 'EN ROUTE TO DELIVERY',color: 'bg-blue-600',   next: 'arrived_delivery',  nextLabel: 'ARRIVED AT DELIVERY'      },
  arrived_delivery:  { label: 'AT DELIVERY',         color: 'bg-amber-600',  next: 'delivered',         nextLabel: 'MARK AS DELIVERED'        },
  delivered:         { label: 'DELIVERED',           color: 'bg-green-600',  next: null                                                        },
  problem:           { label: 'PROBLEM REPORTED',    color: 'bg-red-600',    next: null                                                        },
};

const RouteScreen = ({ load: initialLoad, onBack, onViewMap, onOpenChat }) => {
  const { api, theme, currentLocation, setActiveLoadId } = useDriverApp();
  const [load, setLoad] = useState(initialLoad);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [showProblem, setShowProblem] = useState(false);
  const [problemNote, setProblemNote] = useState('');

  // POD (Proof of Delivery) state
  const [podStep, setPodStep] = useState(null); // null | 'preview'
  const [podFile, setPodFile] = useState(null);
  const [podPreviewUrl, setPodPreviewUrl] = useState(null);
  const podInputRef = useRef(null);

  const isDark = theme === 'dark';
  const bg     = isDark ? 'bg-black'  : 'bg-white';
  const text   = isDark ? 'text-white' : 'text-black';
  const sub    = isDark ? 'text-white/60' : 'text-black/60';
  const card   = isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]';
  const border = isDark ? 'border-[#262626]' : 'border-[#e5e5e5]';

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

  const updateStatus = async (newStatus, note = '') => {
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
        }),
      });
      await refreshLoad();
      setShowProblem(false);
      setProblemNote('');
    } catch (err) {
      setUpdateError(err.message || 'Status update failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // POD handlers
  const handlePodFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPodFile(f);
    setPodPreviewUrl(URL.createObjectURL(f));
    setPodStep('preview');
  };

  const handlePodConfirm = async () => {
    setUpdating(true);
    setUpdateError('');
    try {
      // Upload the POD photo
      const formData = new FormData();
      formData.append('document', podFile);
      formData.append('document_type', 'proof_of_delivery');
      try {
        await api(`/loads/${load.id}/pod`, { method: 'POST', headers: {}, body: formData });
      } catch {
        // Fallback: upload via general documents endpoint
        await api('/documents/scan', { method: 'POST', headers: {}, body: formData });
      }
      // Mark as delivered
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
      setPodStep(null);
      setPodFile(null);
      setPodPreviewUrl(null);
    } catch (err) {
      setUpdateError(err.message || 'Failed to submit delivery. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const status = STATUS_CONFIG[load.status] || STATUS_CONFIG.assigned;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center gap-3 border-b ${border}`}>
        <button onClick={onBack} className={`w-10 h-10 flex items-center justify-center ${text}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className={`text-lg font-bold tracking-wider ${text}`}>
            {load.order_number || `LD-${load.id?.slice(0, 8).toUpperCase()}`}
          </h1>
          <span className={`${status.color} text-white text-xs px-2 py-0.5 tracking-wider`}>
            {status.label}
          </span>
        </div>
        {/* Chat button */}
        <button
          onClick={() => onOpenChat?.(load)}
          className="w-10 h-10 flex items-center justify-center border border-red-600/50 text-red-500 hover:bg-red-600/10 transition-colors"
          title="Chat with dispatcher"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Route Summary */}
        <div className={`border p-4 ${card}`}>
          <div className="flex items-start gap-3 mb-4">
            <div className="flex flex-col items-center pt-1">
              <div className="w-4 h-4 bg-green-600" />
              <div className="w-0.5 h-12 bg-gradient-to-b from-green-600 to-red-600 mt-1" />
            </div>
            <div>
              <p className="text-green-500 text-xs tracking-wider mb-0.5">PICKUP</p>
              <p className={`font-semibold text-sm ${text}`}>{load.pickup_location || load.origin_address || 'Address TBD'}</p>
              <p className={`text-sm ${sub}`}>{load.pickup_city || load.origin_city}, {load.pickup_state || load.origin_state}</p>
              <p className={`text-xs mt-1 ${sub}`}>{formatDateTime(load.pickup_time_planned)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 bg-red-600 mt-1" />
            <div>
              <p className="text-red-500 text-xs tracking-wider mb-0.5">DELIVERY</p>
              <p className={`font-semibold text-sm ${text}`}>{load.delivery_location || load.destination_address || 'Address TBD'}</p>
              <p className={`text-sm ${sub}`}>{load.delivery_city || load.destination_city}, {load.delivery_state || load.destination_state}</p>
              <p className={`text-xs mt-1 ${sub}`}>{formatDateTime(load.delivery_time_planned)}</p>
            </div>
          </div>
        </div>

        {/* Load Details */}
        <div className={`border p-4 ${card}`}>
          <p className={`text-xs tracking-wider mb-3 ${sub}`}>LOAD INFO</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {load.equipment_type && (
              <div>
                <p className={`text-xs ${sub}`}>Equipment</p>
                <p className={`font-medium ${text}`}>{load.equipment_type}</p>
              </div>
            )}
            {load.weight && (
              <div>
                <p className={`text-xs ${sub}`}>Weight</p>
                <p className={`font-medium ${text}`}>{Number(load.weight).toLocaleString()} lbs</p>
              </div>
            )}
            {load.estimated_miles && (
              <div>
                <p className={`text-xs ${sub}`}>Distance</p>
                <p className={`font-medium ${text}`}>{load.estimated_miles} mi</p>
              </div>
            )}
            {load.rate && (
              <div>
                <p className={`text-xs ${sub}`}>Pay</p>
                <p className="font-medium text-green-500">${Number(load.rate).toLocaleString()}</p>
              </div>
            )}
            {load.commodity && (
              <div className="col-span-2">
                <p className={`text-xs ${sub}`}>Commodity</p>
                <p className={`font-medium ${text}`}>{load.commodity}</p>
              </div>
            )}
          </div>
        </div>

        {/* Map button */}
        {onViewMap && (
          <button
            onClick={() => onViewMap()}
            className={`w-full py-3 flex items-center justify-center gap-2 border transition-colors tracking-wider text-sm ${
              isDark
                ? 'bg-[#0a0a0a] border-[#262626] text-white hover:bg-[#171717]'
                : 'bg-white border-[#e5e5e5] text-black hover:bg-[#f5f5f5]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            VIEW ON MAP
          </button>
        )}

        {/* Error */}
        {updateError && (
          <div className="bg-red-600/20 border border-red-600/50 px-4 py-3">
            <p className="text-red-500 text-sm">{updateError}</p>
          </div>
        )}

        {/* ── Status CTA ─────────────────────────────────────────── */}
        {status.next && load.status !== 'delivered' && load.status !== 'problem' && (
          status.next === 'delivered' ? (
            // POD capture required before marking delivered
            podStep === null ? (
              <div>
                <div className="bg-amber-600/20 border border-amber-600/50 px-4 py-3 mb-3">
                  <p className="text-amber-500 text-sm tracking-wider font-semibold">PROOF OF DELIVERY REQUIRED</p>
                  <p className={`text-xs mt-1 ${sub}`}>You must photograph the signed delivery receipt before marking as delivered.</p>
                </div>
                <button
                  onClick={() => podInputRef.current?.click()}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  TAKE POD PHOTO
                </button>
              </div>
            ) : (
              // POD preview + confirm
              <div className={`border p-4 space-y-3 ${card}`}>
                <p className={`text-sm font-semibold tracking-wider ${text}`}>PROOF OF DELIVERY</p>
                <img
                  src={podPreviewUrl}
                  alt="Proof of delivery"
                  className={`w-full object-cover border ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}
                  style={{ maxHeight: 220 }}
                />
                <p className={`text-xs ${sub}`}>Make sure the delivery receipt and signature are clearly visible.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPodStep(null); setPodFile(null); setPodPreviewUrl(null); podInputRef.current?.click(); }}
                    disabled={updating}
                    className={`flex-1 border py-3 text-sm tracking-wider disabled:opacity-40 ${
                      isDark ? 'border-[#262626] text-white/60' : 'border-[#e5e5e5] text-black/60'
                    }`}
                  >
                    RETAKE
                  </button>
                  <button
                    onClick={handlePodConfirm}
                    disabled={updating}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white py-3 text-sm tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        SUBMITTING...
                      </>
                    ) : 'CONFIRM DELIVERY'}
                  </button>
                </div>
              </div>
            )
          ) : (
            // Regular status update
            <button
              onClick={() => updateStatus(status.next)}
              disabled={updating}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  UPDATING...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {status.nextLabel}
                </>
              )}
            </button>
          )
        )}

        {/* Delivered confirmation */}
        {load.status === 'delivered' && (
          <div className="bg-green-600/20 border border-green-600/50 px-4 py-4 text-center">
            <p className="text-green-500 font-bold tracking-wider">LOAD DELIVERED</p>
            <p className={`text-sm mt-1 ${sub}`}>Great work! This load has been completed.</p>
          </div>
        )}

        {/* Problem Report */}
        {load.status !== 'delivered' && load.status !== 'problem' && (
          !showProblem ? (
            <button
              onClick={() => setShowProblem(true)}
              className={`w-full border py-3 text-sm tracking-wider transition-colors ${
                isDark
                  ? 'border-red-600/40 text-red-500 hover:bg-red-600/10'
                  : 'border-red-400/40 text-red-500 hover:bg-red-50'
              }`}
            >
              REPORT A PROBLEM
            </button>
          ) : (
            <div className={`border p-4 ${isDark ? 'bg-[#0a0a0a] border-red-600/50' : 'bg-white border-red-400/50'}`}>
              <p className={`text-sm tracking-wider mb-3 ${text}`}>DESCRIBE THE PROBLEM</p>
              <textarea
                value={problemNote}
                onChange={e => setProblemNote(e.target.value)}
                placeholder="What's happening? Include location if relevant..."
                className={`w-full border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-none mb-3 ${
                  isDark
                    ? 'bg-[#171717] border-[#262626] text-white placeholder-white/30'
                    : 'bg-[#f5f5f5] border-[#e5e5e5] text-black placeholder-black/30'
                }`}
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowProblem(false); setProblemNote(''); }}
                  className={`flex-1 border py-3 text-sm tracking-wider ${
                    isDark ? 'border-[#262626] text-white/60' : 'border-[#e5e5e5] text-black/60'
                  }`}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => updateStatus('problem', problemNote)}
                  disabled={!problemNote.trim() || updating}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/40 text-white py-3 text-sm tracking-wider"
                >
                  SUBMIT
                </button>
              </div>
            </div>
          )
        )}

        {/* Chat CTA */}
        <button
          onClick={() => onOpenChat?.(load)}
          className={`w-full py-3 flex items-center justify-center gap-2 border transition-colors tracking-wider text-sm mb-6 ${
            isDark
              ? 'border-[#262626] text-white/60 hover:bg-[#171717]'
              : 'border-[#e5e5e5] text-black/60 hover:bg-[#f5f5f5]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          CHAT WITH DISPATCHER
        </button>
      </div>

      {/* Hidden POD file input */}
      <input
        ref={podInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePodFileChange}
      />
    </div>
  );
};

export default RouteScreen;
