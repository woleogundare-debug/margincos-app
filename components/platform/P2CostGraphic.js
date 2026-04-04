/**
 * P2 Cost Pass-Through — Recovery Rate Benchmark
 * Horizontal gauge bar with 3 colour zones.
 * Marker pin at 47% (where most companies sit).
 * Benchmark line at 75% (Carthena Advisory benchmark).
 */
export default function P2CostGraphic() {
  const GAUGE_X = 24;
  const GAUGE_Y = 72;
  const GAUGE_W = 236;
  const GAUGE_H = 26;
  const RADIUS  = 6;

  const CURRENT   = 47;  // typical observed median (red zone)
  const BENCHMARK = 75;  // Carthena Advisory benchmark (teal zone)

  const currentX   = GAUGE_X + (CURRENT   / 100) * GAUGE_W;
  const benchmarkX = GAUGE_X + (BENCHMARK / 100) * GAUGE_W;

  // Zone widths
  const redEnd  = GAUGE_X + 0.40 * GAUGE_W;  // 0–40%
  const goldEnd = GAUGE_X + 0.70 * GAUGE_W;  // 40–70%
  const tealEnd = GAUGE_X + 1.00 * GAUGE_W;  // 70–100%

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

      <svg viewBox="0 0 284 175" className="w-full" aria-hidden="true">
        {/* ── Gauge track (3 zones) ── */}
        {/* Red zone: 0–40% */}
        <rect
          x={GAUGE_X} y={GAUGE_Y}
          width={0.40 * GAUGE_W} height={GAUGE_H}
          rx={RADIUS} ry={RADIUS}
          fill="#C0392B" opacity="0.85"
        />
        {/* Gold zone: 40–70% (overlapping corners intentionally) */}
        <rect
          x={redEnd} y={GAUGE_Y}
          width={0.30 * GAUGE_W} height={GAUGE_H}
          fill="#D4A843" opacity="0.85"
        />
        {/* Teal zone: 70–100% */}
        <rect
          x={goldEnd} y={GAUGE_Y}
          width={0.30 * GAUGE_W} height={GAUGE_H}
          rx={RADIUS} ry={RADIUS}
          fill="#0D8F8F" opacity="0.85"
        />

        {/* Zone percentage markers */}
        {[0, 40, 70, 100].map(pct => {
          const x = GAUGE_X + (pct / 100) * GAUGE_W;
          return (
            <text
              key={pct} x={x} y={GAUGE_Y + GAUGE_H + 12}
              fontSize="8.5" fill="#94A3B8" textAnchor="middle"
            >
              {pct}%
            </text>
          );
        })}

        {/* Zone labels inside bar */}
        <text x={GAUGE_X + 0.20 * GAUGE_W} y={GAUGE_Y + 16} fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700" opacity="0.9">At Risk</text>
        <text x={GAUGE_X + 0.55 * GAUGE_W} y={GAUGE_Y + 16} fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700" opacity="0.9">Watch</text>
        <text x={GAUGE_X + 0.85 * GAUGE_W} y={GAUGE_Y + 16} fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700" opacity="0.9">Managed</text>

        {/* ── Benchmark line at 75% ── */}
        <line
          x1={benchmarkX} y1={GAUGE_Y - 6}
          x2={benchmarkX} y2={GAUGE_Y + GAUGE_H + 6}
          stroke="#1B2A4A" strokeWidth="2" strokeDasharray="3 2"
        />
        <text
          x={benchmarkX + 4} y={GAUGE_Y - 10}
          fontSize="8.5" fill="#1B2A4A" fontWeight="700"
        >
          75% benchmark
        </text>

        {/* ── Current marker pin at 47% ── */}
        {/* Triangle pointing down onto the gauge */}
        <polygon
          points={`${currentX},${GAUGE_Y - 4} ${currentX - 6},${GAUGE_Y - 16} ${currentX + 6},${GAUGE_Y - 16}`}
          fill="#C0392B"
        />
        <rect
          x={currentX - 24} y={GAUGE_Y - 36}
          width={48} height={16}
          rx="4" fill="#C0392B"
        />
        <text
          x={currentX} y={GAUGE_Y - 25}
          fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700"
        >
          47% typical
        </text>

        {/* ── Explanatory callout ── */}
        <rect x="24" y="120" width="236" height="42" rx="8" fill="#FEF9F9" stroke="#F9CACA" strokeWidth="1"/>
        <text x="34" y="136" fontSize="8.5" fill="#C0392B" fontWeight="700">Gap to benchmark: 28 percentage points</text>
        <text x="34" y="150" fontSize="8" fill="#64748B">
          Every point below 70% = margin absorbed, not recovered
        </text>
      </svg>
    </div>
  );
}
