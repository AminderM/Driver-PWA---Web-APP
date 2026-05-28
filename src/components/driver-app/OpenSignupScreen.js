import React, { useState, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG   = '#0D0D0D';
const CARD = '#161616';
const BRDR = '#2A2A2A';
const RED  = '#CC2222';
const WHT  = '#FFFFFF';
const DIM  = 'rgba(255,255,255,0.45)';
const FD   = "'Barlow Condensed', sans-serif";
const FM   = "'Share Tech Mono', monospace";
const FB   = "'Barlow', sans-serif";

const STEPS = ['role', 'personal', 'business', 'verify'];
const STEP_TITLES  = ['CHOOSE\nROLE',   'YOUR\nINFO',     'BUSINESS\nINFO', 'VERIFY'];
const STEP_BUTTONS = ['CONTINUE',       'CONTINUE',        'CONTINUE',       'VERIFY & CREATE ACCOUNT'];

// ── Shared primitives ─────────────────────────────────────────────────────────

const inputStyle = (focused) => ({
  width: '100%', background: CARD, border: `1px solid ${focused ? RED : BRDR}`,
  color: WHT, fontFamily: FB, fontSize: 15, padding: '14px 14px',
  outline: 'none', boxSizing: 'border-box',
});

const Spinner = () => (
  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: WHT, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
);

const Label = ({ children, optional }) => (
  <p style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: DIM, textTransform: 'uppercase', margin: '0 0 6px' }}>
    {children}{optional && <span style={{ fontWeight: 400, marginLeft: 6, color: 'rgba(255,255,255,0.25)' }}>(optional)</span>}
  </p>
);

const ErrorBox = ({ msg }) => msg ? (
  <div style={{ background: 'rgba(204,34,34,0.15)', border: `1px solid rgba(204,34,34,0.4)`, padding: '12px 14px', marginBottom: 16 }}>
    <p style={{ fontFamily: FB, fontSize: 13, color: '#FF5555', margin: 0 }}>{msg}</p>
  </div>
) : null;

