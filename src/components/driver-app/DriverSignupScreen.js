import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const DriverSignupScreen = ({ onBack, initialInviteToken }) => {
  const { validateInvite, signup, theme } = useDriverApp();
  const isDark = theme !== 'light';

  const bg      = isDark ? 'bg-black'       : 'bg-white';
  const card    = isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-gray-50 border-[#e5e5e5]';
  const text    = isDark ? 'text-white'     : 'text-black';
  const subtext = isDark ? 'text-white/60'  : 'text-black/60';
  const input   = isDark
    ? 'bg-[#0a0a0a] border-[#262626] text-white placeholder-white/30 focus:ring-red-600'
    : 'bg-white border-[#e5e5e5] text-black placeholder-black/30 focus:ring-red-600';

  const [step, setStep]               = useState('invite');
  const [inviteCode, setInviteCode]   = useState(initialInviteToken || '');
  const [inviteData, setInviteData]   = useState(null);
  const [inviteError, setInviteError] = useState('');
  const [validating, setValidating]   = useState(false);

  const [form, setForm]         = useState({ full_name: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-validate if token came from invite URL
  useEffect(() => {
    if (initialInviteToken) handleValidateInvite(initialInviteToken);
  }, []); // eslint-disable-line

  const handleValidateInvite = async (token) => {
    const code = (token || inviteCode).trim();
    if (!code) { setInviteError('Please enter an invite code.'); return; }
    setValidating(true);
    setInviteError('');
    try {
      const data = await validateInvite(code);
      setInviteData(data);
      // Pre-fill name if dispatcher already set it
      if (data.full_name) setForm(f => ({ ...f, full_name: data.full_name }));
      setStep('details');
    } catch (err) {
      setInviteError(err.message || 'Invalid or expired invite code.');
    } finally {
      setValidating(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const resolvedName = inviteData?.full_name || form.full_name.trim();
    if (!resolvedName) { setFormError('Full name is required.'); return; }
    if (!form.phone.trim())     { setFormError('Phone number is required.'); return; }
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setFormError('Passwords do not match.'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      await signup({
        invite_token: inviteCode.trim() || initialInviteToken,
        full_name: inviteData?.full_name || form.full_name.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      // signup() in DriverAppProvider sets user + token + first_login=true
      // The parent flow will then show DocumentScanScreen
    } catch (err) {
      setFormError(err.message || 'Account creation failed. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Step: Enter invite code ──────────────────────────────────────────────
  if (step === 'invite') return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <div className={`pt-14 pb-6 px-6 border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button onClick={onBack} className={`text-sm tracking-wider mb-4 ${subtext}`}>← BACK TO LOGIN</button>
        <h1 className={`text-2xl font-bold tracking-wider ${text}`}>CREATE ACCOUNT</h1>
        <p className={`text-sm mt-1 ${subtext}`}>Enter the invite code from your dispatcher</p>
      </div>

      <div className="flex-1 px-6 py-8">
        {inviteError && (
          <div className="bg-red-600/20 border border-red-600/50 p-4 mb-4">
            <p className="text-red-500 text-sm">{inviteError}</p>
          </div>
        )}

        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            INVITE CODE
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            placeholder="e.g. ACME-2026-XYZ"
            className={`w-full border py-4 px-4 focus:outline-none focus:ring-2 uppercase tracking-widest ${input}`}
            autoCapitalize="characters"
          />
        </div>

        <button
          onClick={() => handleValidateInvite()}
          disabled={validating || !inviteCode.trim()}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/40 text-white font-semibold py-4 tracking-wider transition-colors"
        >
          {validating
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                VALIDATING...
              </span>
            : 'CONTINUE'}
        </button>

        <p className={`text-center text-xs mt-8 leading-relaxed ${subtext}`}>
          Your dispatcher creates your account and sends you an invite code or link. You cannot sign up without one.
        </p>
      </div>
    </div>
  );

  // ── Step: Account details ─────────────────────────────────────────────────
  if (step === 'details') return (
    <div className={`min-h-screen flex flex-col font-['Oxanium'] ${bg}`}>
      <div className={`pt-14 pb-6 px-6 border-b ${isDark ? 'border-[#262626]' : 'border-[#e5e5e5]'}`}>
        <button onClick={() => setStep('invite')} className={`text-sm tracking-wider mb-4 ${subtext}`}>← BACK</button>
        <h1 className={`text-2xl font-bold tracking-wider ${text}`}>YOUR DETAILS</h1>
        <p className={`text-sm mt-1 ${subtext}`}>Complete your account setup</p>
      </div>

      {/* Company info banner */}
      {inviteData && (
        <div className={`mx-6 mt-4 p-4 border ${card}`}>
          <p className={`text-xs tracking-wider mb-1 ${subtext}`}>INVITED BY</p>
          <p className={`font-bold tracking-wider ${text}`}>{inviteData.company_name}</p>
          {inviteData.required_documents?.length > 0 && (
            <p className={`text-xs mt-2 ${subtext}`}>
              Documents required: {inviteData.required_documents.map(d => d.replace(/_/g, ' ')).join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 px-6 py-6 overflow-y-auto">
        <form onSubmit={handleSignup} className="space-y-4">
          {formError && (
            <div className="bg-red-600/20 border border-red-600/50 p-4">
              <p className="text-red-500 text-sm">{formError}</p>
            </div>
          )}

          {inviteData?.driver_email && (
            <div>
              <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>EMAIL</label>
              <div className={`w-full border py-4 px-4 ${isDark ? 'bg-[#0a0a0a] border-[#262626] text-white/50' : 'bg-gray-50 border-[#e5e5e5] text-black/50'}`}>
                {inviteData.driver_email}
              </div>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>FULL NAME</label>
            {inviteData?.full_name ? (
              <div className={`w-full border py-4 px-4 ${isDark ? 'bg-[#0a0a0a] border-[#262626] text-white/50' : 'bg-gray-50 border-[#e5e5e5] text-black/50'}`}>
                {inviteData.full_name}
              </div>
            ) : (
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="John Smith"
                className={`w-full border py-4 px-4 focus:outline-none focus:ring-2 ${input}`}
                required
              />
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>PHONE</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
              className={`w-full border py-4 px-4 focus:outline-none focus:ring-2 ${input}`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>PASSWORD</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                className={`w-full border py-4 px-4 pr-12 focus:outline-none focus:ring-2 ${input}`}
                required
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${subtext}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPass
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 tracking-wider ${isDark ? 'text-white/80' : 'text-black/80'}`}>CONFIRM PASSWORD</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Re-enter password"
              className={`w-full border py-4 px-4 focus:outline-none focus:ring-2 ${input}`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/40 text-white font-semibold py-4 tracking-wider transition-colors mt-2"
          >
            {submitting
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  CREATING ACCOUNT...
                </span>
              : 'CREATE ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );

  return null;
};

export default DriverSignupScreen;
