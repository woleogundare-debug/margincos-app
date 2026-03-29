import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const CLASS_COLORS = {
  '★ Protect': '#0D8F8F',
  '▲ Grow':    '#27AE60',
  '⚠ Reprice': '#D4A843',
  '✗ Review':  '#C0392B',
};

export default function M1QuadrantChart({ results, portfolioAvgMarginPct, cfg }) {
  if (!results?.length) return null;

  const data = results.map(r => ({
    x:              r.revShare,
    y:              r.skuMarginPct,
    name:           r.sku,
    classification: r.classification,
    color:          CLASS_COLORS[r.classification] || '#8896A7',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #E8ECF0',
        borderRadius: '8px',
        padding: '10px 14px',
        fontFamily: 'DM Sans',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <p style={{ fontWeight: 700, color: '#1B2A4A', marginBottom: '4px' }}>{d.name}</p>
        <p style={{ color: '#5A6B80', marginBottom: '2px' }}>Revenue Share: {d.x.toFixed(1)}%</p>
        <p style={{ color: '#5A6B80', marginBottom: '4px' }}>Margin: {d.y.toFixed(1)}%</p>
        <p style={{ color: d.color, fontWeight: 600 }}>{d.classification}</p>
      </div>
    );
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
      }}>Portfolio Quadrant Matrix</h4>
      <p style={{ fontSize: '12px', color: '#8896A7', marginBottom: '20px' }}>
        {cfg?.charts?.m1Subtitle || 'Revenue share vs margin % · Each dot = 1 product'}
      </p>

      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
          <XAxis
            type="number"
            dataKey="x"
            name="Revenue Share"
            unit="%"
            tick={{ fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
            axisLine={{ stroke: '#E8ECF0' }}
            label={{ value: 'Revenue Share %', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Margin"
            unit="%"
            tick={{ fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
            axisLine={{ stroke: '#E8ECF0' }}
            label={{ value: 'Gross Margin %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine
            y={portfolioAvgMarginPct}
            stroke="#D4A843"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: `Avg ${portfolioAvgMarginPct?.toFixed(1)}%`, position: 'right', fontSize: 10, fill: '#D4A843' }}
          />
          <ReferenceLine
            x={5}
            stroke="#D4A843"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: '5% share', position: 'top', fontSize: 10, fill: '#D4A843' }}
          />
          <Scatter data={data} r={6}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
        {Object.entries(CLASS_COLORS).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#5A6B80', fontFamily: 'DM Sans' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
