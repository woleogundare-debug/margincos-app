export default function RepricingGapChart() {
  const skus = [
    { name: 'Milo 400g',           gap: +120, },
    { name: 'Frytol 1L',           gap:  +85, },
    { name: 'Dangote Sugar 1kg',   gap:  -95, },
    { name: 'Indomie Chicken 70g', gap: -148, },
    { name: 'Close-Up 150ml',      gap: -210, },
    { name: 'Frytol 500ml',        gap: -312, },
    { name: 'Pampers S1 10s',      gap: -445, },
    { name: 'Milo 200g',           gap: -474, },
  ];

  const MAX_ABS = 474; // largest absolute value, used for scaling
  // Each bar occupies up to 42% of total track width (leaving room for labels)
  const TRACK_PCT = 42;

  const color = (gap) => gap >= 0 ? '#1A9E5C' : '#C0392B';
  const bgColor = (gap) => gap >= 0 ? 'rgba(26,158,92,0.08)' : 'rgba(192,57,43,0.07)';

  return (
    <div style={{ margin: '2.5rem 0', background: '#F8FAFC', border: '1px solid #E5E8EC', borderRadius: '16px', padding: '28px 24px 20px' }}>

      {/* Header */}
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
        Repricing gap analysis
      </p>
      <p style={{ color: '#1B2A4A', fontSize: '18px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '4px', lineHeight: 1.3 }}>
        Repricing Gap by SKU (Current RRP vs RRP Floor, ₦)
      </p>
      <p style={{ color: '#8899AA', fontSize: '13px', marginBottom: '20px' }}>
        6 of 8 SKUs are operating below their RRP floor. The gap accumulates silently.
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', color: '#1A9E5C', fontWeight: 600 }}>
          ▮ Above floor (headroom)
        </span>
        <span style={{ fontSize: '11px', color: '#C0392B', fontWeight: 600 }}>
          ▮ Below floor (margin leakage)
        </span>
      </div>

      {/* Chart rows */}
      {skus.map((sku, i) => {
        const barPct = (Math.abs(sku.gap) / MAX_ABS) * TRACK_PCT;
        const isNeg  = sku.gap < 0;
        const c      = color(sku.gap);
        const bg     = bgColor(sku.gap);

        return (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: `${TRACK_PCT}% 1fr ${TRACK_PCT}%`,
            alignItems: 'center',
            gap: '0',
            marginBottom: i < skus.length - 1 ? '10px' : 0,
            padding: '8px 10px',
            background: bg,
            borderRadius: '8px',
          }}>
            {/* Left side: negative bars grow rightward from right edge */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '20px', paddingRight: '4px' }}>
              {isNeg && (
                <div style={{
                  width: `${barPct / TRACK_PCT * 100}%`,
                  height: '10px',
                  background: c,
                  borderRadius: '4px 0 0 4px',
                  opacity: 0.85,
                }} />
              )}
            </div>

            {/* Centre: SKU name */}
            <div style={{ textAlign: 'center', padding: '0 6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1B2A4A', whiteSpace: 'nowrap' }}>
                {sku.name}
              </span>
            </div>

            {/* Right side: positive bars grow leftward from left edge, value label */}
            <div style={{ display: 'flex', alignItems: 'center', height: '20px', paddingLeft: '4px', gap: '6px' }}>
              {!isNeg && (
                <div style={{
                  width: `${barPct / TRACK_PCT * 100}%`,
                  height: '10px',
                  background: c,
                  borderRadius: '0 4px 4px 0',
                  opacity: 0.85,
                }} />
              )}
              <span style={{ fontSize: '12px', fontWeight: 700, color: c, whiteSpace: 'nowrap', marginLeft: isNeg ? 'auto' : '0' }}>
                {sku.gap >= 0 ? '+' : ''}₦{Math.abs(sku.gap)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Summary footer */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E8EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#8899AA', fontSize: '11px', margin: 0 }}>
          Source: Carthena Advisory analysis across Nigerian FMCG portfolios, Q1 2026.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#C0392B', fontFamily: "'Playfair Display', Georgia, serif", margin: 0 }}>6/8</p>
            <p style={{ fontSize: '10px', color: '#8899AA', margin: 0 }}>SKUs below floor</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#C0392B', fontFamily: "'Playfair Display', Georgia, serif", margin: 0 }}>₦2,158</p>
            <p style={{ fontSize: '10px', color: '#8899AA', margin: 0 }}>Total gap (₦/mo est.)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
