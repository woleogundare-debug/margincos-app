import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

function enableGA() {
  if (typeof document === 'undefined') return;
  if (!GA4_ID) return; // graceful on empty env var (staging / dev)
  if (document.getElementById('ga4-script')) return; // already loaded

  // Load gtag.js
  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  // Configure
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA4_ID);
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const isDashboard = router.pathname.startsWith('/dashboard') || router.pathname.startsWith('/admin');

  useEffect(() => {
    const consent = localStorage.getItem('margincos_cookie_consent');
    if (consent === 'accepted') {
      enableGA();
    } else if (!consent && !isDashboard) {
      setVisible(true);
    }
    // If declined, nothing loads. No banner. No cookies.
  }, [isDashboard]);

  function handleAccept() {
    localStorage.setItem('margincos_cookie_consent', 'accepted');
    enableGA();
    setVisible(false);
  }

  function handleDecline() {
    localStorage.setItem('margincos_cookie_consent', 'declined');
    // Delete any GA cookies that may have been set
    document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.margincos.com';
    document.cookie = '_ga_NNS2Q29Z2M=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.margincos.com';
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
