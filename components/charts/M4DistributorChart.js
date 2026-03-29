import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const CLASS_COLORS = {
  '★ Strategic':   '#0D8F8F',
  '▲ Grow':        '#27AE60',
  '⚠ Renegotiate': '#D4A843',
  '✗ Review':      '#C0392B',
};

const fmtN = (v) => {
  if (v == null) return '';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}₦${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}₦${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${sign}₦${(abs / 1e3).toFixed(0)}K`;
  return `${sign}₦${abs.toFixed(0)}`;
};

export default function M4DistributorChart({ results, cfg }) {
  if (!results?.length) return null;

  // contPct and revShare are already 0-100 in the engine
  const data = results.map(r => ({
    x:              r.revShare,
    y:              r.contPct,
    name:           r.name,
    classification: r.classification,
    color:          CLASS_COLORS[r.classification] || '#8896A7',
    rev:            r.rev,
  }));

  const avgCont = data.reduce((sum, d) => sum + d.y, 0) / data.length;

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
        minWidth: '200px',
      }}>
        <p style={{ fontWeight: 700, color: '#1B2A4A', marginBottom: '6px' }}>{d.name}</p>
        <p style={{ color: '#5A6B80', marginBottom: '2px' }}>Revenue Share: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{d.x.toFixed(1)}%</span></p>
        <p style={{ color: '#5A6B80', marginBottom: '2px' }}>True Contribution: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{d.y.toFixed(1)}%</span></p>
        <p style={{ color: '#5A6B80', marginBottom: '6px' }}>Revenue: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{fmtN(d.rev)}</span></p>
        <p style={{ fontWeight: 600, color: d.color }}>{d.classification}</p>
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
      }}>{cfg?.charts?.m4Title || 'Partner Performance Matrix'}</h4>
      <p style={{ fontSize: '12px', color: '#8896A7', marginBottom: '20px' }}>
        Revenue share vs true contribution % · Each dot = 1 distributor
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
            label={{ value: 'Revenue Share %', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#8896A7' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Contribution"
            unit="%"
            tick={{ fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
            axisLine={{ stroke: '#E8ECF0' }}
            label={{ value: 'True Contribution %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#8896A7' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine
            y={avgCont}
            stroke="#D4A843"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: `Avg ${avgCont.toFixed(1)}%`, position: 'right', fontSize: 10, fill: '#D4A843' }}
          />
          <ReferenceLine
            x={10}
            stroke="#D4A843"
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />
          <Scatter data={data} r={8}>
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
