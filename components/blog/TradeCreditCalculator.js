export default function TradeCreditCalculator() {
  const scenarios = [
    { channel: 'Modern Trade', days: 30, receivable: 400, rate: 18 },
    { channel: 'Distributor A', days: 60, receivable: 500, rate: 18 },
    { channel: 'Distributor B', days: 45, receivable: 300, rate: 18 },
    { channel: 'Traditional Trade', days: 90, receivable: 200, rate: 18 },
  ];
  return (
    <div style={{ background: '#1B2A4A', borderRadius: '12px', padding: '28px 32px', margin: '32px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px 0' }}>TRADE CREDIT COST BY CHANNEL</p>
      <p style={{ color: '#CBD5E0', fontSize: '13px', margin: '0 0 20px 0' }}>Annual financing cost at 18% cost of capital</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A3F66' }}>
              {['Channel', 'Days Outstanding', 'Avg Receivable', 'Annual Cost'].map(h => (
                <th key={h} style={{ color: '#8896A7', fontWeight: 600, padding: '8px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s, i) => {
              const cost = Math.round(s.receivable * 1000 * (s.rate / 100) * s.days / 365);
              const isHigh = s.days >= 60;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #1e3352' }}>
                  <td style={{ color: '#E2E8F0', padding: '12px', fontWeight: 500 }}>{s.channel}</td>
                  <td style={{ color: isHigh ? '#C0392B' : '#D4A843', padding: '12px', fontWeight: 700 }}>{s.days} days</td>
                  <td style={{ color: '#CBD5E0', padding: '12px' }}>${s.receivable}K</td>
                  <td style={{ color: isHigh ? '#C0392B' : '#0D8F8F', padding: '12px', fontWeight: 700 }}>${cost.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #2A3F66' }}>
              <td style={{ color: '#E2E8F0', padding: '12px', fontWeight: 700 }}>Total Portfolio</td>
              <td style={{ color: '#8896A7', padding: '12px' }}>Weighted avg</td>
              <td style={{ color: '#CBD5E0', padding: '12px' }}>$1,400K</td>
              <td style={{ color: '#D4A843', padding: '12px', fontWeight: 700, fontSize: '15px' }}>${scenarios.reduce((sum, s) => sum + Math.round(s.receivable * 1000 * (s.rate / 100) * s.days / 365), 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
