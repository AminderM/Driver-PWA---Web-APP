/**
 * Integra AI — UI Sound Effects
 * Synthesized via Web Audio API — no audio files required.
 * All sounds respect the user's mute preference stored in localStorage.
 */

const MUTE_KEY = 'integra_sounds_muted';

export const isMuted = () => {
  try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
};

export const setMuted = (muted) => {
  try { localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false'); } catch {}
};

export const toggleMute = () => {
  const next = !isMuted();
  setMuted(next);
  return next;
};

// Lazily create a single shared AudioContext (browsers require user gesture first)
let _ctx = null;
const getCtx = () => {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
};

/**
 * Low-level tone burst helper.
 * @param {object} opts
 *   frequency    - Hz
 *   duration     - seconds
 *   type         - OscillatorType ('sine'|'square'|'triangle'|'sawtooth')
 *   gainPeak     - 0–1 initial gain
 *   startDelay   - seconds before onset
 *   endGain      - gain to ramp down to (default 0)
 */
const tone = (opts) => {
  const ctx = getCtx();
  if (!ctx) return;
  const {
    frequency = 440,
    duration  = 0.08,
    type      = 'sine',
    gainPeak  = 0.25,
    startDelay = 0,
    endGain    = 0,
  } = opts;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type      = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);

  gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
  gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + startDelay + 0.005);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(endGain, 0.0001),
    ctx.currentTime + startDelay + duration,
  );

  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + duration + 0.01);
};

// ── Sound definitions ─────────────────────────────────────────────────────────

/**
 * tap — short mechanical click for any primary button press.
 * Two-layer: high transient + low body.
 */
const tap = () => {
  // High transient click
  tone({ frequency: 1200, duration: 0.045, type: 'square',   gainPeak: 0.12 });
  // Low body
  tone({ frequency: 180,  duration: 0.06,  type: 'triangle', gainPeak: 0.10 });
};

/**
 * back — softer, slightly lower click for navigation back / cancel.
 */
const back = () => {
  tone({ frequency: 800,  duration: 0.04,  type: 'square',   gainPeak: 0.08 });
  tone({ frequency: 140,  duration: 0.05,  type: 'triangle', gainPeak: 0.07 });
};

/**
 * success — double-tone upward chime (payment recorded, save complete).
 */
const success = () => {
  tone({ frequency: 523, duration: 0.10, type: 'sine', gainPeak: 0.18 });                      // C5
  tone({ frequency: 784, duration: 0.12, type: 'sine', gainPeak: 0.18, startDelay: 0.09 });    // G5
};

/**
 * scan — camera shutter + confirm ping.
 */
const scan = () => {
  // Shutter: broadband noise burst (white noise via buffer)
  const ctx = getCtx();
  if (ctx) {
    const bufLen  = ctx.sampleRate * 0.04;
    const buffer  = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data    = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const src  = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    src.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + 0.05);
  }
  // Confirm ping
  tone({ frequency: 660, duration: 0.12, type: 'sine', gainPeak: 0.15, startDelay: 0.05 });
};

/**
 * error — short low descending buzz.
 */
const error = () => {
  tone({ frequency: 220, duration: 0.12, type: 'sawtooth', gainPeak: 0.12 });
  tone({ frequency: 160, duration: 0.10, type: 'sawtooth', gainPeak: 0.10, startDelay: 0.08 });
};

// ── Public API ────────────────────────────────────────────────────────────────

const SOUNDS = { tap, back, success, scan, error };

/**
 * play('tap' | 'back' | 'success' | 'scan' | 'error')
 * Silently no-ops if muted or if the browser blocks audio.
 */
export const play = (name) => {
  if (isMuted()) return;
  try { SOUNDS[name]?.(); } catch {}
};
