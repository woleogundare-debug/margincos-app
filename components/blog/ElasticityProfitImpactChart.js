import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

// Gross profit impact of an 8% price increase across elasticity values
// Hypothetical SKU: 100M NGN/month revenue, 30% gross margin, 30M NGN baseline gross profit
// At each elasticity, compute new revenue and new gross profit, then delta vs baseline

const baselineRevenue = 100_000_000; // 100M NGN
const baselineGM = 0.30;
const baselineGP = baselineRevenue * baselineGM; // 30M
const baselineUnitMargin = baselineGM; // for proportional reasoning
const priceIncrease = 0.08; // 8%

// Variable cost per unit assumed = 70% of original price
// New unit margin = (1 + priceIncrease) - 0.70 = 0.38, vs original 0.30
// Volume change = elasticity * priceIncrease
// New revenue = baselineRevenue * (1 + priceIncrease) * (1 + elasticity * priceIncrease)
// New GP = New revenue * (new unit margin / new price) where new price = 1.08
const computeGP = (elasticity) => {
  const volumeMultiplier = 1 + elasticity * priceIncrease;
  const newRevenue = baselineRevenue * (1 + priceIncrease) * volumeMultiplier;
  const newGM = (1 + priceIncrease - 0.70) / (1 + priceIncrease); // new gross margin %
  return newRevenue * newGM;
};

const data = [
  { elasticity: 'e = -0.5', label: 'Inelastic',      grossProfit: computeGP(-0.5), color: '#0D8F8F' },
  { elasticity: 'e = -0.8', label: 'Mildly elastic', grossProfit: computeGP(-0.8), color: '#0D8F8F' },
  { elasticity: 'e = -1.0', label: 'Unit elastic',   grossProfit: computeGP(-1.0), color: '#D4A843' },
  { elasticity: 'e = -1.2', label: 'Elastic',        grossProfit: computeGP(-1.2), color: '#D4A843' },
  { elasticity: 'e = -1.5', label: 'Very elastic',   grossProfit: computeGP(-1.5), color: '#C0392B' },
].map(d => ({
  ...d,
  grossProfitM: +(d.grossProfit / 1_000_000).toFixed(2),
  deltaM: +((d.grossProfit - baselineGP) / 1_000_000).toFixed(2),
}));

export default function ElasticityProfitImpactChart() {
  return (
    <div className="my-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: '#0D8F8F', letterSpacing: '0.12em' }}>
        Exhibit 2
      </p>
      <h3 className="text-lg mb-4" style={{ color: '#1B2A4A', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
        Gross profit impact of 8% price increase, by elasticity
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        Hypothetical SKU: ₦100M/month revenue, 30% gross margin, ₦30M baseline gross profit.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="elasticity"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            label={{ value: 'Elasticity assumption', position: 'bottom', offset: 10, style: { fill: '#475569', fontSize: 12 } }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            label={{ value: 'Gross profit (₦M/month)', angle: -90, position: 'insideLeft', style: { fill: '#475569', fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1B2A4A', border: 'none', borderRadius: 4, color: '#ffffff', fontSize: 12 }}
            formatter={(value, name, props) => [
              `₦${value}M (${props.payload.deltaM > 0 ? '+' : ''}₦${props.payload.deltaM}M vs baseline)`,
              'Gross profit'
            ]}
          />
          <ReferenceLine y={30} stroke="#475569" strokeDasharray="4 4" label={{ value: 'Baseline ₦30M', position: 'right', fill: '#475569', fontSize: 11 }} />
          <Bar dataKey="grossProfitM" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-3 italic">
        Source: Carthena Advisory analysis. Variable cost assumed at 70% of baseline price. New gross margin computed against post-increase price; volume response = elasticity × 8% price change.
      </p>
    </div>
  );
}
