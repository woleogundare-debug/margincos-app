import { useState } from 'react';
import { TOKENS, M1_COLORS, clsName, cardStyle, FindingHeader, Legend } from './chartTokens';

/**
 * M1 SKU Portfolio Rationalisation - Marimekko (custom SVG, not Recharts).
 * Width = revenue share (tiles to 100%), height = gross margin on a FIXED 0-100
 * scale so a 35% margin renders at 35% of chart height. Quadrant colour by
 * classification; horizontal labels only (>3% width); avg-margin reference line.
 */
export default function M1MarimekkoChart({ results, portfolioAvgMarginPct, finding, cfg }) {
  const [hover, setHover] = useState(null);
  if (!results?.length) return null;

  const W = 760, H = 360, x0 = 44, y0 = 12, cw = W - 88, ch = 300;
  const order = { Protect: 0, Grow: 1, Reprice: 2, Review: 3 };
  const items = [...results].sort(
    (a, b) => (order[clsName(a.classification)] - order[clsName(b.classification)]) || (b.revShare - a.revShare)
  );
  const yOf = (m) => y0 + ch - (m / 100) * ch;      // fixed 0-100 scale
  const hOf = (m) => (m / 100) * ch;

  let cx = x0;
  const rects = items.map((r) => {
    const w = (r.revShare / 100) * cw;
    const rect = { r, x: cx, y: yOf(r.skuMarginPct), w: Math.max(0, w - 0.6), h: hOf(r.skuMarginPct) };
    cx += w;
    return rect;
  });
  const avgY = yOf(portfolioAvgMarginPct || 0);

  return (
    <div style={cardStyle}>
      <FindingHeader finding={finding} fallbackLabel="M1 · SKU PORTFOLIO RATIONALISATION" fallbackTitle="Portfolio quadrant Marimekko" />
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H + 40}`} width="100%" style={{ fontFamily: 'DM Sans' }} onMouseLeave={() => setHover(null)}>
          {[0, 20, 40, 60, 80, 100].map((t) => (
            <g key={t}>
              <line x1={x0 - 4} y1={yOf(t)} x2={x0} y2={yOf(t)} stroke={TOKENS.rule} />
              <text x={x0 - 7} y={yOf(t) + 3} fontSize="8" fill={TOKENS.muted} textAnchor="end">{t}%</text>
            </g>
          ))}
          <line x1={x0} y1={y0} x2={x0} y2={y0 + ch} stroke={TOKENS.rule} />
          <line x1={x0} y1={y0 + ch} x2={x0 + cw} y2={y0 + ch} stroke={TOKENS.rule} />
          {rects.map((b, i) => (
            <g key={i}>
              <rect
                x={b.x} y={b.y} width={b.w} height={b.h}
                fill={M1_COLORS[b.r.classification] || TOKENS.muted}
                opacity={hover && hover.skuId === b.r.skuId ? 1 : 0.92}
                onMouseEnter={() => setHover(b.r)}
                style={{ cursor: 'pointer' }}
              />
              {b.w > cw * 0.03 && (
                <text x={b.x + b.w / 2} y={b.y + 11} fontSize="7" fill="#fff" textAnchor="middle" pointerEvents="none">{b.r.skuId}</text>
              )}
            </g>
          ))}
          <line x1={x0} y1={avgY} x2={x0 + cw} y2={avgY} stroke={TOKENS.gold} strokeWidth="1.3" strokeDasharray="6 4" />
          <text x={x0 + cw} y={avgY - 4} fontSize="9" fill={TOKENS.gold} textAnchor="end">Avg margin {(portfolioAvgMarginPct || 0).toFixed(1)}%</text>
          <text x={x0} y={y0 + ch + 18} fontSize="9" fill={TOKENS.muted}>Width = revenue share (sums to 100%)   Height = gross margin %</text>
        </svg>
        {hover && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px', background: '#fff',
            border: '1px solid #E8ECF0', borderRadius: '8px', padding: '10px 14px',
            fontFamily: 'DM Sans', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', pointerEvents: 'none',
          }}>
            <div style={{ fontWeight: 700, color: TOKENS.navy, marginBottom: '2px' }}>{hover.sku}</div>
            <div style={{ color: TOKENS.text }}>Revenue share: {hover.revShare.toFixed(1)}%</div>
            <div style={{ color: TOKENS.text }}>Margin: {hover.skuMarginPct.toFixed(1)}%</div>
            <div style={{ color: M1_COLORS[hover.classification], fontWeight: 600, marginTop: '2px' }}>{clsName(hover.classification)}</div>
          </div>
        )}
      </div>
      <Legend items={[['Protect', TOKENS.teal], ['Grow', TOKENS.green], ['Reprice', TOKENS.gold], ['Review', TOKENS.red]]} />
    </div>
  );
}
