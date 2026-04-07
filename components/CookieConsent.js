import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const isDashboard = router.pathname.startsWith('/dashboard') || router.pathname.startsWith('/admin');

  useEffect(() => {
    const consent = localStorage.getItem('margincos_cookie_consent');
    if (!consent && !isDashboard) {
      setVisible(true);
    } else if (consent === 'accepted') {
      enableGA();
    }
    // If declined, GA stays denied - no analytics cookies set
  }, [isDashboard]);

  function enableGA() {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  }

  function handleAccept() {
    localStorage.setItem('margincos_cookie_consent', 'accepted');
    enableGA();
    setVisible(false);
  }

  function handleDecline() {
    localStorage.setItem('margincos_cookie_consent', 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#1B2A4A',
      borderTop: '1px solid #2A3F66',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <p style={{
        color: '#CBD5E0',
        fontSize: '13px',
        margin: 0,
        lineHeight: 1.5,
        maxWidth: '600px',
      }}>
        We use cookies to understand how visitors use this site.{' '}
        See our <a href="/privacy" style={{ color: '#0D8F8F', textDecoration: 'underline' }}>Privacy Policy</a>.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleDecline}
          style={{
            background: 'transparent',
            border: '1px solid #2A3F66',
            color: '#8896A7',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          style={{
            background: '#0D8F8F',
            border: 'none',
            color: '#FFFFFF',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
