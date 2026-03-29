import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  positive: '#0D8F8F', // teal — priced below competitors (room to move)
  negative: '#D4A843', // gold — priced above competitors (caution)
};

export default function P1RepricingChart({ results, cfg }) {
  if (!results?.length) return null;

  // Sort by repricing gain descending, take top 15 for readability
  const data = [...results]
    .filter(r => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 15)
    .map(r => ({
      name: r.sku.length > 25 ? r.sku.substring(0, 22) + '...' : r.sku,
      value: r.delta,
      compGap: r.compGap,
      fullName: r.sku,
    }));

  if (data.length === 0) return null;

  const fmt = (v) => {
    if (v >= 1e9) return `₦${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `₦${(v / 1e6).toFixed(0)}M`;
    if (v >= 1e3) return `₦${(v / 1e3).toFixed(0)}K`;
    return `₦${v.toFixed(0)}`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F7FA 100%)',
      border: '1px solid #E8ECF0',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <h4 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '18px',
        fontWeight: 700,
        color: '#1B2A4A',
        marginBottom: '4px',
      }}>{cfg?.charts?.p1Title || 'Repricing Opportunity by Product'}</h4>
      <p style={{ fontSize: '12px', color: '#8896A7', marginBottom: '20px' }}>
        Top {data.length} {cfg?.unitPlural || 'products'} by monthly repricing gain · Teal = below competitors · Gold = above competitors
      </p>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
            axisLine={{ stroke: '#E8ECF0' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 11, fill: '#1B2A4A', fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [fmt(value), 'Repricing Gain /mo']}
            contentStyle={{ fontFamily: 'DM Sans', fontSize: '12px', borderRadius: '8px', border: '1px solid #E8ECF0' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.compGap != null && entry.compGap >= 0 ? COLORS.positive : COLORS.negative} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
