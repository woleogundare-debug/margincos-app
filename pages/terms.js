import Head from 'next/head';
import { PublicNav } from '../components/layout/PublicNav';
import { PublicFooter } from '../components/layout/PublicFooter';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service — MarginCOS</title>
      </Head>
      <div className="min-h-screen">
        <PublicNav />
        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">Terms of Service</h1>
          </div>
        </section>
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-navy mb-3">Coming Soon</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our terms of service are being finalised. For questions, please contact us at{' '}
                <a href="mailto:info@carthenaadvisory.com" className="text-teal hover:underline">info@carthenaadvisory.com</a>.
              </p>
            </div>
          </div>
        </section>
        <PublicFooter />
      </div>
    </>
  );
}
