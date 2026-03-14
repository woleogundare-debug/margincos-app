import { useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PublicNav } from '../components/layout/PublicNav';
import { PublicFooter } from '../components/layout/PublicFooter';

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

/* ── Abstract dashboard SVG visual ── */
function DashboardVisual() {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 flex items-center justify-center min-h-[280px]">
      <svg viewBox="0 0 320 200" className="w-full max-w-sm" fill="none">
        {[0, 50, 100, 150, 200].map(y => (
          <line key={y} x1="40" y1={y} x2="310" y2={y} stroke="#E2E8F0" strokeWidth="0.5" />
        ))}
        <rect x="60" y="40" width="40" height="160" rx="4" fill="#0D8F8F" opacity="0.8" />
        <rect x="120" y="70" width="40" height="130" rx="4" fill="#0D8F8F" opacity="0.6" />
        <rect x="180" y="100" width="40" height="100" rx="4" fill="#D4A843" opacity="0.7" />
        <rect x="240" y="130" width="40" height="70" rx="4" fill="#C0392B" opacity="0.6" />
        <text x="80" y="195" textAnchor="middle" className="text-[9px]" fill="#94A3B8">P1</text>
        <text x="140" y="195" textAnchor="middle" className="text-[9px]" fill="#94A3B8">P2</text>
        <text x="200" y="195" textAnchor="middle" className="text-[9px]" fill="#94A3B8">P3</text>
        <text x="260" y="195" textAnchor="middle" className="text-[9px]" fill="#94A3B8">P4</text>
        <polyline points="60,55 120,80 180,95 240,115 310,100" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    </div>
  );
}

/* ── Pillar deep-dive section ── */
function PillarSection({ num, title, color, problem, delivers, users, reverse }) {
  const badgeColors = { teal: 'bg-teal', red: 'bg-red-brand', gold: 'bg-gold', purple: 'bg-purple' };
  const borderColors = { teal: 'border-teal/20', red: 'border-red-brand/20', gold: 'border-gold/20', purple: 'border-purple/20' };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}>
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

/* ── Enterprise modules (all 4) ── */
const MODULES = [
  { mod: 'M1', title: 'SKU Portfolio Rationalisation', desc: 'Classify every SKU into a defend / reprice / delist framework based on margin contribution vs. strategic importance. Identify which SKUs are margin-dilutive, which to protect, and where to rationalise for portfolio health.', bg: 'bg-white border-purple/20' },
  { mod: 'M2', title: 'Forward Inflation Scenario Engine', desc: 'Model cost trajectories under multiple inflation scenarios and stress-test your pricing strategy against each. See how margin erodes at 15%, 25%, or 40% input cost inflation — and what pricing actions are needed to maintain floor margin.', bg: 'bg-gold-50/40 border-gold/20' },
  { mod: 'M3', title: 'Trade Spend ROI Analyser', desc: 'Calculate the return on every ₦ of trade investment by channel and spend category. Surface which investments generate margin and which are destroying it — before the spend is committed.', bg: 'bg-white border-teal/20' },
  { mod: 'M4', title: 'Distributor Performance Scorecard', desc: 'Rank every distributor relationship by true net margin contribution after logistics, rebates, and credit costs. Identify who to reward, renegotiate, or exit.', bg: 'bg-gold-50/40 border-gold/20' },
];

