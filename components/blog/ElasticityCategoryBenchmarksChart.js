import { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ErrorBar } from 'recharts';

const data = [
  { category: 'Essential staples',  low: -0.7, high: -0.3, midpoint: -0.5, errorRange: 0.2, color: '#0D8F8F' },
  { category: 'Premium personal',   low: -1.4, high: -0.8, midpoint: -1.1, errorRange: 0.3, color: '#D4A843' },
  { category: 'Beverages',          low: -1.6, high: -1.0, midpoint: -1.3, errorRange: 0.3, color: '#D4A843' },
  { category: 'Snacks & confec.',   low: -1.8, high: -1.2, midpoint: -1.5, errorRange: 0.3, color: '#C0392B' },
];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #1B2A4A',
  borderRadius: 4,
  color: '#1B2A4A',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 2px 8px rgba(27,42,74,0.15)',
};

export default function ElasticityCategoryBenchmarksChart() {
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
        Exhibit 3
      </div>
      <h3 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '18px',
        fontWeight: 700,
        color: '#1B2A4A',
        marginBottom: '16px',
        marginTop: 0,
        lineHeight: 1.3,
      }}>
        Working elasticity ranges, Nigerian FMCG categories
      </h3>
      <ResponsiveContainer width="100%" height={isNarrow ? 380 : 360}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: isNarrow ? 18 : 30, left: 5, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EC" horizontal={false} />
          <XAxis
            type="number"
            domain={[-2.0, 0]}
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            label={{ value: 'Price elasticity (less negative = less elastic)', position: 'insideBottom', offset: -38, style: { fill: '#475569', fontSize: 10, textAnchor: 'middle' } }}
            ticks={[-2.0, -1.5, -1.0, -0.5, 0]}
          />
          <YAxis
            type="category"
            dataKey="category"
            stroke="#64748b"
            tick={{ fontSize: isNarrow ? 10 : 11, fill: '#1B2A4A' }}
            width={isNarrow ? 92 : 130}
            interval={0}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: '#1B2A4A', fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: '#475569' }}
            cursor={{ fill: 'rgba(13,143,143,0.08)' }}
            formatter={(value, name, props) => [
              `${props.payload.low} to ${props.payload.high} (midpoint ${props.payload.midpoint})`,
              'Elasticity range',
            ]}
          />
          <Bar dataKey="midpoint" radius={[0, 4, 4, 0]} barSize={isNarrow ? 22 : 28}>
            {data.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
            <ErrorBar dataKey="errorRange" width={6} strokeWidth={2} stroke="#1B2A4A" direction="x" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>
        Source: Carthena Advisory's analysis identifies these working ranges among Nigerian FMCG portfolios. Bars show midpoint with error bars indicating typical range. Individual SKU elasticity may sit anywhere within or beyond category range depending on brand strength, distribution, and competitive posture.
      </p>
    </div>
  );
}
