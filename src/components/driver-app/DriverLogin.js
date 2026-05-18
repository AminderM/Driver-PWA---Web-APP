import React, { useState } from 'react';
import { useDriverApp } from './DriverAppProvider';

const DEV_MODE = process.env.NODE_ENV === 'development';
const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

const DriverLogin = () => {
  const { login, theme, devLogin } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-black'      : 'bg-white';
  const text    = isDark ? 'text-white'    : 'text-black';
  const subtext = isDark ? 'text-white/60' : 'text-black/60';
  const border  = isDark ? 'border-[#262626]' : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-4 px-4 focus:outline-none focus:ring-2 focus:ring-red-600 ${
    isDark ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/40'
           : 'bg-white border-[#e5e5e5] text-black placeholder-black/40'
  }`;

  // 'login' | 'forgot' | 'sent'
  const [step, setStep] = useState('login');

  // Login state
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPw]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError]   = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      await fetch(`${BACKEND}/api/driver-mobile/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setStep('sent');
    } catch {
      setForgotError('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const Header = () => (
    <div className={`pt-16 pb-12 px-6 text-center border-b ${border}`}>
      <div className="w-20 h-20 bg-red-600 flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      </div>
      <h1 className={`text-2xl font-bold tracking-wider ${text}`}>INTEGRA TMS</h1>
      <p className={`mt-2 ${subtext}`}>
        {step === 'login' ? 'Sign in to view your loads' : 'Reset your password'}
      </p>
    </div>
  );

  // ── Login ────────────────────────────────────────────────────────────────
  if (step === 'login') return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <Header />
      <div className="flex-1 px-6 py-8">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-600/20 border border-red-600/50 p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="driver@company.com"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`${inputCls} pr-12`}
                required
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${subtext}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setForgotEmail(email); setStep('forgot'); }}
              className="mt-2 text-sm text-red-500 hover:text-red-400 tracking-wider"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 transition-colors mt-4 tracking-wider"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SIGNING IN...
              </span>
            ) : 'SIGN IN'}
          </button>
        </form>

        <p className={`text-center text-sm mt-8 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          New driver? Check your email for an invite link from your company.
        </p>

        {DEV_MODE && (
          <div className={`mt-6 pt-6 border-t ${border}`}>
            <p className="text-center text-xs text-amber-500 mb-3 tracking-wider">DEV MODE</p>
            <button
              type="button"
              onClick={devLogin}
              className="w-full border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-semibold py-3 transition-colors tracking-wider text-sm"
            >
              BYPASS LOGIN (PREVIEW)
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── Forgot Password ──────────────────────────────────────────────────────
  if (step === 'forgot') return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <Header />
      <div className="flex-1 px-6 py-8">
        <button onClick={() => setStep('login')} className={`text-sm tracking-wider mb-6 ${subtext}`}>← BACK TO LOGIN</button>

        <p className={`text-sm mb-6 leading-relaxed ${subtext}`}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleForgot} className="space-y-4">
          {forgotError && (
            <div className="bg-red-600/20 border border-red-600/50 p-4">
              <p className="text-red-500 text-sm">{forgotError}</p>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>EMAIL ADDRESS</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              placeholder="driver@company.com"
              className={inputCls}
              required
            />
          </div>

          <button
            type="submit"
            disabled={forgotLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors"
          >
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

  // ── Sent ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-green-600/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className={`text-xl font-bold tracking-wider mb-3 ${text}`}>CHECK YOUR EMAIL</h2>
        <p className={`text-sm max-w-xs leading-relaxed mb-8 ${subtext}`}>
          If that email is registered, a reset link has been sent. Check your inbox and follow the link to set a new password.
        </p>
        <button
          onClick={() => setStep('login')}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 tracking-wider transition-colors"
        >
          BACK TO LOGIN
        </button>
      </div>
    </div>
  );
};

export default DriverLogin;
