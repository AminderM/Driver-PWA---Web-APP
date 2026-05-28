import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';
import OpenSignupScreen from './OpenSignupScreen';

const DEV_MODE = process.env.NODE_ENV === 'development';
const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

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

// ── Shared components ─────────────────────────────────────────────────────────

const HexLogo = () => (
  <div style={{
    width: 68, height: 68,
    clipPath: 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
    background: RED,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <span style={{ fontFamily: FD, fontWeight: 900, fontSize: 24, color: WHT, letterSpacing: '0.04em' }}>IA</span>
  </div>
);

const Spinner = () => (
  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: WHT, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
);

const inputStyle = {
  width: '100%', background: CARD, border: `1px solid ${BRDR}`,
  color: WHT, fontFamily: FB, fontSize: 15, padding: '14px 14px',
  outline: 'none', boxSizing: 'border-box',
};

const BackBtn = ({ onClick, label = 'BACK' }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: RED, fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    {label}
  </button>
);

const PrimaryBtn = ({ children, disabled, onClick, type = 'button' }) => (
  <button type={type} onClick={onClick} disabled={disabled}
    style={{ width: '100%', background: disabled ? 'rgba(204,34,34,0.4)' : RED, border: 'none', color: WHT, fontFamily: FD, fontWeight: 800, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '18px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
    {children}
  </button>
);

const SecondaryBtn = ({ children, onClick }) => (
  <button type="button" onClick={onClick}
    style={{ width: '100%', background: 'transparent', border: `1px solid ${BRDR}`, color: DIM, fontFamily: FD, fontWeight: 700, fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '17px', cursor: 'pointer' }}>
    {children}
  </button>
);

const ErrorBox = ({ msg }) => msg ? (
  <div style={{ background: 'rgba(204,34,34,0.15)', border: `1px solid rgba(204,34,34,0.4)`, padding: '12px 14px', marginBottom: 16 }}>
    <p style={{ fontFamily: FB, fontSize: 13, color: '#FF5555', margin: 0 }}>{msg}</p>
  </div>
) : null;

const Label = ({ children }) => (
  <p style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: DIM, textTransform: 'uppercase', margin: '0 0 6px' }}>{children}</p>
);

// ── Main component ────────────────────────────────────────────────────────────
const DriverLogin = () => {
  const { login, loginWithPhoneRequest, loginWithPhoneVerify, loginWithGoogle, theme, devLogin } = useDriverApp();

  const [step,       setStep]       = useState('splash');
  const [loginTab,   setLoginTab]   = useState('email');
  const [showRegister, setShowRegister] = useState(false);

  // Email login
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError,   setEmailError]   = useState('');

  // Phone login
  const [phone,          setPhone]          = useState('');
  const [otp,            setOtp]            = useState('');
  const [phoneStep,      setPhoneStep]      = useState('enter_phone');
  const [phoneLoading,   setPhoneLoading]   = useState(false);
  const [phoneError,     setPhoneError]     = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // Google
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError,   setGoogleError]   = useState('');
  const googleBtnRef = useRef(null);

  // Forgot password
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError,   setForgotError]   = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== 'login') return;
    const scriptId = 'google-gis-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId; s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    }
  }, [step]);

  const handleGoogleSignIn = () => {
    if (!window.google?.accounts?.id) { setGoogleError('Google sign-in not available.'); return; }
    setGoogleLoading(true); setGoogleError('');
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        try { await loginWithGoogle(credential); }
        catch (err) { setGoogleError(err.message || 'Google sign-in failed.'); setGoogleLoading(false); }
      },
      auto_select: false,
    });
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'filled_black', size: 'large', width: '100%' });
        setGoogleLoading(false);
      }
    });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault(); setEmailLoading(true); setEmailError('');
    try { await login(email, password); }
    catch (err) { setEmailError(err.message || 'Login failed'); }
    finally { setEmailLoading(false); }
  };

  const startResendCooldown = () => {
    setResendCooldown(60); clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleSendCode = async (e) => {
    e.preventDefault(); setPhoneLoading(true); setPhoneError('');
    try { await loginWithPhoneRequest(phone); setPhoneStep('enter_otp'); startResendCooldown(); }
    catch (err) { setPhoneError(err.message || 'Failed to send code.'); }
    finally { setPhoneLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setPhoneLoading(true); setPhoneError('');
    try { await loginWithPhoneVerify(phone, otp); }
    catch (err) { setPhoneError(err.message || 'Invalid or expired code.'); }
    finally { setPhoneLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(`${BACKEND}/api/driver-mobile/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Something went wrong.'); }
      setStep('sent');
    } catch (err) { setForgotError(err.message || 'Something went wrong.'); }
    finally { setForgotLoading(false); }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  if (showRegister) return <OpenSignupScreen onBack={() => setShowRegister(false)} />;

  // ── Shared screen wrapper ──────────────────────────────────────────────────
  const Screen = ({ children }) => (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: FD, overflowX: 'hidden' }}>
      {children}
    </div>
  );

  // ── Forgot password ────────────────────────────────────────────────────────
  if (step === 'forgot') return (
    <Screen>
      <div style={{ padding: '52px 24px 24px' }}>
        <BackBtn onClick={() => setStep('login')} label="SIGN IN" />
        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 48, textTransform: 'uppercase', color: WHT, lineHeight: 1, margin: '20px 0 4px' }}>FORGOT<br />PASSWORD</h1>
        <p style={{ fontFamily: FM, fontSize: 11, color: RED, letterSpacing: '0.16em', margin: '0 0 32px' }}>// RESET ACCESS</p>
        <ErrorBox msg={forgotError} />
        <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label>Email Address</Label>
            <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
              placeholder="driver@company.com" style={inputStyle} required
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e => e.target.style.borderColor = BRDR} />
          </div>
          <PrimaryBtn type="submit" disabled={forgotLoading}>
            {forgotLoading ? <><Spinner />SENDING...</> : 'SEND RESET LINK'}
          </PrimaryBtn>
        </form>
      </div>
    </Screen>
  );

  // ── Email sent ─────────────────────────────────────────────────────────────
  if (step === 'sent') return (
    <Screen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'rgba(45,187,98,0.15)', border: '1px solid rgba(45,187,98,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="32" height="32" fill="none" stroke="#2DBB62" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 style={{ fontFamily: FD, fontWeight: 900, fontSize: 36, textTransform: 'uppercase', color: WHT, margin: '0 0 12px' }}>CHECK YOUR EMAIL</h2>
        <p style={{ fontFamily: FB, fontSize: 14, color: DIM, margin: '0 0 40px', lineHeight: 1.6, maxWidth: 280 }}>
          If that email is registered, a reset link has been sent. Check your inbox.
        </p>
        <PrimaryBtn onClick={() => setStep('login')}>BACK TO SIGN IN</PrimaryBtn>
      </div>
    </Screen>
  );

  // ── Splash ─────────────────────────────────────────────────────────────────
  if (step === 'splash') return (
    <Screen>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Diagonal panel */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-30%', right: '-30%', height: '55%', background: 'rgba(0,0,0,0.45)', transform: 'rotate(-7deg)', transformOrigin: 'center bottom' }} />
      </div>

      {/* Logo area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 72, gap: 0, position: 'relative' }}>
        <HexLogo />
        <p style={{ fontFamily: FD, fontWeight: 800, fontSize: 22, letterSpacing: '0.22em', color: WHT, margin: '14px 0 4px', textTransform: 'uppercase' }}>INTEGRA AI</p>
        <p style={{ fontFamily: FM, fontSize: 11, color: RED, letterSpacing: '0.2em', margin: 0 }}>// BUILT FOR THE ROAD</p>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '32px 0' }}>
        {/* Diagonal red slash */}
        <div style={{ position: 'absolute', top: '48%', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent 5%, ${RED} 35%, ${RED} 65%, transparent 95%)`, transform: 'rotate(-2.5deg)', transformOrigin: 'center', pointerEvents: 'none' }} />
        <p style={{ fontFamily: FD, fontWeight: 900, fontSize: 72, textTransform: 'uppercase', color: WHT, lineHeight: 0.95, margin: 0, letterSpacing: '-0.01em' }}>DRIVE.</p>
        <p style={{ fontFamily: FD, fontWeight: 900, fontSize: 72, textTransform: 'uppercase', color: RED,  lineHeight: 0.95, margin: 0, letterSpacing: '-0.01em' }}>GET PAID.</p>
        <p style={{ fontFamily: FD, fontWeight: 900, fontSize: 72, textTransform: 'uppercase', color: WHT, lineHeight: 0.95, margin: 0, letterSpacing: '-0.01em' }}>REPEAT.</p>
        <p style={{ fontFamily: FB, fontSize: 11, color: DIM, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '24px 0 0', textAlign: 'center' }}>TOOLS BUILT FOR DRIVERS, NOT SUITS</p>
      </div>

      {/* Buttons */}
      <div style={{ padding: '0 24px 52px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        <PrimaryBtn onClick={() => setShowRegister(true)}>GET STARTED</PrimaryBtn>
        <SecondaryBtn onClick={() => setStep('login')}>SIGN IN</SecondaryBtn>
      </div>
    </Screen>
  );

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <Screen>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ padding: '52px 24px 0' }}>
        <BackBtn onClick={() => setStep('splash')} />
        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 56, textTransform: 'uppercase', color: WHT, lineHeight: 1, margin: '20px 0 4px' }}>SIGN IN</h1>
        <p style={{ fontFamily: FM, fontSize: 11, color: RED, letterSpacing: '0.16em', margin: '0 0 28px' }}>// WELCOME BACK</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BRDR}`, margin: '0 24px 24px' }}>
        {['email', 'phone'].map(tab => (
          <button key={tab} onClick={() => { setLoginTab(tab); setEmailError(''); setPhoneError(''); setGoogleError(''); }}
            style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: loginTab === tab ? `2px solid ${RED}` : '2px solid transparent', color: loginTab === tab ? RED : DIM, fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: -1 }}>
            {tab === 'email' ? 'EMAIL' : 'PHONE'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '0 24px', overflowY: 'auto' }}>

        {/* ── Email tab ──────────────────────────────────────────────────── */}
        {loginTab === 'email' && (
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ErrorBox msg={emailError} />
            <div>
              <Label>Email Address</Label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="driver@company.com" style={inputStyle} required
                onFocus={e => e.target.style.borderColor = RED}
                onBlur={e => e.target.style.borderColor = BRDR} />
            </div>
            <div>
              <Label>Password</Label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" style={{ ...inputStyle, paddingRight: 48 }} required
                  onFocus={e => e.target.style.borderColor = RED}
                  onBlur={e => e.target.style.borderColor = BRDR} />
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
              <button type="button" onClick={() => { setForgotEmail(email); setStep('forgot'); }}
                style={{ marginTop: 8, background: 'none', border: 'none', color: RED, fontFamily: FB, fontSize: 13, cursor: 'pointer', padding: 0 }}>
                Forgot password?
              </button>
            </div>
            <PrimaryBtn type="submit" disabled={emailLoading}>
              {emailLoading ? <><Spinner />SIGNING IN...</> : 'SIGN IN'}
            </PrimaryBtn>
          </form>
        )}

        {/* ── Phone tab ──────────────────────────────────────────────────── */}
        {loginTab === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ErrorBox msg={phoneError} />
            {phoneStep === 'enter_phone' ? (
              <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Label>Mobile Number</Label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ background: CARD, border: `1px solid ${BRDR}`, padding: '14px 12px', color: DIM, fontFamily: FB, fontSize: 14, whiteSpace: 'nowrap' }}>🇨🇦 +1</div>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="647 844 4618" style={{ ...inputStyle, flex: 1 }} required
                      onFocus={e => e.target.style.borderColor = RED}
                      onBlur={e => e.target.style.borderColor = BRDR} />
                  </div>
                  <p style={{ fontFamily: FB, fontSize: 12, color: DIM, margin: '6px 0 0' }}>Include country code, e.g. +1 for Canada/US</p>
                </div>
                <PrimaryBtn type="submit" disabled={phoneLoading}>
                  {phoneLoading ? <><Spinner />SENDING...</> : 'SEND CODE'}
                </PrimaryBtn>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Label>Verification Code</Label>
                  <p style={{ fontFamily: FB, fontSize: 13, color: DIM, margin: '0 0 12px' }}>
                    Code sent to <span style={{ color: WHT }}>{phone}</span>
                  </p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <input key={i} id={`otp-login-${i}`} type="text" inputMode="numeric" maxLength={1}
                        value={otp[i] || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          const arr = otp.split(''); arr[i] = val;
                          setOtp(arr.join('').slice(0, 6));
                          if (val && i < 5) document.getElementById(`otp-login-${i + 1}`)?.focus();
                        }}
                        onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-login-${i - 1}`)?.focus(); }}
                        style={{ width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700, background: CARD, border: `1px solid ${BRDR}`, color: WHT, outline: 'none', fontFamily: FM }}
                        onFocus={e => e.target.style.borderColor = RED}
                        onBlur={e => e.target.style.borderColor = BRDR}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => { setPhoneStep('enter_phone'); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: DIM, fontFamily: FD, fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer', padding: 0 }}>
                    ← Change number
                  </button>
                  {resendCooldown > 0
                    ? <span style={{ fontFamily: FB, fontSize: 13, color: DIM }}>Resend in {resendCooldown}s</span>
                    : <button type="button" disabled={phoneLoading}
                        onClick={async () => { setPhoneLoading(true); try { await loginWithPhoneRequest(phone); startResendCooldown(); } catch (err) { setPhoneError(err.message); } finally { setPhoneLoading(false); } }}
                        style={{ background: 'none', border: 'none', color: RED, fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', cursor: 'pointer', padding: 0 }}>
                        RESEND CODE
                      </button>
                  }
                </div>
                <PrimaryBtn type="submit" disabled={phoneLoading || otp.length < 6}>
                  {phoneLoading ? <><Spinner />VERIFYING...</> : 'VERIFY & SIGN IN'}
                </PrimaryBtn>
              </form>
            )}
          </div>
        )}

        {/* ── Google OAuth ───────────────────────────────────────────────── */}
        {GOOGLE_CLIENT_ID && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: BRDR }} />
              <span style={{ fontFamily: FM, fontSize: 10, color: DIM, letterSpacing: '0.12em' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: BRDR }} />
            </div>
            <ErrorBox msg={googleError} />
            <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading}
              style={{ width: '100%', background: CARD, border: `1px solid ${BRDR}`, color: WHT, fontFamily: FD, fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {googleLoading
                ? <Spinner />
                : <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
              }
              CONTINUE WITH GOOGLE
            </button>
            <div ref={googleBtnRef} style={{ marginTop: 8 }} />
          </div>
        )}

        {/* ── Register link ──────────────────────────────────────────────── */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${BRDR}`, textAlign: 'center', paddingBottom: 32 }}>
          <p style={{ fontFamily: FB, fontSize: 13, color: DIM, margin: '0 0 10px' }}>Owner Operator or Carrier?</p>
          <button type="button" onClick={() => setShowRegister(true)}
            style={{ background: 'none', border: 'none', color: RED, fontFamily: FD, fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            CREATE YOUR ACCOUNT →
          </button>
          <p style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>
            Company Driver? Use the invite link from your dispatcher.
          </p>
          {DEV_MODE && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontFamily: FM, fontSize: 10, color: '#D4921A', letterSpacing: '0.15em', marginBottom: 8 }}>// DEV MODE</p>
              <button type="button" onClick={devLogin}
                style={{ width: '100%', background: 'none', border: '1px solid rgba(212,146,26,0.4)', color: '#D4921A', fontFamily: FD, fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', padding: '12px', cursor: 'pointer' }}>
                BYPASS LOGIN (PREVIEW)
              </button>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
};

export default DriverLogin;
