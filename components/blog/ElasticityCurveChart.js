import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = Array.from({ length: 21 }, (_, i) => {
  const priceIncreasePct = i;
  return {
    priceIncrease: priceIncreasePct,
    'e = -0.5 (inelastic)':       +(100 * (1 - 0.005 * priceIncreasePct)).toFixed(2),
    'e = -1.0 (unit elastic)':    +(100 * (1 - 0.010 * priceIncreasePct)).toFixed(2),
    'e = -1.5 (elastic)':         +(100 * (1 - 0.015 * priceIncreasePct)).toFixed(2),
    'e = -2.0 (highly elastic)':  +(100 * (1 - 0.020 * priceIncreasePct)).toFixed(2),
  };
});

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #1B2A4A',
  borderRadius: 4,
  color: '#1B2A4A',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 2px 8px rgba(27,42,74,0.15)',
};
const tooltipLabelStyle = { color: '#1B2A4A', fontWeight: 600, marginBottom: 4 };
const tooltipItemStyle  = { color: '#475569', padding: '2px 0' };

export default function ElasticityCurveChart() {
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
        Exhibit 1
      </div>
      <h3 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '18px',
        fontWeight: 700,
        color: '#1B2A4A',
        marginBottom: '16px',
        marginTop: 0,
      }}>
        Volume response to price increase, by elasticity
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EC" />
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
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            labelFormatter={(value) => `Price increase: ${value}%`}
          />
          <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
          <Line type="monotone" dataKey="e = -0.5 (inelastic)"      stroke="#0D8F8F" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -1.0 (unit elastic)"   stroke="#D4A843" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -1.5 (elastic)"        stroke="#C0392B" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -2.0 (highly elastic)" stroke="#1B2A4A" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', fontStyle: 'italic' }}>
        Source: Carthena Advisory analysis. Volume response computed as percentage change = elasticity × price change percentage.
      </p>
    </div>
  );
}
