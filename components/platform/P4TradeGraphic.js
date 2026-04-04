/**
 * P4 Trade Execution — Promotion ROI Matrix
 * 2×2 grid showing 4 promotions: 2 accretive (teal), 2 destructive (red).
 * Each card shows: promo name, volume uplift, margin impact, status badge.
 */
export default function P4TradeGraphic() {
  const promos = [
    {
      name:    'Buy 2 Get 1',
      volume:  '+28%',
      margin:  '−$42K',
      status:  'destructive',
      note:    'Requires +35% lift to break even',
    },
    {
      name:    '10% Off Modern',
      volume:  '+15%',
      margin:  '+$18K',
      status:  'accretive',
      note:    'Break-even at +10% — delivered +15%',
    },
    {
      name:    'Bundle Pack',
      volume:  '+8%',
      margin:  '+$31K',
      status:  'accretive',
      note:    'Low-cost mechanic, high margin return',
    },
    {
      name:    'End Cap Display',
      volume:  '+45%',
      margin:  '−$67K',
      status:  'destructive',
      note:    'Volume driven but not margin-accretive',
    },
  ];

  return (
    <div
      className="rounded-2xl border bg-white p-5"
      style={{ borderColor: 'rgba(107,70,193,0.2)' }}
    >
      <p
        className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
        style={{ color: '#94A3B8' }}
      >
        Promotion ROI Matrix
      </p>
      <p className="text-[10px] mb-3" style={{ color: '#94A3B8' }}>
        Volume uplift vs. net margin impact — 4 live promotions
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {promos.map((p, i) => {
          const isAccretive = p.status === 'accretive';
          return (
            <div
              key={i}
              className="rounded-xl p-3"
              style={{
                border: `1.5px solid ${isAccretive ? 'rgba(13,143,143,0.35)' : 'rgba(192,57,43,0.35)'}`,
                backgroundColor: isAccretive ? 'rgba(13,143,143,0.04)' : 'rgba(192,57,43,0.04)',
              }}
            >
              <p
                className="text-[10px] font-bold leading-tight mb-2"
                style={{ color: '#1B2A4A' }}
              >
                {p.name}
              </p>

              <div className="space-y-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] w-9 flex-shrink-0" style={{ color: '#94A3B8' }}>Vol</span>
                  <span className="text-[12px] font-bold" style={{ color: '#1B2A4A' }}>{p.volume}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] w-9 flex-shrink-0" style={{ color: '#94A3B8' }}>Margin</span>
                  <span
                    className="text-[12px] font-bold"
                    style={{ color: isAccretive ? '#0D8F8F' : '#C0392B' }}
                  >
                    {p.margin}
                  </span>
                </div>
              </div>

              <p className="text-[8.5px] leading-tight mb-2" style={{ color: '#94A3B8' }}>
                {p.note}
              </p>

              <span
                className="inline-block rounded px-1.5 py-0.5 text-[8px] font-bold uppercase"
                style={{
                  backgroundColor: isAccretive ? 'rgba(13,143,143,0.12)' : 'rgba(192,57,43,0.12)',
                  color: isAccretive ? '#0D8F8F' : '#C0392B',
                }}
              >
                {isAccretive ? '✓ Accretive' : '✗ Destructive'}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] mt-3 text-center" style={{ color: '#94A3B8' }}>
        Break-even uplift calculated before spend is committed
      </p>
    </div>
  );
}
