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
          <p className="text-xs text-white/60">&copy; 2026 Carthena Advisory. All rights reserved.</p>
          <a href="mailto:info@carthenaadvisory.com" title="Email the MarginCOS team" className="text-xs text-white/60 hover:text-white/50 transition-colors">
            info@carthenaadvisory.com
          </a>
        </div>
      </div>
    </footer>
  );
}
