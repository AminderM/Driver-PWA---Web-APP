import React, { useState, useEffect, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

const PhoneVerificationScreen = () => {
  const { user, sendPhoneOTP, verifyPhoneOTP, logout, theme, toggleTheme } = useDriverApp();
  const isDark = theme !== 'light';

  const bg      = isDark ? 'bg-black'      : 'bg-white';
  const text    = isDark ? 'text-white'    : 'text-black';
  const subtext = isDark ? 'text-white/60' : 'text-black/60';
  const input   = isDark
    ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/30 focus:ring-red-600'
    : 'bg-white border-[#e5e5e5] text-black placeholder-black/30 focus:ring-red-600';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle'); // idle | sending | verifying | error
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Auto-send OTP on mount
  useEffect(() => {
    handleSendOTP();
  }, []); // eslint-disable-line

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOTP = async () => {
    setStatus('sending');
    setError('');
    try {
      await sendPhoneOTP();
      setResendCooldown(60);
      setStatus('idle');
    } catch {
      setError('Failed to send verification code. Please try again.');
      setStatus('error');
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setStatus('verifying');
    setError('');
    try {
      await verifyPhoneOTP(code);
      // phoneVerified will update from context, re-render handled by index.js
    } catch {
      setError('Incorrect code. Please check and try again.');
      setStatus('idle');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const phone = user?.phone || '';
  const maskedPhone = phone.length > 4
    ? `•••• •••• ${phone.slice(-4)}`
    : phone;

  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      {/* Header */}
      <div className={`relative pt-16 pb-10 px-6 text-center border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <div className="absolute top-4 right-4"><button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button></div>
        <div className="w-20 h-20 bg-red-600/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className={`text-3xl font-bold tracking-wider ${text}`}>VERIFY YOUR PHONE</h1>
        <p className={`mt-2 text-base max-w-xs mx-auto leading-relaxed ${subtext}`}>
          {status === 'sending'
            ? 'Sending verification code…'
            : `We sent a 6-digit code to ${maskedPhone}`}
        </p>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col">
        {error && (
          <div className="bg-red-600/20 border border-red-600/50 p-4 mb-6">
            <p className="text-red-500 text-base">{error}</p>
          </div>
        )}

        {/* OTP inputs */}
        <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-2xl font-bold border focus:outline-none focus:ring-2 ${input}`}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={status === 'verifying' || status === 'sending'}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors"
        >
          {status === 'verifying' ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              VERIFYING…
            </span>
          ) : 'VERIFY PHONE'}
        </button>

        {/* Resend */}
        <div className="mt-6 text-center">
          {resendCooldown > 0 ? (
            <p className={`text-base ${subtext}`}>Resend code in {resendCooldown}s</p>
          ) : (
            <button
              onClick={handleSendOTP}
              disabled={status === 'sending'}
              className="text-base text-red-500 hover:text-red-400 tracking-wider"
            >
              RESEND CODE
            </button>
          )}
        </div>

        {/* Escape hatch */}
        <div className="mt-auto pt-8 text-center">
          <button
            onClick={logout}
            className={`text-sm tracking-wider ${subtext}`}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationScreen;