export default function PlatformPage() {
  const rootRef = useScrollReveal();

  return (
    <>
      <Head>
        <title>Platform — Pricing Intelligence & Margin Analytics for Nigerian FMCG | MarginCOS</title>
        <meta name="description" content="Explore MarginCOS's eight analytical engines: SKU pricing intelligence, cost pass-through tracking, channel margin analysis, and trade spend ROI — purpose-built for FMCG and manufacturing companies in Nigeria and West Africa." />
        <meta property="og:image" content="https://margincos.com/og-image.png" />
        <meta name="twitter:image" content="https://margincos.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>

      <div ref={rootRef} className="min-h-screen">
        <PublicNav />

        {/* HERO */}
        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="fade-in-up text-3xl md:text-5xl font-black text-white leading-tight">
              The MarginCOS Platform
            </h1>
            <p className="fade-in-up delay-200 mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              MarginCOS is a margin recovery platform purpose-built for Nigerian FMCG, manufacturing, and retail. Eight analytical engines work simultaneously across your portfolio — giving your CFO and Commercial Director real-time pricing intelligence, cost pass-through analysis, and trade spend ROI from a single Excel upload.
            </p>
          </div>
        </section>

        {/* PLATFORM OVERVIEW */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div data-reveal className="opacity-0">
                <DashboardVisual />
              </div>
              <div>
                <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy mb-8">What Makes MarginCOS Different</h2>
                <div className="space-y-6">
                  {[
                    { title: 'Built for inflationary markets', desc: 'Not adapted from a Western SaaS template — designed from the ground up for the realities of operating in Nigeria and similar high-inflation economies.' },
                    { title: 'SKU-level granularity', desc: 'Not just portfolio averages — every metric, every recommendation, every Naira figure is calculated at the individual SKU level.' },
                    { title: 'No ERP integration required', desc: 'Works from your existing commercial data. Enter via the in-app form or bulk import a CSV. Live in hours, not months.' },
                    { title: 'Output in ₦', desc: 'Every recommendation is quantified in Naira impact — not abstract percentages, but real recoverable revenue per action.' },
                  ].map((item, i) => (
                    <div key={i} data-reveal className="opacity-0 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOUR PILLARS — DEEP DIVE */}
        <section className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">The Four Pillars</span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">Deep Dive Into the Engine</h2>
            </div>

            <div className="space-y-24">
              <div id="pricing-intelligence">
                <PillarSection num={1} title="Pricing Intelligence" color="teal" reverse={false}
                problem="Most FMCG companies in Nigeria reprice reactively, without visibility on competitor positioning, margin floor breaches, or willingness-to-pay headroom. Without a pricing strategy tool, the result is chronic under-pricing or poorly timed increases that erode volume."
                delivers={['SKU-level pricing intelligence with competitor benchmarks in ₦ and %', 'WTP headroom quantified in ₦/month of recoverable revenue', 'Margin floor breach alerts with repricing recommendations for FMCG portfolios']}
                users={['CFO', 'Commercial Director']} />
              </div>
              <div id="cost-pass-through">
                <PillarSection num={2} title="Cost Pass-Through" color="red" reverse={true}
                problem="Input cost inflation accumulates silently. Without cost pass-through analysis at the SKU level, absorbed costs compound into structural margin erosion — invisible on the P&L until inflation recovery is no longer viable."
                delivers={['Cost pass-through rate vs. BUA Foods 75% benchmark for margin improvement', 'FX-linked cost decomposition by SKU for inflation cost recovery planning', 'Actual vs. self-reported inflation comparison']}
                users={['CFO', 'Finance Director', 'Supply Chain']} />
              </div>
              <div id="channel-economics">
                <PillarSection num={3} title="Channel Economics" color="gold" reverse={false}
                problem="Gross margin looks healthy until logistics, distributor margin, trade credit costs, and rebates are deducted by channel — revealing that some routes to market are actively destroying value while appearing profitable."
                delivers={['Net route-to-market margin by channel including trade credit cost', 'Distributor performance ranking by true contribution', 'Weak channel identification with remediation actions']}
                users={['Commercial Director', 'Sales Director', 'Trade Marketing']} />
              </div>
              <div id="trade-execution">
                <PillarSection num={4} title="Trade Execution" color="purple" reverse={true}
                problem="Trade investment is the largest untracked cost line in most FMCG P&Ls. Without trade spend ROI visibility, promotional depth routinely exceeds margin — with no mechanism to catch it before the spend is committed."
                delivers={['Promotion profitability per SKU — revenue, cost, and net impact', 'Break-even lift calculation for trade spend ROI on every promo', 'Loss-making promotion flagging with margin-positive alternatives']}
                users={['Trade Marketing', 'Sales Director', 'CFO']} />
              </div>
            </div>
          </div>
        </section>

        {/* ENTERPRISE MODULES (all 4) */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">Enterprise</span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">Advanced Intelligence Modules</h2>
              <p data-reveal className="opacity-0 mt-4 text-slate-500 leading-relaxed">
                Enterprise clients access advanced analytical modules that go deeper — portfolio-level rationalisation, forward scenario planning, trade spend analytics, and distributor scorecards. These modules run on the same data and appear alongside the four core pillars.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MODULES.map((m, i) => {const modId = m.mod.toLowerCase(); return (
                <div key={i} id={modId} data-reveal className={`opacity-0 rounded-2xl border p-8 ${m.bg}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-sm font-black text-white">{m.mod}</span>
                    <h3 className="text-lg font-bold text-navy">{m.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                </div>
              )})}
            </div>
          </div>
        </section>

        {/* DATA ENTRY */}
        <section className="bg-slate-50 py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full mb-3">Data Entry</span>
            <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy mb-6">Your Data, Your Way</h2>
            <p data-reveal className="opacity-0 text-slate-500 leading-relaxed max-w-2xl mx-auto">
              MarginCOS does not require an ERP integration. Clients enter their portfolio data directly into the platform — either SKU by SKU via the built-in form, or by uploading a CSV file for bulk import. A downloadable CSV template is available to guide data preparation. Most teams are live and running their first analysis within 48 hours.
            </p>
          </div>
        </section>

        {/* SECURITY */}
        <section className="bg-navy py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 data-reveal className="opacity-0 text-xl md:text-2xl font-bold text-white mb-6">Enterprise-Grade Security</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Authenticated Access',  desc: 'Supabase Auth with secure session management' },
                { label: 'Row-Level Isolation',    desc: 'Database policies ensure complete client data separation' },
                { label: 'No Shared Data',         desc: 'Your data is never visible to other clients' },
                { label: 'Enterprise Infra',       desc: 'Built on Supabase with PostgreSQL and edge functions' },
              ].map((s, i) => (
                <div key={i} data-reveal className="opacity-0">
                  <div className="w-10 h-10 rounded-xl bg-teal/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{s.label}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy mb-4">Ready to see your margin opportunity?</h2>
            <p data-reveal className="opacity-0 text-slate-500 mb-8">Start with a 14-day pilot on your real portfolio data.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-brand text-white font-semibold text-sm hover:bg-red-light transition-all">
                Request Diagnostic
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-navy font-semibold text-sm hover:border-teal hover:text-teal transition-all">
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        <PublicFooter />
      </div>
    </>
  );
}
