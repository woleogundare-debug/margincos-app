export default function PassThroughBenchmarkChart() {
  const zones = [
    { label: 'At Risk',  range: '0 – 40%',  width: 40, color: '#C0392B', note: 'Margin destruction. Repricing or rationalisation required.' },
    { label: 'Watch',    range: '40 – 70%', width: 30, color: '#D4A843', note: 'Margin eroding. Action needed within 30 days.' },
    { label: 'Managed',  range: '70 – 90%', width: 20, color: '#0D8F8F', note: 'Margin protected. Monitor only.' },
    { label: 'Overshoot',range: '90%+',     width: 10, color: '#4A5568', note: 'Volume risk. Price may be exceeding market tolerance.' },
  ];

  const markers = [
    { label: 'Most companies sit here', pct: 47, color: '#C0392B' },
    { label: 'Leader benchmark',        pct: 75, color: '#0D8F8F' },
  ];

  return (
    <div className="stat-card">
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
        Pass-through rate benchmark zones
      </p>
      <p style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '24px', lineHeight: 1.3 }}>
        Where most companies sit — and where leaders sit
      </p>

      {/* Segmented bar */}
      <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
        {zones.map((z, i) => (
          <div key={i} style={{ width: `${z.width}%`, backgroundColor: z.color, opacity: 0.85 }} />
        ))}
      </div>

      {/* Marker pins */}
      <div style={{ position: 'relative', height: '28px', marginBottom: '20px' }}>
        {markers.map((m, i) => (
          <div key={i} style={{ position: 'absolute', left: `${m.pct}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
            <div style={{ width: '2px', height: '12px', backgroundColor: m.color, margin: '0 auto' }} />
            <p style={{ color: m.color, fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', marginTop: '3px' }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Zone legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
        {zones.map((z, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: z.color, flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ color: '#FFFFFF', fontSize: '11px', fontWeight: 700, marginBottom: '1px' }}>{z.label} <span style={{ color: z.color }}>{z.range}</span></p>
              <p style={{ color: '#8899AA', fontSize: '10px', lineHeight: 1.4 }}>{z.note}</p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ color: '#8899AA', fontSize: '11px', marginTop: '16px' }}>
        Source: Carthena Advisory analysis across FMCG and manufacturing portfolios, 2024–2026
      </p>
    </div>
  );
}
