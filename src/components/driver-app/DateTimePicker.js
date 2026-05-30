import React, { useState, useEffect } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS_SHORT  = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTHS_FULL = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN',
                      'JUL','AUG','SEP','OCT','NOV','DEC'];

const FD = "'Barlow Condensed', sans-serif";
const FM = "'Share Tech Mono', monospace";

// Parse "YYYY-MM-DDTHH:mm" → Date (local)
const parseLocal = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d) ? null : d;
};

// Format Date → "YYYY-MM-DDTHH:mm" (local)
const toLocalDT = (date) => {
  if (!date) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ── Chevron time wheel ────────────────────────────────────────────────────────
const TimeWheel = ({ value, onChange, max, step = 1, color, borderC, surface, textMain, textDim }) => {
  const pad = n => String(n).padStart(2, '0');
  const inc = () => onChange((value + step) % max);
  const dec = () => onChange((value - step + max) % max);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button type="button" onClick={inc}
        style={{ width: 60, height: 36, background: 'none', border: `1px solid ${borderC}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="9" fill="none" stroke={textDim} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 14 9">
          <path d="M1 8L7 2l6 6" />
        </svg>
      </button>

      <div style={{ width: 60, height: 56, background: surface, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: FD, fontSize: 28, fontWeight: 900, color: textMain, letterSpacing: '0.04em', lineHeight: 1 }}>
          {pad(value)}
        </span>
      </div>

      <button type="button" onClick={dec}
        style={{ width: 60, height: 36, background: 'none', border: `1px solid ${borderC}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="9" fill="none" stroke={textDim} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 14 9">
          <path d="M1 1L7 7l6-6" />
        </svg>
      </button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const DateTimePicker = ({ value, onChange, label, optional, isDark }) => {
  // ── Colors keyed to theme ───────────────────────────────────────────────
  const bg      = isDark ? '#080808'  : '#ffffff';
  const surface = isDark ? '#0f0f0f'  : '#f5f5f5';
  const card    = isDark ? '#161616'  : '#eeeeee';
  const textMain= isDark ? '#EDE9E3'  : '#1A1814';
  const textDim = isDark ? '#555250'  : '#70706E';
  const borderC = isDark ? '#2a2a2a'  : '#e0e0e0';
  const red     = '#CC2222';
  const redDim  = isDark ? 'rgba(204,34,34,0.15)' : 'rgba(204,34,34,0.08)';

  // ── Internal state ───────────────────────────────────────────────────────
  const existing = parseLocal(value);
  const now = new Date();

  const [open,      setOpen]     = useState(false);
  const [viewYear,  setViewYear] = useState((existing || now).getFullYear());
  const [viewMonth, setViewMo]   = useState((existing || now).getMonth());
  const [selDay,    setSelDay]   = useState(existing ? {
    y: existing.getFullYear(), m: existing.getMonth(), d: existing.getDate()
  } : null);
  const [hour, setHour] = useState(existing?.getHours()   ?? 8);
  const [min,  setMin]  = useState(Math.round((existing?.getMinutes() ?? 0) / 5) * 5 % 60);

  // Re-sync when prop changes
  useEffect(() => {
    const p = parseLocal(value);
    if (p) {
      setViewYear(p.getFullYear());
      setViewMo(p.getMonth());
      setSelDay({ y: p.getFullYear(), m: p.getMonth(), d: p.getDate() });
      setHour(p.getHours());
      setMin(Math.round(p.getMinutes() / 5) * 5 % 60);
    }
  }, [value]);

  // ── Calendar helpers ─────────────────────────────────────────────────────
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday  = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMo(11); }
    else setViewMo(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMo(0); }
    else setViewMo(m => m + 1);
  };

  const isSelected = (d) => selDay && d === selDay.d && viewMonth === selDay.m && viewYear === selDay.y;
  const isToday    = (d) => d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();

  // ── Confirm / Clear ──────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!selDay) return;
    const d = new Date(selDay.y, selDay.m, selDay.d, hour, min, 0, 0);
    onChange(toLocalDT(d));
    setOpen(false);
  };

  const handleClear = () => { onChange(''); setSelDay(null); setOpen(false); };

  // ── Trigger label ────────────────────────────────────────────────────────
  const displayText = (() => {
    if (!value || !selDay) return null;
    const d = new Date(selDay.y, selDay.m, selDay.d, hour, min);
    const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const h   = d.getHours() % 12 || 12;
    const ap  = d.getHours() >= 12 ? 'PM' : 'AM';
    const mm  = String(d.getMinutes()).padStart(2, '0');
    return `${dow}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()} · ${h}:${mm} ${ap}`;
  })();

  // ── Calendar grid cells ──────────────────────────────────────────────────
  const cells = Array(firstWeekday).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Field label ── */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)', fontFamily: FD }}>
          {label}{optional && <span style={{ fontWeight: 400, marginLeft: 4, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>(optional)</span>}
        </label>

        {/* ── Trigger button ── */}
        <button type="button" onClick={() => setOpen(true)}
          style={{ width: '100%', border: `1px solid ${displayText ? red + '55' : borderC}`, background: isDark ? '#0a0a0a' : '#fff', padding: '11px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: FD, fontSize: 15, color: displayText ? textMain : textDim, letterSpacing: '0.03em' }}>
            {displayText || 'Select date & time'}
          </span>
          <svg width="16" height="16" fill="none" stroke={displayText ? red : textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="1" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
      </div>

      {/* ── Bottom sheet ── */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
            onClick={() => setOpen(false)} />

          {/* Sheet */}
          <div style={{ position: 'relative', background: bg, borderTop: `2px solid ${red}`, maxHeight: '88vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>

            {/* ── Sheet header ── */}
            <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderC}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 20, background: red }} />
                <span style={{ fontFamily: FD, fontSize: 16, fontWeight: 800, letterSpacing: '0.12em', color: textMain, textTransform: 'uppercase' }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {value && (
                  <button type="button" onClick={handleClear}
                    style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.12em', color: textDim, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                    CLEAR
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)}
                  style={{ width: 28, height: 28, background: 'none', border: `1px solid ${borderC}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textDim, fontSize: 16, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            </div>

            {/* ── Calendar ── */}
            <div style={{ padding: '16px 16px 12px' }}>

              {/* Month navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button type="button" onClick={prevMonth}
                  style={{ width: 36, height: 36, background: 'none', border: `1px solid ${borderC}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textDim }}>
                  <svg width="8" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 8 13">
                    <path d="M7 1L1 6.5 7 12" />
                  </svg>
                </button>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: FD, fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', color: textMain, margin: 0, textTransform: 'uppercase' }}>
                    {MONTHS_FULL[viewMonth]}
                  </p>
                  <p style={{ fontFamily: FM, fontSize: 10, color: textDim, margin: '1px 0 0', letterSpacing: '0.1em' }}>{viewYear}</p>
                </div>

                <button type="button" onClick={nextMonth}
                  style={{ width: 36, height: 36, background: 'none', border: `1px solid ${borderC}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textDim }}>
                  <svg width="8" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 8 13">
                    <path d="M1 1L7 6.5 1 12" />
                  </svg>
                </button>
              </div>

              {/* Day-of-week headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                {DAYS_SHORT.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontFamily: FM, fontSize: 9, letterSpacing: '0.1em', color: textDim, padding: '3px 0' }}>{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {cells.map((day, i) => {
                  const sel = isSelected(day);
                  const tod = isToday(day);
                  return (
                    <button key={i} type="button" disabled={!day}
                      onClick={() => day && setSelDay({ y: viewYear, m: viewMonth, d: day })}
                      style={{
                        aspectRatio: '1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: FD, fontSize: 15, fontWeight: sel ? 800 : 400,
                        cursor: day ? 'pointer' : 'default',
                        background: sel ? red : tod ? redDim : 'transparent',
                        color: sel ? '#fff' : tod ? red : day ? textMain : 'transparent',
                        border: tod && !sel ? `1px solid ${red}50` : '1px solid transparent',
                        transition: 'background 0.1s',
                      }}>
                      {day || ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: 1, background: borderC, margin: '0 16px' }} />

            {/* ── Time picker ── */}
            <div style={{ padding: '16px' }}>
              <p style={{ fontFamily: FM, fontSize: 8, letterSpacing: '0.2em', color: textDim, textTransform: 'uppercase', margin: '0 0 14px' }}>// TIME</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <TimeWheel value={hour} onChange={setHour} max={24} step={1}
                  color={red} borderC={borderC} surface={card} textMain={textMain} textDim={textDim} />

                <span style={{ fontFamily: FD, fontSize: 32, fontWeight: 900, color: textMain, lineHeight: 1, marginTop: -4 }}>:</span>

                <TimeWheel value={min} onChange={setMin} max={60} step={5}
                  color={red} borderC={borderC} surface={card} textMain={textMain} textDim={textDim} />

                {/* AM / PM indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 4 }}>
                  {['AM','PM'].map(ap => {
                    const active = (ap === 'AM') === (hour < 12);
                    return (
                      <button key={ap} type="button"
                        onClick={() => {
                          if (ap === 'AM' && hour >= 12) setHour(h => h - 12);
                          if (ap === 'PM' && hour < 12)  setHour(h => h + 12);
                        }}
                        style={{ fontFamily: FM, fontSize: 10, letterSpacing: '0.1em', width: 40, height: 26, background: active ? red : 'transparent', color: active ? '#fff' : textDim, border: `1px solid ${active ? red : borderC}`, cursor: 'pointer' }}>
                        {ap}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick time shortcuts */}
              <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                {[[6,0],[8,0],[10,0],[12,0],[14,0],[17,0],[20,0]].map(([h,m]) => {
                  const active = hour === h && min === m;
                  const label  = `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h < 12 ? 'AM' : 'PM'}`;
                  return (
                    <button key={h} type="button" onClick={() => { setHour(h); setMin(m); }}
                      style={{ fontFamily: FM, fontSize: 9, letterSpacing: '0.08em', padding: '4px 8px', background: active ? red : 'transparent', color: active ? '#fff' : textDim, border: `1px solid ${active ? red : borderC}`, cursor: 'pointer' }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Confirm button ── */}
            <div style={{ padding: '4px 16px 20px' }}>
              <button type="button" onClick={handleConfirm} disabled={!selDay}
                style={{
                  width: '100%', border: 'none', cursor: selDay ? 'pointer' : 'not-allowed',
                  background: selDay ? red : isDark ? '#1a0808' : '#f0e8e8',
                  color: selDay ? '#fff' : textDim,
                  fontFamily: FD, fontWeight: 800, fontSize: 15,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  padding: '15px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                {selDay ? (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {`CONFIRM — ${MONTHS_SHORT[selDay.m]} ${selDay.d}, ${String(hour % 12 || 12).padStart(2,'0')}:${String(min).padStart(2,'0')} ${hour < 12 ? 'AM' : 'PM'}`}
                  </>
                ) : 'SELECT A DATE FIRST'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default DateTimePicker;
