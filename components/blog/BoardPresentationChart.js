export default function BoardPresentationChart() {
  const metrics = [
    {
      number: '58%',
      label: 'Portfolio pass-through rate',
      sub: 'Recovering less than 3-in-5 dollars of cost inflation',
      color: '#D4A843',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      number: '$172M',
      label: 'Revenue at risk',
      sub: '32% of total revenue running below 40% cost recovery',
      color: '#C0392B',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      number: '$47M',
      label: 'Monthly recovery opportunity',
      sub: 'Margin improvement if At Risk and Watch products reach 75%',
      color: '#0D8F8F',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      ),
    },
  ];

  return (
    <div className="stat-card">
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
        The three board numbers
      </p>
      <p style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '24px', lineHeight: 1.3 }}>
        How to present cost pass-through to ExCo
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '16px',
            padding: '16px', borderRadius: '10px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderLeft: `3px solid ${m.color}`,
          }}>
            <div style={{ color: m.color, flexShrink: 0, marginTop: '2px' }}>{m.icon}</div>
            <div>
              <p style={{ color: m.color, fontSize: '26px', fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, marginBottom: '4px' }}>
                {m.number}
              </p>
              <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, marginBottom: '3px' }}>{m.label}</p>
              <p style={{ color: '#8899AA', fontSize: '11px', lineHeight: 1.5 }}>{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: '#8899AA', fontSize: '11px', marginTop: '16px' }}>
        Illustrative example. Numbers are representative of a mid-size FMCG portfolio running below benchmark recovery.
      </p>
    </div>
  );
}
