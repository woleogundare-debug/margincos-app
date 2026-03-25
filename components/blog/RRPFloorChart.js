export default function RRPFloorChart() {
  // All values in ₦. Scale bars relative to WTP Ceiling (max = 2650).
  const MAX = 2650;
  const bars = [
    { label: 'WTP Ceiling',        value: 2650, color: '#D4A843', pct: 100,  sub: 'Consumer willingness-to-pay upper bound' },
    { label: 'Cost Floor',         value: 2324, color: '#3A5068', pct: 87.7, sub: 'Minimum RRP to preserve 32% gross margin' },
    { label: 'Competitor Anchor',  value: 2114, color: '#0D8F8F', pct: 79.8, sub: 'Reference RRP from nearest competitor SKU' },
    { label: 'Current RRP',        value: 1850, color: '#C0392B', pct: 69.8, sub: 'Actual shelf price — below cost floor' },
  ];

  // Floor sits at 87.7% of track width — used for the danger zone overlay
  const floorPct = 87.7;
  const rrpPct   = 69.8;

  return (
    <div className="stat-card">
      {/* Header */}
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
        RRP Floor calculation
      </p>
      <p style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '6px', lineHeight: 1.3 }}>
        500g Cooking Oil — RRP vs Floor Inputs (₦)
      </p>
      <p style={{ color: '#A0B0C0', fontSize: '13px', marginBottom: '28px' }}>
        Current RRP sits ₦474 below the cost floor — operating at 14.6% actual gross margin against a 32% target.
      </p>

      {/* Bars */}
      {bars.map((bar, i) => (
        <div key={i} style={{ marginBottom: i === bars.length - 1 ? 0 : '20px' }}>
          <div className="stat-bar-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ color: bar.color === '#3A5068' ? '#C8D6E4' : '#A8B8CC' }}>{bar.label}</span>
            <span style={{ color: bar.color, fontWeight: 700, fontSize: '15px' }}>
              ₦{bar.value.toLocaleString()}
            </span>
          </div>

          {/* Bar track with relative positioning to allow danger-zone overlay */}
          <div style={{ position: 'relative', height: '12px', marginBottom: '6px', marginTop: '4px' }}>
            {/* Background track */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '6px',
            }} />

            {/* Danger zone between Current RRP and Cost Floor (only shown on first/last relevant rows) */}
            {bar.label === 'Current RRP' && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${rrpPct}%`,
                width: `${floorPct - rrpPct}%`,
                background: 'rgba(192,57,43,0.15)',
                borderLeft: '2px dashed rgba(192,57,43,0.5)',
              }} />
            )}

            {/* Filled bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${bar.pct}%`,
              backgroundColor: bar.color,
              borderRadius: '6px',
              opacity: bar.label === 'Cost Floor' ? 1 : 0.9,
            }} />

            {/* Cost Floor: add a right-edge marker */}
            {bar.label === 'Cost Floor' && (
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
        <span style={{ color: '#C0392B', fontSize: '13px', fontWeight: 600 }}>
          Gap to cost floor
        </span>
        <span style={{ color: '#C0392B', fontSize: '18px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif" }}>
          −₦474
        </span>
      </div>

      <p style={{ color: '#8899AA', fontSize: '12px', marginTop: '12px' }}>
        Source: Carthena Advisory analysis. Costs indexed to current FMCG input basket, Q1 2026.
      </p>
    </div>
  );
}
