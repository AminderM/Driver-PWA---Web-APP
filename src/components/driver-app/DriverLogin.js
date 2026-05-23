import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';
import OpenSignupScreen from './OpenSignupScreen';

const DEV_MODE = process.env.NODE_ENV === 'development';
const BACKEND = process.env.REACT_APP_BACKEND_URL || '';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const LoginHeader = ({ step, isDark, border, text, subtext }) => (
  <div className={`pt-12 pb-8 px-6 text-center border-b ${border}`}>
    <div className="w-16 h-16 bg-red-600 flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    </div>
    <h1 className={`text-2xl font-bold tracking-wider ${text}`}>INTEGRA AI</h1>
    <p className={`mt-1 text-sm ${subtext}`}>
      {step === 'login' ? 'Driver & Carrier Platform' : 'Reset your password'}
    </p>
  </div>
);

const DriverLogin = () => {
  const { login, loginWithPhoneRequest, loginWithPhoneVerify, loginWithGoogle, theme, devLogin } = useDriverApp();
  const isDark = theme === 'dark';

  const bg       = isDark ? 'bg-black'         : 'bg-white';
  const text     = isDark ? 'text-white'        : 'text-black';
  const subtext  = isDark ? 'text-white/60'     : 'text-black/60';
  const border   = isDark ? 'border-[#262626]'  : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-4 px-4 focus:outline-none focus:ring-2 focus:ring-red-600 ${
    isDark ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/40'
           : 'bg-white border-[#e5e5e5] text-black placeholder-black/40'
  }`;

  // Top-level step: 'login' | 'forgot' | 'sent'
  const [step, setStep]           = useState('login');
  // Login tabs: 'email' | 'phone'
  const [loginTab, setLoginTab]   = useState('email');
  // Show register screen
  const [showRegister, setShowRegister] = useState(false);

  // ── Email login state ────────────────────────────────────────────────────
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError]     = useState('');

  // ── Phone login state ────────────────────────────────────────────────────
  const [phone, setPhone]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [phoneStep, setPhoneStep]     = useState('enter_phone'); // 'enter_phone' | 'enter_otp'
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError]   = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // ── Google loading state ─────────────────────────────────────────────────
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError]     = useState('');
  const googleBtnRef = useRef(null);

  // ── Forgot password state ────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError]     = useState('');

  // ── Load Google Identity Services ────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== 'login') return;
    const scriptId = 'google-gis-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [step]);

  const handleGoogleSignIn = () => {
    if (!window.google?.accounts?.id) {
      setGoogleError('Google sign-in is not available. Please try again.');
      return;
    }
    setGoogleLoading(true);
    setGoogleError('');
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          await loginWithGoogle(credential);
        } catch (err) {
          setGoogleError(err.message || 'Google sign-in failed.');
          setGoogleLoading(false);
        }
      },
      auto_select: false,
    });
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fall back to One Tap popup
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          width: '100%',
        });
        setGoogleLoading(false);
      }
    });
  };

  // ── Email login ──────────────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError('');
    try {
      await login(email, password);
    } catch (err) {
      setEmailError(err.message || 'Login failed');
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Phone OTP — send code ────────────────────────────────────────────────
  const handleSendCode = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError('');
    try {
      await loginWithPhoneRequest(phone);
      setPhoneStep('enter_otp');
      startResendCooldown();
    } catch (err) {
      setPhoneError(err.message || 'Failed to send code.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // ── Phone OTP — verify code ──────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError('');
    try {
      await loginWithPhoneVerify(phone, otp);
    } catch (err) {
      setPhoneError(err.message || 'Invalid or expired code.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Forgot password ──────────────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch(`${BACKEND}/api/driver-mobile/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Something went wrong. Please try again.');
      }
      setStep('sent');
    } catch (err) {
      setForgotError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Register screen ──────────────────────────────────────────────────────
  if (showRegister) {
    return <OpenSignupScreen onBack={() => setShowRegister(false)} />;
  }

  // ── Forgot password ──────────────────────────────────────────────────────
  if (step === 'forgot') return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <LoginHeader step={step} isDark={isDark} border={border} text={text} subtext={subtext} />
      <div className="flex-1 px-6 py-8">
        <button onClick={() => setStep('login')} className={`text-sm tracking-wider mb-6 ${subtext}`}>← BACK TO LOGIN</button>
        <p className={`text-sm mb-6 leading-relaxed ${subtext}`}>
          Enter your email and we'll send a link to reset your password.
        </p>
        <form onSubmit={handleForgot} className="space-y-4">
          {forgotError && (
            <div className="bg-red-600/20 border border-red-600/50 p-4">
              <p className="text-red-500 text-sm">{forgotError}</p>
            </div>
          )}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>EMAIL ADDRESS</label>
            <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
              placeholder="driver@company.com" className={inputCls} required />
          </div>
          <button type="submit" disabled={forgotLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors">
            {forgotLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SENDING...
              </span>
            ) : 'SEND RESET LINK'}
          </button>
        </form>
      </div>
    </div>
  );

  // ── Email sent ───────────────────────────────────────────────────────────
  if (step === 'sent') return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <LoginHeader step={step} isDark={isDark} border={border} text={text} subtext={subtext} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-green-600/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className={`text-xl font-bold tracking-wider mb-3 ${text}`}>CHECK YOUR EMAIL</h2>
        <p className={`text-sm max-w-xs leading-relaxed mb-8 ${subtext}`}>
          If that email is registered, a reset link has been sent. Check your inbox.
        </p>
        <button onClick={() => setStep('login')}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 tracking-wider transition-colors">
          BACK TO LOGIN
        </button>
      </div>
    </div>
  );

  // ── Main Login ───────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <LoginHeader step="login" isDark={isDark} border={border} text={text} subtext={subtext} />

      <div className="flex-1 px-6 py-6 overflow-y-auto">

        {/* Tab switcher */}
        <div className={`flex border-b mb-6 ${border}`}>
          {['email', 'phone'].map(tab => (
            <button
              key={tab}
              onClick={() => { setLoginTab(tab); setEmailError(''); setPhoneError(''); setGoogleError(''); }}
              className={`flex-1 py-3 text-sm font-semibold tracking-wider transition-colors ${
                loginTab === tab
                  ? 'text-red-500 border-b-2 border-red-500'
                  : subtext
              }`}
            >
              {tab === 'email' ? 'EMAIL' : 'PHONE'}
            </button>
          ))}
        </div>

        {/* ── Email tab ─────────────────────────────────────────────────── */}
        {loginTab === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {emailError && (
              <div className="bg-red-600/20 border border-red-600/50 p-4">
                <p className="text-red-500 text-sm">{emailError}</p>
              </div>
            )}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>EMAIL ADDRESS</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="driver@company.com" className={inputCls} required />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>PASSWORD</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" className={`${inputCls} pr-12`} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${subtext}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPw
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
              <button type="button" onClick={() => { setForgotEmail(email); setStep('forgot'); }}
                className="mt-2 text-sm text-red-500 hover:text-red-400 tracking-wider">
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={emailLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 transition-colors mt-2 tracking-wider">
              {emailLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SIGNING IN...
                </span>
              ) : 'SIGN IN'}
            </button>
          </form>
        )}

        {/* ── Phone tab ─────────────────────────────────────────────────── */}
        {loginTab === 'phone' && (
          <div className="space-y-4">
            {phoneError && (
              <div className="bg-red-600/20 border border-red-600/50 p-4">
                <p className="text-red-500 text-sm">{phoneError}</p>
              </div>
            )}

            {phoneStep === 'enter_phone' ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>PHONE NUMBER</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (416) 555-0100" className={inputCls} required />
                  <p className={`text-xs mt-2 ${subtext}`}>Include country code, e.g. +1 for Canada/US</p>
                </div>
                <button type="submit" disabled={phoneLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors">
                  {phoneLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      SENDING...
                    </span>
                  ) : 'SEND CODE'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>VERIFICATION CODE</label>
                  <p className={`text-sm mb-4 ${subtext}`}>
                    We sent a 6-digit code to <span className={text}>{phone}</span>
                  </p>
                  {/* 6-digit OTP input */}
                  <div className="flex gap-2 justify-between">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[i] || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          const arr = otp.split('');
                          arr[i] = val;
                          setOtp(arr.join('').slice(0, 6));
                          if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0) {
                            document.getElementById(`otp-${i - 1}`)?.focus();
                          }
                        }}
                        className={`w-12 h-14 text-center text-xl font-bold border focus:outline-none focus:ring-2 focus:ring-red-600 ${
                          isDark ? 'bg-[#0a0a0a] border-[#262626] text-white'
                                 : 'bg-white border-[#e5e5e5] text-black'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => { setPhoneStep('enter_phone'); setOtp(''); }}
                    className={`text-sm tracking-wider ${subtext}`}>
                    ← Change number
                  </button>
                  {resendCooldown > 0 ? (
                    <span className={`text-sm ${subtext}`}>Resend in {resendCooldown}s</span>
                  ) : (
                    <button type="button" disabled={phoneLoading}
                      onClick={async () => {
                        setPhoneLoading(true);
                        try { await loginWithPhoneRequest(phone); startResendCooldown(); }
                        catch (err) { setPhoneError(err.message); }
                        finally { setPhoneLoading(false); }
                      }}
                      className="text-sm text-red-500 hover:text-red-400 tracking-wider">
                      RESEND CODE
                    </button>
                  )}
                </div>

                <button type="submit" disabled={phoneLoading || otp.length < 6}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors">
                  {phoneLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      VERIFYING...
                    </span>
                  ) : 'VERIFY & SIGN IN'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Google OAuth ──────────────────────────────────────────────── */}
        {GOOGLE_CLIENT_ID && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex-1 h-px ${isDark ? 'bg-[#262626]' : 'bg-[#e5e5e5]'}`} />
              <span className={`text-xs tracking-wider ${subtext}`}>OR</span>
              <div className={`flex-1 h-px ${isDark ? 'bg-[#262626]' : 'bg-[#e5e5e5]'}`} />
            </div>

            {googleError && (
              <div className="bg-red-600/20 border border-red-600/50 p-3 mb-3">
                <p className="text-red-500 text-sm">{googleError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className={`w-full flex items-center justify-center gap-3 border py-4 font-semibold tracking-wider transition-colors ${
                isDark
                  ? 'border-[#262626] text-white hover:bg-white/5 disabled:opacity-50'
                  : 'border-[#e5e5e5] text-black hover:bg-black/5 disabled:opacity-50'
              }`}
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              CONTINUE WITH GOOGLE
            </button>

            {/* Hidden div for Google button fallback rendering */}
            <div ref={googleBtnRef} className="mt-2" />
          </div>
        )}

        {/* ── Register link ─────────────────────────────────────────────── */}
        <div className={`mt-6 pt-6 border-t ${border} text-center`}>
          <p className={`text-sm mb-3 ${subtext}`}>Owner Operator or Carrier?</p>
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="text-red-500 hover:text-red-400 text-sm font-semibold tracking-wider"
          >
            CREATE YOUR ACCOUNT →
          </button>
        </div>

        <p className={`text-center text-xs mt-4 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
          Company Driver? Use the invite link from your dispatcher.
        </p>

        {/* ── Dev mode bypass ───────────────────────────────────────────── */}
        {DEV_MODE && (
          <div className={`mt-6 pt-6 border-t ${border}`}>
            <p className="text-center text-xs text-amber-500 mb-3 tracking-wider">DEV MODE</p>
            <button type="button" onClick={devLogin}
              className="w-full border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-semibold py-3 transition-colors tracking-wider text-sm">
              BYPASS LOGIN (PREVIEW)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverLogin;
