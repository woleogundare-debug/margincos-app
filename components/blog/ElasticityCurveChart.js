import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Volume response to price increase across four elasticity values
// X-axis: price increase percentage (0% to 20%)
// Y-axis: volume index (100 = baseline before price change)
// Each line: a different elasticity assumption
const data = Array.from({ length: 21 }, (_, i) => {
  const priceIncreasePct = i; // 0 to 20
  return {
    priceIncrease: priceIncreasePct,
    'e = -0.5 (inelastic)':  +(100 * (1 - 0.005 * priceIncreasePct)).toFixed(2),
    'e = -1.0 (unit elastic)': +(100 * (1 - 0.010 * priceIncreasePct)).toFixed(2),
    'e = -1.5 (elastic)':     +(100 * (1 - 0.015 * priceIncreasePct)).toFixed(2),
    'e = -2.0 (highly elastic)': +(100 * (1 - 0.020 * priceIncreasePct)).toFixed(2),
  };
});

export default function ElasticityCurveChart() {
  return (
    <div className="my-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: '#0D8F8F', letterSpacing: '0.12em' }}>
        Exhibit 1
      </p>
      <h3 className="text-lg mb-4" style={{ color: '#1B2A4A', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
        Volume response to price increase, by elasticity
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="priceIncrease"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            label={{ value: 'Price increase (%)', position: 'bottom', offset: 10, style: { fill: '#475569', fontSize: 12 } }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            domain={[60, 102]}
            label={{ value: 'Volume index (baseline = 100)', angle: -90, position: 'insideLeft', style: { fill: '#475569', fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1B2A4A', border: 'none', borderRadius: 4, color: '#ffffff', fontSize: 12 }}
            labelFormatter={(value) => `Price increase: ${value}%`}
          />
          <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
          <Line type="monotone" dataKey="e = -0.5 (inelastic)"      stroke="#0D8F8F" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -1.0 (unit elastic)"   stroke="#D4A843" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -1.5 (elastic)"        stroke="#C0392B" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -2.0 (highly elastic)" stroke="#1B2A4A" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-3 italic">
        Source: Carthena Advisory analysis. Volume response computed as percentage change = elasticity × price change percentage.
      </p>
    </div>
  );
}
