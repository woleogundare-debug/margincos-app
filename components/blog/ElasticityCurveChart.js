import { useEffect, useRef, useState } from 'react';
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
  whiteSpace: 'normal',
  maxWidth: 200,
};

const tooltipWrapperStyle = {
  maxWidth: 200,
  zIndex: 5,
  outline: 'none',
};

const tooltipLabelStyle = {
  color: '#1B2A4A',
  fontWeight: 600,
  marginBottom: 4,
  whiteSpace: 'normal',
};

const tooltipItemStyle = {
  color: '#475569',
  padding: '2px 0',
  whiteSpace: 'normal',
};

export default function ElasticityCurveChart() {
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
    window.addEventListener('resize', measure);
    const interval = setInterval(measure, 500);
    const tid = setTimeout(() => clearInterval(interval), 3000);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      clearInterval(interval);
      clearTimeout(tid);
    };
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
        Exhibit 1
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
        Volume response to price increase, by elasticity
      </h3>
      <ResponsiveContainer width="100%" height={isNarrow ? 280 : 340}>
        <LineChart
          data={data}
          margin={{ top: 10, right: isNarrow ? 12 : 30, left: isNarrow ? 2 : 32, bottom: isNarrow ? 30 : 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EC" />
          <XAxis
            dataKey="priceIncrease"
            stroke="#64748b"
            tick={{ fontSize: isNarrow ? 10 : 11 }}
            label={{ value: 'Price increase (%)', position: 'insideBottom', offset: -4, style: { fill: '#475569', fontSize: 11 } }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: isNarrow ? 10 : 11 }}
            domain={[60, 102]}
            width={isNarrow ? 30 : 56}
            label={isNarrow ? undefined : { value: 'Volume index (baseline = 100)', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#475569', fontSize: 11, textAnchor: 'middle' } }}
          />
          <Tooltip
            wrapperStyle={tooltipWrapperStyle}
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            allowEscapeViewBox={{ x: false, y: false }}
            labelFormatter={(value) => `Price increase: ${value}%`}
          />
          {!isNarrow && (
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: 16, fontSize: 12, lineHeight: 1.6 }}
              iconSize={10}
            />
          )}
          <Line type="monotone" dataKey="e = -0.5 (inelastic)"      stroke="#0D8F8F" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -1.0 (unit elastic)"   stroke="#D4A843" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -1.5 (elastic)"        stroke="#C0392B" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="e = -2.0 (highly elastic)" stroke="#1B2A4A" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {isNarrow && (
        <>
          <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', margin: '6px 0 10px', fontWeight: 600 }}>
            Volume index (baseline = 100)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '14px', rowGap: '6px', fontSize: '10.5px', color: '#1B2A4A', padding: '10px 4px 0', borderTop: '1px solid #E5E8EC' }}>
            {[
              { color: '#0D8F8F', text: 'e = -0.5 (inelastic)' },
              { color: '#D4A843', text: 'e = -1.0 (unit elastic)' },
              { color: '#C0392B', text: 'e = -1.5 (elastic)' },
              { color: '#1B2A4A', text: 'e = -2.0 (highly elastic)' },
            ].map((item, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.2 }}>
                <span style={{ display: 'inline-block', width: 14, height: 3, background: item.color, borderRadius: 1, flexShrink: 0 }} />
                <span>{item.text}</span>
              </span>
            ))}
          </div>
        </>
      )}
      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>
        Source: Carthena Advisory analysis. Volume response computed as percentage change = elasticity × price change percentage.
      </p>
    </div>
  );
}
