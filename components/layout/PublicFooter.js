import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Platform', href: '/platform' },
  { label: 'Pricing',  href: '/pricing' },
  { label: 'Client Login', href: '/login' },
  { label: 'Contact',  href: 'mailto:info@margincos.com' },
];

export function PublicFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-white tracking-tight">Margin</span>
              <span className="text-xl font-black text-teal tracking-tight">COS</span>
            </Link>
            <p className="mt-3 text-sm text-white/50 leading-relaxed max-w-sm">
              Margin intelligence for FMCG, manufacturing, and retail companies operating in high-inflation markets.
            </p>
            <p className="mt-4 text-xs text-white/30">
              Built by{' '}
              <a href="https://carthenaadvisory.com" target="_blank" rel="noopener noreferrer"
                className="text-teal/70 hover:text-teal transition-colors">
                Carthena Advisory
              </a>
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Product</h4>
            <nav className="space-y-3">
              {FOOTER_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className="block text-sm text-white/60 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Contact</h4>
            <a href="mailto:info@margincos.com"
              className="block text-sm text-white/60 hover:text-teal transition-colors">
              info@margincos.com
            </a>
            <a href="https://carthenaadvisory.com" target="_blank" rel="noopener noreferrer"
              className="block mt-2 text-sm text-white/60 hover:text-teal transition-colors">
              carthenaadvisory.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} MarginCOS. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/20">Built on enterprise infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
