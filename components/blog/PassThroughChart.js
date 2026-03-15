export default function PassThroughChart() {
  const bars = [
    { label: 'Nigerian average (most companies)', pct: 38, color: '#C0392B', text: '35–45%' },
    { label: 'Nigerian FMCG leaders (benchmark)', pct: 72, color: '#0D8F8F', text: '70–75%' },
    { label: 'Recovery gap (available margin)', pct: 34, color: '#D4A843', text: '~30pp gap' },
  ];

  return (
    <div className="stat-card">
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
        Cost pass-through rate
      </p>
      <p style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '28px', lineHeight: 1.3 }}>
        The gap between what companies recover and what leaders recover
      </p>
      {bars.map((bar, i) => (
        <div key={i}>
          <div className="stat-bar-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{bar.label}</span>
            <span style={{ color: bar.color, fontWeight: 600 }}>{bar.text}</span>
          </div>
          <div className="stat-bar-track">
            <div className="stat-bar-fill" style={{ width: `${bar.pct}%`, backgroundColor: bar.color }} />
          </div>
        </div>
      ))}
      <p style={{ color: '#8899AA', fontSize: '12px', marginTop: '8px' }}>
        Source: Carthena Advisory analysis across Nigerian FMCG portfolios, 2024–2026
      </p>
    </div>
  );
}
