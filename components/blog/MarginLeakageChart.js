export default function MarginLeakageChart() {
  const items = [
    { label: 'SKUs with under-recovered inflation', value: '15–25%', sub: 'of portfolio by count driving majority of leakage', color: '#C0392B' },
    { label: 'Average pass-through rate', value: '35–45%', sub: 'vs 70–75% benchmark among Nigerian leaders', color: '#D4A843' },
    { label: 'Monthly margin left on table', value: '₦180–220M', sub: 'per ₦10B revenue company absorbing 40% inflation', color: '#0D8F8F' },
    { label: 'Loss-making promotional spend', value: 'High', sub: 'Promo depth exceeds breakeven lift at SKU level', color: '#8A6BBE' },
  ];

  return (
    <div style={{ margin: '2.5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: '#F8FAFC',
          border: '1px solid #E5E8EC',
          borderLeft: `4px solid ${item.color}`,
          borderRadius: '0 12px 12px 0',
          padding: '18px 20px',
        }}>
          <p style={{ fontSize: '22px', fontWeight: 700, color: item.color, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '4px' }}>
            {item.value}
          </p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1B2A4A', marginBottom: '4px' }}>
            {item.label}
          </p>
          <p style={{ fontSize: '12px', color: '#8899AA', lineHeight: 1.5 }}>
            {item.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
