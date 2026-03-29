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
} from 'recharts';

const COLORS = {
  profitable:    '#0D8F8F', // teal  — positive net impact
  unprofitable:  '#D95F4B', // red   — negative net impact
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
      minWidth: '200px',
    }}>
      <p style={{ fontWeight: 700, color: '#1B2A4A', marginBottom: '6px' }}>{d.fullName}</p>
      <p style={{ marginBottom: '3px', color: '#8896A7' }}>
        Net Promo Impact:{' '}
        <span style={{ fontWeight: 600, color: d.netImpact >= 0 ? COLORS.profitable : COLORS.unprofitable }}>
          {fmt(d.netImpact)}
        </span>
      </p>
      {d.depth != null && (
        <p style={{ color: '#8896A7', fontSize: '11px', marginBottom: '2px' }}>
          Depth: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>{(d.depth * 100).toFixed(0)}%</span>
        </p>
      )}
      {d.effPrice != null && (
        <p style={{ color: '#8896A7', fontSize: '11px', marginBottom: '2px' }}>
          Eff. Price: <span style={{ fontWeight: 600, color: '#1B2A4A' }}>₦{d.effPrice?.toFixed(2)}</span>
        </p>
      )}
      <p style={{ fontSize: '11px', marginTop: '4px' }}>
        <span style={{
          background: d.profitable ? 'rgba(13,143,143,0.1)' : 'rgba(217,95,75,0.1)',
          color: d.profitable ? COLORS.profitable : COLORS.unprofitable,
          borderRadius: '4px',
          padding: '2px 6px',
          fontWeight: 600,
        }}>
          {d.profitable ? 'Profitable' : 'Loss-making'}
        </span>
      </p>
    </div>
  );
};

export default function P4PromoChart({ results, cfg }) {
  if (!results?.length) return null;

  // Sort by absolute net impact, keep top 15
  const data = [...results]
    .sort((a, b) => Math.abs(b.netImpact) - Math.abs(a.netImpact))
    .slice(0, 15)
    .map(r => ({
      name:       r.sku.length > 22 ? r.sku.substring(0, 19) + '...' : r.sku,
      fullName:   r.sku,
      netImpact:  r.netImpact,
      profitable: r.profitable,
      depth:      r.depth,
      effPrice:   r.effPrice,
      unitMargin: r.unitMargin,
    }));

  if (data.length === 0) return null;

  const profitableCount   = results.filter(r => r.profitable).length;
  const unprofitableCount = results.length - profitableCount;

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
      }}>{cfg?.charts?.p4Title || 'Promotion Net Impact by Product'}</h4>
      <p style={{ fontSize: '12px', color: '#8896A7', marginBottom: '12px' }}>
        Top {data.length} {cfg?.unitPlural || 'products'} by absolute promo impact · Teal = profitable · Red = loss-making
      </p>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{
          background: 'rgba(13,143,143,0.08)',
          border: '1px solid rgba(13,143,143,0.2)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '11px',
          color: COLORS.profitable,
          fontWeight: 600,
        }}>
          {profitableCount} Profitable {profitableCount !== 1 ? (cfg?.unitPlural || 'products') : (cfg?.unit || 'product')}
        </div>
        {unprofitableCount > 0 && (
          <div style={{
            background: 'rgba(217,95,75,0.08)',
            border: '1px solid rgba(217,95,75,0.2)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '11px',
            color: COLORS.unprofitable,
            fontWeight: 600,
          }}>
            {unprofitableCount} Loss-making {unprofitableCount !== 1 ? (cfg?.unitPlural || 'products') : (cfg?.unit || 'product')}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: '#8896A7', fontFamily: 'DM Sans' }}
            axisLine={{ stroke: '#E8ECF0' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 11, fill: '#1B2A4A', fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={0} stroke="#1B2A4A" strokeWidth={1.5} strokeDasharray="0" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,143,143,0.05)' }} />
          <Bar dataKey="netImpact" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.netImpact >= 0 ? COLORS.profitable : COLORS.unprofitable}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
