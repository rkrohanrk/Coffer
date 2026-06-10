// Sector palette, ported from the design (pms-data.js). Shared chroma/lightness,
// hue varies — tuned for the dark theme.
export const SECTOR_COLORS: Record<string, string> = {
  IT: "oklch(0.80 0.13 230)",
  Banking: "oklch(0.82 0.13 150)",
  Financials: "oklch(0.80 0.13 190)",
  Energy: "oklch(0.80 0.13 90)",
  Telecom: "oklch(0.80 0.13 320)",
  FMCG: "oklch(0.80 0.13 50)",
  Auto: "oklch(0.78 0.13 270)",
  Metals: "oklch(0.78 0.13 20)",
  Pharma: "oklch(0.82 0.13 165)",
  "Capital Goods": "oklch(0.80 0.13 110)",
  Power: "oklch(0.80 0.13 60)",
  Consumer: "oklch(0.78 0.13 350)",
  Conglomerate: "oklch(0.78 0.13 250)",
};

const FALLBACK_HUES = [150, 230, 90, 320, 50, 270, 20, 165, 110, 60, 350, 190];

export function sectorColor(sector: string | null | undefined): string {
  if (!sector) return "oklch(0.80 0.13 150)";
  if (SECTOR_COLORS[sector]) return SECTOR_COLORS[sector];
  // Deterministic colour for any sector not in the base palette.
  let h = 0;
  for (let i = 0; i < sector.length; i++) h = (h * 31 + sector.charCodeAt(i)) % 360;
  const hue = FALLBACK_HUES[sector.length % FALLBACK_HUES.length] ?? h;
  return `oklch(0.80 0.13 ${hue})`;
}

export function tkLabel(sym: string): string {
  return sym.replace(/\.[A-Z]+$/, "").slice(0, 3);
}

// Static, representative NSE index strip. The backend serves end-of-day equity
// prices only and has no index feed, so these are clearly-labelled reference
// levels (~May 2026 snapshot from the design), not live quotes.
export const INDICES = [
  { sym: "NIFTY 50", val: 23687.0, pc: 23860.0 },
  { sym: "SENSEX", val: 77942.0, pc: 78512.0 },
  { sym: "BANK NIFTY", val: 53104.0, pc: 53330.0 },
  { sym: "NIFTY IT", val: 31480.0, pc: 31712.0 },
];

// Seeded pseudo-random sparkline/series generator (design-ported). Used only for
// decorative trend visuals where the backend exposes no price history.
export function genSeries(seed: number, n: number, endVal: number, vol: number): number[] {
  let s = (seed * 9973) % 233280;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out = new Array<number>(n);
  let v = endVal;
  for (let i = n - 1; i >= 0; i--) {
    out[i] = v;
    v = v / (1 + (rnd() - 0.5) * vol);
  }
  return out;
}

export function genNav(endVal: number, n: number): number[] {
  let s = 7321;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out = new Array<number>(n);
  let v = endVal || 1;
  for (let i = n - 1; i >= 0; i--) {
    out[i] = Math.round(v);
    const drift = 0.0016;
    v = (v * (1 - drift)) / (1 + (rnd() - 0.5) * 0.013);
  }
  return out;
}
