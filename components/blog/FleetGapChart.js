export default function FleetGapChart() {
  const lanes = [
    { name: 'Lagos-Kano',     gap: -260000 },
    { name: 'Lagos-PH',       gap: -185000 },
    { name: 'Kano-Maiduguri', gap: -142000 },
    { name: 'Abuja-Jos',      gap:  -78000 },
    { name: 'Lagos-Abuja',    gap:  -95000 },
    { name: 'Lagos-Ibadan',   gap:  +45000 },
    { name: 'PH-Aba',         gap:  +62000 },
    { name: 'Lagos-Onitsha',  gap:  +38000 },
  ];

  // Sort: worst deficit first, then above-floor lanes
  const sorted = [...lanes].sort((a, b) => a.gap - b.gap);

  const MAX_ABS = 260000;
  const color  = (gap) => gap >= 0 ? '#1A9E5C' : '#C0392B';
  const bgColor = (gap) => gap >= 0 ? 'rgba(26,158,92,0.08)' : 'rgba(192,57,43,0.07)';

  const totalDeficit  = lanes.filter(l => l.gap < 0).reduce((s, l) => s + l.gap, 0);
  const belowCount    = lanes.filter(l => l.gap < 0).length;
  const monthlyDeficit = Math.abs(totalDeficit) * 2 * 4; // 2 trips/week × 4 weeks

  return (
    <div style={{ margin: '2.5rem 0', background: '#F8FAFC', border: '1px solid #E5E8EC', borderRadius: '16px', padding: '28px 24px 20px' }}>

      {/* Header */}
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
        Fleet lane profitability
      </p>
      <p style={{ color: '#1B2A4A', fontSize: '18px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '4px', lineHeight: 1.3 }}>
        Rate Deficit by Lane (Contracted Rate vs Cost Floor, ₦ per trip)
      </p>
      <p style={{ color: '#8899AA', fontSize: '13px', marginBottom: '20px' }}>
        5 of 8 lanes operating below their cost floor. The deficit compounds every trip.
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', color: '#1A9E5C', fontWeight: 600 }}>
          ▮ Above floor (viable)
        </span>
        <span style={{ fontSize: '11px', color: '#C0392B', fontWeight: 600 }}>
          ▮ Below floor (loss per trip)
        </span>
      </div>

      {/* Chart rows */}
      {sorted.map((lane, i) => {
        const barPct = (Math.abs(lane.gap) / MAX_ABS) * 100;
        const c  = color(lane.gap);
        const bg = bgColor(lane.gap);

        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            marginBottom: i < sorted.length - 1 ? '10px' : 0,
            padding: '8px 10px',
            background: bg,
            borderRadius: '8px',
            boxSizing: 'border-box',
          }}>
            {/* Lane name */}
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#1B2A4A',
              width: 130,
              flexShrink: 0,
              textAlign: 'right',
            }}>
              {lane.name}
            </span>

            {/* Bar */}
            <div style={{ flex: 1, minWidth: 0, height: '10px', position: 'relative' }}>
              <div style={{
                width: `${barPct}%`,
                height: '10px',
                background: c,
                borderRadius: '0 4px 4px 0',
                opacity: 0.85,
              }} />
            </div>

            {/* Value */}
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: c,
              width: 80,
              flexShrink: 0,
              textAlign: 'left',
            }}>
              {lane.gap >= 0
                ? `+₦${(lane.gap / 1000).toFixed(0)}k`
                : `−₦${(Math.abs(lane.gap) / 1000).toFixed(0)}k`}
            </span>
          </div>
        );
      })}

      {/* Summary footer */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E8EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: '#8899AA', fontSize: '11px', margin: 0 }}>
          Diesel at ₦1,700/litre. 25% minimum margin target. 2 trips/week per lane.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#C0392B', fontFamily: "'Playfair Display', Georgia, serif", margin: 0 }}>{belowCount}/8</p>
            <p style={{ fontSize: '10px', color: '#8899AA', margin: 0 }}>Lanes below floor</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#C0392B', fontFamily: "'Playfair Display', Georgia, serif", margin: 0 }}>
              ₦{(Math.abs(totalDeficit) / 1000).toFixed(0)}k
            </p>
            <p style={{ fontSize: '10px', color: '#8899AA', margin: 0 }}>Deficit per trip cycle</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#C0392B', fontFamily: "'Playfair Display', Georgia, serif", margin: 0 }}>
              ₦{(monthlyDeficit / 1000000).toFixed(2)}M
            </p>
            <p style={{ fontSize: '10px', color: '#8899AA', margin: 0 }}>/month (2 trips/wk)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
