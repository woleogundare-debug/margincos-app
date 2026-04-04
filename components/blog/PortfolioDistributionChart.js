export default function PortfolioDistributionChart() {
  // Illustrative products: some well-managed, some bleeding margin
  const products = [
    { name: 'Product A', rate: 92, rev: 18, color: '#0D8F8F' },
    { name: 'Product B', rate: 88, rev: 14, color: '#0D8F8F' },
    { name: 'Product C', rate: 85, rev: 11, color: '#0D8F8F' },
    { name: 'Product D', rate: 78, rev: 9,  color: '#0D8F8F' },
    { name: 'Product E', rate: 74, rev: 8,  color: '#0D8F8F' },
    { name: 'Product F', rate: 55, rev: 10, color: '#D4A843' },
    { name: 'Product G', rate: 48, rev: 8,  color: '#D4A843' },
    { name: 'Product H', rate: 22, rev: 11, color: '#C0392B' },
    { name: 'Product I', rate: 14, rev: 8,  color: '#C0392B' },
    { name: 'Product J', rate: 8,  rev: 3,  color: '#C0392B' },
  ];

  const blended = Math.round(
    products.reduce((sum, p) => sum + p.rate * p.rev, 0) /
    products.reduce((sum, p) => sum + p.rev, 0)
  );

  return (
    <div className="stat-card">
      <p style={{ color: '#D4A843', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
        The blended average trap
      </p>
      <p style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '6px', lineHeight: 1.3 }}>
        Blended portfolio rate: <span style={{ color: '#D4A843' }}>{blended}%</span>
      </p>
      <p style={{ color: '#8899AA', fontSize: '12px', marginBottom: '22px' }}>
        The headline looks manageable. Product-level reality is different.
      </p>

      {products.map((p, i) => (
        <div key={i} style={{ marginBottom: '10px' }}>
          <div className="stat-bar-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px' }}>{p.name} <span style={{ color: '#8899AA', fontWeight: 400 }}>({p.rev}% of revenue)</span></span>
            <span style={{ color: p.color, fontWeight: 700, fontSize: '11px' }}>{p.rate}%</span>
          </div>
          <div className="stat-bar-track" style={{ height: '8px' }}>
            <div className="stat-bar-fill" style={{ width: `${p.rate}%`, backgroundColor: p.color, height: '8px' }} />
          </div>
        </div>
      ))}

      {/* Blended marker line */}
      <div style={{ position: 'relative', marginTop: '4px' }}>
        <div style={{ position: 'absolute', left: `${blended}%`, top: '-130px', width: '1px', height: '120px', backgroundColor: '#D4A843', opacity: 0.4 }} />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
        {[{ color: '#0D8F8F', label: 'Managed (70%+)' }, { color: '#D4A843', label: 'Watch (40–70%)' }, { color: '#C0392B', label: 'At Risk (<40%)' }].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: l.color }} />
            <span style={{ color: '#8899AA', fontSize: '11px' }}>{l.label}</span>
          </div>
        ))}
      </div>
      <p style={{ color: '#8899AA', fontSize: '11px', marginTop: '12px' }}>
        Illustrative portfolio. Products, revenue weights, and rates are representative examples.
      </p>
    </div>
  );
}
