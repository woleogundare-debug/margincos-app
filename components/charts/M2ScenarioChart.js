import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function M2ScenarioChart({ scenarios, totalCogsBase }) {
  const { currSym } = useCurrency();

  const fmt = (v) => {
    if (v == null) return '';
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${currSym}${(abs / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${currSym}${(abs / 1e6).toFixed(0)}M`;
    return `${currSym}${(abs / 1e3).toFixed(0)}K`;
  };
  if (!scenarios?.length) return null;

  // recoveryRate is 0-1 decimal in the engine
  const data = scenarios.map(s => ({
    name:      `${(s.recoveryRate * 100).toFixed(0)}%`,
    margin:    s.projMargin,
    marginPct: s.projMarginPct,
    absorbed:  s.absorbed,
    riskLevel: s.riskLevel,
    riskColor: s.riskColor,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const riskTextColor = d.riskColor || (
      d.riskLevel?.toLowerCase().includes('critical') ? '#C0392B'
        : d.riskLevel?.toLowerCase().includes('protected') ? '#27AE60'
          : '#D4A843'
    );
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #E8ECF0',
        borderRadius: '8px',
        padding: '10px 14px',
        fontFamily: 'DM Sans',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        minWidth: '180px',
      }}>
        <p style={{ fontWeight: 700, color: '#1B2A4A', marginBottom: '6px' }}>Recovery: {d.name}</p>
        <p style={{ color: '#5A6B80', marginBottom: '2px' }}>Projected Margin: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{fmt(d.margin)}</span></p>
        <p style={{ color: '#5A6B80', marginBottom: '2px' }}>Margin %: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{d.marginPct?.toFixed(1)}%</span></p>
        <p style={{ color: '#5A6B80', marginBottom: '6px' }}>Cost Absorbed: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{fmt(d.absorbed)}</span></p>
        <p style={{ fontWeight: 600, color: riskTextColor }}>{d.riskLevel}</p>
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
      }}>Margin Under Inflation Scenarios</h4>
      <p style={{ fontSize: '12px', color: '#8896A7', marginBottom: '20px' }}>
        Projected portfolio margin across 5 cost recovery scenarios
        {totalCogsBase != null ? ` · COGS base: ${fmt(totalCogsBase)}` : ''}
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 24, left: 10 }}>
          <defs>
            <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0D8F8F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0D8F8F" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#1B2A4A', fontFamily: 'DM Sans', fontWeight: 600 }}
            axisLine={{ stroke: '#E8ECF0' }}
            tickLine={false}
            label={{ value: 'Cost Recovery Rate', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#8896A7' }}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(13,143,143,0.2)' }} />
          <Area
            type="monotone"
            dataKey="margin"
            stroke="#0D8F8F"
            strokeWidth={2.5}
            fill="url(#marginGrad)"
            dot={{ r: 5, fill: '#0D8F8F', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 7 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
