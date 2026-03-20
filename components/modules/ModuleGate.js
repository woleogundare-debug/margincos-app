import Link from 'next/link';

export function ModuleGate({ tier, moduleName, description, children }) {
  const isEnterprise = tier === 'enterprise';

  if (isEnterprise) return <>{children}</>;

  return (
    <div className="rounded-2xl p-10 text-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #111D33 0%, #1B2A4A 60%, #2A3F66 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(17, 29, 51, 0.3)',
      }}>

      {/* Subtle diagonal texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 8px)',
      }} />

      {/* Gold accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '60px', height: '3px', borderRadius: '0 0 4px 4px',
        background: 'linear-gradient(90deg, transparent, #D4A843, transparent)',
      }} />

      <div className="relative z-10">
        {/* Enterprise gold pill */}
        <span style={{
          display: 'inline-block', fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#D4A843', background: 'rgba(212, 168, 67, 0.12)',
          border: '1px solid rgba(212, 168, 67, 0.2)',
          padding: '4px 12px', borderRadius: '100px', marginBottom: '16px',
        }}>
          Enterprise
        </span>

        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '22px', fontWeight: 700, color: '#FFFFFF',
          marginBottom: '8px', letterSpacing: '-0.02em',
        }}>
          {moduleName}
        </h3>

        <p style={{
          fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)',
          maxWidth: '360px', margin: '0 auto 28px', lineHeight: 1.6,
        }}>
          {description}
        </p>

        <Link href="/pricing"
          style={{
            display: 'inline-block', padding: '12px 28px', borderRadius: '8px',
            background: '#D4A843', color: '#1B2A4A',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none',
            letterSpacing: '0.02em',
          }}>
          Unlock with Enterprise →
        </Link>
      </div>
    </div>
  );
}
