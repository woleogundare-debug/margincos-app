import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Cell, LabelList } from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';
import { TOKENS, M4_COLORS, clsName, cardStyle, FindingHeader, Legend, fmtMoney } from './chartTokens';

/**
 * M4 Distributor Performance - named bubble. X = revenue share %, Y = true
 * contribution %, bubble size = revenue (log scale when max/min > 10). Colour by
 * classification; quadrant background shading; reference lines at 10% share and
 * average contribution. Replaces the former M4DistributorChart scatter.
 */
export default function M4BubbleChart({ results, finding, cfg }) {
  const { currSym } = useCurrency();
  if (!results?.length) return null;

  const revs = results.map((r) => r.rev);
  const useLog = (Math.max(...revs) / Math.max(1, Math.min(...revs))) > 10;
  const data = results.map((r) => ({
    x: r.revShare,
    y: r.contPct,
    z: useLog ? Math.log10(r.rev || 1) : r.rev,
    name: r.name,
    rev: r.rev,
    classification: r.classification,
    color: M4_COLORS[r.classification] || TOKENS.muted,
  }));
  const avgC = data.reduce((s, d) => s + d.y, 0) / data.length;
  const maxX = Math.max(...data.map((d) => d.x), 12);
  const yMax = Math.max(...data.map((d) => d.y), 20);
  const yMin = Math.min(...data.map((d) => d.y), 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: '8px', padding: '10px 14px', fontFamily: 'DM Sans', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: '200px' }}>
        <p style={{ fontWeight: 700, color: TOKENS.navy, marginBottom: '6px' }}>{d.name}</p>
        <p style={{ color: TOKENS.text, margin: '2px 0' }}>Revenue share: <b style={{ color: TOKENS.navy }}>{d.x.toFixed(1)}%</b></p>
        <p style={{ color: TOKENS.text, margin: '2px 0' }}>True contribution: <b style={{ color: TOKENS.navy }}>{d.y.toFixed(1)}%</b></p>
        <p style={{ color: TOKENS.text, margin: '2px 0' }}>Revenue: <b style={{ color: TOKENS.navy }}>{fmtMoney(d.rev, currSym)}</b></p>
        <p style={{ fontWeight: 600, color: d.color, marginTop: '4px' }}>{d.classification}</p>
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <FindingHeader finding={finding} fallbackLabel="M4 · DISTRIBUTOR PERFORMANCE" fallbackTitle="Partner performance matrix" />
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 20, left: 10 }}>
          {/* quadrant shading */}
          <ReferenceArea x1={10} x2={maxX} y1={avgC} y2={yMax} fill={TOKENS.teal} fillOpacity={0.05} stroke="none" />
          <ReferenceArea x1={0} x2={10} y1={avgC} y2={yMax} fill={TOKENS.green} fillOpacity={0.05} stroke="none" />
          <ReferenceArea x1={10} x2={maxX} y1={yMin} y2={avgC} fill={TOKENS.gold} fillOpacity={0.06} stroke="none" />
          <ReferenceArea x1={0} x2={10} y1={yMin} y2={avgC} fill={TOKENS.red} fillOpacity={0.05} stroke="none" />
          <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.rule} />
          <XAxis type="number" dataKey="x" name="Revenue Share" unit="%" domain={[0, Math.ceil(maxX)]} tick={{ fontSize: 11, fill: TOKENS.muted, fontFamily: 'DM Sans' }} axisLine={{ stroke: TOKENS.rule }} label={{ value: 'Revenue Share %', position: 'insideBottom', offset: -10, fontSize: 11, fill: TOKENS.muted }} />
          <YAxis type="number" dataKey="y" name="Contribution" unit="%" tick={{ fontSize: 11, fill: TOKENS.muted, fontFamily: 'DM Sans' }} axisLine={{ stroke: TOKENS.rule }} label={{ value: 'True Contribution %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: TOKENS.muted }} />
          <ZAxis type="number" dataKey="z" range={[90, 620]} />
          <ReferenceLine x={10} stroke={TOKENS.gold} strokeDasharray="6 4" strokeWidth={1.5} label={{ value: '10% share', position: 'top', fontSize: 10, fill: TOKENS.gold }} />
          <ReferenceLine y={avgC} stroke={TOKENS.gold} strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `Avg ${avgC.toFixed(1)}%`, position: 'right', fontSize: 10, fill: TOKENS.gold }} />
          <ReferenceLine y={0} stroke={TOKENS.rule} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.72} stroke="#fff" />)}
            <LabelList dataKey="name" position="top" style={{ fontSize: '8px', fill: TOKENS.navy, fontFamily: 'DM Sans' }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <Legend items={[['Strategic', TOKENS.teal], ['Grow', TOKENS.green], ['Renegotiate', TOKENS.gold], ['Review', TOKENS.red]]} />
    </div>
  );
}
