import React, { useState, useRef } from 'react';
import { useDriverApp } from './DriverAppProvider';

const STEPS = ['role', 'personal', 'business', 'verify'];

const OpenSignupScreen = ({ onBack }) => {
  const { openSignup, loginWithPhoneRequest, theme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg       = isDark ? 'bg-black'          : 'bg-white';
  const text     = isDark ? 'text-white'         : 'text-black';
  const subtext  = isDark ? 'text-white/60'      : 'text-black/60';
  const border   = isDark ? 'border-[#262626]'   : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-4 px-4 focus:outline-none focus:ring-2 focus:ring-red-600 ${
    isDark ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/40'
           : 'bg-white border-[#e5e5e5] text-black placeholder-black/40'
  }`;

  const [step, setStep]       = useState(0); // index into STEPS
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Form data
  const [userType, setUserType]     = useState('');
  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [mcDot, setMcDot]           = useState('');
  const [logoFile, setLogoFile]     = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef                = useRef(null);

  // OTP verify step
  const [otp, setOtp]                     = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef                       = useRef(null);

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

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Step 1: role selected — go to personal info
  const handleRoleSelect = (type) => {
    setUserType(type);
    setError('');
    setStep(1);
  };

  // Step 2: personal info — validate and send OTP (needed for step 4)
  const handlePersonalNext = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return; }
    setStep(2);
  };

  // Step 3: business info — send OTP then move to verify
  const handleBusinessNext = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithPhoneRequest(phone);
      startResendCooldown();
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: OTP verified → call openSignup (which also auto-logs in)
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      await openSignup({
        userType,
        fullName: fullName.trim(),
        email: email.trim(),
        phone,
        password,
        companyName: companyName.trim(),
        mcDotNumber: mcDot.trim() || null,
        logoFile,
        otp,
      });
      // openSignup sets token+user → app re-renders to BusinessSuiteShell automatically
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const progressPct = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>

      {/* Header */}
      <div className={`pt-12 pb-6 px-6 border-b ${border}`}>
        <button onClick={step === 0 ? onBack : () => { setStep(s => s - 1); setError(''); }}
          className={`text-sm tracking-wider mb-4 block ${subtext}`}>
          ← BACK
        </button>
        <div className="flex items-center justify-between mb-1">
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>CREATE ACCOUNT</h1>
          <span className={`text-xs ${subtext}`}>Step {step + 1} of {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className={`h-1 w-full mt-3 ${isDark ? 'bg-[#262626]' : 'bg-[#e5e5e5]'}`}>
          <div className="h-1 bg-red-600 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto">

        {error && (
          <div className="bg-red-600/20 border border-red-600/50 p-4 mb-6">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* ── Step 0: Choose Role ────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <p className={`text-sm mb-6 leading-relaxed ${subtext}`}>
              What best describes you?
            </p>
            <div className="space-y-4">
              {[
                {
                  type: 'owner_operator',
                  label: 'OWNER OPERATOR',
                  desc: 'You own and operate your truck. Manage your loads, expenses, invoices, and documents.',
                  icon: '🚛',
                },
                {
                  type: 'carrier',
                  label: 'CARRIER',
                  desc: 'You run a fleet or brokerage. Receive loads from brokers, manage your business tools.',
                  icon: '🏢',
                },
              ].map(({ type, label, desc, icon }) => (
                <button
                  key={type}
                  onClick={() => handleRoleSelect(type)}
                  className={`w-full text-left p-5 border transition-colors ${
                    isDark
                      ? 'border-[#262626] hover:border-red-600/60 hover:bg-red-600/5'
                      : 'border-[#e5e5e5] hover:border-red-600/60 hover:bg-red-600/5'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <span className={`font-bold tracking-wider text-sm ${text}`}>{label}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${subtext}`}>{desc}</p>
                </button>
              ))}
            </div>
            <div className={`mt-8 p-4 ${isDark ? 'bg-[#0a0a0a] border border-[#262626]' : 'bg-[#f5f5f5]'}`}>
              <p className={`text-xs ${subtext}`}>
                <span className={`font-semibold ${text}`}>Company Driver?</span> You don't sign up here.
                Ask your dispatcher for an invite link — they'll send it to your email.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 1: Personal Info ──────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handlePersonalNext} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>FULL NAME</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="John Smith" className={inputCls} required />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>EMAIL ADDRESS</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" className={inputCls} required />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>PHONE NUMBER</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+1 (416) 555-0100" className={inputCls} required />
              <p className={`text-xs mt-1 ${subtext}`}>Include country code, e.g. +1</p>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>PASSWORD</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" className={`${inputCls} pr-12`} required minLength={8} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${subtext}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={showPw
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>CONFIRM PASSWORD</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Re-enter password" className={inputCls} required />
            </div>
            <button type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 tracking-wider transition-colors mt-2">
              CONTINUE →
            </button>
          </form>
        )}

        {/* ── Step 2: Business Info ──────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleBusinessNext} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>COMPANY NAME</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="Smith Trucking Inc." className={inputCls} required />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                MC / DOT NUMBER <span className={`font-normal ${subtext}`}>(optional)</span>
              </label>
              <input type="text" value={mcDot} onChange={e => setMcDot(e.target.value)}
                placeholder="MC-123456 or USDOT 1234567" className={inputCls} />
              <p className={`text-xs mt-1 ${subtext}`}>Required for invoicing — can be added later in profile</p>
            </div>

            {/* Logo upload */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                COMPANY LOGO <span className={`font-normal ${subtext}`}>(optional)</span>
              </label>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
              {logoPreview ? (
                <div className="flex items-center gap-4">
                  <img src={logoPreview} alt="Logo preview"
                    className="w-16 h-16 object-cover border border-[#262626]" />
                  <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    className={`text-sm ${subtext}`}>Remove</button>
                </div>
              ) : (
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className={`w-full border-2 border-dashed py-6 text-sm tracking-wider transition-colors ${
                    isDark
                      ? 'border-[#262626] text-white/40 hover:border-red-600/50 hover:text-white/60'
                      : 'border-[#e5e5e5] text-black/40 hover:border-red-600/50 hover:text-black/60'
                  }`}>
                  TAP TO UPLOAD LOGO
                </button>
              )}
              <p className={`text-xs mt-1 ${subtext}`}>Used on invoice letterhead</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SENDING CODE...
                </span>
              ) : 'CONTINUE →'}
            </button>
          </form>
        )}

        {/* ── Step 3: Phone Verification ─────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            <p className={`text-sm mb-2 leading-relaxed ${subtext}`}>
              We sent a 6-digit code to <span className={`font-semibold ${text}`}>{phone}</span>.
              Enter it below to verify your number and complete registration.
            </p>

            {/* 6-digit OTP boxes */}
            <div className="flex gap-2 justify-between mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  id={`signup-otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const arr = otp.split('');
                    arr[i] = val;
                    setOtp(arr.join('').slice(0, 6));
                    if (val && i < 5) document.getElementById(`signup-otp-${i + 1}`)?.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) {
                      document.getElementById(`signup-otp-${i - 1}`)?.focus();
                    }
                  }}
                  className={`w-12 h-14 text-center text-xl font-bold border focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    isDark ? 'bg-[#0a0a0a] border-[#262626] text-white'
                           : 'bg-white border-[#e5e5e5] text-black'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${subtext}`}>Didn't receive it?</span>
              {resendCooldown > 0 ? (
                <span className={`text-sm ${subtext}`}>Resend in {resendCooldown}s</span>
              ) : (
                <button type="button" disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try { await loginWithPhoneRequest(phone); startResendCooldown(); }
                    catch (err) { setError(err.message); }
                    finally { setLoading(false); }
                  }}
                  className="text-sm text-red-500 hover:text-red-400 tracking-wider">
                  RESEND CODE
                </button>
              )}
            </div>

            <button type="submit" disabled={loading || otp.length < 6}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors mt-4">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  CREATING ACCOUNT...
                </span>
              ) : 'VERIFY & CREATE ACCOUNT'}
            </button>

            <p className={`text-xs text-center mt-2 ${subtext}`}>
              By registering you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default OpenSignupScreen;
