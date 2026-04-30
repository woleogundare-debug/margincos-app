import { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const baselineRevenue = 100_000_000;
const baselineGM = 0.30;
const baselineGP = baselineRevenue * baselineGM;
const priceIncrease = 0.08;

const computeGP = (elasticity) => {
  const volumeMultiplier = 1 + elasticity * priceIncrease;
  const newRevenue = baselineRevenue * (1 + priceIncrease) * volumeMultiplier;
  const newGM = (1 + priceIncrease - 0.70) / (1 + priceIncrease);
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

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #1B2A4A',
  borderRadius: 4,
  color: '#1B2A4A',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 2px 8px rgba(27,42,74,0.15)',
};

export default function ElasticityProfitImpactChart() {
  const containerRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const measure = () => {
      const parent = node.parentElement;
      if (!parent) return;
      setIsNarrow(parent.getBoundingClientRect().width < 480);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (node.parentElement) ro.observe(node.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        margin: '32px 0',
        marginLeft: isNarrow ? '-44px' : 0,
        marginRight: isNarrow ? '-44px' : 0,
        padding: isNarrow ? '20px 12px' : '24px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E5E8EC',
        borderRadius: '8px',
      }}
    >
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#0D8F8F',
        marginBottom: '6px',
      }}>
        Exhibit 2
      </div>
      <h3 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '18px',
        fontWeight: 700,
        color: '#1B2A4A',
        marginBottom: '8px',
        marginTop: 0,
        lineHeight: 1.3,
      }}>
        Gross profit impact of 8% price increase, by elasticity
      </h3>
      <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', marginTop: 0, lineHeight: 1.5 }}>
        Hypothetical SKU: ₦100M/month revenue, 30% gross margin, ₦30M baseline gross profit.
      </p>
      <ResponsiveContainer width="100%" height={isNarrow ? 360 : 340}>
        <BarChart
          data={data}
          margin={{ top: 24, right: isNarrow ? 14 : 110, left: isNarrow ? 4 : 28, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EC" />
          <XAxis
            dataKey="elasticity"
            stroke="#64748b"
            tick={{ fontSize: isNarrow ? 10 : 11 }}
            interval={0}
            angle={isNarrow ? -28 : 0}
            textAnchor={isNarrow ? 'end' : 'middle'}
            height={isNarrow ? 50 : 40}
            label={isNarrow ? undefined : { value: 'Elasticity assumption', position: 'insideBottom', offset: -8, style: { fill: '#475569', fontSize: 11 } }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: isNarrow ? 10 : 11 }}
            width={isNarrow ? 36 : 56}
            label={isNarrow ? undefined : { value: 'Gross profit (₦M/month)', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#475569', fontSize: 11, textAnchor: 'middle' } }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#1B2A4A', fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: '#475569' }}
            cursor={{ fill: 'rgba(13,143,143,0.08)' }}
            formatter={(value, name, props) => [
              `₦${value}M (${props.payload.deltaM >= 0 ? '+' : ''}₦${props.payload.deltaM}M vs baseline)`,
              'Gross profit',
            ]}
          />
          <ReferenceLine
            y={30}
            stroke="#475569"
            strokeDasharray="4 4"
            label={isNarrow ? undefined : {
              value: 'Baseline ₦30M',
              position: 'right',
              fill: '#475569',
              fontSize: 11,
              offset: 8,
            }}
          />
          <Bar dataKey="grossProfitM" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {isNarrow && (
        <>
          <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', margin: '8px 0 4px', fontWeight: 600 }}>
            Gross profit (₦M/month) by elasticity assumption
          </p>
          <p style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', margin: '0 0 0' }}>
            <span style={{display:'inline-block', width:14, borderTop:'1.5px dashed #475569', verticalAlign:'middle', marginRight:6}} />
            Dashed line: ₦30M baseline gross profit
          </p>
        </>
      )}
      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>
        Source: Carthena Advisory analysis. Variable cost assumed at 70% of baseline price. New gross margin computed against post-increase price; volume response = elasticity × 8% price change.
      </p>
    </div>
  );
}
