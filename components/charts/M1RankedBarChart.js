import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useCurrency } from '../../contexts/CurrencyContext';
import { TOKENS, M1_COLORS, cardStyle, fmtMoney } from './chartTokens';

/**
 * M1 companion - "SKUs at risk" ranked bar. Reprice + Review only, ordered by
 * monthly margin at stake (descending). Bar colour by classification; the label
 * carries ₦ value + recommended verb. The note (engine finding.rankedBarNote)
 * shares one numerator/denominator with the Marimekko finding.
 */
export default function M1RankedBarChart({ results, note, cfg }) {
  const { currSym } = useCurrency();
  if (!results?.length) return null;

  const data = results
    .filter((r) => /Reprice|Review/.test(r.classification))
    .sort((a, b) => b.marginAtStake - a.marginAtStake)
    .slice(0, 12)
    .map((r) => ({
      name: r.sku,
      value: r.marginAtStake,
      color: M1_COLORS[r.classification] || TOKENS.muted,
      verb: /Review/.test(r.classification) ? 'Delist' : 'Reprice',
    }));
  if (!data.length) return null;

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: TOKENS.gold, fontFamily: 'DM Sans', marginBottom: '4px' }}>
        M1 · SKUS AT RISK
      </div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: 700, color: TOKENS.navy, marginBottom: '14px' }}>
        Ranked by monthly margin at stake
      </div>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 30 + 30)}>
        <BarChart layout="vertical" data={data} margin={{ top: 4, right: 150, bottom: 4, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.rule} horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => fmtMoney(v, currSym)} tick={{ fontSize: 10, fill: TOKENS.muted }} axisLine={{ stroke: TOKENS.rule }} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10, fill: TOKENS.navy }} axisLine={{ stroke: TOKENS.rule }} />
          <Tooltip formatter={(v) => [fmtMoney(v, currSym), 'Margin at stake']} cursor={{ fill: 'rgba(13,143,143,0.05)' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            <LabelList
              dataKey="value"
              content={(props) => {
                const { x, y, width, height, index } = props;
                const d = data[index];
                return (
                  <text x={x + width + 6} y={y + height / 2 + 4} fontSize={10} fontWeight={700} fill={d.color} fontFamily="DM Sans">
                    {fmtMoney(d.value, currSym)} · {d.verb}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {note && <p style={{ fontSize: '11px', color: TOKENS.muted, marginTop: '10px', fontFamily: 'DM Sans' }}>{note}</p>}
    </div>
  );
}
