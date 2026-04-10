import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-navy-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 md:gap-8">
          {/* Column 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" title="MarginCOS – Commercial Operating System for Margin Recovery" className="flex flex-col gap-1 mb-4">
              <span className="text-2xl font-bold tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                <span className="text-white">Margin</span>
                <span style={{ color: '#C0392B' }}>COS</span>
              </span>
              <span className="text-[9px] tracking-[0.18em] uppercase text-gray-500 font-medium mt-1.5 block">
                Commercial Operating System
              </span>
            </Link>
            <p className="mt-3 text-xs text-white/70 leading-relaxed max-w-xs">
              The Commercial Operating System for Margin Recovery. Built for businesses navigating inflationary markets.
            </p>
            <p className="mt-4 text-xs text-white/60">
              A product of{' '}
              <a href="https://carthenaadvisory.com" target="_blank" rel="noopener noreferrer" title="Carthena Advisory website"
                className="text-teal/70 hover:text-teal transition-colors">
                Carthena Advisory
              </a>
            </p>
          </div>

          {/* Column 2 — Platform */}
          <div>
            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">Platform</h4>
            <nav className="space-y-2.5">
              {[
                { label: 'Pricing Intelligence', href: '/platform#pricing-intelligence', title: 'Pricing Intelligence Engine' },
                { label: 'Cost Pass-Through',    href: '/platform#cost-pass-through',    title: 'Cost Pass-Through Engine' },
                { label: 'Channel Economics',    href: '/platform#channel-economics',    title: 'Channel Economics Engine' },
                { label: 'Trade Execution',      href: '/platform#trade-execution',      title: 'Trade Execution Engine' },
              ].map((l, i) => (
                <Link key={i} href={l.href} title={l.title}
                  className="block text-xs text-white/50 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
              <div className="pt-1 border-t border-white/10 mt-1 space-y-2">
                <Link href="/platform/fmcg"          title="MarginCOS for FMCG Margin Recovery"          className="block text-xs text-white/50 hover:text-white transition-colors">FMCG</Link>
                <Link href="/platform/manufacturing"  title="MarginCOS for Manufacturing Margin Recovery"  className="block text-xs text-white/50 hover:text-white transition-colors">Manufacturing</Link>
                <Link href="/platform/retail"         title="MarginCOS for Retail Margin Recovery"         className="block text-xs text-white/50 hover:text-white transition-colors">Retail</Link>
                <Link href="/platform/logistics"      title="MarginCOS for Logistics Margin Recovery"      className="block text-xs text-white/50 hover:text-white transition-colors">Logistics</Link>
              </div>
            </nav>
          </div>

          {/* Column 3 — Enterprise */}
          <div>
            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">Enterprise</h4>
            <nav className="space-y-2.5">
              {[
                { label: 'Portfolio Rationalisation', href: '/platform#m1', title: 'Portfolio Rationalisation Module' },
                { label: 'Forward Scenarios',         href: '/platform#m2', title: 'Forward Scenarios Module' },
                { label: 'Commercial Spend ROI',      href: '/platform#m3', title: 'Commercial Spend ROI Module' },
                { label: 'Partner Scorecard',         href: '/platform#m4', title: 'Partner Scorecard Module' },
              ].map((l, i) => (
                <Link key={i} href={l.href} title={l.title}
                  className="block text-xs text-white/50 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4 — Company */}
          <div>
            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">Company</h4>
            <nav className="space-y-2.5">
              <Link href="/platform" title="MarginCOS Platform" className="block text-xs text-white/50 hover:text-white transition-colors">Platform</Link>
              <Link href="/#how-it-works" title="How MarginCOS Works" className="block text-xs text-white/50 hover:text-white transition-colors">How It Works</Link>
              <Link href="/pricing" title="MarginCOS Pricing Plans" className="block text-xs text-white/50 hover:text-white transition-colors">Pricing</Link>
              <Link href="/contact" title="Contact MarginCOS" className="block text-xs text-white/50 hover:text-white transition-colors">Contact</Link>
              <a href="https://carthenaadvisory.com" target="_blank" rel="noopener noreferrer" title="Carthena Advisory website"
                className="block text-xs text-white/50 hover:text-teal transition-colors">
                Carthena Advisory
              </a>
            </nav>
          </div>

          {/* Column 5 — Resources */}
          <div>
            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">Resources</h4>
            <nav className="space-y-2.5">
              <Link href="/blog" title="MarginCOS Insights and Articles" className="block text-xs text-white/50 hover:text-white transition-colors">Insights</Link>
              <a href="/MarginCOS_Sales_Deck.pdf" target="_blank" rel="noopener noreferrer" download title="Download MarginCOS Sales Deck PDF"
                className="block text-xs text-white/50 hover:text-white transition-colors">
                ↓ Sales Deck (PDF)
              </a>
              <Link href="/contact" title="MarginCOS Interactive Demo" className="block text-xs text-white/50 hover:text-white transition-colors">Interactive Demo</Link>
              <Link href="/contact" title="Book a MarginCOS Diagnostic Session" className="block text-xs text-white/50 hover:text-white transition-colors">Book a Diagnostic</Link>
            </nav>
          </div>

          {/* Column 6 — Legal */}
          <div>
            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">Legal</h4>
            <nav className="space-y-2.5">
              <Link href="/privacy" title="MarginCOS Privacy Policy" className="block text-xs text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" title="MarginCOS Terms of Service" className="block text-xs text-white/50 hover:text-white transition-colors">Terms of Service</Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/60 order-1 sm:order-none">&copy; 2026 Carthena Advisory. All rights reserved.</p>

          <div className="flex items-center gap-4 order-3 sm:order-none">
            <a
              href="https://www.linkedin.com/showcase/111952697"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MarginCOS on LinkedIn"
              title="MarginCOS on LinkedIn"
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>

            <a
              href="https://x.com/Margin_COS"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MarginCOS on X (Twitter)"
              title="MarginCOS on X (Twitter)"
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          <a
            href="mailto:info@carthenaadvisory.com"
            title="Email the MarginCOS team"
            className="text-xs text-white/60 hover:text-white/50 transition-colors order-2 sm:order-none"
          >
            info@carthenaadvisory.com
          </a>
        </div>
      </div>
    </footer>
  );
}
