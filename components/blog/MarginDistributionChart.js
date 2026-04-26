export default function MarginDistributionChart() {
  const bins = [
    { range: '0-10%', count: 2, cluster: 'low' },
    { range: '10-20%', count: 5, cluster: 'low' },
    { range: '20-30%', count: 8, cluster: 'low' },
    { range: '30-40%', count: 6, cluster: 'low' },
    { range: '40-50%', count: 3, cluster: 'mid' },
    { range: '50-60%', count: 2, cluster: 'mid' },
    { range: '60-70%', count: 3, cluster: 'mid' },
    { range: '70-80%', count: 7, cluster: 'high' },
    { range: '80-90%', count: 12, cluster: 'high' },
    { range: '90-100%', count: 8, cluster: 'high' },
  ];

  const maxCount = Math.max(...bins.map(b => b.count));

  const clusterColors = {
    low: '#C0392B',
    mid: '#D4A843',
    high: '#0D8F8F',
  };

  return (
    <div style={{
      margin: '2.5rem 0',
      background: '#1B2A4A',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid rgba(13, 143, 143, 0.2)',
    }}>
      <p style={{
        color: '#0D8F8F',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '6px',
      }}>
        SKU-Level Pass-Through Distribution
      </p>
      <p style={{
        color: '#FFFFFF',
        fontSize: '20px',
        fontWeight: 700,
        fontFamily: "'Playfair Display', Georgia, serif",
        marginBottom: '8px',
        lineHeight: 1.3,
      }}>
        The blended rate hides a bimodal reality
      </p>
      <p style={{
        color: '#8899AA',
        fontSize: '13px',
        marginBottom: '28px',
        lineHeight: 1.5,
      }}>
        Typical FMCG portfolio: 56 SKUs. Blended pass-through: 58%. The distribution tells a different story.
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', marginBottom: '8px' }}>
        {bins.map((bin, i) => {
          const height = (bin.count / maxCount) * 140;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#8899AA', fontSize: '10px', marginBottom: '4px' }}>{bin.count}</span>
              <div style={{
                width: '100%',
                height: `${height}px`,
                backgroundColor: clusterColors[bin.cluster],
                borderRadius: '4px 4px 0 0',
                opacity: 0.85,
                transition: 'opacity 0.2s',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {bins.map((bin, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ color: '#5A6B80', fontSize: '9px' }}>{bin.range}</span>
          </div>
        ))}
      </div>
      <p style={{ color: '#5A6B80', fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>
        Cost pass-through rate by SKU
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '20px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#C0392B' }} />
          <span style={{ color: '#8899AA', fontSize: '11px' }}>At risk (below 40%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#D4A843' }} />
          <span style={{ color: '#8899AA', fontSize: '11px' }}>Watch (40-70%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#0D8F8F' }} />
          <span style={{ color: '#8899AA', fontSize: '11px' }}>Managed (above 70%)</span>
        </div>
      </div>

      <p style={{ color: '#5A6B80', fontSize: '11px', marginTop: '16px', textAlign: 'center' }}>
        Source: Carthena Advisory analysis of representative FMCG portfolio, 2024-2026
      </p>
    </div>
  );
}
