import { useEffect } from 'react';
import Head from 'next/head';
import path from 'path';
import fs from 'fs';
import { PublicNav } from '../components/layout/PublicNav';
import { PublicFooter } from '../components/layout/PublicFooter';

export default function HomePage({ css, sectionsHtml }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Pillar tabs
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

    // Active pillar auto-cycle for demo feel
    let cycleInterval;
    const startCycle = () => {
      let current = 0;
      const order = ['p1', 'p2', 'p3', 'p4'];
      cycleInterval = setInterval(() => {
        current = (current + 1) % order.length;
        const tab = document.querySelector(`[data-panel="${order[current]}"]`);
        if (tab) tab.click();
      }, 4000);
    };

    // Stop cycle on user interaction
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        clearInterval(cycleInterval);
      });
    });

    // Start cycle after 3s
    const cycleTimer = setTimeout(startCycle, 3000);

    // CTA click tracking
    document.querySelectorAll('a[href^="mailto:"], .btn-plan, .btn-hero-primary, .btn-hero-secondary').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'cta_click', {
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
      clearInterval(cycleInterval);
      clearTimeout(cycleTimer);
      clearTimeout(viewportRevealTimer);
    };
  }, []);

  return (
    <>
      <Head>
        <title>MarginCOS — Nigeria&apos;s Margin Recovery Platform</title>
        <meta name="description" content="MarginCOS is the Commercial Operating System for margin recovery — built for Nigerian FMCG, manufacturing, and retail companies navigating inflationary markets. Pricing intelligence, cost pass-through analysis, channel economics, and trade execution analytics." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://margincos.com/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://margincos.com/" />
        <meta property="og:title" content="MarginCOS — Nigeria's Margin Recovery Platform" />
        <meta property="og:description" content="The Commercial Operating System for Margin Recovery. Built for FMCG, manufacturing, and retail companies navigating inflationary markets." />
        <meta property="og:image" content="https://margincos.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="MarginCOS" />
        <meta property="og:locale" content="en_NG" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MarginCOS — Nigeria's Margin Recovery Platform" />
        <meta name="twitter:description" content="The Commercial Operating System for Margin Recovery. Built for Nigerian FMCG companies." />
        <meta name="twitter:image" content="https://margincos.com/og-image.png" />

        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="https://margincos.com/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://margincos.com/apple-touch-icon.png" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-NNS2Q29Z2M" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-NNS2Q29Z2M');
            `
          }}
        />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "MarginCOS",
              "description": "Commercial Operating System for Margin Recovery — built for FMCG, manufacturing, and retail companies in Nigeria and West Africa.",
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

      <style jsx global>{`
        @media (max-width: 900px) {
          .hero { padding: 100px 24px 60px !important; }
          .hero-inner { width: 100% !important; max-width: 100% !important; }
          .hero-content-row { grid-template-columns: 1fr !important; }
          .hero-right { display: none !important; }
          .hero-left {
            text-align: center !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
          }
          .hero-title { text-align: center !important; }
          .hero-sub { text-align: center !important; margin: 0 auto 40px !important; }
          .hero-actions {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            gap: 12px !important;
          }
          .btn-hero-primary, .btn-hero-secondary {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          .metrics-strip {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .metric-cell { padding: 20px 12px !important; }
          .metric-val { font-size: 28px !important; }
          .metric-label { font-size: 11px !important; }
        }
      `}</style>

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
