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
        if (e.isIntersecting) { e.target.classList.add('fade-in-up'); obs.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, []);
  return ref;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD', rate: 1 },
  { code: 'NGN', symbol: '₦', label: 'NGN', rate: 1650 },
  { code: 'EUR', symbol: '€', label: 'EUR', rate: 0.92 },
  { code: 'GBP', symbol: '£', label: 'GBP', rate: 0.79 },
];

const BASE_PRICES = {
  essentials: { monthly: 250, annual: 213, impl: 450 },
  professional: { monthly: 850, annual: 723, impl: 1300 },
  enterprise: { monthly: 2400, annual: 2040, impl: 0 },
};

const ANNUAL_DISCOUNT = 0.15;

const TIERS = [
  { key: 'essentials', name: 'Essentials', tagline: 'Pricing Intelligence pillar for lean teams getting started with margin analysis.', cta: 'Start Pilot', ctaHref: '/contact?plan=essentials', featured: false },
  { key: 'professional', name: 'Professional', tagline: 'All four analytical pillars for commercial and finance leads managing complex portfolios.', cta: 'Start Pilot', ctaHref: '/contact?plan=professional', featured: true },
  { key: 'enterprise', name: 'Enterprise', tagline: 'Full platform with advanced modules, dedicated onboarding, and unlimited scale.', cta: 'Request a Demo', ctaHref: '/contact?plan=enterprise', featured: false },
];

const FEATURES = [
  { label: 'Pricing Intelligence (P1)',             ess: true,  pro: true,  ent: true },
  { label: 'Cost Pass-Through (P2)',                ess: false, pro: true,  ent: true },
  { label: 'Channel Economics (P3)',                ess: false, pro: true,  ent: true },
  { label: 'Trade Execution (P4)',                  ess: false, pro: true,  ent: true },
  { label: 'SKU Portfolio Rationalisation (M1)',    ess: false, pro: false, ent: true },
  { label: 'Forward Inflation Scenario Engine (M2)',ess: false, pro: false, ent: true },
  { label: 'Trade Spend ROI Analyser (M3)',         ess: false, pro: false, ent: true },
  { label: 'Distributor Performance Scorecard (M4)',ess: false, pro: false, ent: true },
  { label: 'CSV bulk import',                       ess: true,  pro: true,  ent: true },
  { label: 'Up to 100 SKUs',                        ess: true,  pro: false, ent: false },
  { label: 'Up to 500 SKUs',                        ess: false, pro: true,  ent: false },
  { label: 'Unlimited SKUs',                        ess: false, pro: false, ent: true },
  { label: 'Email support',                         ess: true,  pro: true,  ent: true },
  { label: 'Priority support',                      ess: false, pro: true,  ent: true },
  { label: 'Dedicated account manager',             ess: false, pro: false, ent: true },
  { label: '4-week onboarding',                     ess: false, pro: false, ent: true },
  { label: 'Multi-user access',                     ess: false, pro: false, ent: true },
];

const FAQS = [
  { q: 'Do I need to integrate my ERP?', a: 'No. MarginCOS works from exported commercial data entered directly into the platform. There is no ERP integration required — most teams are live within 48 hours.' },
  { q: 'How long does onboarding take?', a: 'Essentials and Professional clients are live within 48 hours. Enterprise includes a structured 4-week onboarding with a dedicated account manager.' },
  { q: 'What data do I need to get started?', a: 'SKU-level pricing, COGS, volume, and channel data for your active portfolio. A CSV template is available inside the platform to guide data preparation.' },
  { q: 'Is my data shared with other clients?', a: 'No. Row-level security ensures each client\u2019s data is completely isolated at the database level. No client can see or access another\u2019s data.' },
  { q: 'Can I upgrade my plan?', a: 'Yes. Upgrades take effect immediately and are prorated for the remainder of your billing period.' },
];

