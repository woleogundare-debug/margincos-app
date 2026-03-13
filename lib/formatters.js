// ── Numeric extractor ─────────────────────────────────────────────────────
export const n = (v) => parseFloat(String(v || '').replace(/[₦,]/g, '')) || 0;

// ── Naira formatters ──────────────────────────────────────────────────────
export function fNAbs(val) {
  const v = Math.abs(val);
  if (v >= 1_000_000_000) return '₦' + (v / 1_000_000_000).toFixed(1) + 'B';
  if (v >= 1_000_000)     return '₦' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)         return '₦' + (v / 1_000).toFixed(0) + 'K';
  return '₦' + v.toFixed(0);
}

export function fN(val) {
  return (val < 0 ? '-' : '+') + fNAbs(val);
}

export function fNPlain(val) {
  return '₦' + Math.abs(val).toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

// ── HTML escape (for any dangerouslySetInnerHTML usage) ───────────────────
export function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Channel split parser ──────────────────────────────────────────────────
export function parseChannelSplit(str) {
  if (!str || !String(str).trim()) return null;
  const parts = String(str).split(',').map(s => s.trim()).filter(Boolean);
  const result = {};
  const VALID_CODES = new Set(['MT','OM','WS','HO','DI','EC','OT']);
  for (const part of parts) {
    const [code, pct] = part.split(':');
    if (!code || pct === undefined) return null;
    if (!VALID_CODES.has(code.trim().toUpperCase())) return null;
    result[code.trim().toUpperCase()] = parseFloat(pct);
  }
  const total = Object.values(result).reduce((s, v) => s + v, 0);
  if (Math.abs(total - 100) > 1) return null;
  return result;
}

// ── Channel code labels ───────────────────────────────────────────────────
export const CHANNEL_LABELS = {
  MT: 'Modern Trade',
  OM: 'Open Market',
  WS: 'Wholesale',
  HO: 'HoReCa',
  DI: 'Direct',
  EC: 'E-Commerce',
  OT: 'Other',
};
