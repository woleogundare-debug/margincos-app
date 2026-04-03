import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';

const fmtROI = (v) => (v == null ? '' : `${v.toFixed(1)}x`);

const statusColor = (status) => {
  if (!status) return '#8896A7';
  const s = status.toLowerCase();
  if (s.includes('accretive')) return '#0D8F8F';
  if (s.includes('dilutive'))  return '#C0392B';
  return '#D4A843';
};

export default function M3TradeROIChart({ results }) {
  const { currSym } = useCurrency();

  const fmtN = (v) => {
    if (v == null) return '';
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}${currSym}${(abs / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${sign}${currSym}${(abs / 1e6).toFixed(0)}M`;
    if (abs >= 1e3) return `${sign}${currSym}${(abs / 1e3).toFixed(0)}K`;
    return `${sign}${currSym}${abs.toFixed(0)}`;
  };

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
        minWidth: '180px',
      }}>
        <p style={{ fontWeight: 700, color: '#1B2A4A', marginBottom: '6px' }}>{d.name}</p>
        <p style={{ color: '#5A6B80', marginBottom: '2px' }}>ROI: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{d.roi?.toFixed(2)}x</span></p>
        <p style={{ color: '#5A6B80', marginBottom: '6px' }}>Total Spend: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{fmtN(d.total)}</span></p>
        <p style={{ fontWeight: 600, color: statusColor(d.status) }}>{d.status}</p>
      </div>
    );
  };
  if (!results?.length) return null;

  const data = results
    .filter(r => r.roi != null)
    .sort((a, b) => (b.roi || 0) - (a.roi || 0))
    .map(r => ({
      name:   r.channel,
      roi:    r.roi,
      status: r.status,
      total:  r.total,
    }));

  if (data.length === 0) return null;

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
      }}>Trade Spend ROI by Channel</h4>
      <p style={{ fontSize: '12px', color: '#8896A7', marginBottom: '20px' }}>
        Return on trade investment · Dashed line = 1.0x breakeven
      </p>

      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 56)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={fmtROI}
            tick={{ fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
            axisLine={{ stroke: '#E8ECF0' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12, fill: '#1B2A4A', fontFamily: 'DM Sans', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,143,143,0.05)' }} />
          <ReferenceLine
            x={1}
            stroke="#D4A843"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: 'Breakeven', position: 'top', fontSize: 10, fill: '#D4A843' }}
          />
          <Bar dataKey="roi" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((entry, i) => (
              <Cell key={i} fill={statusColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