function PricingCard({ tier, annual, formatPrice }) {
  const prices = BASE_PRICES[tier.key];
  const price = annual ? prices.annual : prices.monthly;

  return (
    <div className={`relative rounded-2xl border p-8 flex flex-col transition-all hover:shadow-lg ${
      tier.featured ? 'border-red-brand shadow-md bg-white scale-[1.02] z-10' : 'border-slate-200 bg-white'
    }`}>
      {tier.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-brand text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{tier.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-navy">{formatPrice(price)}</span>
          <span className="text-sm text-slate-400 font-medium">/mo</span>
        </div>
        {!annual && <p className="mt-1 text-xs font-semibold" style={{ color: '#0D8F8F' }}>Save {Math.round(ANNUAL_DISCOUNT * 100)}% with annual billing</p>}
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">{tier.tagline}</p>
        <p className="mt-2 text-xs text-slate-400">
          {prices.impl > 0 ? `+ ${formatPrice(prices.impl)} implementation` : '4-week onboarding included'}
        </p>
      </div>
      <Link href={tier.ctaHref}
        className={`mt-auto w-full text-center py-3 rounded-xl font-semibold text-sm transition-all block ${
          tier.featured ? 'bg-red-brand text-white hover:bg-red-light' : 'border border-slate-200 text-navy hover:border-teal hover:text-teal'
        }`}>
        {tier.cta} →
      </Link>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-sm font-semibold text-navy pr-4">{q}</span>
        <svg className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-5 text-sm text-slate-500 leading-relaxed">{a}</div>}
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const rootRef = useScrollReveal();

  const formatPrice = (usdAmount) => {
    if (usdAmount === 0) return 'Included';
    const converted = Math.round(usdAmount * currency.rate);
    return currency.symbol + converted.toLocaleString();
  };

  return (
    <>
      <Head>
        <title>Pricing | MarginCOS</title>
        <meta name="description" content="Essentials from $250/mo. Professional from $850/mo. Enterprise from $2,400/mo. No ERP required. 14-day pilot included." />
      </Head>

      <div ref={rootRef} className="min-h-screen">
        <PublicNav />

        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="fade-in-up text-3xl md:text-5xl font-black text-white leading-tight">Simple, Transparent Pricing</h1>
            <p className="fade-in-up delay-200 mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              All plans include a 14-day pilot. No ERP integration required. Cancel anytime.
            </p>
          </div>
        </section>

        <section className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center gap-4 mb-10">
              {/* Row 1 — Monthly/Annual toggle */}
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium ${!annual ? 'text-navy' : 'text-gray-400'}`}>Monthly</span>
                <button onClick={() => setAnnual(!annual)}
                  className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ backgroundColor: annual ? '#0D8F8F' : '#D1D5DB' }}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className={`text-sm font-medium ${annual ? 'text-navy' : 'text-gray-400'}`}>Annual</span>
                {!annual && (
                  <span className="text-sm font-semibold" style={{ color: '#0D8F8F' }}>(save 15%)</span>
                )}
              </div>
              {/* Row 2 — Currency selector */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-1 py-1">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      currency.code === c.code
                        ? 'text-white shadow-sm'
                        : 'text-gray-500 hover:text-navy'
                    }`}
                    style={currency.code === c.code ? { backgroundColor: '#1B2A4A' } : {}}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
              {TIERS.map(tier => <PricingCard key={tier.key} tier={tier} annual={annual} formatPrice={formatPrice} />)}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              All prices shown in {currency.label}. NGN rates are indicative and updated periodically. Contracts are invoiced in USD unless otherwise agreed.
            </p>
          </div>
        </section>

        <section className="bg-white py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6">
            <h2 data-reveal className="opacity-0 text-xl md:text-2xl font-black text-navy text-center mb-12">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Feature</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Essentials</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-red-brand uppercase tracking-wider">Professional</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-3 pr-4 text-slate-700 font-medium">{f.label}</td>
                      {['ess', 'pro', 'ent'].map(k => (
                        <td key={k} className="py-3 px-4 text-center">
                          {f[k]
                            ? <svg className="w-5 h-5 mx-auto text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6">
            <h2 data-reveal className="opacity-0 text-xl md:text-2xl font-black text-navy text-center mb-12">Frequently Asked Questions</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 md:px-8">
              {FAQS.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </section>

        <section className="bg-navy py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Ready to see your margin opportunity?</h2>
            <p className="text-white/50 mb-8">Start with a 14-day pilot on your real portfolio data.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-brand text-white font-semibold text-sm hover:bg-red-light transition-all shadow-lg shadow-red-brand/20">
                Request Diagnostic →
              </Link>
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
