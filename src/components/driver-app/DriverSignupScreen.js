import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const DriverSignupScreen = ({ inviteToken }) => {
  const { validateInvite, signup, theme } = useDriverApp();
  const isDark = theme !== 'light';

  const bg      = isDark ? 'bg-black'      : 'bg-white';
  const text    = isDark ? 'text-white'    : 'text-black';
  const subtext = isDark ? 'text-white/60' : 'text-black/60';
  const card    = isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-gray-50 border-[#e5e5e5]';
  const input   = isDark
    ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/30 focus:ring-red-600'
    : 'bg-white border-[#e5e5e5] text-black placeholder-black/30 focus:ring-red-600';

  // 'loading' | 'error' | 'form' | 'submitting'
  const [step, setStep]             = useState('loading');
  const [inviteData, setInviteData] = useState(null);
  const [loadError, setLoadError]   = useState('');

  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [formError, setFormError] = useState('');

  // Auto-validate on mount — token always comes from URL
  useEffect(() => {
    if (!inviteToken) {
      setLoadError('No invite token found. Please use the link sent to your email.');
      setStep('error');
      return;
    }
    validateInvite(inviteToken)
      .then(data => { setInviteData(data); setStep('form'); })
      .catch(() => {
        setLoadError('This invite link is invalid or has expired. Please contact your company admin.');
        setStep('error');
      });
  }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim())        { setFormError('Phone number is required.'); return; }
    if (password.length < 8)  { setFormError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setFormError('Passwords do not match.'); return; }
    setFormError('');
    setStep('submitting');
    try {
      await signup({ token: inviteToken, full_name: inviteData?.full_name, phone: phone.trim(), password });
    } catch (err) {
      setFormError(err.message || 'Account creation failed. Please try again.');
      setStep('form');
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div className={`min-h-screen flex flex-col items-center justify-center font-['Oxanium'] ${bg}`}>
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className={`text-sm tracking-wider ${subtext}`}>LOADING INVITE...</p>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 font-['Oxanium'] ${bg}`}>
      <div className="w-16 h-16 bg-red-600/20 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h1 className={`text-xl font-bold tracking-wider mb-3 text-center ${text}`}>INVITE UNAVAILABLE</h1>
      <p className={`text-sm text-center max-w-xs leading-relaxed ${subtext}`}>{loadError}</p>
    </div>
  );

  // ── Submitting ───────────────────────────────────────────────────────────
  if (step === 'submitting') return (
    <div className={`min-h-screen flex flex-col items-center justify-center font-['Oxanium'] ${bg}`}>
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className={`text-sm tracking-wider ${subtext}`}>CREATING ACCOUNT...</p>
    </div>
  );

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      {/* Header */}
      <div className={`pt-16 pb-10 px-6 text-center border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <div className="w-20 h-20 bg-red-600 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8l2-2zM13 8h4l2 4v4h-6V8z" />
          </svg>
        </div>
        <h1 className={`text-2xl font-bold tracking-wider ${text}`}>DRIVER TMS</h1>
        <p className={`mt-1 text-sm ${subtext}`}>Complete your account setup</p>
      </div>

      <div className="flex-1 px-6 py-8 overflow-y-auto">
        {/* Company + driver info */}
        {inviteData && (
          <div className={`border p-4 mb-6 ${card}`}>
            <p className={`text-xs tracking-wider mb-1 ${subtext}`}>INVITED BY</p>
            <p className={`font-bold tracking-wider ${text}`}>{inviteData.company_name}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-600/20 border border-red-600/50 p-4">
              <p className="text-red-500 text-sm">{formError}</p>
            </div>
          )}

          {/* Name — read-only */}
          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              FULL NAME
            </label>
            <div className={`w-full border py-4 px-4 ${isDark ? 'bg-[#0a0a0a] border-[#262626] text-white/50' : 'bg-gray-50 border-[#e5e5e5] text-black/50'}`}>
              {inviteData?.full_name}
            </div>
          </div>

          {/* Email — read-only */}
          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              EMAIL
            </label>
            <div className={`w-full border py-4 px-4 ${isDark ? 'bg-[#0a0a0a] border-[#262626] text-white/50' : 'bg-gray-50 border-[#e5e5e5] text-black/50'}`}>
              {inviteData?.driver_email}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              PHONE NUMBER
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="6471234567"
              className={`w-full border py-4 px-4 focus:outline-none focus:ring-2 ${input}`}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={`w-full border py-4 px-4 pr-12 focus:outline-none focus:ring-2 ${input}`}
                required
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${subtext}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPass
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              CONFIRM PASSWORD
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={`w-full border py-4 px-4 focus:outline-none focus:ring-2 ${input}`}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 tracking-wider transition-colors mt-2"
          >
            CREATE ACCOUNT
          </button>
        </form>
      </div>
    </div>
  );
};

export default DriverSignupScreen;
