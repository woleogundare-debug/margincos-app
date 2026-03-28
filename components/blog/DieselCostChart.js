export default function DieselCostChart() {
  return (
    <div className="stat-card">
      {/* Header label */}
      <p style={{ color: '#0D8F8F', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
        Diesel depot price movement
      </p>
      <p style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '28px', lineHeight: 1.3 }}>
        The single largest cost line has moved 55% — contracted rates haven&apos;t
      </p>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>

        {/* Left: price stack */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#A0B0C0', fontSize: '13px', margin: '0 0 4px 0' }}>Diesel depot price, mid-2024</p>
            <p style={{ color: '#FFFFFF', fontSize: '36px', fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", margin: 0, lineHeight: 1 }}>
              ₦1,100
            </p>
            <p style={{ color: '#6B7E90', fontSize: '11px', margin: '4px 0 0 0' }}>per litre</p>
          </div>
          <div>
            <p style={{ color: '#A0B0C0', fontSize: '13px', margin: '0 0 4px 0' }}>Diesel depot price, March 2026</p>
            <p style={{ color: '#C0392B', fontSize: '36px', fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", margin: 0, lineHeight: 1 }}>
              ₦1,700
            </p>
            <p style={{ color: '#6B7E90', fontSize: '11px', margin: '4px 0 0 0' }}>per litre</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch', flexShrink: 0 }} />

        {/* Right: impact */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: '#D4A843', fontSize: '56px', fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", margin: '0 0 4px 0', lineHeight: 1 }}>
            55%
          </p>
          <p style={{ color: '#A0B0C0', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            Increase in the single largest cost line
          </p>
          <p style={{ color: '#6B7E90', fontSize: '11px', margin: 0, lineHeight: 1.5 }}>
            Diesel accounts for ≥35% of trucking cash outflows in Nigeria.
            <br />
            <span style={{ color: '#8899AA' }}>Source: Mordor Intelligence, NBS</span>
          </p>
        </div>
      </div>

      {/* Bottom warning bar */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(192,57,43,0.1)',
        border: '1px solid rgba(192,57,43,0.2)',
        borderRadius: '8px',
      }}>
        <p style={{ color: '#A0B0C0', fontSize: '12px', margin: 0 }}>
          ⚠︎ PETROAN projects diesel may reach <strong style={{ color: '#C0392B' }}>₦2,000/litre</strong> if Middle East supply tensions persist.
        </p>
      </div>
    </div>
  );
}