// Controlled input with focus-state red border
const Input = ({ type = 'text', value, onChange, placeholder, required, min, step: stepProp, minLength, accept }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      required={required} min={min} step={stepProp} minLength={minLength} accept={accept}
      style={inputStyle(focused)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const OpenSignupScreen = ({ onBack }) => {
  const { openSignup, loginWithPhoneRequest } = useDriverApp();

  const [step,     setStep]     = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Form data
  const [userType,     setUserType]     = useState('');
  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [companyName,  setCompanyName]  = useState('');
  const [mcDot,        setMcDot]        = useState('');
  const [logoFile,     setLogoFile]     = useState(null);
  const [logoPreview,  setLogoPreview]  = useState(null);
  const logoInputRef                    = useRef(null);

  // OTP
  const [otp,            setOtp]            = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef                         = useRef(null);

  const startResendCooldown = () => {
    setResendCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRoleSelect = (type) => { setUserType(type); setError(''); setStep(1); };

  const handlePersonalNext = async (e) => {
    e.preventDefault(); setError('');
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return; }
    setStep(2);
  };

  const handleBusinessNext = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await loginWithPhoneRequest(phone); startResendCooldown(); setStep(3); }
    catch (err) { setError(err.message || 'Failed to send verification code.'); }
    finally { setLoading(false); }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter the 6-digit code.'); return; }
    setError(''); setLoading(true);
    try {
      await openSignup({ userType, fullName: fullName.trim(), email: email.trim(), phone, password, companyName: companyName.trim(), mcDotNumber: mcDot.trim() || null, logoFile, otp });
    } catch (err) { setError(err.message || 'Registration failed. Please try again.'); setLoading(false); }
  };

  // ── Layout ────────────────────────────────────────────────────────────────

  const titleLines = STEP_TITLES[step].split('\n');

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: FD }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ padding: '52px 24px 24px' }}>
        <button onClick={step === 0 ? onBack : () => { setStep(s => s - 1); setError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: RED, fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          BACK
        </button>

        {/* Big stacked title */}
        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 52, textTransform: 'uppercase', color: WHT, lineHeight: 0.92, margin: '0 0 8px' }}>
          {titleLines.map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}
        </h1>
        <p style={{ fontFamily: FM, fontSize: 11, color: RED, letterSpacing: '0.16em', margin: '0 0 20px' }}>
          // STEP {String(step + 1).padStart(2, '0')} OF 04
        </p>

        {/* 4-segment progress bar */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: i <= step ? RED : '#2A2A2A' }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '8px 24px 32px', overflowY: 'auto' }}>
        <ErrorBox msg={error} />

        {/* ── Step 0: Choose Role ─────────────────────────────────────────── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { type: 'owner_operator', label: 'OWNER OPERATOR', desc: 'You own and operate your truck. Manage loads, expenses, invoices, and documents.' },
              { type: 'carrier', label: 'CARRIER', desc: 'You run a fleet or brokerage. Receive loads from brokers and manage your business.' },
            ].map(({ type, label, desc }) => (
              <button key={type} onClick={() => handleRoleSelect(type)}
                style={{ background: userType === type ? 'rgba(204,34,34,0.1)' : CARD, border: `1px solid ${userType === type ? RED : BRDR}`, borderLeft: `3px solid ${userType === type ? RED : BRDR}`, padding: '18px 16px', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                <p style={{ fontFamily: FD, fontWeight: 800, fontSize: 18, textTransform: 'uppercase', color: WHT, margin: '0 0 6px', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ fontFamily: FB, fontSize: 13, color: DIM, margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </button>
            ))}
            <div style={{ background: CARD, border: `1px solid ${BRDR}`, padding: '14px 16px', marginTop: 8 }}>
              <p style={{ fontFamily: FB, fontSize: 13, color: DIM, margin: 0, lineHeight: 1.5 }}>
                <span style={{ color: WHT, fontWeight: 600 }}>Company Driver?</span> You don't sign up here — ask your dispatcher for an invite link.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 1: Personal Info ────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handlePersonalNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>First Name</Label>
                <Input value={fullName.split(' ')[0] || ''} onChange={e => setFullName(e.target.value + ' ' + (fullName.split(' ').slice(1).join(' ') || '').trim())} placeholder="James" required />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={fullName.split(' ').slice(1).join(' ')} onChange={e => setFullName((fullName.split(' ')[0] || '') + ' ' + e.target.value)} placeholder="Kowalski" required />
              </div>
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="james@gmail.com" required />
            </div>
            <div>
              <Label>Mobile Number</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: CARD, border: `1px solid ${BRDR}`, padding: '14px 12px', color: DIM, fontFamily: FB, fontSize: 14, whiteSpace: 'nowrap' }}>🇨🇦 +1</div>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="647 844 4618" required />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div style={{ position: 'relative' }}>
                <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: DIM, padding: 0 }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPw
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter password" required />
            </div>
            <button type="submit"
              style={{ width: '100%', background: RED, border: 'none', color: WHT, fontFamily: FD, fontWeight: 800, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '18px', cursor: 'pointer', marginTop: 4 }}>
              CONTINUE
            </button>
          </form>
        )}

        {/* ── Step 2: Business Info ────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleBusinessNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label>Company Name</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Smith Trucking Inc." required />
            </div>
            <div>
              <Label optional>MC / DOT Number</Label>
              <Input value={mcDot} onChange={e => setMcDot(e.target.value)} placeholder="MC-123456 or USDOT 1234567" />
              <p style={{ fontFamily: FB, fontSize: 12, color: DIM, margin: '6px 0 0' }}>Required for invoicing — can be added later in profile</p>
            </div>
            <div>
              <Label optional>Company Logo</Label>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: 'none' }} />
              {logoPreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={logoPreview} alt="Logo" style={{ width: 56, height: 56, objectFit: 'cover', border: `1px solid ${BRDR}` }} />
                  <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    style={{ background: 'none', border: 'none', color: DIM, fontFamily: FB, fontSize: 13, cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  style={{ width: '100%', background: 'none', border: `2px dashed ${BRDR}`, color: DIM, fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '24px', cursor: 'pointer', boxSizing: 'border-box' }}>
                  TAP TO UPLOAD LOGO
                </button>
              )}
              <p style={{ fontFamily: FB, fontSize: 12, color: DIM, margin: '6px 0 0' }}>Used on invoice letterhead</p>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? 'rgba(204,34,34,0.4)' : RED, border: 'none', color: WHT, fontFamily: FD, fontWeight: 800, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '18px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              {loading ? <><Spinner />SENDING CODE...</> : 'CONTINUE'}
            </button>
          </form>
        )}

        {/* ── Step 3: Verify OTP ───────────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleVerifyAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontFamily: FB, fontSize: 14, color: DIM, margin: '0 0 8px', lineHeight: 1.6 }}>
              We sent a 6-digit code to <span style={{ color: WHT }}>{phone}</span>. Enter it below to complete registration.
            </p>

            {/* OTP boxes */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <input key={i} id={`signup-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                  value={otp[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const arr = otp.split(''); arr[i] = val;
                    setOtp(arr.join('').slice(0, 6));
                    if (val && i < 5) document.getElementById(`signup-otp-${i + 1}`)?.focus();
                  }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`signup-otp-${i - 1}`)?.focus(); }}
                  style={{ width: 44, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700, background: CARD, border: `1px solid ${BRDR}`, color: WHT, outline: 'none', fontFamily: FM }}
                  onFocus={e => { e.target.style.borderColor = RED; }}
                  onBlur={e => { e.target.style.borderColor = BRDR; }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FB, fontSize: 13, color: DIM }}>Didn't receive it?</span>
              {resendCooldown > 0
                ? <span style={{ fontFamily: FB, fontSize: 13, color: DIM }}>Resend in {resendCooldown}s</span>
                : <button type="button" disabled={loading}
                    onClick={async () => { setLoading(true); try { await loginWithPhoneRequest(phone); startResendCooldown(); } catch (err) { setError(err.message); } finally { setLoading(false); } }}
                    style={{ background: 'none', border: 'none', color: RED, fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer', padding: 0 }}>
                    RESEND CODE
                  </button>
              }
            </div>

            <button type="submit" disabled={loading || otp.length < 6}
              style={{ width: '100%', background: loading || otp.length < 6 ? 'rgba(204,34,34,0.4)' : RED, border: 'none', color: WHT, fontFamily: FD, fontWeight: 800, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '18px', cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              {loading ? <><Spinner />CREATING ACCOUNT...</> : 'VERIFY & CREATE ACCOUNT'}
            </button>

            <p style={{ fontFamily: FB, fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.5 }}>
              By registering you agree to our{' '}
              <span style={{ color: DIM, textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ color: DIM, textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default OpenSignupScreen;
