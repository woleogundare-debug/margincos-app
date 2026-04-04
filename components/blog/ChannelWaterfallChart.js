export default function ChannelWaterfallChart() {
  const steps = [
    { label: 'Gross', pct: 42, color: '#0D8F8F' },
    { label: 'Distrib.', pct: -12, color: '#C0392B' },
    { label: 'Credit', pct: -4, color: '#C0392B' },
    { label: 'Rebates', pct: -3, color: '#C0392B' },
    { label: 'Returns', pct: -2, color: '#C0392B' },
    { label: 'Logistics', pct: -5, color: '#C0392B' },
    { label: 'Net', pct: 16, color: '#0D8F8F' },
  ];
  const maxH = 180;
  const scale = maxH / 45;
  const barW = 50;
  const gap = 16;
  const baseY = 220;
  let running = 0;
  const bars = steps.map((s, i) => {
    if (i === 0) { running = s.pct; return { ...s, y: baseY - s.pct * scale, h: s.pct * scale, isFirst: true }; }
    if (i === steps.length - 1) { return { ...s, y: baseY - s.pct * scale, h: s.pct * scale, isLast: true }; }
    const top = running;
    running += s.pct;
    return { ...s, y: baseY - top * scale, h: Math.abs(s.pct) * scale };
  });
  return (
    <div style={{ background: '#1B2A4A', borderRadius: '12px', padding: '28px 32px', margin: '32px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px 0' }}>CHANNEL MARGIN WATERFALL</p>
      <p style={{ color: '#CBD5E0', fontSize: '13px', margin: '0 0 20px 0' }}>From gross margin to true net channel margin</p>
      <svg viewBox="0 0 490 270" style={{ width: '100%', maxWidth: '490px' }}>
        {bars.map((b, i) => {
          const x = 12 + i * (barW + gap);
          return (
            <g key={i}>
              <rect x={x} y={b.y} width={barW} height={b.h} fill={b.color} rx={3} opacity={b.isFirst ? 0.7 : 1} />
              <text x={x + barW / 2} y={b.y - 8} textAnchor="middle" fill={b.color} fontSize="12" fontWeight="700">
                {b.pct > 0 ? `${b.pct}%` : `${b.pct}%`}
              </text>
              <text x={x + barW / 2} y={baseY + 16} textAnchor="middle" fill="#8896A7" fontSize="9">{b.label}</text>
            </g>
          );
        })}
        <line x1="8" y1={baseY} x2="480" y2={baseY} stroke="#2A3F66" strokeWidth="1" />
      </svg>
      <div style={{ display: 'flex', gap: '20px', marginTop: '8px', flexWrap: 'wrap' }}>
        <span style={{ color: '#0D8F8F', fontSize: '11px' }}>■ Margin</span>
        <span style={{ color: '#C0392B', fontSize: '11px' }}>■ Deductions</span>
        <span style={{ color: '#D4A843', fontSize: '11px', fontWeight: 600 }}>26 percentage points lost between gross and net</span>
      </div>
    </div>
  );
}
