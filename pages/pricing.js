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
  { label: 'Pricing Intelligence report (PDF)',     ess: true,  pro: true,  ent: true },
  { label: 'Full P1-P4 margin intelligence report (PDF)', ess: false, pro: true, ent: true },
  { label: 'Board-ready report with all pillars + advanced modules (PDF)', ess: false, pro: false, ent: true },
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
        <title>Pricing — MarginCOS Margin Recovery Platform for Nigerian FMCG</title>
        <meta name="description" content="MarginCOS pricing: three tiers from $250/month. Essentials for single-pillar pricing intelligence, Professional for full margin analysis, Enterprise for multi-user commercial analytics with dedicated onboarding. NGN, EUR and GBP rates available." />
        <link rel="canonical" href="https://margincos.com/pricing" />
        <meta property="og:title" content="Pricing — MarginCOS Margin Recovery Platform" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://margincos.com/pricing" />
        <meta property="og:description" content="Three tiers from $250/month. Essentials, Professional, and Enterprise plans for Nigerian FMCG and manufacturing companies." />
        <meta property="og:image" content="https://margincos.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@margincos" />
        <meta name="twitter:title" content="Pricing — MarginCOS Margin Recovery Platform" />
        <meta name="twitter:description" content="Three tiers from $250/month. Essentials, Professional, and Enterprise plans for Nigerian FMCG and manufacturing companies." />
        <meta name="twitter:image" content="https://margincos.com/og-image.png" />
      </Head>

      <div ref={rootRef} className="min-h-screen">
        <PublicNav />

        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="fade-in-up text-3xl md:text-5xl font-black text-white leading-tight">Simple, Transparent Pricing</h1>
            <p className="fade-in-up delay-200 mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              Purpose-built for FMCG and manufacturing companies in Nigeria and West Africa — with pricing in USD, NGN, EUR, and GBP. All plans include a 14-day pilot.
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

            {/* Report feature callout */}
            <div className="max-w-4xl mx-auto mb-16 rounded-2xl overflow-hidden border border-gray-100"
              style={{ boxShadow: '0 2px 16px rgba(27,42,74,0.08)' }}>
              <div className="p-8 md:p-10" style={{ backgroundColor: '#1B2A4A' }}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(13,143,143,0.2)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D8F8F" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                      style={{ color: '#0D8F8F' }}>
                      Included on every plan
                    </p>
                    <h3 className="text-xl font-bold text-white mb-3"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Board-ready Margin Intelligence Reports
                    </h3>
                    <p className="text-sm leading-relaxed mb-0" style={{ color: '#A8B8CC' }}>
                      Every analysis generates a branded, multi-page PDF report — cover page, executive
                      summary with priority actions, and a full pillar-by-pillar breakdown with consultant-grade
                      narrative interpretation. Formatted to go directly to the CFO, MD, or board without
                      further editing.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  {[
                    { label: 'Essentials', desc: 'P1 Pricing Intelligence report' },
                    { label: 'Professional', desc: 'Full P1–P4 pillar report' },
                    { label: 'Enterprise', desc: 'Full report + advanced modules' },
                    { label: 'All plans', desc: 'Branded PDF, instant download' },
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#0D8F8F' }}>{item.label}</p>
                      <p className="text-xs" style={{ color: '#8899AA' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── PRICING CARDS ─────────────────────────────────────────────────── */}
            <section className="pricing-cards-section">
              <div className="pricing-cards-inner">
                <div className="pricing-cards-header">
                  <div className="section-tag-gold-pill">Transparent Pricing</div>
                  <h2 className="pricing-cards-heading">Simple. Scalable. No surprises.</h2>
                  <p className="pricing-cards-sub">Every plan includes the PDF Margin Intelligence Report, Action Tracker, and Excel import. No ERP integration required.</p>
                </div>
                <div className="pricing-cards-grid">
                  {/* Essentials */}
                  <div className="pc-card">
                    <div className="pc-badge">Essentials</div>
                    <h3 className="pc-name">Essentials</h3>
                    <p className="pc-desc">Pricing intelligence for lean commercial teams starting their margin recovery journey.</p>
                    <div className="pc-amount">
                      <div className="pc-val">$250</div>
                      <div className="pc-period">per month</div>
                      <span className="pc-annual">$213/mo billed annually — save 15%</span>
                    </div>
                    <ul className="pc-features">
                      <li>P1 Pricing Intelligence</li>
                      <li>PDF margin report (P1)</li>
                      <li>Action Tracker</li>
                      <li>1 team seat</li>
                      <li>Excel import</li>
                      <li>$450 implementation</li>
                    </ul>
                    <a href="/contact" className="pc-btn pc-btn-outline">Get Started</a>
                  </div>
                  {/* Professional */}
                  <div className="pc-card pc-featured">
                    <div className="pc-featured-label">Most Popular</div>
                    <div className="pc-badge">Professional</div>
                    <h3 className="pc-name">Professional</h3>
                    <p className="pc-desc">All four commercial pillars for CFOs and Commercial Directors managing full portfolios.</p>
                    <div className="pc-amount">
                      <div className="pc-val">$850</div>
                      <div className="pc-period">per month</div>
                      <span className="pc-annual">$723/mo billed annually — save 15%</span>
                    </div>
                    <ul className="pc-features">
                      <li>P1 Pricing Intelligence</li>
                      <li>P2 Cost Pass-Through</li>
                      <li>P3 Channel Economics</li>
                      <li>P4 Trade Execution</li>
                      <li>Full PDF report (P1–P4)</li>
                      <li>5 team seats</li>
                      <li>$1,300 implementation</li>
                    </ul>
                    <a href="/contact" className="pc-btn pc-btn-primary">Book a Diagnostic</a>
                  </div>
                  {/* Enterprise */}
                  <div className="pc-card">
                    <div className="pc-badge">Enterprise</div>
                    <h3 className="pc-name">Enterprise</h3>
                    <p className="pc-desc">The full platform with advanced modules, unlimited seats, and managed onboarding.</p>
                    <div className="pc-amount">
                      <div className="pc-val">$2,400</div>
                      <div className="pc-period">per month</div>
                      <span className="pc-annual">$2,040/mo billed annually — save 15%</span>
                    </div>
                    <ul className="pc-features">
                      <li>All P1–P4 pillars</li>
                      <li>M1–M4 Enterprise modules</li>
                      <li>Full 8-pillar PDF report</li>
                      <li>Unlimited team seats</li>
                      <li>4-week managed onboarding</li>
                      <li>Implementation included</li>
                    </ul>
                    <a href="/contact" className="pc-btn pc-btn-outline">Contact Sales</a>
                  </div>
                </div>
              </div>
            </section>

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

      <style jsx global>{`
        .pricing-cards-section {
          padding: 80px 48px;
          background: #F5F7FA;
        }
        .pricing-cards-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .pricing-cards-header {
          text-align: center;
          max-width: 560px;
          margin: 0 auto 60px;
        }
        .section-tag-gold-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #D4A843;
          background: rgba(212,168,67,0.12);
          border: 1px solid rgba(212,168,67,0.25);
          padding: 4px 14px;
          border-radius: 100px;
          margin-bottom: 20px;
        }
        .pricing-cards-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 700;
          color: #1B2A4A;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        .pricing-cards-sub {
          font-size: 15px;
          color: #5A6B80;
          line-height: 1.7;
        }
        .pricing-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: start;
        }
        .pc-card {
          background: #fff;
          border: 1px solid #E8ECF0;
          border-radius: 20px;
          padding: 40px 32px;
          position: relative;
          transition: all 0.3s;
        }
        .pc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 40px rgba(27,42,74,0.12);
          border-color: rgba(13,143,143,0.2);
        }
        .pc-featured {
          background: #1B2A4A;
          border-color: transparent;
          transform: scale(1.02);
          box-shadow: 0 12px 50px rgba(27,42,74,0.25);
        }
        .pc-featured:hover { transform: scale(1.02) translateY(-4px); }
        .pc-featured-label {
          position: absolute;
          top: -14px; left: 50%;
          transform: translateX(-50%);
          background: #C0392B;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 5px 16px;
          border-radius: 100px;
          white-space: nowrap;
        }
        .pc-badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0D8F8F;
          background: #E6F5F5;
          padding: 4px 12px;
          border-radius: 100px;
          display: inline-block;
          margin-bottom: 20px;
        }
        .pc-featured .pc-badge { background: rgba(13,143,143,0.15); }
        .pc-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #1B2A4A;
          margin-bottom: 8px;
        }
        .pc-featured .pc-name { color: #fff; }
        .pc-desc { font-size: 14px; color: #5A6B80; margin-bottom: 28px; line-height: 1.5; }
        .pc-featured .pc-desc { color: rgba(255,255,255,0.45); }
        .pc-amount { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #E8ECF0; }
        .pc-featured .pc-amount { border-color: rgba(255,255,255,0.07); }
        .pc-val {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 44px;
          font-weight: 700;
          color: #1B2A4A;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .pc-featured .pc-val { color: #D4A843; }
        .pc-period { font-size: 13px; color: #5A6B80; margin-top: 2px; }
        .pc-featured .pc-period { color: rgba(255,255,255,0.35); }
        .pc-annual { display: block; font-size: 12px; color: #27AE60; font-weight: 500; margin-top: 6px; }
        .pc-features {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 32px;
        }
        .pc-features li {
          font-size: 14px;
          color: #5A6B80;
          padding-left: 20px;
          position: relative;
        }
        .pc-features li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #0D8F8F;
          font-weight: 700;
        }
        .pc-featured .pc-features li { color: rgba(255,255,255,0.55); }
        .pc-featured .pc-features li::before { color: #0D8F8F; }
        .pc-btn {
          display: block;
          text-align: center;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          padding: 14px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .pc-btn-outline {
          border: 1.5px solid #E8ECF0;
          color: #1B2A4A;
        }
        .pc-btn-outline:hover { border-color: #0D8F8F; color: #0D8F8F; }
        .pc-btn-primary {
          background: #C0392B;
          color: #fff;
          border: none;
        }
        .pc-btn-primary:hover { background: #d44132; }
        @media (max-width: 900px) {
          .pricing-cards-section { padding: 60px 24px; }
          .pricing-cards-grid { grid-template-columns: 1fr; }
          .pc-featured { transform: none; }
        }
      `}</style>
    </>
  );
}
