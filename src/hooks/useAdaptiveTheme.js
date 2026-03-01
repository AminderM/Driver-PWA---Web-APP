import { useEffect, useState } from 'react';
import Vibrant from 'node-vibrant';
import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import labPlugin from 'colord/plugins/lab';

extend([mixPlugin, labPlugin]);

// Ensure contrast ratio >= 4.5 for normal text (WCAG AA)
function ensureContrast(bgHex, fgHex, minRatio = 4.5) {
  let fg = colord(fgHex);
  const bg = colord(bgHex);
  if (!bg.isValid()) return fgHex;
  if (!fg.isValid()) fg = colord('#111111');

  let ratio = fg.contrast(bg);
  if (ratio >= minRatio) return fg.toHex();

  // Try adjusting lightness
  let adjusted = fg;
  const isBgDark = bg.isDark();
  for (let i = 0; i < 20 && adjusted.contrast(bg) < minRatio; i++) {
    adjusted = isBgDark ? adjusted.lighten(0.05) : adjusted.darken(0.05);
  }
  if (adjusted.contrast(bg) >= minRatio) return adjusted.toHex();

  // Fallback to black/white
  return isBgDark ? '#FFFFFF' : '#111111';
}

function mapPaletteToCSSVariables(palette) {
  const primary = colord(palette.Vibrant?.hex || palette.Muted?.hex || '#2563eb');
  const secondary = colord(palette.LightVibrant?.hex || primary.mix('#ffffff', 0.7).toHex());
  const accent = colord(palette.DarkVibrant?.hex || primary.mix('#000000', 0.7).toHex());

  const bg = colord('#ffffff');
  const fg = colord('#0a0a0a');

  const primaryHex = primary.toHex();
  const secondaryHex = secondary.toHex();
  const accentHex = accent.toHex();

  const p = primary.toHsl();
  const s = secondary.toHsl();
  const a = accent.toHsl();
  const pf = colord(ensureContrast(primaryHex, '#ffffff')).toHsl();
  const sf = colord(ensureContrast(secondaryHex, '#0a0a0a')).toHsl();
  const af = colord(ensureContrast(accentHex, '#ffffff')).toHsl();

  const vars = {
    '--primary': `${p.h} ${p.s}% ${p.l}%`,
    '--primary-foreground': `${pf.h} ${pf.s}% ${pf.l}%`,
    '--secondary': `${s.h} ${s.s}% ${s.l}%`,
    '--secondary-foreground': `${sf.h} ${sf.s}% ${sf.l}%`,
    '--accent': `${a.h} ${a.s}% ${a.l}%`,
    '--accent-foreground': `${af.h} ${af.s}% ${af.l}%`,
    '--ring': `${p.h} ${p.s}% ${p.l}%`,
  };

  return vars;
}

function applyCSSVariables(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => {
    root.style.setProperty(k, v);
  });
}

export default function useAdaptiveTheme(logoUrl, { persist = false, companyId = null } = {}) {
  const [themeVars, setThemeVars] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!logoUrl) return;
      setLoading(true);
      setError(null);
      try {
        const palette = await Vibrant.from(logoUrl).getPalette();
        if (cancelled) return;
        const vars = mapPaletteToCSSVariables(palette);
        setThemeVars(vars);
        applyCSSVariables(vars);

        if (persist && companyId) {
          try {
            const payload = { theme: vars };
            const token = localStorage.getItem('auth_token');
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            await fetch(`${backendUrl}/api/companies/my`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          } catch (e) {
            // Non-blocking
            console.warn('Persist theme failed', e);
          }
        }
      } catch (e) {
        console.error('Adaptive theme error', e);
        setError('Failed to compute theme from logo');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [logoUrl, persist, companyId]);

  return { themeVars, loading, error };
}
