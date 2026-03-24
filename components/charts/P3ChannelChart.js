import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from 'recharts';

const COLORS = {
  rev:        '#1B2A4A', // navy   — revenue
  contMargin: '#0D8F8F', // teal   — contribution margin
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

// contPct is already 0-100 (not a decimal)
const pct = (v) => (v == null ? '' : `${Number(v).toFixed(1)}%`);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const rev = payload.find(p => p.dataKey === 'rev');
  const cont = payload.find(p => p.dataKey === 'contMargin');
  const entry = payload[0]?.payload;
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8ECF0',
      borderRadius: '8px',
      padding: '10px 14px',
      fontFamily: 'DM Sans',
      fontSize: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      minWidth: '180px',
    }}>
      <p style={{ fontWeight: 700, color: '#1B2A4A', marginBottom: '8px' }}>{label}</p>
      {rev && (
        <p style={{ color: COLORS.rev, marginBottom: '4px' }}>
          Revenue: <span style={{ fontWeight: 600 }}>{fmt(rev.value)}</span>
        </p>
      )}
      {cont && (
        <p style={{ color: COLORS.contMargin, marginBottom: '4px' }}>
          Contribution: <span style={{ fontWeight: 600 }}>{fmt(cont.value)}</span>
        </p>
      )}
      {entry?.contPct != null && (
        <p style={{ color: '#8896A7', fontSize: '11px' }}>
          Margin %: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{pct(entry.contPct)}</span>
        </p>
      )}
      {entry?.skuCount != null && (
        <p style={{ color: '#8896A7', fontSize: '11px' }}>
          SKUs: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{entry.skuCount}</span>
        </p>
      )}
    </div>
  );
};

export default function P3ChannelChart({ channelResults }) {
  if (!channelResults?.length) return null;

  // Sort by revenue descending
  const data = [...channelResults]
    .sort((a, b) => b.rev - a.rev)
    .map(r => ({
      channel:    r.channel,
      rev:        r.rev,
      contMargin: r.contMargin,
      contPct:    r.contPct,
      wtpGap:     r.wtpGap,
      vol:        r.vol,
      skuCount:   r.skuCount,
    }));

  const CustomLegend = () => (
    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginBottom: '8px' }}>
      {[
        { color: COLORS.rev,        label: 'Revenue'      },
        { color: COLORS.contMargin, label: 'Contribution' },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8896A7', fontFamily: 'DM Sans' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
          {label}
        </div>
      ))}
    </div>
  );

  const barHeight = 48;
  const chartHeight = Math.max(300, data.length * barHeight * 2 + 80);

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
      }}>Channel Revenue vs Contribution Margin</h4>
      <p style={{ fontSize: '12px', color: '#8896A7', marginBottom: '16px' }}>
        Revenue and contribution margin by channel · Sorted by revenue
      </p>

      <CustomLegend />

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 24, bottom: 0, left: 10 }}
          barCategoryGap="28%"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" vertical={false} />
          <XAxis
            dataKey="channel"
            tick={{ fontSize: 11, fill: '#1B2A4A', fontFamily: 'DM Sans', fontWeight: 600 }}
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
          <Bar dataKey="rev" name="Revenue" fill={COLORS.rev} radius={[4, 4, 0, 0]} barSize={36}>
            <LabelList
              dataKey="rev"
              position="top"
              formatter={fmt}
              style={{ fontSize: '10px', fontFamily: 'DM Sans', fill: '#8896A7' }}
            />
          </Bar>
          <Bar dataKey="contMargin" name="Contribution" fill={COLORS.contMargin} radius={[4, 4, 0, 0]} barSize={36}>
            <LabelList
              dataKey="contMargin"
              position="top"
              formatter={fmt}
              style={{ fontSize: '10px', fontFamily: 'DM Sans', fill: '#8896A7' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
