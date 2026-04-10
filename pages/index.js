import { useEffect } from 'react';
import Head from 'next/head';
import path from 'path';
import fs from 'fs';
import { PublicNav } from '../components/layout/PublicNav';
import { PublicFooter } from '../components/layout/PublicFooter';

export default function HomePage({ css, sectionsHtml }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Pillar tabs - manual click only, no auto-cycle.
    // The cycle was removed (see git history) because it created race
    // conditions on mobile where users would arrive at the pillars section
    // to find P2 or P3 already active. Manual clicks emit a GA4 event so we
    // can see which pillars users actually engage with.
    const tabs = document.querySelectorAll('.pillar-tab');
    const panels = document.querySelectorAll('.pillar-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.panel;
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById('panel-' + target);
        if (panel) panel.classList.add('active');

        // GA4 engagement tracking. Degrades to a no-op if the user has
        // declined cookies (window.gtag never gets defined in that case).
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'pillar_click', {
            event_category: 'engagement',
            event_label: target,
            page_location: window.location.pathname,
          });
        }
      });
    });

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => revealObserver.observe(el));

    // Bar shimmer observer
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.breakdown-grid').forEach(el => barObserver.observe(el));

    // CTA click tracking
    document.querySelectorAll('a[href^="mailto:"], .btn-plan, .btn-hero-primary, .btn-hero-secondary').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'cta_click', {
            'event_category': 'engagement',
            'event_label': btn.textContent.trim().substring(0, 50)
          });
        }
      });
    });

    // Force reveal elements already in viewport on direct load
    // (fallback for mobile where IntersectionObserver fires late)
    const viewportRevealTimer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('visible');
        }
      });
    }, 100);

    return () => {
      clearTimeout(viewportRevealTimer);
    };
  }, []);

  return (
    <>
      <Head>
        <title>MarginCOS — Commercial Operating System for Margin Recovery</title>
        <meta name="description" content="The Commercial Operating System for margin recovery. Pricing intelligence, cost pass-through, channel economics and trade execution. In your currency." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://margincos.com/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://margincos.com/" />
        <meta property="og:title" content="MarginCOS — Commercial Operating System for Margin Recovery" />
        <meta property="og:description" content="The Commercial Operating System for margin recovery. Pricing intelligence, cost pass-through, channel economics and trade execution. In your currency." />
        <meta property="og:image" content="https://margincos.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="MarginCOS" />
        <meta property="og:locale" content="en" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MarginCOS — Commercial Operating System for Margin Recovery" />
        <meta name="twitter:description" content="The Commercial Operating System for margin recovery. Pricing intelligence, cost pass-through, channel economics and trade execution. In your currency." />
        <meta name="twitter:image" content="https://margincos.com/og-image.png" />

        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="https://margincos.com/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://margincos.com/apple-touch-icon.png" />

        {/* Fonts are self-hosted via /public/fonts/ and preloaded in
            pages/_document.js. The old Google Fonts CDN stylesheet was
            removed because it caused render-blocking double-loading - the
            browser was fetching Playfair 700 and DM Sans 400/500/700 twice,
            once from gstatic (blocking) and once self-hosted. Removing the
            CDN link cut ~283 Kb of blocking font weight from first paint. */}

        {/* GA4 is loaded dynamically by components/CookieConsent.js after
            the user accepts the consent banner. */}

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "MarginCOS",
              "description": "The Commercial Operating System for margin recovery. Pricing intelligence, cost pass-through, channel economics and trade execution. In your currency.",
              "url": "https://margincos.com",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "USD",
                "lowPrice": "250",
                "highPrice": "2400"
              },
              "author": {
                "@type": "Organization",
                "name": "Carthena Advisory",
                "url": "https://carthenaadvisory.com"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "info@carthenaadvisory.com",
                "contactType": "sales"
              }
            })
          }}
        />
      </Head>

      <style jsx global>{css}</style>

      <PublicNav />

      <div dangerouslySetInnerHTML={{ __html: sectionsHtml }} />

      <PublicFooter />
    </>
  );
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'public', 'landing.html');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Extract CSS between <style> and </style>
  const styleStart = fileContent.indexOf('<style>') + '<style>'.length;
  const styleEnd = fileContent.indexOf('</style>');
  const css = fileContent.slice(styleStart, styleEnd);

  // Extract sections between <!-- ── HERO and <!-- ── FOOTER
  // Characters are U+2500 BOX DRAWINGS LIGHT HORIZONTAL
  const heroMarker = '<!-- \u2500\u2500 HERO';
  const footerMarker = '<!-- \u2500\u2500 FOOTER';

  const heroPos = fileContent.indexOf(heroMarker);
  const footerPos = fileContent.indexOf(footerMarker);
  const sectionsHtml = fileContent.slice(heroPos, footerPos).trim();

  return {
    props: {
      css,
      sectionsHtml,
    },
  };
}
