/**
 * P3 Channel Economics — Channel Margin Waterfall
 * Vertical waterfall: Gross Margin 42% stepping down through
 * deductions to Net Margin 18%.
 *
 * Layout (6 columns):
 *   1. Gross Margin   +42%  navy  (full bar from 0 to 42)
 *   2. Distributor    −12%  red   (floating: 42 → 30)
 *   3. Trade Credit   − 4%  red   (floating: 30 → 26)
 *   4. Rebates        − 3%  red   (floating: 26 → 23)
 *   5. Logistics      − 5%  red   (floating: 23 → 18)
 *   6. Net Margin     +18%  teal  (full bar from 0 to 18)
 */
export default function P3ChannelGraphic() {
  const BASELINE = 175;  // y of 0%
  const MAX_VAL  = 42;   // Gross Margin (sets chart scale)
  const CHART_H  = 132;  // px for 42%
  const SCALE    = CHART_H / MAX_VAL; // px per %

  const COL_W = 30;
  const GAP   = 10;
  // 6 columns: total = 6*30 + 5*10 = 230. start at x=27, centred in 284px viewBox
  const START_X = 27;

  const steps = [
    { label: 'Gross\nMargin',  value: 42, type: 'positive', from: 0,  to: 42 },
    { label: 'Distributor',    value: 12, type: 'negative', from: 42, to: 30 },
    { label: 'Trade\nCredit',  value:  4, type: 'negative', from: 30, to: 26 },
    { label: 'Rebates',        value:  3, type: 'negative', from: 26, to: 23 },
    { label: 'Logistics',      value:  5, type: 'negative', from: 23, to: 18 },
    { label: 'Net\nMargin',    value: 18, type: 'result',   from: 0,  to: 18 },
  ];

  const getBarRect = (step, i) => {
    const x = START_X + i * (COL_W + GAP);
    if (step.type === 'positive' || step.type === 'result') {
      const h = step.to * SCALE;
      return { x, y: BASELINE - h, h };
    } else {
      // Deduction: floating bar from "from" level downward by value
      const topY  = BASELINE - step.from * SCALE;
      const h     = step.value * SCALE;
      return { x, y: topY, h };
    }
  };

  const getColor = (type) => {
    if (type === 'positive') return '#1B2A4A';
    if (type === 'result')   return '#0D8F8F';
    return '#C0392B';
  };

  return (
    <div
      className="rounded-2xl border bg-white p-5"
      style={{ borderColor: 'rgba(212,168,67,0.25)' }}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94A3B8' }}>
        Channel Margin Waterfall
      </p>
      <p className="text-[10px] mb-3" style={{ color: '#94A3B8' }}>
        Gross to net — every deduction itemised by channel
      </p>

      <svg viewBox="0 0 284 215" className="w-full" aria-hidden="true">
        {/* Horizontal reference lines */}
        {[0, 10, 20, 30, 40].map(pct => {
          const y = BASELINE - pct * SCALE;
          return (
            <g key={pct}>
              <line x1="20" y1={y} x2="264" y2={y} stroke="#F1F5F9" strokeWidth="0.5"/>
              <text x="18" y={y + 3} fontSize="7.5" fill="#CBD5E1" textAnchor="end">{pct}%</text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1="20" y1={BASELINE} x2="264" y2={BASELINE} stroke="#CBD5E1" strokeWidth="1"/>

        {/* Connector lines between steps (dashed, gray) */}
        {steps.slice(0, -1).map((step, i) => {
          const { x, y, h } = getBarRect(step, i);
          const nextX = x + COL_W + GAP;
          // Connect the BOTTOM of each deduction to the TOP of the next
          const connectY = step.type === 'positive'
            ? y                        // top of positive bar
            : y + h;                   // bottom of deduction = new running total
          return (
            <line
              key={i}
              x1={x + COL_W} y1={connectY}
              x2={nextX}     y2={connectY}
              stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="3 2"
            />
          );
        })}

        {/* Bars */}
        {steps.map((step, i) => {
          const { x, y, h } = getBarRect(step, i);
          const color = getColor(step.type);
          const valLabel = step.type === 'negative' ? `−${step.value}%` : `${step.to}%`;
          const labelY = step.type === 'negative'
            ? y - 4
            : y - 5;

          return (
            <g key={i}>
              <rect x={x} y={y} width={COL_W} height={h} rx="3" fill={color} opacity="0.9"/>

              {/* Value label above each bar */}
              <text
                x={x + COL_W / 2} y={labelY}
                fontSize={step.type === 'negative' ? 8.5 : 9.5}
                fill={color}
                textAnchor="middle"
                fontWeight="700"
              >
                {valLabel}
              </text>

              {/* Column label below baseline (multi-line via tspan) */}
              {step.label.includes('\n') ? (
                <>
                  <text x={x + COL_W / 2} y={BASELINE + 12} fontSize="7.5" fill="#64748B" textAnchor="middle">
                    {step.label.split('\n')[0]}
                  </text>
                  <text x={x + COL_W / 2} y={BASELINE + 22} fontSize="7.5" fill="#64748B" textAnchor="middle">
                    {step.label.split('\n')[1]}
                  </text>
                </>
              ) : (
                <text x={x + COL_W / 2} y={BASELINE + 12} fontSize="7.5" fill="#64748B" textAnchor="middle">
                  {step.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#1B2A4A' }}/>
          <span className="text-[10px]" style={{ color: '#64748B' }}>Gross margin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#C0392B' }}/>
          <span className="text-[10px]" style={{ color: '#64748B' }}>Deductions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: '#0D8F8F' }}/>
          <span className="text-[10px]" style={{ color: '#64748B' }}>Net margin</span>
        </div>
      </div>
    </div>
  );
}
