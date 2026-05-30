import React, { useState, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';
import { takePhoto, isNative, hapticSuccess } from '../../lib/native';

const ALL_DOC_TYPES = {
  drivers_license:      { value: 'drivers_license',      label: "Driver's License",       emoji: '🪪' },
  abstract:             { value: 'abstract',              label: 'Driver Abstract',         emoji: '📋' },
  sin_card:             { value: 'sin_card',              label: 'SIN Card',                emoji: '🔒' },
  void_cheque:          { value: 'void_cheque',           label: 'Void Cheque',             emoji: '🏦' },
  medical_card:         { value: 'medical_card',          label: 'Medical Card',            emoji: '🏥' },
  hazmat_cert:          { value: 'hazmat_cert',           label: 'Hazmat Certification',    emoji: '☢️' },
  twic_card:            { value: 'twic_card',             label: 'TWIC Card',               emoji: '🪪' },
  vehicle_registration: { value: 'vehicle_registration',  label: 'Vehicle Registration',    emoji: '🚗' },
  cvor_certificate:     { value: 'cvor_certificate',      label: 'CVOR / NSC Certificate',  emoji: '📜' },
  cargo_insurance:      { value: 'cargo_insurance',       label: 'Cargo Insurance',         emoji: '🛡️' },
  liability_insurance:  { value: 'liability_insurance',   label: 'Liability Insurance',     emoji: '🛡️' },
  lease_agreement:      { value: 'lease_agreement',       label: 'Lease Agreement',         emoji: '📝' },
  ifta_license:         { value: 'ifta_license',          label: 'IFTA License',            emoji: '⛽' },
  business_registration:{ value: 'business_registration', label: 'Business Registration',   emoji: '🏢' },
  gst_hst_registration: { value: 'gst_hst_registration',  label: 'GST/HST Registration',   emoji: '📑' },
  operating_authority:  { value: 'operating_authority',   label: 'Operating Authority',     emoji: '⚖️' },
  other:                { value: 'other',                  label: 'Other Document',          emoji: '📄' },
};

const DOC_KEYS_BY_TYPE = {
  driver: [
    'drivers_license', 'abstract', 'sin_card', 'void_cheque',
    'medical_card', 'hazmat_cert', 'twic_card', 'other',
  ],
  owner_operator: [
    'drivers_license', 'abstract', 'sin_card', 'void_cheque',
    'medical_card', 'hazmat_cert', 'twic_card',
    'vehicle_registration', 'cvor_certificate', 'cargo_insurance',
    'liability_insurance', 'lease_agreement', 'ifta_license', 'other',
  ],
  carrier: [
    'cvor_certificate', 'cargo_insurance', 'liability_insurance',
    'business_registration', 'gst_hst_registration', 'operating_authority', 'other',
  ],
};

const getDocumentTypes = (userType) => {
  const keys = DOC_KEYS_BY_TYPE[userType] || DOC_KEYS_BY_TYPE.driver;
  return keys.map(k => ALL_DOC_TYPES[k]);
};

const DocumentScanScreen = ({ onComplete, requiredDocs = [] }) => {
  const { api, mergeUserData, theme, userType } = useDriverApp();
  const [step, setStep] = useState('welcome');
  const [docType, setDocType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const isDark = theme !== 'light';

  const bg      = isDark ? 'bg-black'      : 'bg-white';
  const text    = isDark ? 'text-white'    : 'text-black';
  const subtext = isDark ? 'text-white/60' : 'text-black/60';

  const documentTypes = getDocumentTypes(userType);

  // Web-only fallback handler (native path goes through handleCapture → takePhoto)
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStep('preview');
  };

  const handleCapture = async () => {
    if (isNative()) {
      try {
        const { dataUrl, file: photo } = await takePhoto({ source: 'camera' });
        setFile(photo);
        setPreviewUrl(dataUrl);
        setStep('preview');
      } catch {
        // user cancelled — do nothing
      }
    } else {
      fileInputRef.current?.click();
    }
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
      hapticSuccess();
      setStep('success');
    } catch (err) {
      // C2: show real error with retry — no fake "will sync later" promise
      setUploadError(err.message || 'Upload failed. Please check your connection and try again.');
      setStep('preview'); // return to preview so driver can retry or retake
    }
  };

  const handleAddAnother = () => {
    setDocType(null);
    setPreviewUrl(null);
    setFile(null);
    setUploadError(null);
    setStep('select-type');
  };

  const completeLabel = userType === 'carrier' ? 'GO TO MY FLEET' : 'GO TO MY LOADS';

  if (step === 'welcome') return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-red-600 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className={`text-3xl font-bold tracking-wider mb-3 ${text}`}>COMPLETE YOUR PROFILE</h1>
        <p className={`text-base mb-10 max-w-xs leading-relaxed ${subtext}`}>
          {userType === 'carrier'
            ? 'Upload your business documents to complete your carrier profile.'
            : "Scan your driver's license or other documents to get started."}
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
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className={`pt-14 pb-6 px-6 border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button onClick={() => setStep('welcome')} className={`text-base tracking-wider mb-4 ${subtext}`}>← BACK</button>
        <h1 className={`text-2xl font-bold tracking-wider ${text}`}>SELECT DOCUMENT TYPE</h1>
      </div>
      <div className="flex-1 px-6 py-6 space-y-3">
        {documentTypes.map((dt) => {
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
              <span className="text-3xl">{dt.emoji}</span>
              <span className={`flex-1 font-semibold tracking-wider ${text}`}>{dt.label}</span>
              {isRequired && (
                <span className="text-sm bg-red-600 text-white px-2 py-0.5 tracking-wider">REQUIRED</span>
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
    const label = ALL_DOC_TYPES[docType]?.label || 'Document';
    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`pt-14 pb-6 px-6 border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
          <h1 className={`text-2xl font-bold tracking-wider ${text}`}>{label.toUpperCase()}</h1>
          <p className={`text-base mt-1 ${subtext}`}>Make sure the document is clear and readable</p>
        </div>
        <div className="flex-1 px-6 py-6 flex flex-col">
          <div className={`flex-1 border flex items-center justify-center overflow-hidden ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`} style={{ minHeight: 280 }}>
            {previewUrl && (
              <img src={previewUrl} alt="Document preview" className="w-full h-full object-contain" />
            )}
          </div>
          {uploadError && (
            <div className="mt-4 bg-[#CC2222]/20 border border-[#CC2222]/50 px-4 py-3">
              <p className="text-[#FF5555] text-sm">{uploadError}</p>
            </div>
          )}
          <div className="mt-4 space-y-3">
            <button
              onClick={handleUpload}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-4 tracking-wider transition-colors"
            >
              {uploadError ? 'RETRY UPLOAD' : 'CONFIRM & UPLOAD'}
            </button>
            <button
              onClick={handleCapture}
              className={`w-full border font-semibold py-4 tracking-wider active:opacity-70 ${isDark ? 'border-[#262626] text-white/60 hover:bg-white/5' : 'border-[#e5e5e5] text-black/60 hover:bg-black/5'}`}
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
    <div className={`min-h-screen flex flex-col items-center justify-center font-['Barlow_Condensed'] ${bg}`}>
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6" />
      <p className={`text-base tracking-wider ${subtext}`}>UPLOADING DOCUMENT...</p>
    </div>
  );

  if (step === 'success') {
    const label = ALL_DOC_TYPES[docType]?.label || 'Document';
    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className={`w-20 h-20 flex items-center justify-center mb-6 ${uploadError ? 'bg-amber-500/20' : 'bg-green-600/20'}`}>
            {uploadError
              ? <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              : <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            }
          </div>
          <h1 className={`text-3xl font-bold tracking-wider mb-3 ${text}`}>
            {uploadError ? 'SAVED LOCALLY' : 'DOCUMENT UPLOADED'}
          </h1>
          <p className={`text-base mb-10 max-w-xs leading-relaxed ${subtext}`}>
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
              {completeLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DocumentScanScreen;
