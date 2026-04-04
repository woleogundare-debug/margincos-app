import Head from 'next/head';
import { PublicNav } from '../components/layout/PublicNav';
import { PublicFooter } from '../components/layout/PublicFooter';

const LAST_UPDATED = 'March 2026';

const sections = [
  {
    title: '1. Introduction',
    body: `MarginCOS ("the Platform") is a product of Carthena Advisory ("we", "us", or "our"). We are committed to protecting the privacy and security of your personal information and commercial data. This Privacy Policy explains how we collect, use, store, and protect data when you use MarginCOS, in compliance with the Nigeria Data Protection Regulation (NDPR), the Nigeria Data Protection Act 2023, and applicable principles of the EU General Data Protection Regulation (GDPR).`,
  },
  {
    title: '2. Data We Collect',
    body: null,
    subsections: [
      {
        subtitle: '2.1 Account Information',
        text: 'When you register for MarginCOS, we collect your full name, work email address, company name, job title, and chosen password (stored as a salted hash — we never store plaintext passwords).',
      },
      {
        subtitle: '2.2 Commercial Portfolio Data',
        text: 'You enter or upload SKU-level commercial data including product names, categories, pricing, cost of goods, channel information, distributor terms, and trade investment figures. This is your proprietary business data, and we treat it with the highest level of confidentiality.',
      },
      {
        subtitle: '2.3 Usage Data',
        text: 'We collect anonymised usage analytics including pages visited, features accessed, session duration, and browser type. This data is used solely to improve the Platform and is never sold or shared with third parties.',
      },
      {
        subtitle: '2.4 Contact Form Submissions',
        text: 'When you submit a diagnostic booking request or contact enquiry, we collect the information you provide: name, email, company, role, annual revenue range, and any message you include.',
      },
    ],
  },
  {
    title: '3. How We Use Your Data',
    body: null,
    list: [
      'To provide, operate, and maintain the MarginCOS platform and your account',
      'To process your commercial data and generate margin analysis, pricing intelligence, cost pass-through metrics, channel economics, and trade execution insights',
      'To respond to diagnostic booking requests and customer support enquiries',
      'To send transactional communications related to your account (e.g. password resets, subscription confirmations)',
      'To improve the Platform based on aggregated, anonymised usage patterns',
      'To comply with legal obligations under Nigerian law',
    ],
  },
  {
    title: '4. Data Isolation and Security',
    body: `Your commercial data is fully isolated from other clients' data. MarginCOS enforces row-level security (RLS) policies at the database level, meaning your portfolio data is cryptographically and logically separated from every other account. No other client, and no Carthena Advisory employee outside of authorised support personnel, can view your data.`,
    subsections: [
      {
        subtitle: 'Security measures include:',
        text: null,
        list: [
          'TLS 1.2+ encryption for all data in transit',
          'AES-256 encryption for data at rest',
          'Supabase-managed PostgreSQL with row-level security policies',
          'Secure session management with HTTP-only cookies',
          'Regular security audits and vulnerability assessments',
        ],
      },
    ],
  },
  {
    title: '5. Data Sharing and Third Parties',
    body: `We do not sell, rent, or trade your personal information or commercial data to any third party. We share data only with the following categories of service providers, strictly under data processing agreements:`,
    list: [
      'Infrastructure providers: Supabase (database and authentication), Vercel (hosting)',
      'Analytics: Anonymised, aggregated usage data only — never individual client commercial data',
    ],
    after: 'All third-party processors are contractually bound to process data only on our instructions and to maintain equivalent or higher security standards.',
  },
  {
    title: '6. Data Retention',
    body: `We retain your account information and commercial data for as long as your subscription is active. Upon cancellation or account deletion:`,
    list: [
      'Your commercial portfolio data is permanently deleted within 90 days of cancellation',
      'Account information (name, email) may be retained for up to 12 months for legal and audit purposes',
      'Anonymised, aggregated analytics data (which cannot be linked back to you) may be retained indefinitely',
    ],
    after: 'You may request immediate deletion of your data at any time by contacting us at the address below.',
  },
  {
    title: '7. Your Rights',
    body: 'Under the NDPR, the Nigeria Data Protection Act 2023, and applicable data protection law, you have the following rights:',
    list: [
      'Right of access: Request a copy of the personal data we hold about you',
      'Right to rectification: Request correction of inaccurate or incomplete data',
      'Right to erasure: Request deletion of your personal data and commercial data',
      'Right to data portability: Receive your data in a structured, machine-readable format (CSV export)',
      'Right to object: Object to processing of your personal data for specific purposes',
      'Right to withdraw consent: Withdraw consent at any time where processing is based on consent',
    ],
    after: 'To exercise any of these rights, contact us at the address below. We will respond within 30 days.',
  },
  {
    title: '8. Cookies',
    body: 'MarginCOS uses strictly necessary cookies for authentication and session management. We do not use advertising cookies, tracking cookies, or third-party marketing cookies. No cookie consent banner is required as we only use essential cookies necessary for the functioning of the Platform.',
  },
  {
    title: '9. International Data Transfers',
    body: 'Your data may be processed on servers located outside Nigeria (including the United States and the European Union) through our infrastructure providers. Where data is transferred internationally, we ensure appropriate safeguards are in place, including standard contractual clauses and compliance with NDPR cross-border transfer requirements.',
  },
  {
    title: '10. Children',
    body: 'MarginCOS is a business-to-business platform and is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children.',
  },
  {
    title: '11. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. Material changes will be communicated via email to registered users and posted on this page with an updated effective date. Continued use of the Platform after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '12. Governing Law',
    body: 'This Privacy Policy is governed by and construed in accordance with the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 and the Nigeria Data Protection Regulation (NDPR).',
  },
  {
    title: '13. Contact',
    body: null,
    contact: true,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | MarginCOS</title>
        <meta name="description" content="How MarginCOS collects, uses, stores, and protects your data. NDPR and GDPR-aligned privacy practices." />
        <link rel="canonical" href="https://margincos.com/privacy" />
        <meta property="og:title" content="Privacy Policy | MarginCOS" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://margincos.com/privacy" />
        <meta property="og:description" content="How MarginCOS collects, uses, stores, and protects your data. NDPR and GDPR-aligned privacy practices." />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Privacy Policy | MarginCOS" />
        <meta name="twitter:description" content="How MarginCOS collects, uses, stores, and protects your data. NDPR and GDPR-aligned privacy practices." />
      </Head>
      <div className="min-h-screen">
        <PublicNav />
        <section className="hero-mesh pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">Privacy Policy</h1>
            <p className="mt-4 text-sm text-white/50">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section className="bg-white py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6 space-y-10">
            {sections.map((s, i) => (
              <div key={i}>
                <h2 className="text-lg font-bold text-navy mb-3">{s.title}</h2>
                {s.body && <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>}
                {s.list && (
                  <ul className="mt-3 space-y-2">
                    {s.list.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                        <span className="text-teal mt-1 flex-shrink-0">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.after && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{s.after}</p>}
                {s.subsections && s.subsections.map((sub, k) => (
                  <div key={k} className="mt-4">
                    <h3 className="text-sm font-semibold text-navy mb-2">{sub.subtitle}</h3>
                    {sub.text && <p className="text-sm text-slate-600 leading-relaxed">{sub.text}</p>}
                    {sub.list && (
                      <ul className="mt-2 space-y-1.5">
                        {sub.list.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                            <span className="text-teal mt-1 flex-shrink-0">&bull;</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {s.contact && (
                  <div className="text-sm text-slate-600 leading-relaxed space-y-1">
                    <p>If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at:</p>
                    <p className="mt-3 font-medium text-navy">Carthena Advisory</p>
                    <p>Email: <a href="mailto:info@carthenaadvisory.com" className="text-teal hover:underline">info@carthenaadvisory.com</a></p>
                    <p>Website: <a href="https://carthenaadvisory.com" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">carthenaadvisory.com</a></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <PublicFooter />
      </div>
    </>
  );
}
