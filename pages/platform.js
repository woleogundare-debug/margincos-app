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
        {/* Grid lines */}
        {[0, 50, 100, 150, 200].map(y => (
          <line key={y} x1="40" y1={y} x2="310" y2={y} stroke="#E2E8F0" strokeWidth="0.5" />
        ))}
        {/* Bars */}
        <rect x="60" y="40" width="40" height="160" rx="4" fill="#0D9488" opacity="0.8" />
        <rect x="120" y="70" width="40" height="130" rx="4" fill="#0D9488" opacity="0.6" />
        <rect x="180" y="100" width="40" height="100" rx="4" fill="#D97706" opacity="0.7" />
        <rect x="240" y="130" width="40" height="70" rx="4" fill="#DC2626" opacity="0.6" />
        {/* Labels */}
        <text x="80" y="195" textAnchor="middle" className="text-[9px]" fill="#94A3B8">P1</text>
        <text x="140" y="195" textAnchor="middle" className="text-[9px]" fill="#94A3B8">P2</text>
        <text x="200" y="195" textAnchor="middle" className="text-[9px]" fill="#94A3B8">P3</text>
        <text x="260" y="195" textAnchor="middle" className="text-[9px]" fill="#94A3B8">P4</text>
        {/* Trend line */}
        <polyline points="60,55 120,80 180,95 240,115 310,100" stroke="#0F2942" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    </div>
  );
}

