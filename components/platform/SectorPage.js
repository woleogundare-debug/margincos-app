import { useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PublicNav } from '../layout/PublicNav';
import { PublicFooter } from '../layout/PublicFooter';

/* ── Scroll reveal (mirrors pages/platform.js) ── */
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('fade-in-up');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Pillar colour mapping (matches platform.js order) ── */
const PILLAR_COLORS = ['teal', 'red', 'gold', 'purple'];

/* ── PillarSection — exact copy from pages/platform.js ── */
function PillarSection({ num, title, color, problem, delivers, users, reverse }) {
  const badgeColors  = { teal: 'bg-teal', red: 'bg-red-brand', gold: 'bg-gold', purple: 'bg-purple' };
  const borderColors = { teal: 'border-teal/20', red: 'border-red-brand/20', gold: 'border-gold/20', purple: 'border-purple/20' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className={reverse ? 'lg:order-2' : ''}>
        <div data-reveal className="opacity-0">
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white ${badgeColors[color]}`}>
              P{num}
            </span>
            <h3 className="text-xl md:text-2xl font-black text-navy">{title}</h3>
          </div>
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">The Problem</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{problem}</p>
          </div>
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">What MarginCOS Delivers</h4>
            <div className="space-y-2">
              {delivers.map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-700">{d}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Who Uses This</h4>
            <div className="flex flex-wrap gap-2">
              {users.map((u, i) => (
                <span key={i} className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{u}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={reverse ? 'lg:order-1' : ''} data-reveal>
        <div className={`opacity-0 rounded-2xl border ${borderColors[color]} bg-white p-8 min-h-[200px] flex items-center justify-center`}>
          <div className="text-center">
            <span className={`inline-flex w-16 h-16 rounded-2xl ${badgeColors[color]} items-center justify-center text-2xl font-black text-white mb-3 mx-auto`}>
              P{num}
            </span>
            <p className="text-xs text-slate-400 font-medium">{title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Module background classes (mirrors platform.js pattern) ── */
const MODULE_BG = [
  'bg-white border-purple/20',
  'bg-gold-50/40 border-gold/20',
  'bg-white border-teal/20',
  'bg-gold-50/40 border-gold/20',
];

/* ── SectorPage — shared template for all seven sector pages ── */
export default function SectorPage({
  sectorName,
  sectorSlug,
  metaTitle,
  metaDescription,
  heroHeadline,
  heroSubheadline,
  stat1,
  stat2,
  stat3,
  pillars,
  modules,
  ctaText,
  isLive,
}) {
  const rootRef = useScrollReveal();

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://margincos.com/platform/${sectorSlug}`} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://margincos.com/platform/${sectorSlug}`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content="https://margincos.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="https://margincos.com/og-image.png" />
      </Head>

      <div ref={rootRef} className="min-h-screen">
        <PublicNav />

        {/* ── HERO ── */}
        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="fade-in-up inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal/10 border border-teal/20 px-3 py-1 rounded-full mb-4">
              {sectorName}
            </span>
            <h1 className="fade-in-up text-3xl md:text-5xl font-black text-white leading-tight mt-3">
              {heroHeadline}
            </h1>
            <p className="fade-in-up delay-200 mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              {heroSubheadline}
            </p>
            {/* Stat cards */}
            <div className="fade-in-up delay-300 grid grid-cols-3 gap-4 md:gap-6 mt-12 max-w-2xl mx-auto">
              {[stat1, stat2, stat3].filter(Boolean).map((s, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xl md:text-2xl font-black text-white leading-tight">{s.value}</div>
                  <div className="text-xs text-white/50 mt-1.5 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOUR PILLARS ── */}
        <section className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">
                The Four Pillars
              </span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">Where Your Margin Leaks</h2>
            </div>
            <div className="space-y-24">
              {pillars.map((pillar, i) => (
                <PillarSection
                  key={pillar.id}
                  num={i + 1}
                  title={pillar.name}
                  color={PILLAR_COLORS[i] || 'teal'}
                  problem={pillar.problem}
                  delivers={pillar.delivers}
                  users={pillar.roles}
                  reverse={i % 2 !== 0}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── ENTERPRISE MODULES ── */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">
                Enterprise
              </span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">Advanced Intelligence Modules</h2>
              <p data-reveal className="opacity-0 mt-4 text-slate-500 leading-relaxed">
                Enterprise clients access four advanced analytical modules that go deeper — portfolio-level rationalisation, forward scenario planning, commercial spend analytics, and partner performance scorecards. These run on the same data alongside the four core pillars.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((m, i) => (
                <div key={m.id} data-reveal className={`opacity-0 rounded-2xl border p-8 ${MODULE_BG[i % 4]}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-sm font-black text-white">
                      {m.id}
                    </span>
                    <h3 className="text-lg font-bold text-navy">{m.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA (live) or WAITLIST (coming soon) ── */}
        {isLive ? (
          <section className="bg-white py-20 md:py-24">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy mb-4">
                {ctaText || 'Ready to see your margin opportunity?'}
              </h2>
              <p data-reveal className="opacity-0 text-slate-500 mb-8">
                Start with a 14-day pilot on your real portfolio data.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-brand text-white font-semibold text-sm hover:bg-red-light transition-all">
                  Request Diagnostic
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-navy font-semibold text-sm hover:border-teal hover:text-teal transition-all">
                  View Pricing
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-slate-50 py-20 md:py-24">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <span className="inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-4">
                Coming Soon
              </span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy mb-4">
                {sectorName} Support is in Development
              </h2>
              <p data-reveal className="opacity-0 text-slate-500 mb-8 max-w-xl mx-auto">
                We&apos;re building sector-specific analytical configurations for {sectorName}. Join the waitlist to be notified when it launches.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href={`mailto:info@carthenaadvisory.com?subject=MarginCOS Waitlist — ${sectorName}&body=Hi,%0A%0AI'd like to join the waitlist for MarginCOS ${sectorName} support.%0A%0ACompany:%0ARole:%0A`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-brand text-white font-semibold text-sm hover:bg-red-light transition-all">
                  Join the Waitlist
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-navy font-semibold text-sm hover:border-teal hover:text-teal transition-all">
                  Book a Conversation
                </Link>
              </div>
              <p className="text-xs text-slate-400 mt-5">
                Or{' '}
                <Link href="/contact" className="text-teal hover:underline">
                  book a conversation
                </Link>{' '}
                to discuss your specific requirements.
              </p>
            </div>
          </section>
        )}

        <PublicFooter />
      </div>
    </>
  );
}
