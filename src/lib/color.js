// OKLCH stops from far (yellow) to close (deep red) — [pct, L%, C, H].
// Chroma never drops below ~0.15 — the old far-end stop (C 0.03) was nearly
// as desaturated as the default unguessed fill (#c9bfa8), so far-away
// guesses were barely visible against it. Every stop now stays clearly
// saturated so any guess reads as "colored in", not just close ones.
const STOPS = [
  [0, 50, 0.22, 25],
  [0.2, 58, 0.21, 35],
  [0.4, 66, 0.19, 50],
  [0.6, 74, 0.17, 65],
  [0.8, 82, 0.16, 80],
  [1, 90, 0.15, 95],
];

export const WIN_COLOR = 'oklch(70% 0.19 145)';

export function colorForPct(pct, alpha) {
  pct = Math.max(0, Math.min(1, pct));
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (pct >= STOPS[i][0] && pct <= STOPS[i + 1][0]) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const span = b[0] - a[0] || 1;
  const t = (pct - a[0]) / span;
  const L = a[1] + (b[1] - a[1]) * t;
  const C = a[2] + (b[2] - a[2]) * t;
  const H = a[3] + (b[3] - a[3]) * t;
  return `oklch(${L.toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)}${alpha != null ? ` / ${alpha}` : ''})`;
}

export const SHARE_EMOJI = ['🟨', '🟧', '🟧', '🟠', '🔴', '🔴'];
