/**
 * P1 Pricing Intelligence — WTP Headroom by Product
 * Stacked bar chart: navy = current price captured, gold = recoverable gap
 * Each bar normalized to its own WTP ceiling (= 100% height)
 */
export default function P1PricingGraphic() {
  // gap = WTP headroom as % of WTP ceiling (WTP - current) / WTP
  const bars = [
    { label: 'Dairy',   gap: 14, current: 86 },
    { label: 'Noodles', gap: 10, current: 90 },
    { label: 'Cocoa',   gap: 13, current: 87 },
    { label: 'Pasta',   gap: 15, current: 85 },
    { label: 'Oil 1L',  gap:  9, current: 91 },
  ];

  const BAR_H   = 120;  // max bar height = 100% of WTP
  const BASELINE = 162; // y of baseline (0%)
  const BAR_W   = 34;
  const START_X = 18;
  const STEP    = 52;

  return (
    <div
      className="rounded-2xl border bg-white p-5"
      style={{ borderColor: 'rgba(13,143,143,0.2)' }}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94A3B8' }}>
        WTP Headroom by Product
      </p>
      <p className="text-[10px] mb-3" style={{ color: '#94A3B8' }}>
        Recoverable margin per SKU vs. WTP ceiling
      </p>

      <svg viewBox="0 0 290 188" className="w-full" aria-hidden="true">
        {/* Grid lines */}
        {[0, 50, 100].map(pct => {
          const y = BASELINE - (pct / 100) * BAR_H;
          return (
            <g key={pct}>
              <line
                x1="14" y1={y} x2="278" y2={y}
                stroke={pct === 0 ? '#CBD5E1' : '#F1F5F9'}
                strokeWidth={pct === 0 ? 1 : 0.5}
                strokeDasharray={pct === 100 ? '4 3' : undefined}
              />
              <text x="11" y={y + 3} fontSize="7.5" fill="#94A3B8" textAnchor="end">
                {pct}%
              </text>
            </g>
          );
        })}

        {/* WTP ceiling label */}
        <text x="22" y={BASELINE - BAR_H - 6} fontSize="7.5" fill="#94A3B8">
          WTP ceiling
        </text>

        {/* Bars */}
        {bars.map(({ label, gap, current }, i) => {
          const x = START_X + i * STEP;
          const goldH = Math.round((gap / 100) * BAR_H);
          const navyH = BAR_H - goldH;

          return (
            <g key={label}>
              {/* Gold (gap) portion — top */}
              <rect
                x={x} y={BASELINE - BAR_H}
                width={BAR_W} height={goldH}
                rx="3" fill="#D4A843"
              />
              {/* Navy (current price) portion — bottom */}
              <rect
                x={x} y={BASELINE - BAR_H + goldH}
                width={BAR_W} height={navyH}
                rx="2" fill="#1B2A4A"
              />
              {/* Gap % label above bar */}
              <text
                x={x + BAR_W / 2} y={BASELINE - BAR_H - 4}
                fontSize="9" fill="#D4A843" textAnchor="middle" fontWeight="700"
              >
                +{gap}%
              </text>
              {/* Product label below baseline */}
              <text
                x={x + BAR_W / 2} y={BASELINE + 13}
                fontSize="8" fill="#64748B" textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-5 mt-1">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: '#1B2A4A' }}
          />
          <span className="text-[10px]" style={{ color: '#64748B' }}>Current price</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: '#D4A843' }}
          />
          <span className="text-[10px]" style={{ color: '#64748B' }}>WTP gap (recoverable)</span>
        </div>
      </div>
    </div>
  );
}
