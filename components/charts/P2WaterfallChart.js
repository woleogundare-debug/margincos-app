import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';

const COLORS = {
  shock:    '#D4A843', // gold  — total cost shock
  absorbed: '#D95F4B', // red   — absorbed (margin erosion)
  recovery: '#0D8F8F', // teal  — recovered through price
};

const fmt = (v) => {
  if (v == null) return '';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}₦${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}₦${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${sign}₦${(abs / 1e3).toFixed(0)}K`;
  return `${sign}₦${abs.toFixed(0)}`;
};

const pct = (v) => (v == null ? '' : `${(v * 100).toFixed(1)}%`);

export default function P2WaterfallChart({ p2 }) {
  if (!p2) return null;

  const { totalCostShock, totalAbsorbed, portRecoveryPct } = p2;

  // Guard: nothing meaningful to show
  if (!totalCostShock && !totalAbsorbed) return null;

  const recovered = totalCostShock - totalAbsorbed;

  const data = [
    {
      label: 'Cost Shock',
      value: totalCostShock,
      color: COLORS.shock,
      description: 'Total input-cost increase across portfolio',
    },
    {
      label: 'Recovered',
      value: recovered,
      color: COLORS.recovery,
      description: 'Cost passed through to price',
    },
    {
      label: 'Absorbed',
      value: totalAbsorbed,
      color: COLORS.absorbed,
      description: 'Residual margin erosion',
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8ECF0',
        borderRadius: '8px',
        padding: '10px 14px',
        fontFamily: 'DM Sans',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <p style={{ fontWeight: 600, color: '#1B2A4A', marginBottom: '4px' }}>{d.label}</p>
        <p style={{ color: '#8896A7', marginBottom: '2px' }}>{d.description}</p>
        <p style={{ color: d.color, fontWeight: 700 }}>{fmt(d.value)}</p>
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
      }}>Cost Recovery Waterfall</h4>
      <p style={{ fontSize: '12px', color: '#8896A7', marginBottom: '8px' }}>
        Portfolio-level cost shock vs price recovery vs absorbed margin
      </p>

      {/* KPI pill */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Recovery Rate', value: pct(portRecoveryPct), color: COLORS.recovery },
          { label: 'Total Shock',   value: fmt(totalCostShock),  color: COLORS.shock    },
          { label: 'Absorbed',      value: fmt(totalAbsorbed),   color: COLORS.absorbed },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#F5F7FA',
            border: '1px solid #E8ECF0',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '11px',
            color: '#8896A7',
          }}>
            {label}:{' '}
            <span style={{ fontWeight: 700, color }}>{value}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 16, right: 24, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#1B2A4A', fontFamily: 'DM Sans', fontWeight: 600 }}
            axisLine={{ stroke: '#E8ECF0' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,143,143,0.05)' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={72}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={fmt}
              style={{ fontSize: '11px', fontFamily: 'DM Sans', fontWeight: 600, fill: '#1B2A4A' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
