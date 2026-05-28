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

const STEPS       = ['account', 'info', 'role', 'verify'];
const STEP_TITLES = ['CREATE\nACCOUNT', 'YOUR\nINFO', 'YOUR\nROLE', 'VERIFY\nNUMBER'];

// ── Shared primitives (defined outside to prevent keyboard-dismiss remounts) ──

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

const Input = ({ type = 'text', value, onChange, placeholder, required, min, step: stepProp, minLength, autoComplete }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      required={required} min={min} step={stepProp} minLength={minLength} autoComplete={autoComplete}
      style={inputStyle(focused)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  );
};

const EyeIcon = ({ open }) => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open
      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
    }
  </svg>
);

// ── Main component ────────────────────────────────────────────────────────────
const OpenSignupScreen = ({ onBack }) => {
  const { openSignup, loginWithPhoneRequest } = useDriverApp();

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Step 0 — Create Account
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw,    setShowPw]    = useState(false);

  // Step 1 — Your Info
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [province,  setProvince]  = useState('');

  // Step 2 — Your Role
  const [userType,    setUserType]    = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mcDot,       setMcDot]       = useState('');

  // Step 3 — Verify
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

  const e164Phone = () => `+1${phone.replace(/\D/g, '')}`;

  const goBack = () => { setStep(s => s - 1); setError(''); };

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleAccountNext = (e) => {
    e.preventDefault(); setError('');
    if (!phone.trim()) { setError('Mobile number is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    setStep(1);
  };

  const handleInfoNext = (e) => {
    e.preventDefault(); setError('');
    if (!firstName.trim()) { setError('First name is required.'); return; }
    if (!lastName.trim())  { setError('Last name is required.'); return; }
    if (!email.trim())     { setError('Email address is required.'); return; }
    setStep(2);
  };

  const handleRoleNext = async (e) => {
    e.preventDefault(); setError('');
    if (!userType)           { setError('Please select a role to continue.'); return; }
    if (!companyName.trim()) { setError('Company name is required.'); return; }
    setLoading(true);
    try {
      await loginWithPhoneRequest(e164Phone());
      startResendCooldown();
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter the 6-digit code.'); return; }
    setError(''); setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      // Persist for the YOU'RE IN welcome screen in BusinessSuiteShell
      localStorage.setItem('driver_app_new_signup', JSON.stringify({
        name: fullName, role: userType, province: province.trim() || null,
      }));
      await openSignup({
        userType,
        fullName,
        email: email.trim(),
        phone: e164Phone(),
        password,
        companyName: companyName.trim(),
        mcDotNumber: mcDot.trim() || null,
        logoFile: null,
        otp,
      });
      // openSignup sets auth state → index.js routes to BusinessSuiteShell
      // which reads driver_app_new_signup and shows the welcome screen
    } catch (err) {
      localStorage.removeItem('driver_app_new_signup');
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try { await loginWithPhoneRequest(e164Phone()); startResendCooldown(); }
    catch (err) { setError(err.message || 'Failed to resend code.'); }
    finally { setLoading(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const titleLines = STEP_TITLES[step].split('\n');

  const PrimaryBtn = ({ onClick, disabled, loading: ld, children, type = 'submit' }) => (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ width: '100%', background: disabled ? 'rgba(204,34,34,0.4)' : RED, border: 'none', color: WHT, fontFamily: FD, fontWeight: 800, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '18px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
      {ld ? <><Spinner />{children}</> : children}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: FD }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ padding: '52px 24px 24px' }}>
        <button onClick={step === 0 ? onBack : goBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: RED, fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          BACK
        </button>

        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 52, textTransform: 'uppercase', color: WHT, lineHeight: 0.92, margin: '0 0 8px' }}>
          {titleLines.map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}
        </h1>
        <p style={{ fontFamily: FM, fontSize: 11, color: RED, letterSpacing: '0.16em', margin: '0 0 20px' }}>
          // STEP {String(step + 1).padStart(2, '0')} OF 04
        </p>

        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: i <= step ? RED : '#2A2A2A' }} />
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '8px 24px 40px', overflowY: 'auto' }}>
        <ErrorBox msg={error} />

        {/* ── Step 0: Create Account ── */}
        {step === 0 && (
          <form onSubmit={handleAccountNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label>Mobile Number</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: CARD, border: `1px solid ${BRDR}`, padding: '14px 12px', color: DIM, fontFamily: FB, fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>🇨🇦 +1</div>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="647 844 4618" required autoComplete="tel" />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div style={{ position: 'relative' }}>
                <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: DIM, padding: 0 }}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter password" required />
            </div>
            <PrimaryBtn>CONTINUE</PrimaryBtn>
            <p style={{ fontFamily: FB, fontSize: 13, color: DIM, textAlign: 'center', margin: 0 }}>
              Already have an account?{' '}
              <button type="button" onClick={onBack}
                style={{ background: 'none', border: 'none', color: RED, fontFamily: FD, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, letterSpacing: '0.06em' }}>
                SIGN IN
              </button>
            </p>
          </form>
        )}

        {/* ── Step 1: Your Info ── */}
        {step === 1 && (
          <form onSubmit={handleInfoNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>First Name</Label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="James" required />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Kowalski" required />
              </div>
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="james@email.com" required autoComplete="email" />
            </div>
            <div>
              <Label optional>Province / State</Label>
              <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. Ontario, Alberta" />
            </div>
            <PrimaryBtn>CONTINUE</PrimaryBtn>
          </form>
        )}

        {/* ── Step 2: Your Role ── */}
        {step === 2 && (
          <form onSubmit={handleRoleNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { type: 'owner_operator', label: 'OWNER OPERATOR', desc: 'You own and operate your truck. Manage loads, expenses, and invoices.' },
                { type: 'carrier',        label: 'CARRIER',         desc: 'You run a fleet or brokerage. Manage drivers and business operations.' },
              ].map(({ type, label, desc }) => {
                const sel = userType === type;
                return (
                  <button key={type} type="button" onClick={() => { setUserType(type); setError(''); }}
                    style={{ background: sel ? 'rgba(204,34,34,0.1)' : CARD, border: `1px solid ${sel ? RED : BRDR}`, borderLeft: `3px solid ${sel ? RED : BRDR}`, padding: '16px', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? RED : BRDR}`, background: sel ? RED : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: WHT }} />}
                      </div>
                      <p style={{ fontFamily: FD, fontWeight: 800, fontSize: 16, textTransform: 'uppercase', color: WHT, margin: 0, letterSpacing: '0.06em' }}>{label}</p>
                    </div>
                    <p style={{ fontFamily: FB, fontSize: 12, color: DIM, margin: '0 0 0 26px', lineHeight: 1.5 }}>{desc}</p>
                  </button>
                );
              })}
              <div style={{ background: CARD, border: `1px solid ${BRDR}`, padding: '12px 14px' }}>
                <p style={{ fontFamily: FB, fontSize: 12, color: DIM, margin: 0, lineHeight: 1.5 }}>
                  <span style={{ color: WHT, fontWeight: 600 }}>Company Driver?</span> Ask your dispatcher for an invite link.
                </p>
              </div>
            </div>

            <div>
              <Label>Company Name</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Smith Trucking Inc." required />
            </div>
            <div>
              <Label optional>MC / DOT Number</Label>
              <Input value={mcDot} onChange={e => setMcDot(e.target.value)} placeholder="MC-123456 or USDOT 1234567" />
              <p style={{ fontFamily: FB, fontSize: 12, color: DIM, margin: '6px 0 0' }}>Can be added later in your profile</p>
            </div>

            <PrimaryBtn loading={loading} disabled={loading}>
              {loading ? 'SENDING CODE...' : 'CONTINUE'}
            </PrimaryBtn>
          </form>
        )}

        {/* ── Step 3: Verify ── */}
        {step === 3 && (
          <form onSubmit={handleVerifyAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontFamily: FB, fontSize: 14, color: DIM, margin: '0 0 8px', lineHeight: 1.6 }}>
              We sent a 6-digit code to <span style={{ color: WHT }}>+1 {phone}</span>. Enter it below to complete registration.
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
                  style={{ flex: 1, maxWidth: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700, background: CARD, border: `1px solid ${BRDR}`, color: WHT, outline: 'none', fontFamily: FM }}
                  onFocus={e => { e.target.style.borderColor = RED; }}
                  onBlur={e => { e.target.style.borderColor = BRDR; }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FB, fontSize: 13, color: DIM }}>Didn't receive it?</span>
              {resendCooldown > 0
                ? <span style={{ fontFamily: FM, fontSize: 11, color: DIM }}>Resend in {resendCooldown}s</span>
                : <button type="button" disabled={loading} onClick={handleResend}
                    style={{ background: 'none', border: 'none', color: RED, fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer', padding: 0 }}>
                    RESEND CODE
                  </button>
              }
            </div>

            <PrimaryBtn loading={loading} disabled={loading || otp.length < 6}>
              {loading ? 'CREATING ACCOUNT...' : 'VERIFY & CREATE ACCOUNT'}
            </PrimaryBtn>

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
