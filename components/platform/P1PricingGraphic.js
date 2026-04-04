/**
 * P1 Pricing Intelligence — WTP Headroom by Product
 * Stacked bar chart: navy = current price captured, gold = recoverable gap.
 * Each bar normalised to its own WTP ceiling (= 100% height).
 *
 * Y-axis labels removed — gap % labels above each bar tell the story.
 * A dashed ceiling line + "WTP Ceiling" label top-right replaces the axis.
 */
export default function P1PricingGraphic() {
  // gap = (WTP - current) / WTP, current = current / WTP
  const bars = [
    { label: 'Dairy',   gap: 14, current: 86 },
    { label: 'Noodles', gap: 10, current: 90 },
    { label: 'Cocoa',   gap: 13, current: 87 },
    { label: 'Pasta',   gap: 15, current: 85 },
    { label: 'Oil 1L',  gap:  9, current: 91 },
  ];

  const BAR_H    = 116;  // total bar height = 100% of WTP ceiling
  const BASELINE = 160;  // y of baseline (0%)
  const TOP_Y    = BASELINE - BAR_H;  // y of WTP ceiling = 44
  const BAR_W    = 34;
  const START_X  = 22;
  const STEP     = 52;

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

      <svg viewBox="0 0 290 185" className="w-full" aria-hidden="true">

        {/* ── WTP ceiling dashed reference line ── */}
        <line
          x1={START_X} y1={TOP_Y}
          x2={START_X + 4 * STEP + BAR_W + 4} y2={TOP_Y}
          stroke="#CBD5E1" strokeWidth="0.75" strokeDasharray="4 3"
        />
        {/* "WTP Ceiling" label — right-aligned, clear of bars */}
        <text
          x={START_X + 4 * STEP + BAR_W + 8} y={TOP_Y + 4}
          fontSize="7.5" fill="#94A3B8"
        >
          WTP Ceiling
        </text>

        {/* ── Baseline ── */}
        <line
          x1={START_X - 4} y1={BASELINE}
          x2={START_X + 4 * STEP + BAR_W + 4} y2={BASELINE}
          stroke="#CBD5E1" strokeWidth="1"
        />

        {/* ── Bars ── */}
        {bars.map(({ label, gap }, i) => {
          const x = START_X + i * STEP;
          const goldH = Math.round((gap / 100) * BAR_H);
          const navyH = BAR_H - goldH;

          return (
            <g key={label}>
              {/* Gold (gap) portion — top of bar */}
              <rect
                x={x} y={TOP_Y}
                width={BAR_W} height={goldH}
                rx="3" fill="#D4A843"
              />
              {/* Navy (captured price) portion — bottom of bar */}
              <rect
                x={x} y={TOP_Y + goldH}
                width={BAR_W} height={navyH}
                rx="2" fill="#1B2A4A"
              />
              {/* Gap % label — centred above bar, clear of ceiling line */}
              <text
                x={x + BAR_W / 2} y={TOP_Y - 6}
                fontSize="9" fill="#D4A843" textAnchor="middle" fontWeight="700"
              >
                +{gap}%
              </text>
              {/* Product name below baseline */}
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

      {/* Legend */}
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
