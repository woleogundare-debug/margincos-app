import { useState, useEffect, useRef } from 'react';
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

/* ── Pricing data ── */
const MONTHLY = { essentials: 250, professional: 850, enterprise: 2400 };
const ANNUAL_DISCOUNT = 0.15;
const IMPL = { essentials: 450, professional: 1300, enterprise: null }; // enterprise = 4-week onboarding included

const TIERS = [
  {
    key: 'essentials',
    name: 'Essentials',
    tagline: 'Pricing Intelligence pillar for lean teams getting started with margin analysis.',
    cta: 'Start Pilot',
    ctaHref: 'mailto:info@margincos.com?subject=Essentials%20Pilot',
    featured: false,
  },
  {
    key: 'professional',
    name: 'Professional',
    tagline: 'All four analytical pillars for commercial and finance leads managing complex portfolios.',
    cta: 'Start Pilot',
    ctaHref: 'mailto:info@margincos.com?subject=Professional%20Pilot',
    featured: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    tagline: 'Full platform with advanced modules, dedicated onboarding, and unlimited scale.',
    cta: 'Request a Demo',
    ctaHref: 'mailto:info@margincos.com?subject=Enterprise%20Demo',
    featured: false,
  },
];

const FEATURES = [
  { label: 'Pricing Intelligence (P1)',            ess: true,  pro: true,  ent: true },
  { label: 'Cost Pass-Through (P2)',               ess: false, pro: true,  ent: true },
  { label: 'Channel Economics (P3)',               ess: false, pro: true,  ent: true },
  { label: 'Trade Execution (P4)',                 ess: false, pro: true,  ent: true },
  { label: 'SKU Portfolio Rationalisation (M1)',   ess: false, pro: false, ent: true },
  { label: 'Forward Inflation Scenario Engine (M2)',ess: false, pro: false, ent: true },
  { label: 'Trade Spend ROI Analyser (M3)',        ess: false, pro: false, ent: true },
  { label: 'Distributor Performance Scorecard (M4)',ess: false, pro: false, ent: true },
  { label: 'CSV bulk import',                      ess: true,  pro: true,  ent: true },
  { label: 'Up to 100 SKUs',                       ess: true,  pro: false, ent: false },
  { label: 'Up to 500 SKUs',                       ess: false, pro: true,  ent: false },
  { label: 'Unlimited SKUs',                       ess: false, pro: false, ent: true },
  { label: 'Email support',                        ess: true,  pro: true,  ent: true },
  { label: 'Priority support',                     ess: false, pro: true,  ent: true },
  { label: 'Dedicated account manager',            ess: false, pro: false, ent: true },
  { label: '4-week onboarding',                    ess: false, pro: false, ent: true },
  { label: 'Multi-user access',                    ess: false, pro: false, ent: true },
];

const FAQS = [
  {
    q: 'Do I need to integrate my ERP?',
    a: 'No. MarginCOS works from exported commercial data entered directly into the platform. There is no ERP integration required — most teams are live within 48 hours.',
  },
  {
    q: 'How long does onboarding take?',
    a: 'Essentials and Professional clients are live within 48 hours. Enterprise includes a structured 4-week onboarding with a dedicated account manager.',
  },
  {
    q: 'What data do I need to get started?',
    a: 'SKU-level pricing, COGS, volume, and channel data for your active portfolio. A CSV template is available inside the platform to guide data preparation.',
  },
  {
    q: 'Is my data shared with other clients?',
    a: 'No. Row-level security ensures each client\u2019s data is completely isolated at the database level. No client can see or access another\u2019s data.',
  },
  {
    q: 'Can I upgrade my plan?',
    a: 'Yes. Upgrades take effect immediately and are prorated for the remainder of your billing period.',
  },
];

function PricingCard({ tier, annual }) {
  const monthly = MONTHLY[tier.key];
  const price = annual ? Math.round(monthly * (1 - ANNUAL_DISCOUNT)) : monthly;
  const impl = IMPL[tier.key];

  return (
    <div className={`relative rounded-2xl border p-8 flex flex-col transition-all hover:shadow-lg ${
      tier.featured
        ? 'border-teal shadow-md bg-white scale-[1.02] z-10'
        : 'border-slate-200 bg-white'
    }`}>
      {tier.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{tier.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-navy">${price}</span>
          <span className="text-sm text-slate-400 font-medium">/mo</span>
        </div>
        {annual && (
          <p className="mt-1 text-xs text-teal font-semibold">
            Save {Math.round(ANNUAL_DISCOUNT * 100)}% with annual billing
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">{tier.tagline}</p>
        {impl ? (
          <p className="mt-2 text-xs text-slate-400">+ ${impl.toLocaleString()} implementation</p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">4-week onboarding included</p>
        )}
      </div>

      <a href={tier.ctaHref}
        className={`mt-auto w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
          tier.featured
            ? 'bg-teal text-white hover:bg-teal-dark'
            : 'border border-slate-200 text-navy hover:border-teal hover:text-teal'
        }`}>
        {tier.cta} →
      </a>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-sm font-semibold text-navy pr-4">{q}</span>
        <svg className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 text-sm text-slate-500 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const rootRef = useScrollReveal();

  return (
    <>
      <Head>
        <title>Pricing — MarginCOS</title>
        <meta name="description" content="Simple, transparent pricing for MarginCOS. All plans include a 14-day pilot. No ERP integration required." />
      </Head>

      <div ref={rootRef} className="min-h-screen">
        <PublicNav />

        {/* ════ HERO ════ */}
        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="fade-in-up text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="fade-in-up delay-200 mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              All plans include a 14-day pilot. No ERP integration required. Cancel anytime.
            </p>
          </div>
        </section>

        {/* ════ TOGGLE + CARDS ════ */}
        <section className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-14">
              <span className={`text-sm font-semibold transition-colors ${!annual ? 'text-navy' : 'text-slate-400'}`}>Monthly</span>
              <button onClick={() => setAnnual(!annual)}
                className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-teal' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-semibold transition-colors ${annual ? 'text-navy' : 'text-slate-400'}`}>
                Annual <span className="text-teal text-xs font-bold">(save 15%)</span>
              </span>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
              {TIERS.map(tier => (
                <PricingCard key={tier.key} tier={tier} annual={annual} />
              ))}
            </div>
          </div>
        </section>

        {/* ════ FEATURE COMPARISON ════ */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6">
            <h2 data-reveal className="opacity-0 text-xl md:text-2xl font-black text-navy text-center mb-12">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Feature</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Essentials</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-teal uppercase tracking-wider">Professional</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-3 pr-4 text-slate-700 font-medium">{f.label}</td>
                      {['ess', 'pro', 'ent'].map(k => (
                        <td key={k} className="py-3 px-4 text-center">
                          {f[k] ? (
                            <svg className="w-5 h-5 mx-auto text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ════ FAQ ════ */}
        <section className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 data-reveal className="opacity-0 text-xl md:text-2xl font-black text-navy text-center mb-12">Frequently Asked Questions</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 md:px-8">
              {FAQS.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ════ BOTTOM CTA ════ */}
        <section className="bg-navy py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Ready to see your margin opportunity?</h2>
            <p className="text-white/50 mb-8">Start with a 14-day pilot on your real portfolio data.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="mailto:info@margincos.com?subject=Diagnostic%20Request"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-all shadow-lg shadow-teal/20">
                Request Diagnostic
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
              <Link href="/platform"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/80 font-semibold text-sm hover:bg-white/10 hover:text-white transition-all">
                View Platform →
              </Link>
            </div>
          </div>
        </section>

        <PublicFooter />
      </div>
    </>
  );
}
