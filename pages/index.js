import { useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PublicNav } from '../components/layout/PublicNav';
import { PublicFooter } from '../components/layout/PublicFooter';

/* ── Intersection Observer hook for fade-in on scroll ── */
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

/* ── Hero dashboard card (SVG + CSS) ── */
function HeroDashboardCard() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Margin Leakage Breakdown</span>
          <span className="text-[10px] font-semibold bg-red-brand/20 text-red-light px-2 py-0.5 rounded-full">-4.2% margin erosion</span>
        </div>
        {[
          { label: 'Unrecovered COGS inflation', pct: 38, color: 'bg-red-brand' },
          { label: 'Distributor margin creep', pct: 24, color: 'bg-gold' },
          { label: 'Promotional depth overshoot', pct: 22, color: 'bg-purple' },
          { label: 'FX-linked cost pass-through gap', pct: 16, color: 'bg-teal' },
        ].map((bar, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-white/70">{bar.label}</span>
              <span className="text-[11px] font-bold text-white/90">{bar.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
            </div>
          </div>
        ))}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/50">Total recoverable margin</span>
          <span className="text-sm font-bold text-gold">+₦142M / year</span>
        </div>
      </div>
      <div className="absolute -inset-4 bg-teal/10 rounded-3xl blur-2xl -z-10" />
    </div>
  );
}

