import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F7FA',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px' }}>
        <p style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#0D8F8F',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          MarginCOS
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '48px',
          fontWeight: 700,
          color: '#1B2A4A',
          marginBottom: '12px',
        }}>
          404
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#5A6B80',
          marginBottom: '32px',
          lineHeight: 1.6,
        }}>
          This page doesn&apos;t exist. You may have followed an outdated link or typed the URL incorrectly.
        </p>
        <Link href="/dashboard/portfolio" style={{
            display: 'inline-block',
            padding: '12px 28px',
            borderRadius: '10px',
            backgroundColor: '#1B2A4A',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Back to Dashboard
        </Link>
        <div style={{ marginTop: '16px' }}>
          <Link href="/" style={{
              fontSize: '13px',
              color: '#0D8F8F',
              textDecoration: 'none',
            }}>
              or go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
