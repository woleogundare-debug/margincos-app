import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';
import { TOKENS, M4_COLORS, clsName, cardStyle, Legend, fmtMoney } from './chartTokens';

const LEGEND = [['Strategic', TOKENS.teal], ['Grow', TOKENS.green], ['Renegotiate', TOKENS.gold], ['Review', TOKENS.red]];

/**
 * M4 companion - adaptive primitive (PLATFORM.ADAPTIVE_CHART_PRIMITIVES).
 * renderPrimitive === 'waterfall'  -> classical floating-bar waterfall with a
 *                                     running cumulative line + portfolio-total anchor.
 * renderPrimitive === 'ranked_bar' -> horizontal ranked bar by contribution ₦.
 * Bars colour by classification (consistent with the bubble, gate 9).
 */
export default function M4WaterfallChart({ waterfall, portfolioTotal, renderPrimitive, results, cfg }) {
  const { currSym } = useCurrency();

  const header = (title) => (
    <>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: TOKENS.gold, fontFamily: 'DM Sans', marginBottom: '4px' }}>M4 · DISTRIBUTOR CONTRIBUTION</div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 700, color: TOKENS.navy, marginBottom: '14px' }}>{title}</div>
    </>
  );

  // ── Ranked-bar variant (no destruction) ──
  if (renderPrimitive === 'ranked_bar') {
    const data = [...(results || [])].sort((a, b) => b.trueContrib - a.trueContrib).map((r) => ({
      name: r.name, value: r.trueContrib, color: M4_COLORS[r.classification] || TOKENS.muted,
    }));
    if (!data.length) return null;
    return (
      <div style={cardStyle}>
        {header('Contribution by distributor')}
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 28 + 30)}>
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 110, bottom: 4, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.rule} horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => fmtMoney(v, currSym)} tick={{ fontSize: 10, fill: TOKENS.muted }} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10, fill: TOKENS.navy }} />
            <Tooltip formatter={(v) => [fmtMoney(v, currSym), 'True contribution']} cursor={{ fill: 'rgba(13,143,143,0.05)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: '11px', color: TOKENS.muted, marginTop: '10px', fontFamily: 'DM Sans' }}>
          Portfolio contribution {fmtMoney(portfolioTotal, currSym)}/month · no distributor is destroying value, so a ranked bar (not a waterfall) fits the data.
        </p>
        <Legend items={LEGEND} />
      </div>
    );
  }

  // ── Waterfall variant (destruction present) ──
  if (!waterfall?.length) return null;
  let prev = 0;
  const data = waterfall.map((w) => {
    const lo = Math.min(prev, w.cumulative), hi = Math.max(prev, w.cumulative);
    const row = { name: w.name, base: lo, delta: hi - lo, cumulative: w.cumulative, contribution: w.contribution, isTotal: false, color: M4_COLORS[w.classification] || TOKENS.muted };
    prev = w.cumulative;
    return row;
  });
  data.push({ name: 'TOTAL', base: 0, delta: portfolioTotal, cumulative: portfolioTotal, contribution: portfolioTotal, isTotal: true, color: TOKENS.navy });

  const WaterfallTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: '8px', padding: '10px 14px', fontFamily: 'DM Sans', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <p style={{ fontWeight: 700, color: TOKENS.navy, marginBottom: '4px' }}>{d.name}</p>
        <p style={{ color: TOKENS.text, margin: '2px 0' }}>{d.isTotal ? 'Portfolio total' : 'Contribution'}: <b style={{ color: d.contribution < 0 ? TOKENS.red : TOKENS.navy }}>{fmtMoney(d.contribution, currSym)}</b></p>
        {!d.isTotal && <p style={{ color: TOKENS.text, margin: '2px 0' }}>Cumulative: <b style={{ color: TOKENS.navy }}>{fmtMoney(d.cumulative, currSym)}</b></p>}
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      {header('Contribution waterfall - worst to best')}
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 40, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.rule} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 8, fill: TOKENS.navy, fontFamily: 'DM Sans' }} interval={0} angle={-40} textAnchor="end" height={60} />
          <YAxis tickFormatter={(v) => fmtMoney(v, currSym)} tick={{ fontSize: 10, fill: TOKENS.muted }} axisLine={{ stroke: TOKENS.rule }} />
          <Tooltip content={<WaterfallTooltip />} cursor={{ fill: 'rgba(13,143,143,0.05)' }} />
          <ReferenceLine y={0} stroke={TOKENS.muted} />
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="delta" stackId="w" isAnimationActive={false}>
            {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.88} />)}
          </Bar>
          <Line type="linear" dataKey="cumulative" stroke={TOKENS.navy} strokeWidth={1.5} dot={{ r: 2, fill: TOKENS.navy }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '11px', color: TOKENS.muted, marginTop: '8px', fontFamily: 'DM Sans' }}>
        Worst → best · bar colour = classification · bars step down = value destroyed, up = accretive · line = running cumulative · navy = portfolio total ({fmtMoney(portfolioTotal, currSym)}).
      </p>
      <Legend items={LEGEND} />
    </div>
  );
}
