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
        const barPct = (Math.abs(sku.gap) / MAX_ABS) * 100;
        const c   = color(sku.gap);
        const bg  = bgColor(sku.gap);

        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            marginBottom: i < skus.length - 1 ? '10px' : 0,
            padding: '8px 10px',
            background: bg,
            borderRadius: '8px',
            boxSizing: 'border-box',
          }}>
            {/* SKU name — fixed width, never wraps or clips the bar */}
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#1B2A4A',
              width: 130,
              flexShrink: 0,
              textAlign: 'right',
            }}>
              {sku.name}
            </span>

            {/* Bar container — takes all remaining space, shrinks on mobile */}
            <div style={{ flex: 1, minWidth: 0, height: '10px', position: 'relative' }}>
              <div style={{
                width: `${barPct}%`,
                height: '10px',
                background: c,
                borderRadius: '0 4px 4px 0',
                opacity: 0.85,
              }} />
            </div>

            {/* Value — fixed width, always stays inside the card */}
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: c,
              width: 52,
              flexShrink: 0,
              textAlign: 'left',
            }}>
              {sku.gap >= 0 ? `+₦${sku.gap}` : `₦${Math.abs(sku.gap)}`}
            </span>
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