/* ── Pillar deep-dive section ── */
function PillarSection({ num, title, color, problem, delivers, users, reverse }) {
  const badgeColors = { teal: 'bg-teal', red: 'bg-red', amber: 'bg-amber', purple: 'bg-purple' };
  const borderColors = { teal: 'border-teal/20', red: 'border-red/20', amber: 'border-amber/20', purple: 'border-purple/20' };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? 'lg:direction-rtl' : ''}`}>
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
            <span className={`inline-block w-16 h-16 rounded-2xl ${badgeColors[color]} flex items-center justify-center text-2xl font-black text-white mb-3 mx-auto`}>
              P{num}
            </span>
            <p className="text-xs text-slate-400 font-medium">{title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlatformPage() {
  const rootRef = useScrollReveal();

  return (
    <>
      <Head>
        <title>Platform — MarginCOS</title>
        <meta name="description" content="A purpose-built margin intelligence engine for FMCG, manufacturing, and retail companies operating in high-inflation markets." />
      </Head>

      <div ref={rootRef} className="min-h-screen">
        <PublicNav />

        {/* ════ HERO ════ */}
        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="fade-in-up text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
              The MarginCOS Platform
            </h1>
            <p className="fade-in-up delay-200 mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              A purpose-built margin intelligence engine for FMCG, manufacturing, and retail companies operating in high-inflation, high-complexity markets.
            </p>
          </div>
        </section>

        {/* ════ PLATFORM OVERVIEW ════ */}
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

        {/* ════ FOUR PILLARS — DEEP DIVE ════ */}
        <section className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest mb-3">The Four Pillars</span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">Deep Dive Into the Engine</h2>
            </div>

            <div className="space-y-24">
              <PillarSection
                num={1} title="Pricing Intelligence" color="teal" reverse={false}
                problem="Most FMCG companies reprice reactively, without visibility on competitor positioning, margin floor breaches, or willingness-to-pay headroom. The result is chronic under-pricing or poorly timed increases that erode volume."
                delivers={[
                  'Competitor price gap per SKU — quantified in ₦ and %',
                  'WTP headroom quantified in ₦/month of recoverable revenue',
                  'Margin floor breach alerts with repricing recommendations',
                ]}
                users={['CFO', 'Commercial Director']}
              />
              <PillarSection
                num={2} title="Cost Pass-Through" color="red" reverse={true}
                problem="Input cost inflation accumulates silently. Without SKU-level tracking, absorbed costs compound into structural margin erosion that remains invisible on the P&L until it's too late to act."
                delivers={[
                  'Pass-through rate vs. BUA Foods 75% benchmark',
                  'FX-linked cost decomposition by SKU',
                  'Actual vs. self-reported inflation comparison',
                ]}
                users={['CFO', 'Finance Director', 'Supply Chain']}
              />
              <PillarSection
                num={3} title="Channel Economics" color="amber" reverse={false}
                problem="Gross margin looks healthy until logistics, distributor margin, and rebates are deducted by channel — revealing that some routes to market are actively destroying value while appearing profitable."
                delivers={[
                  'Net contribution margin by channel',
                  'Distributor performance ranking',
                  'Weak channel identification with remediation actions',
                ]}
                users={['Commercial Director', 'Sales Director', 'Trade Marketing']}
              />
              <PillarSection
                num={4} title="Trade Execution" color="purple" reverse={true}
                problem="Trade investment is the largest untracked cost line in most FMCG P&Ls. Promotional depth routinely exceeds margin, with no mechanism to catch it before the spend is committed."
                delivers={[
                  'Promotion P&L per SKU — revenue, cost, and net impact',
                  'Break-even lift calculation for every promo',
                  'Loss-making promotion flagging with alternatives',
                ]}
                users={['Trade Marketing', 'Sales Director', 'CFO']}
              />
            </div>
          </div>
        </section>

        {/* ════ ENTERPRISE MODULES ════ */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span data-reveal className="opacity-0 inline-block text-xs font-bold text-purple uppercase tracking-widest mb-3">Enterprise</span>
              <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy">Advanced Intelligence Modules</h2>
              <p data-reveal className="opacity-0 mt-4 text-slate-500 leading-relaxed">
                Enterprise clients access advanced analytical modules that go deeper — portfolio-level rationalisation, forward scenario planning, and more. These modules run on the same data and appear alongside the four core pillars.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  mod: 'M1', title: 'SKU Portfolio Rationalisation',
                  desc: 'Classify every SKU into a defend / reprice / delist framework based on margin contribution vs. strategic importance. Identify which SKUs are margin-dilutive, which to protect, and where to rationalise for portfolio health.',
                  color: 'border-purple/20 bg-purple-50/30',
                },
                {
                  mod: 'M2', title: 'Forward Inflation Scenario Engine',
                  desc: 'Model cost trajectories under multiple inflation scenarios and stress-test your pricing strategy against each. See how margin erodes at 15%, 25%, or 40% input cost inflation — and what pricing actions are needed to maintain floor margin.',
                  color: 'border-gold/20 bg-gold-50/30',
                },
              ].map((m, i) => (
                <div key={i} data-reveal className={`opacity-0 rounded-2xl border p-8 ${m.color}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-sm font-black text-white">{m.mod}</span>
                    <h3 className="text-lg font-bold text-navy">{m.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ DATA ENTRY ════ */}
        <section className="bg-slate-50 py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span data-reveal className="opacity-0 inline-block text-xs font-bold text-teal uppercase tracking-widest mb-3">Data Entry</span>
            <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy mb-6">Your Data, Your Way</h2>
            <p data-reveal className="opacity-0 text-slate-500 leading-relaxed max-w-2xl mx-auto">
              MarginCOS does not require an ERP integration. Clients enter their portfolio data directly into the platform — either SKU by SKU via the built-in form, or by uploading a CSV file for bulk import. A downloadable CSV template is available to guide data preparation. Most teams are live and running their first analysis within 48 hours.
            </p>
          </div>
        </section>

        {/* ════ SECURITY ════ */}
        <section className="bg-navy py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 data-reveal className="opacity-0 text-xl md:text-2xl font-bold text-white mb-6">Enterprise-Grade Security</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: '🔐', label: 'Authenticated Access', desc: 'Supabase Auth with secure session management' },
                { icon: '🛡️', label: 'Row-Level Isolation', desc: 'Database policies ensure complete client data separation' },
                { icon: '🚫', label: 'No Shared Data', desc: 'Your data is never visible to other clients' },
                { icon: '🏗️', label: 'Enterprise Infra', desc: 'Built on Supabase with PostgreSQL and edge functions' },
              ].map((s, i) => (
                <div key={i} data-reveal className="opacity-0">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <h3 className="text-sm font-bold text-white mb-1">{s.label}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ CTA ════ */}
        <section className="bg-white py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 data-reveal className="opacity-0 text-2xl md:text-3xl font-black text-navy mb-4">Ready to see your margin opportunity?</h2>
            <p data-reveal className="opacity-0 text-slate-500 mb-8">Start with a 14-day pilot on your real portfolio data.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="mailto:info@margincos.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-all">
                Request Diagnostic
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
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
