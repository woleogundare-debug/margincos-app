// Single source of truth for M1/M4 redesign chart tokens, classification colour
// maps, and the shared finding-header / legend / card UI. Locked brand palette
// (see lib/engine/CONVENTIONS.md and PLATFORM.BRAND_REFRESH.CLASSIFICATION_COLOURS).
export const TOKENS = {
  navy:  '#1B2A4A',
  red:   '#C0392B',
  teal:  '#0D8F8F',
  gold:  '#D4A843',
  green: '#10B981',
  muted: '#8896A7',
  rule:  '#E8ECF0',
  text:  '#5A6B80',
};

export const M1_COLORS = {
  '★ Protect': TOKENS.teal,
  '▲ Grow':    TOKENS.green,
  '⚠ Reprice': TOKENS.gold,
  '✗ Review':  TOKENS.red,
};

export const M4_COLORS = {
  '★ Strategic':   TOKENS.teal,
  '▲ Grow':        TOKENS.green,
  '⚠ Renegotiate': TOKENS.gold,
  '✗ Review':      TOKENS.red,
};

export const clsName = (s) => (s || '').replace(/^[^\w]+/, '').trim();

export const cardStyle = {
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F7FA 100%)',
  border: '1px solid #E8ECF0',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '24px',
};

// Abbreviated currency (matches lib/formatters fNAbs shape, symbol threaded).
export const fmtMoney = (v, sym = '₦') => {
  const a = Math.abs(v || 0), s = (v || 0) < 0 ? '-' : '';
  if (a >= 1e9) return `${s}${sym}${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${s}${sym}${(a / 1e6).toFixed(0)}M`;
  if (a >= 1e3) return `${s}${sym}${(a / 1e3).toFixed(0)}K`;
  return `${s}${sym}${a.toFixed(0)}`;
};

// Two-line finding header: gold small-caps module label + navy serif finding.
export function FindingHeader({ finding, fallbackLabel, fallbackTitle }) {
  const label = finding?.label || fallbackLabel;
  const sentence = finding?.sentence || fallbackTitle;
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: TOKENS.gold, fontFamily: 'DM Sans' }}>
          {label}
        </div>
      )}
      {sentence && (
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: 700, color: TOKENS.navy, marginTop: '4px', lineHeight: 1.3 }}>
          {sentence}
        </div>
      )}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
      {items.map(([label, color]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: TOKENS.text, fontFamily: 'DM Sans' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}
