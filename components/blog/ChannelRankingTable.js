export default function ChannelRankingTable() {
  const channels = [
    { name: 'Modern Trade', gross: 28, net: 22, days: 30, rank: 1, status: 'profitable' },
    { name: 'Distributor C', gross: 35, net: 19, days: 45, rank: 2, status: 'profitable' },
    { name: 'Distributor A', gross: 38, net: 14, days: 75, rank: 3, status: 'watch' },
    { name: 'Traditional Trade', gross: 42, net: 11, days: 90, rank: 4, status: 'at-risk' },
    { name: 'Distributor B', gross: 32, net: 8, days: 90, rank: 5, status: 'at-risk' },
  ];
  return (
    <div style={{ background: '#1B2A4A', borderRadius: '12px', padding: '28px 32px', margin: '32px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px 0' }}>CHANNEL PROFITABILITY RANKING</p>
      <p style={{ color: '#CBD5E0', fontSize: '13px', margin: '0 0 20px 0' }}>Ranked by net margin after full waterfall - not gross margin</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A3F66' }}>
              {['Rank', 'Channel', 'Gross Margin', 'Net Margin', 'Days Outstanding', 'Verdict'].map(h => (
                <th key={h} style={{ color: '#8896A7', fontWeight: 600, padding: '8px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channels.map((c, i) => {
              const verdictColor = c.status === 'profitable' ? '#0D8F8F' : c.status === 'watch' ? '#D4A843' : '#C0392B';
              const verdictLabel = c.status === 'profitable' ? 'Profitable' : c.status === 'watch' ? 'Watch' : 'At Risk';
              const grossRank = [...channels].sort((a, b) => b.gross - a.gross).findIndex(x => x.name === c.name) + 1;
              const shifted = grossRank !== c.rank;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #1e3352' }}>
                  <td style={{ color: '#D4A843', padding: '12px', fontWeight: 700, fontSize: '16px' }}>#{c.rank}</td>
                  <td style={{ color: '#E2E8F0', padding: '12px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: '#8896A7', padding: '12px' }}>{c.gross}%{shifted ? ` (#${grossRank})` : ''}</td>
                  <td style={{ color: verdictColor, padding: '12px', fontWeight: 700 }}>{c.net}%</td>
                  <td style={{ color: c.days >= 75 ? '#C0392B' : '#CBD5E0', padding: '12px' }}>{c.days} days</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: verdictColor + '20', color: verdictColor, padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>{verdictLabel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color: '#D4A843', fontSize: '12px', marginTop: '16px', fontStyle: 'italic' }}>
        Traditional Trade ranks #1 by gross margin (42%) but drops to #4 by net margin (11%) - a 31-point gap driven by 90-day credit terms and high logistics costs.
      </p>
    </div>
  );
}