/* ── Pillar card ── */
function PillarCard({ num, title, desc, color }) {
  const colors = {
    teal: 'border-teal/20 bg-teal-50/50',
    red: 'border-red-brand/20 bg-red-50/50',
    gold: 'border-gold/20 bg-gold-50/50',
    purple: 'border-purple/20 bg-purple-50/50',
  };
  const badgeColors = {
    teal: 'bg-teal text-white',
    red: 'bg-red-brand text-white',
    gold: 'bg-gold text-white',
    purple: 'bg-purple text-white',
  };
  return (
    <div data-reveal className={`opacity-0 rounded-2xl border p-6 transition-all hover:shadow-lg hover:-translate-y-1 ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${badgeColors[color]}`}>
          P{num}
        </span>
        <h3 className="text-base font-bold text-navy">{title}</h3>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Enterprise module data (all 4) ── */
const MODULES = [
  { mod: 'M1', title: 'SKU Portfolio Rationalisation', desc: 'Classify every SKU into a defend / reprice / delist framework. Identify margin-dilutive products and where to rationalise for portfolio health.', bg: 'bg-white border-purple/20' },
  { mod: 'M2', title: 'Forward Inflation Scenario Engine', desc: 'Model cost trajectories under multiple inflation scenarios \u2014 15%, 25%, 40% input cost inflation \u2014 and stress-test pricing strategy against each.', bg: 'bg-gold-50/40 border-gold/20' },
  { mod: 'M3', title: 'Trade Spend ROI Analyser', desc: 'Calculate the return on every ₦ of trade investment by channel and spend category. Identify which investments generate margin and which destroy it.', bg: 'bg-white border-teal/20' },
  { mod: 'M4', title: 'Distributor Performance Scorecard', desc: 'Rank every distributor relationship by true net margin contribution after logistics, rebates, and credit costs. Identify who to reward, renegotiate, or exit.', bg: 'bg-gold-50/40 border-gold/20' },
];

/* ── Logo ticker companies ── */
const COMPANY_LOGOS = [
  { name: 'Flour Mills of Nigeria', src: '/logos/flour-mills-of-nigeria.webp' },
  { name: 'GB Foods',               src: '/logos/gb-foods.webp' },
  { name: 'Julius Berger',          src: '/logos/julius-berger.webp' },
  { name: 'Sifax Group',            src: '/logos/sifax-group.png' },
  { name: 'Pade HCM',               src: '/logos/pade-hcm.webp' },
  { name: 'Arit of Africa',         src: '/logos/arit-of-africa.webp' },
  { name: 'PFS',                    src: '/logos/pfs.webp' },
];

export default function HomePage() {
  const rootRef = useScrollReveal();

  return (
    <>
      <Head>
        <title>MarginCOS | Commercial Operating System for Margin Recovery</title>
        <meta name="description" content="MarginCOS identifies pricing gaps, cost absorption failures, and channel leakage across your FMCG or manufacturing portfolio. Built for inflationary markets." />
      </Head>

      <div ref={rootRef} className="min-h-screen">
        <PublicNav />

        {/* \u2550\u2550\u2550\u2550 HERO \u2550\u2550\u2550\u2550 */}
        <section className="hero-mesh pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="fade-in-up">
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  Stop Absorbing Inflation.<br />
                  <span className="text-gold">Start Recovering Margin.</span>
                </h1>
                <p className="mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-lg">
                  MarginCOS gives FMCG, manufacturing, and retail companies in high-inflation markets the intelligence to identify pricing gaps, quantify cost absorption, and recover margin across every SKU, channel, and region.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-brand text-white font-semibold text-sm hover:bg-red-light transition-all shadow-lg shadow-red-brand/20">
                    Request a Diagnostic
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                  <Link href="/platform"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/80 font-semibold text-sm hover:bg-white/10 hover:text-white transition-all">
                    See How It Works
                  </Link>
                </div>
              </div>
              <div className="fade-in-up delay-300 hidden lg:block">
                <HeroDashboardCard />
              </div>
            </div>
          </div>
        </section>

        {/* \u2550\u2550\u2550\u2550 STATS — numbers in Gold \u2550\u2550\u2550\u2550 */}
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                { val: '3\u20136%', label: 'Revenue as EBITDA Uplift' },
                { val: '15\u201330', label: 'Days DSO Reduction' },
                { val: '10\u201330\u00d7', label: 'Platform ROI' },
              ].map((s, i) => (
                <div key={i} data-reveal className="opacity-0">
                  <div className="text-3xl md:text-4xl font-black text-gold">{s.val}</div>
                  <div className="mt-1 text-sm text-slate-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* \u2550\u2550\u2550\u2550 SOCIAL PROOF TICKER \u2550\u2550\u2550\u2550 */}
        <section className="bg-slate-50 border-b border-slate-100 py-10 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <p data-reveal className="opacity-0 text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Trusted by leading organisations across West Africa
            </p>
          </div>
          <div className="relative">
            <div className="flex logo-ticker items-center" style={{ width: 'max-content' }}>
              {[...Array(2)].map((_, setIdx) => (
                COMPANY_LOGOS.map((logo, i) => (
                  <div key={`${setIdx}-${i}`} className="flex-shrink-0 mx-6 px-6 py-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center"
                    style={{ minWidth: 160 }}>
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="max-w-[120px] h-[40px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                ))
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
          </div>
        </section>

        {/* \u2550\u2550\u2550\u2550 FOUR PILLARS \u2550\u2550\u2550\u2550 */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">Core Engine</span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">What MarginCOS Analyses</h2>
              <p data-reveal className="opacity-0 mt-4 text-slate-500 leading-relaxed">
                Four analytical pillars run simultaneously on your portfolio data, surfacing margin leakage with Naira-quantified recovery actions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PillarCard num={1} title="Pricing Intelligence" color="teal"
                desc="Identify pricing gaps, benchmark against competitors, and quantify WTP headroom before you leave revenue on the table." />
              <PillarCard num={2} title="Cost Pass-Through" color="red"
                desc="Measure how much input cost inflation you\u2019re absorbing vs. passing through \u2014 broken down by SKU and FX exposure." />
              <PillarCard num={3} title="Channel Economics" color="gold"
                desc="Calculate true net contribution margin by route to market, accounting for distributor margin, logistics, and rebates." />
              <PillarCard num={4} title="Trade Execution" color="purple"
                desc="Analyse promotional depth vs. volume lift, flag loss-making promotions, and quantify trade investment ROI." />
            </div>
          </div>
        </section>

        {/* \u2550\u2550\u2550\u2550 ENTERPRISE MODULES (all 4) \u2550\u2550\u2550\u2550 */}
        <section id="about" className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">Enterprise</span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">Advanced Intelligence for Complex Portfolios</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MODULES.map((m, i) => (
                <div key={i} data-reveal className={`opacity-0 rounded-2xl border p-6 hover:shadow-lg transition-all ${m.bg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-xs font-black text-white">{m.mod}</span>
                    <h3 className="text-base font-bold text-navy">{m.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* \u2550\u2550\u2550\u2550 HOW IT WORKS \u2550\u2550\u2550\u2550 */}
        <section id="how-it-works" className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">Process</span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">How It Works</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Enter your portfolio data', desc: 'SKU by SKU via the in-app form, or bulk import via CSV. No ERP integration required.' },
                { step: '02', title: 'Run the analysis', desc: 'The engine processes all four pillars simultaneously in seconds, quantifying every margin leak in Naira.' },
                { step: '03', title: 'Act on the output', desc: 'Prioritised recommendations with ₦ impact quantified per action \u2014 from repricing to rationalisation.' },
              ].map((s, i) => (
                <div key={i} data-reveal className="opacity-0 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-navy mx-auto flex items-center justify-center mb-5">
                    <span className="text-lg font-black text-gold">{s.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-navy mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* \u2550\u2550\u2550\u2550 TRUST STRIP \u2550\u2550\u2550\u2550 */}
        <section className="bg-navy py-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                'Row-Level Data Isolation',
                'Authenticated Access Only',
                'Your Data Stays Yours',
                'No ERP Required',
                'Built on Enterprise Infrastructure',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs font-semibold text-white/70 whitespace-nowrap">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* \u2550\u2550\u2550\u2550 PRICING PREVIEW \u2550\u2550\u2550\u2550 */}
        <section id="pricing-section" className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">Plans</span>
            <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy mb-12">Simple, Transparent Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { name: 'Essentials', desc: 'Pricing Intelligence pillar for lean teams.' },
                { name: 'Professional', desc: 'All four pillars for commercial and finance leads.' },
                { name: 'Enterprise', desc: 'Full platform with advanced modules and onboarding.' },
              ].map((tier, i) => (
                <div key={i} data-reveal className="opacity-0 bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wider">{tier.name}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{tier.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/pricing" data-reveal
              className="opacity-0 inline-flex items-center gap-2 mt-10 px-6 py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-all">
              View Pricing
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </section>

        <PublicFooter />
      </div>
    </>
  );
}
