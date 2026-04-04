/**
 * P2 Cost Pass-Through — Recovery Rate Benchmark
 * Horizontal gauge bar with 3 colour zones.
 * Marker pin at 47% (where most companies sit).
 * Benchmark line at 75% (Carthena Advisory benchmark).
 *
 * Gauge spans x=8 to x=276 (GAUGE_W=268) to fill the SVG width,
 * eliminating the dead-space margins that made visual estimation hard.
 * Marker position: GAUGE_X + (CURRENT/100) * GAUGE_W = exact 47% of gauge.
 * A vertical stem line connects the label to the gauge surface.
 */
export default function P2CostGraphic() {
  const GAUGE_X = 8;
  const GAUGE_W = 268;   // gauge fills viewBox (8 + 268 = 276, leaving 8px right margin)
  const GAUGE_Y = 76;
  const GAUGE_H = 26;
  const RADIUS  = 6;

  const CURRENT   = 47;   // typical observed median
  const BENCHMARK = 75;   // Carthena Advisory benchmark

  // Marker x = exact 47% along the gauge (= GAUGE_X + 47% of GAUGE_W)
  const currentX   = GAUGE_X + (CURRENT   / 100) * GAUGE_W;  // = 8 + 125.96 = 133.96
  const benchmarkX = GAUGE_X + (BENCHMARK / 100) * GAUGE_W;  // = 8 + 201    = 209

  // Zone right-edge pixel positions
  const redEnd  = GAUGE_X + 0.40 * GAUGE_W;  // x at 40%
  const goldEnd = GAUGE_X + 0.70 * GAUGE_W;  // x at 70%

  return (
    <div
      className="rounded-2xl border bg-white p-5"
      style={{ borderColor: 'rgba(192,57,43,0.2)' }}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94A3B8' }}>
        Recovery Rate Benchmark
      </p>
      <p className="text-[10px] mb-3" style={{ color: '#94A3B8' }}>
        Cost pass-through rate vs. Carthena Advisory benchmark
      </p>

      <svg viewBox="0 0 284 178" className="w-full" aria-hidden="true">

        {/* ── Gauge track (3 zones) ── */}
        {/* Red zone 0–40% — rounded left corners only */}
        <rect
          x={GAUGE_X} y={GAUGE_Y}
          width={0.40 * GAUGE_W} height={GAUGE_H}
          rx={RADIUS} fill="#C0392B" opacity="0.85"
        />
        {/* Gold zone 40–70% — no rounding (joins red on left, teal on right) */}
        <rect
          x={redEnd} y={GAUGE_Y}
          width={0.30 * GAUGE_W} height={GAUGE_H}
          fill="#D4A843" opacity="0.85"
        />
        {/* Teal zone 70–100% — rounded right corners only */}
        <rect
          x={goldEnd} y={GAUGE_Y}
          width={0.30 * GAUGE_W} height={GAUGE_H}
          rx={RADIUS} fill="#0D8F8F" opacity="0.85"
        />

        {/* ── Zone labels inside bar ── */}
        <text x={GAUGE_X + 0.20 * GAUGE_W} y={GAUGE_Y + 16} fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700" opacity="0.9">At Risk</text>
        <text x={GAUGE_X + 0.55 * GAUGE_W} y={GAUGE_Y + 16} fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700" opacity="0.9">Watch</text>
        <text x={GAUGE_X + 0.85 * GAUGE_W} y={GAUGE_Y + 16} fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700" opacity="0.9">Managed</text>

        {/* ── Percentage scale below gauge ── */}
        {[0, 40, 70, 100].map(pct => {
          const x = GAUGE_X + (pct / 100) * GAUGE_W;
          return (
            <text
              key={pct} x={x} y={GAUGE_Y + GAUGE_H + 13}
              fontSize="8.5" fill="#94A3B8" textAnchor="middle"
            >
              {pct}%
            </text>
          );
        })}

        {/* ── Benchmark line at 75% ── */}
        <line
          x1={benchmarkX} y1={GAUGE_Y - 4}
          x2={benchmarkX} y2={GAUGE_Y + GAUGE_H + 4}
          stroke="#1B2A4A" strokeWidth="2" strokeDasharray="3 2"
        />
        <text
          x={benchmarkX} y={GAUGE_Y - 9}
          fontSize="8.5" fill="#1B2A4A" fontWeight="700" textAnchor="middle"
        >
          75% benchmark
        </text>

        {/* ── Current marker at 47% ── */}
        {/* Stem line: from label box bottom to gauge top surface */}
        <line
          x1={currentX} y1={GAUGE_Y - 4}
          x2={currentX} y2={GAUGE_Y}
          stroke="#C0392B" strokeWidth="1.5"
        />
        {/* Dot on gauge surface */}
        <circle cx={currentX} cy={GAUGE_Y} r="3.5" fill="#C0392B"/>
        {/* Label pill */}
        <rect
          x={currentX - 27} y={GAUGE_Y - 26}
          width={54} height={18}
          rx="5" fill="#C0392B"
        />
        <text
          x={currentX} y={GAUGE_Y - 14}
          fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700"
        >
          47% typical
        </text>

        {/* ── Explanatory callout ── */}
        <rect x={GAUGE_X} y="120" width={GAUGE_W} height="46" rx="8" fill="#FEF9F9" stroke="#F9CACA" strokeWidth="1"/>
        <text x={GAUGE_X + 10} y="137" fontSize="8.5" fill="#C0392B" fontWeight="700">Gap to benchmark: 28 percentage points</text>
        <text x={GAUGE_X + 10} y="153" fontSize="8" fill="#64748B">
          Every point below 70% = margin absorbed, not recovered
        </text>
      </svg>
    </div>
  );
}
