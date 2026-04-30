import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar } from 'recharts';

// Category-level elasticity ranges for Nigerian FMCG
// Each row: category, low end of range, high end of range, midpoint (for bar), error bar size
const data = [
  { category: 'Essential staples',     low: -0.7, high: -0.3, midpoint: -0.5, errorRange: 0.2, color: '#0D8F8F' },
  { category: 'Premium personal care', low: -1.4, high: -0.8, midpoint: -1.1, errorRange: 0.3, color: '#D4A843' },
  { category: 'Beverages',              low: -1.6, high: -1.0, midpoint: -1.3, errorRange: 0.3, color: '#D4A843' },
  { category: 'Snacks & confectionery', low: -1.8, high: -1.2, midpoint: -1.5, errorRange: 0.3, color: '#C0392B' },
];

export default function ElasticityCategoryBenchmarksChart() {
  return (
    <div className="my-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: '#0D8F8F', letterSpacing: '0.12em' }}>
        Exhibit 3
      </p>
      <h3 className="text-lg mb-4" style={{ color: '#1B2A4A', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
        Working elasticity ranges, Nigerian FMCG categories
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 60, left: 60, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
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
            contentStyle={{ backgroundColor: '#1B2A4A', border: 'none', borderRadius: 4, color: '#ffffff', fontSize: 12 }}
            formatter={(value, name, props) => [
              `${props.payload.low} to ${props.payload.high} (midpoint ${props.payload.midpoint})`,
              'Elasticity range'
            ]}
          />
          <Bar dataKey="midpoint" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((entry, i) => (
              <ErrorBar key={i} dataKey="errorRange" width={6} strokeWidth={2} stroke="#1B2A4A" direction="x" />
            ))}
            {data.map((entry, i) => (
              <text key={`label-${i}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-3 italic">
        Source: Carthena Advisory's analysis identifies these working ranges among Nigerian FMCG portfolios. Bars show midpoint with error bars indicating typical range. Individual SKU elasticity may sit anywhere within or beyond category range depending on brand strength, distribution, and competitive posture.
      </p>
    </div>
  );
}
