export default function LaneCostFloorChart() {
  // Scale: max = 1,500,000 (just above cost floor 2026)
  const MAX = 1500000;

  const bars = [
    {
      label: 'Cost Floor (2024)',
      value: 940000,
      pct: (940000 / MAX) * 100,
      color: '#3A5068',
      sub: 'Viable at ₦1,100/litre diesel — rate cleared this comfortably',
    },
    {
      label: 'Contracted Rate',
      value: 1100000,
      pct: (1100000 / MAX) * 100,
      color: '#C0392B',
      sub: 'Rate locked 18 months ago — now below the 2026 cost floor',
    },
    {
      label: 'Cost Floor (2026)',
      value: 1360000,
      pct: (1360000 / MAX) * 100,
      color: '#1B2A4A',
      sub: 'Required rate at ₦1,700/litre diesel, 40% backhaul, 25% margin target',
    },
  ];

  const contractedPct = (1100000 / MAX) * 100;
  const floorPct      = (1360000 / MAX) * 100;

  return (
    <div className="stat-card">
      {/* Header */}
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
        Lane cost floor — worked example
      </p>
      <p style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '6px', lineHeight: 1.3 }}>
        Lagos-Kano, 30-tonne truck — Contracted Rate vs Cost Floor (₦ per trip)
      </p>
      <p style={{ color: '#A0B0C0', fontSize: '13px', marginBottom: '28px' }}>
        The contracted rate cleared the 2024 floor by ₦160,000. It now sits ₦260,000 below the 2026 floor.
      </p>

      {/* Bars */}
      {bars.map((bar, i) => (
        <div key={i} style={{ marginBottom: i === bars.length - 1 ? 0 : '20px' }}>
          <div className="stat-bar-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ color: '#A8B8CC' }}>{bar.label}</span>
            <span style={{ color: bar.color, fontWeight: 700, fontSize: '15px' }}>
              ₦{bar.value.toLocaleString()}
            </span>
          </div>

          <div style={{ position: 'relative', height: '12px', marginBottom: '6px', marginTop: '4px' }}>
            {/* Background track */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '6px',
            }} />

            {/* Danger zone: between contracted rate bar and 2026 cost floor bar */}
            {bar.label === 'Contracted Rate' && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${contractedPct}%`,
                width: `${floorPct - contractedPct}%`,
                background: 'rgba(192,57,43,0.18)',
                borderLeft: '2px dashed rgba(192,57,43,0.5)',
              }} />
            )}

            {/* Filled bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${bar.pct}%`,
              backgroundColor: bar.color,
              borderRadius: '6px',
            }} />

            {/* Cost Floor 2026: right-edge marker */}
            {bar.label === 'Cost Floor (2026)' && (
              <div style={{
                position: 'absolute', top: '-3px', bottom: '-3px',
                left: `${floorPct}%`,
                width: '2px',
                background: '#C8D6E4',
                borderRadius: '1px',
              }} />
            )}
          </div>

          <p style={{ color: '#6B7E90', fontSize: '11px', margin: 0 }}>{bar.sub}</p>
        </div>
      ))}

      {/* Gap callout */}
      <div style={{
        marginTop: '24px',
        padding: '12px 16px',
        background: 'rgba(192,57,43,0.12)',
        border: '1px solid rgba(192,57,43,0.25)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ color: '#C0392B', fontSize: '13px', fontWeight: 600 }}>
            Gap per trip
          </span>
          <span style={{ color: '#6B7E90', fontSize: '11px', marginLeft: '8px' }}>
            At 2 trips/week → ₦2.08M/month margin destruction
          </span>
        </div>
        <span style={{ color: '#C0392B', fontSize: '18px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif" }}>
          −₦260,000
        </span>
      </div>

      <p style={{ color: '#8899AA', fontSize: '12px', marginTop: '12px' }}>
        Lagos-Kano, 30-tonne truck, 40% backhaul recovery, 25% minimum margin. Diesel at ₦1,700/litre (March 2026).
      </p>
    </div>
  );
}
