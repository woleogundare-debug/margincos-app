import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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

const REVENUE_OPTIONS = [
  'Under \u20a61B',
  '\u20a61B \u2013 \u20a610B',
  '\u20a610B \u2013 \u20a650B',
  'Over \u20a650B',
];

export default function ContactPage() {
  const rootRef = useScrollReveal();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Pre-fill plan from query string (e.g. /contact?plan=professional)
  const plan = router.query.plan || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setFormError('Something went wrong. Please try again or email us directly at info@carthenaadvisory.com');
      }
    } catch (err) {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Book a Diagnostic \u2014 MarginCOS</title>
        <meta name="description" content="Book a 90-minute margin diagnostic session. We apply MarginCOS to your actual commercial data and show you the first findings in the room." />
      </Head>

      <div ref={rootRef} className="min-h-screen">
        <PublicNav />

        {/* HERO */}
        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="fade-in-up text-3xl md:text-5xl font-black text-white leading-tight">
              Book a Margin Diagnostic
            </h1>
            <p className="fade-in-up delay-200 mt-6 text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
              A 90-minute session applying MarginCOS to your actual commercial data. We show you the first findings in the room. No cost, no obligation.
            </p>
          </div>
        </section>

        {/* FORM + WHAT TO EXPECT */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
              {/* Form — 3 cols */}
              <div className="lg:col-span-3">
                {submitted ? (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-8 text-center">
                    <div className="text-4xl mb-4">&#10003;</div>
                    <h3 className="text-xl font-bold text-navy mb-2">Request Received</h3>
                    <p className="text-gray-text">Thank you. We'll be in touch within 24 hours to schedule your diagnostic session.</p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {plan && <input type="hidden" name="plan" value={plan} />}
                    {formError && (
                      <div className="bg-red-50 border border-red-brand/20 rounded-xl p-4 text-sm text-red-brand">
                        {formError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                        <input name="name" type="text" required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Work Email *</label>
                        <input name="email" type="email" required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Company *</label>
                        <input name="company" type="text" required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role / Title *</label>
                        <input name="role" type="text" required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Annual Revenue</label>
                      <select name="revenue"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all bg-white">
                        <option value="">Select range...</option>
                        {REVENUE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Message (optional)</label>
                      <textarea name="message" rows={4} placeholder="Tell us about your current margin challenge"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-all resize-none" />
                    </div>

                    <button type="submit" disabled={submitting}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-red-brand text-white font-semibold text-sm hover:bg-red-light transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? 'Sending...' : 'Request Diagnostic'}
                      {!submitting && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* What to expect — 2 cols */}
              <div className="lg:col-span-2">
                <div data-reveal className="opacity-0 bg-slate-50 rounded-2xl border border-slate-100 p-8">
                  <h3 className="text-lg font-bold text-navy mb-6">What to expect</h3>
                  <div className="space-y-6">
                    {[
                      { num: '1', title: 'We review your portfolio data', desc: 'Share your SKU-level pricing, cost, and channel data \u2014 we prepare the analysis before the session.' },
                      { num: '2', title: 'Live 90-minute diagnostic', desc: 'We walk through the MarginCOS output together \u2014 pricing gaps, cost absorption, channel economics, and trade execution \u2014 on your real numbers.' },
                      { num: '3', title: 'You receive the full report', desc: 'A Naira-quantified margin recovery roadmap with prioritised actions and estimated impact per recommendation.' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-xs font-black text-gold flex-shrink-0">
                          {step.num}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-navy mb-1">{step.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <p className="text-sm text-gray-text">
                      Prefer to reach out directly? We respond to all enquiries within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PublicFooter />
      </div>
    </>
  );
}
