import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ErrorBar } from 'recharts';

const data = [
  { category: 'Essential staples',     low: -0.7, high: -0.3, midpoint: -0.5, errorRange: 0.2, color: '#0D8F8F' },
  { category: 'Premium personal care', low: -1.4, high: -0.8, midpoint: -1.1, errorRange: 0.3, color: '#D4A843' },
  { category: 'Beverages',             low: -1.6, high: -1.0, midpoint: -1.3, errorRange: 0.3, color: '#D4A843' },
  { category: 'Snacks & confectionery', low: -1.8, high: -1.2, midpoint: -1.5, errorRange: 0.3, color: '#C0392B' },
];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #1B2A4A',
  borderRadius: 4,
  color: '#1B2A4A',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 2px 8px rgba(27,42,74,0.15)',
};

export default function ElasticityCategoryBenchmarksChart() {
  return (
    <div style={{
      margin: '32px 0',
      padding: '24px',
      backgroundColor: '#F8FAFC',
      border: '1px solid #E5E8EC',
      borderRadius: '8px',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#0D8F8F',
        marginBottom: '6px',
      }}>
        Exhibit 3
      </div>
      <h3 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '18px',
        fontWeight: 700,
        color: '#1B2A4A',
        marginBottom: '16px',
        marginTop: 0,
      }}>
        Working elasticity ranges, Nigerian FMCG categories
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 60, left: 60, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EC" horizontal={false} />
          <XAxis
            type="number"
            domain={[-2.0, 0]}
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            label={{ value: 'Price elasticity of demand (less negative = less elastic)', position: 'bottom', offset: 10, style: { fill: '#475569', fontSize: 12 } }}
            ticks={[-2.0, -1.5, -1.0, -0.5, 0]}
          />
          <YAxis
            type="category"
            dataKey="category"
            stroke="#64748b"
            tick={{ fontSize: 12, fill: '#1B2A4A' }}
            width={150}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#1B2A4A', fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: '#475569' }}
            cursor={{ fill: 'rgba(13,143,143,0.08)' }}
            formatter={(value, name, props) => [
              `${props.payload.low} to ${props.payload.high} (midpoint ${props.payload.midpoint})`,
              'Elasticity range',
            ]}
          />
          <Bar dataKey="midpoint" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
            <ErrorBar dataKey="errorRange" width={6} strokeWidth={2} stroke="#1B2A4A" direction="x" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', fontStyle: 'italic' }}>
        Source: Carthena Advisory's analysis identifies these working ranges among Nigerian FMCG portfolios. Bars show midpoint with error bars indicating typical range. Individual SKU elasticity may sit anywhere within or beyond category range depending on brand strength, distribution, and competitive posture.
      </p>
    </div>
  );
}
