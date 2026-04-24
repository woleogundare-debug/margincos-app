export default function PromoBreakevenChart() {
  const scenarios = [
    { discount: '5%', breakeven: 17, typical: 12, margin: 35, color: '#0D8F8F', verdict: 'Near breakeven' },
    { discount: '10%', breakeven: 40, typical: 18, margin: 35, color: '#D4A843', verdict: 'Margin loss' },
    { discount: '15%', breakeven: 75, typical: 23, margin: 35, color: '#C0392B', verdict: 'Heavy loss' },
    { discount: '20%', breakeven: 133, typical: 28, margin: 35, color: '#C0392B', verdict: 'Destructive' },
  ];

  const maxVal = 140;

  return (
    <div style={{
      margin: '2.5rem 0',
      background: '#1B2A4A',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid rgba(192, 57, 43, 0.2)',
    }}>
      <p style={{
        color: '#C0392B',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '6px',
      }}>
        Promotion Breakeven Analysis
      </p>
      <p style={{
        color: '#FFFFFF',
        fontSize: '20px',
        fontWeight: 700,
        fontFamily: "'Playfair Display', Georgia, serif",
        marginBottom: '8px',
        lineHeight: 1.3,
      }}>
        The volume lift most promotions never achieve
      </p>
      <p style={{
        color: '#8899AA',
        fontSize: '13px',
        marginBottom: '28px',
        lineHeight: 1.5,
      }}>
        At 35% gross margin, every discount depth requires a disproportionate volume response to break even.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {scenarios.map((s, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>
                {s.discount} discount
              </span>
              <span style={{ color: s.color, fontSize: '12px', fontWeight: 600 }}>
                {s.verdict}
              </span>
            </div>
            <div style={{ position: 'relative', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
              {/* Breakeven bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${Math.min((s.breakeven / maxVal) * 100, 100)}%`,
                backgroundColor: s.color,
                opacity: 0.2,
                borderRadius: '6px',
              }} />
              {/* Typical response bar */}
              <div style={{
                position: 'absolute',
                top: '6px',
                left: 0,
                height: '20px',
                width: `${(s.typical / maxVal) * 100}%`,
                backgroundColor: '#0D8F8F',
                borderRadius: '4px',
              }} />
              {/* Breakeven marker */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: `${Math.min((s.breakeven / maxVal) * 100, 98)}%`,
                height: '100%',
                width: '2px',
                backgroundColor: s.color,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ color: '#0D8F8F', fontSize: '11px' }}>
                Typical response: +{s.typical}%
              </span>
              <span style={{ color: s.color, fontSize: '11px' }}>
                Breakeven: +{s.breakeven}%{s.breakeven > 100 ? ' (unreachable)' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '20px', height: '10px', borderRadius: '3px', backgroundColor: '#0D8F8F' }} />
          <span style={{ color: '#8899AA', fontSize: '11px' }}>Typical volume response</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '2px', height: '16px', backgroundColor: '#C0392B' }} />
          <span style={{ color: '#8899AA', fontSize: '11px' }}>Breakeven volume lift required</span>
        </div>
      </div>

      <p style={{ color: '#5A6B80', fontSize: '11px', marginTop: '16px', textAlign: 'center' }}>
        Source: Carthena Advisory promotional effectiveness analysis across Nigerian FMCG portfolios, 2024-2026
      </p>
    </div>
  );
}
