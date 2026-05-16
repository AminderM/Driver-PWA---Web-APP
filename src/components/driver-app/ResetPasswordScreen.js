import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

const ResetPasswordScreen = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [status, setStatus]       = useState('form'); // form | submitting | success
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }

    setError('');
    setStatus('submitting');
    try {
      const res = await fetch(`${BACKEND}/api/driver-mobile/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Reset failed. Please try again.');
      }
      setStatus('success');
      setTimeout(() => navigate('/driver-app', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('form');
    }
  };

  const inputCls = 'w-full border py-4 px-4 bg-[#0a0a0a] border-[#262626] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-600';

  if (status === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6 font-['Oxanium'] text-center">
      <div className="w-20 h-20 bg-green-600/20 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold tracking-wider text-white mb-3">PASSWORD UPDATED</h1>
      <p className="text-sm text-white/60 max-w-xs leading-relaxed">
        Your password has been set. Redirecting you to sign in…
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-black font-['Oxanium']">
      {/* Header */}
      <div className="pt-16 pb-12 px-6 text-center border-b border-[#262626]">
        <div className="w-20 h-20 bg-red-600 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-wider text-white">SET NEW PASSWORD</h1>
        <p className="mt-2 text-white/60 text-sm">Choose a strong password for your account</p>
      </div>

      <div className="flex-1 px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-600/20 border border-red-600/50 p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-white/80">NEW PASSWORD</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={`${inputCls} pr-12`}
                required
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPw
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white/80">CONFIRM PASSWORD</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={inputCls}
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-4 tracking-wider transition-colors mt-2"
          >
            {status === 'submitting' ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                UPDATING...
              </span>
            ) : 'SET NEW PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
