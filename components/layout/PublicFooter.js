import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-navy-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 md:gap-8">
          {/* Column 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex flex-col gap-1 mb-4">
              <span className="text-2xl font-bold tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                <span className="text-white">Margin</span>
                <span style={{ color: '#C0392B' }}>COS</span>
              </span>
              <span className="text-[9px] tracking-[0.18em] uppercase text-gray-500 font-medium mt-1 block">
                Commercial Operating System
              </span>
            </Link>
            <p className="mt-3 text-xs text-white/40 leading-relaxed max-w-xs">
              The Commercial Operating System for Margin Recovery. Built for FMCG, manufacturing, and retail companies navigating inflationary markets.
            </p>
            <p className="mt-4 text-xs text-white/25">
              A product of{' '}
              <a href="https://carthenaadvisory.com" target="_blank" rel="noopener noreferrer"
                className="text-teal/70 hover:text-teal transition-colors">
                Carthena Advisory
              </a>
            </p>
          </div>

          {/* Column 2 — Platform */}
          <div>
            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Platform</h4>
            <nav className="space-y-2.5">
              {[
                { label: 'Pricing Intelligence', href: '/platform#pricing-intelligence' },
                { label: 'Cost Pass-Through',    href: '/platform#cost-pass-through' },
                { label: 'Channel Economics',     href: '/platform#channel-economics' },
                { label: 'Trade Execution',       href: '/platform#trade-execution' },
              ].map((l, i) => (
                <Link key={i} href={l.href}
                  className="block text-xs text-white/50 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3 — Enterprise */}
          <div>
            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Enterprise</h4>
            <nav className="space-y-2.5">
              {[
                { label: 'SKU Rationalisation',    href: '/platform#m1' },
                { label: 'Inflation Scenarios',     href: '/platform#m2' },
                { label: 'Trade Spend ROI',         href: '/platform#m3' },
                { label: 'Distributor Scorecard',   href: '/platform#m4' },
              ].map((l, i) => (
                <Link key={i} href={l.href}
                  className="block text-xs text-white/50 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4 — Company */}
          <div>
            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Company</h4>
            <nav className="space-y-2.5">
              <Link href="/platform" className="block text-xs text-white/50 hover:text-white transition-colors">Platform</Link>
              <Link href="/#how-it-works" className="block text-xs text-white/50 hover:text-white transition-colors">How It Works</Link>
              <Link href="/pricing" className="block text-xs text-white/50 hover:text-white transition-colors">Pricing</Link>
              <Link href="/contact" className="block text-xs text-white/50 hover:text-white transition-colors">Contact</Link>
              <a href="https://carthenaadvisory.com" target="_blank" rel="noopener noreferrer"
                className="block text-xs text-white/50 hover:text-teal transition-colors">
                Carthena Advisory
              </a>
            </nav>
          </div>

          {/* Column 5 — Resources */}
          <div>
            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Resources</h4>
            <nav className="space-y-2.5">
              <a href="/MarginCOS_Sales_Deck.pdf" target="_blank" rel="noopener noreferrer" download
                className="block text-xs text-white/50 hover:text-white transition-colors">
                ↓ Sales Deck (PDF)
              </a>
              <Link href="/contact" className="block text-xs text-white/50 hover:text-white transition-colors">Interactive Demo</Link>
              <Link href="/contact" className="block text-xs text-white/50 hover:text-white transition-colors">Book a Diagnostic</Link>
            </nav>
          </div>

          {/* Column 6 — Legal */}
          <div>
            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Legal</h4>
            <nav className="space-y-2.5">
              <Link href="/privacy" className="block text-xs text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="block text-xs text-white/50 hover:text-white transition-colors">Terms of Service</Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">&copy; 2026 Carthena Advisory. All rights reserved.</p>
          <a href="mailto:info@carthenaadvisory.com" className="text-xs text-white/25 hover:text-white/50 transition-colors">
            info@carthenaadvisory.com
          </a>
        </div>
      </div>
    </footer>
  );
}
