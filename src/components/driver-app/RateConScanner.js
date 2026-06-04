import React, { useState, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';
import { takePhoto, isNative } from '../../lib/native';
import { scanRateCon } from '../../lib/deepseek';

const RateConScanner = ({ onParsed, onCancel }) => {
  const { api, theme, toggleTheme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg       = isDark ? 'bg-black'         : 'bg-white';
  const text     = isDark ? 'text-white'        : 'text-black';
  const subtext  = isDark ? 'text-white/60'     : 'text-black/60';
  const border   = isDark ? 'border-[#262626]'  : 'border-[#e5e5e5]';
  const surface  = isDark ? 'bg-[#0a0a0a]'      : 'bg-[#f5f5f5]';

  const [step, setStep]           = useState('capture');  // 'capture' | 'preview' | 'parsing' | 'result'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile]           = useState(null);
  const [parsed, setParsed]       = useState(null);
  const [parseError, setParseError] = useState('');
  const fileInputRef              = useRef(null);

  const handleCamera = async () => {
    try {
      const { dataUrl, file: photo } = await takePhoto({ source: 'camera' });
      setPreviewUrl(dataUrl);
      setFile(photo);
      setStep('preview');
    } catch (err) {
      if (err.message !== 'cancelled') setParseError('Camera error: ' + err.message);
    }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewUrl(ev.target.result);
      setStep('preview');
    };
    reader.readAsDataURL(f);
  };

  const handleParse = async () => {
    setStep('parsing');
    setParseError('');
    try {
      const result = await scanRateCon(file);
      setParsed(result);
      setStep('result');
    } catch (err) {
      setParseError(err.message || 'Could not parse rate confirmation. Try again or enter manually.');
      setStep('preview');
    }
  };

  // ── Capture ───────────────────────────────────────────────────────────────
  if (step === 'capture') return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className={`pt-12 pb-6 px-5 border-b ${border}`}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCancel} className={`text-base tracking-wider ${subtext}`}>← CANCEL</button>
          <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
        <h1 className={`text-2xl font-bold tracking-wider ${text}`}>SCAN RATE CONFIRMATION</h1>
        <p className={`text-sm mt-1 ${subtext}`}>AI will extract load details automatically</p>
      </div>

      <div className="flex-1 px-5 py-8 space-y-4">
        {/* Camera */}
        <button onClick={handleCamera}
          className={`w-full border-2 ${isDark ? 'border-[#262626] hover:border-red-600/50' : 'border-[#e5e5e5] hover:border-red-600/50'} py-10 flex flex-col items-center gap-3 transition-colors`}>
          <div className="w-14 h-14 bg-red-600/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className={`font-bold tracking-wider text-base ${text}`}>
              {isNative() ? 'TAKE PHOTO' : 'USE CAMERA'}
            </p>
            <p className={`text-sm mt-1 ${subtext}`}>Point camera at your rate con</p>
          </div>
        </button>

        {/* File upload */}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf"
          onChange={handleFileSelect} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 ${isDark ? 'border-[#262626] hover:border-red-600/50' : 'border-[#e5e5e5] hover:border-red-600/50'} py-8 flex flex-col items-center gap-3 transition-colors`}>
          <div className="w-14 h-14 bg-blue-600/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center">
            <p className={`font-bold tracking-wider text-base ${text}`}>UPLOAD FILE</p>
            <p className={`text-sm mt-1 ${subtext}`}>PDF or image from your phone</p>
          </div>
        </button>

        <div className={`${surface} border ${border} p-4 flex gap-3`}>
          <span className="text-xl">✨</span>
          <div>
            <p className={`text-sm font-bold tracking-wider ${text}`}>POWERED BY DEEPSEEK</p>
            <p className={`text-sm mt-1 ${subtext}`}>
              Extracts shipper, consignee, origin, destination, dates, rate, broker info and more — instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Preview ───────────────────────────────────────────────────────────────
  if (step === 'preview') return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className={`pt-12 pb-6 px-5 border-b ${border}`}>
        <button onClick={() => { setStep('capture'); setPreviewUrl(null); setFile(null); }}
          className={`text-base tracking-wider mb-4 block ${subtext}`}>← RETAKE</button>
        <h1 className={`text-2xl font-bold tracking-wider ${text}`}>CONFIRM IMAGE</h1>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5">
        {parseError && (
          <div className="bg-red-600/20 border border-red-600/50 p-4">
            <p className="text-red-400 text-base">{parseError}</p>
          </div>
        )}

        {previewUrl && (
          previewUrl.startsWith('data:application/pdf') || file?.type === 'application/pdf' ? (
            <div className={`${surface} border ${border} p-8 flex flex-col items-center gap-3`}>
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className={`text-base font-bold tracking-wider ${text}`}>{file?.name || 'Rate Confirmation PDF'}</p>
              <p className={`text-sm ${subtext}`}>PDF ready to parse</p>
            </div>
          ) : (
            <img src={previewUrl} alt="Rate confirmation" className="w-full object-contain max-h-72 border border-[#262626]" />
          )
        )}

        <button onClick={handleParse}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 tracking-wider flex items-center justify-center gap-2">
          <span className="text-xl">✨</span>
          PARSE WITH AI
        </button>

        <button onClick={onCancel}
          className={`w-full border ${border} py-3 text-base tracking-wider ${subtext}`}>
          ENTER MANUALLY INSTEAD
        </button>
      </div>
    </div>
  );

  // ── Parsing ───────────────────────────────────────────────────────────────
  if (step === 'parsing') return (
    <div className={`min-h-screen flex flex-col items-center justify-center font-['Barlow_Condensed'] ${bg}`}>
      <div className="w-16 h-16 bg-red-600/20 flex items-center justify-center mb-6 animate-pulse">
        <span className="text-3xl">✨</span>
      </div>
      <h2 className={`text-xl font-bold tracking-wider mb-2 ${text}`}>PARSING RATE CON</h2>
      <p className={`text-base ${subtext}`}>DeepSeek is extracting load details...</p>
      <div className="mt-8 flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 bg-red-600 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  // ── Result preview ────────────────────────────────────────────────────────
  if (step === 'result' && parsed) {
    const fields = [
      { label: 'SHIPPER',          value: parsed.shipper },
      { label: 'CONSIGNEE',        value: parsed.consignee },
      { label: 'ORIGIN',           value: parsed.origin },
      { label: 'DESTINATION',      value: parsed.destination },
      { label: 'PICKUP DATE',      value: parsed.pickup_date },
      { label: 'DELIVERY DATE',    value: parsed.delivery_date },
      { label: 'COMMODITY',        value: parsed.commodity },
      { label: 'WEIGHT',           value: parsed.weight ? `${parsed.weight} lbs` : null },
      { label: 'RATE',             value: parsed.rate ? `$${Number(parsed.rate).toLocaleString()}` : null },
      { label: 'BROKER',           value: parsed.broker_name },
      { label: 'BROKER MC',        value: parsed.broker_mc },
      { label: 'BROKER CONTACT',   value: parsed.broker_contact },
    ].filter(f => f.value);

    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`pt-12 pb-6 px-5 border-b ${border}`}>
          <h1 className={`text-2xl font-bold tracking-wider ${text}`}>REVIEW PARSED DATA</h1>
          <p className={`text-sm mt-1 text-green-400`}>✓ {fields.length} fields extracted — review before saving</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className={`${surface} border ${border} divide-y ${isDark ? 'divide-[#1a1a1a]' : 'divide-[#f0f0f0]'}`}>
            {fields.map(({ label, value }) => (
              <div key={label} className="px-4 py-3 flex justify-between items-start gap-4">
                <span className={`text-sm tracking-wider flex-shrink-0 ${subtext}`}>{label}</span>
                <span className={`text-base text-right ${text}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 mt-5">
            <button onClick={() => onParsed(parsed)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 tracking-wider">
              USE THIS DATA →
            </button>
            <button onClick={() => setStep('capture')}
              className={`w-full border ${border} py-3 text-base tracking-wider ${subtext}`}>
              SCAN AGAIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RateConScanner;
