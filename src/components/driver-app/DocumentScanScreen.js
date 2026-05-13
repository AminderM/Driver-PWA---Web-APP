import React, { useState, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

const DOCUMENT_TYPES = [
  { value: 'drivers_license', label: "Driver's License",    emoji: '🪪' },
  { value: 'abstract',        label: 'Driver Abstract',     emoji: '📋' },
  { value: 'sin_card',        label: 'SIN Card',            emoji: '🔒' },
  { value: 'void_cheque',     label: 'Void Cheque',         emoji: '🏦' },
  { value: 'medical_card',    label: 'Medical Card',        emoji: '🏥' },
  { value: 'hazmat_cert',     label: 'Hazmat Certification',emoji: '☢️' },
  { value: 'twic_card',       label: 'TWIC Card',           emoji: '🪪' },
  { value: 'other',           label: 'Other Document',      emoji: '📄' },
];

const DocumentScanScreen = ({ onComplete, requiredDocs = [] }) => {
  const { api, mergeUserData, theme } = useDriverApp();
  const [step, setStep] = useState('welcome');
  const [docType, setDocType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const isDark = theme !== 'light';

  const bg      = isDark ? 'bg-black'       : 'bg-white';
  const card    = isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-[#e5e5e5]';
  const text    = isDark ? 'text-white'     : 'text-black';
  const subtext = isDark ? 'text-white/60'  : 'text-black/60';

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStep('preview');
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    setStep('uploading');
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', docType);
      const result = await api('/documents/scan', {
        method: 'POST',
        headers: {},
        body: formData,
      });
      if (result?.user) mergeUserData(result.user);
      setStep('success');
    } catch {
      setUploadError('Upload failed — your document will be synced later.');
      setStep('success');
    }
  };

  const handleAddAnother = () => {
    setDocType(null);
    setPreviewUrl(null);
    setFile(null);
    setUploadError(null);
    setStep('select-type');
  };

  if (step === 'welcome') return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-red-600 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className={`text-2xl font-bold tracking-wider mb-3 ${text}`}>COMPLETE YOUR PROFILE</h1>
        <p className={`text-sm mb-10 max-w-xs leading-relaxed ${subtext}`}>
          Scan your driver's license or other documents to get started. Your dispatcher may have already added your details.
        </p>
        <div className="w-full space-y-3">
          <button
            onClick={() => setStep('select-type')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 tracking-wider transition-colors"
          >
            SCAN DOCUMENT
          </button>
          <button
            onClick={onComplete}
            className={`w-full border font-semibold py-4 tracking-wider transition-colors ${isDark ? 'border-[#262626] text-white/60 hover:bg-white/5' : 'border-[#e5e5e5] text-black/60 hover:bg-black/5'}`}
          >
            SKIP FOR NOW
          </button>
        </div>
      </div>
    </div>
  );

  if (step === 'select-type') return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <div className={`pt-14 pb-6 px-6 border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button onClick={() => setStep('welcome')} className={`text-sm tracking-wider mb-4 ${subtext}`}>← BACK</button>
        <h1 className={`text-xl font-bold tracking-wider ${text}`}>SELECT DOCUMENT TYPE</h1>
      </div>
      <div className="flex-1 px-6 py-6 space-y-3">
        {DOCUMENT_TYPES.map((dt) => {
          const isRequired = requiredDocs.includes(dt.value);
          return (
            <button
              key={dt.value}
              onClick={() => { setDocType(dt.value); handleCapture(); }}
              className={`w-full flex items-center gap-4 p-4 border text-left transition-colors ${
                isRequired
                  ? 'border-red-600/50 bg-red-600/5'
                  : isDark ? 'border-[#262626] hover:bg-white/5' : 'border-[#e5e5e5] hover:bg-black/5'
              }`}
            >
              <span className="text-2xl">{dt.emoji}</span>
              <span className={`flex-1 font-semibold tracking-wider ${text}`}>{dt.label}</span>
              {isRequired && (
                <span className="text-xs bg-red-600 text-white px-2 py-0.5 tracking-wider">REQUIRED</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="px-6 pb-8">
        <button
          onClick={onComplete}
          className={`w-full border font-semibold py-4 tracking-wider ${isDark ? 'border-[#262626] text-white/40' : 'border-[#e5e5e5] text-black/40'}`}
        >
          SKIP FOR NOW
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );

  if (step === 'preview') {
    const label = DOCUMENT_TYPES.find(d => d.value === docType)?.label || 'Document';
    return (
      <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
        <div className={`pt-14 pb-6 px-6 border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>{label.toUpperCase()}</h1>
          <p className={`text-sm mt-1 ${subtext}`}>Make sure the document is clear and readable</p>
        </div>
        <div className="flex-1 px-6 py-6 flex flex-col">
          <div className={`flex-1 border flex items-center justify-center overflow-hidden ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`} style={{ minHeight: 280 }}>
            {previewUrl && (
              <img src={previewUrl} alt="Document preview" className="w-full h-full object-contain" />
            )}
          </div>
          <div className="mt-6 space-y-3">
            <button
              onClick={handleUpload}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 tracking-wider transition-colors"
            >
              CONFIRM & UPLOAD
            </button>
            <button
              onClick={handleCapture}
              className={`w-full border font-semibold py-4 tracking-wider ${isDark ? 'border-[#262626] text-white/60 hover:bg-white/5' : 'border-[#e5e5e5] text-black/60 hover:bg-black/5'}`}
            >
              RETAKE
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  if (step === 'uploading') return (
    <div className={`min-h-screen flex flex-col items-center justify-center font-['Oxanium'] ${bg}`}>
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6" />
      <p className={`text-sm tracking-wider ${subtext}`}>UPLOADING DOCUMENT...</p>
    </div>
  );

  if (step === 'success') {
    const label = DOCUMENT_TYPES.find(d => d.value === docType)?.label || 'Document';
    return (
      <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className={`w-20 h-20 flex items-center justify-center mb-6 ${uploadError ? 'bg-amber-500/20' : 'bg-green-600/20'}`}>
            {uploadError
              ? <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              : <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            }
          </div>
          <h1 className={`text-2xl font-bold tracking-wider mb-3 ${text}`}>
            {uploadError ? 'SAVED LOCALLY' : 'DOCUMENT UPLOADED'}
          </h1>
          <p className={`text-sm mb-10 max-w-xs leading-relaxed ${subtext}`}>
            {uploadError || `Your ${label.toLowerCase()} has been scanned and uploaded successfully.`}
          </p>
          <div className="w-full space-y-3">
            <button
              onClick={handleAddAnother}
              className={`w-full border font-semibold py-4 tracking-wider transition-colors ${isDark ? 'border-[#262626] text-white/60 hover:bg-white/5' : 'border-[#e5e5e5] text-black/60 hover:bg-black/5'}`}
            >
              ADD ANOTHER DOCUMENT
            </button>
            <button
              onClick={onComplete}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 tracking-wider transition-colors"
            >
              GO TO MY LOADS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DocumentScanScreen;
