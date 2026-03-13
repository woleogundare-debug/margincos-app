import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const NAV_LINKS = [
  { href: '/platform', label: 'Platform' },
  { href: '/pricing',  label: 'Pricing' },
  { href: 'mailto:info@margincos.com', label: 'Contact', external: true },
];

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
        : 'bg-transparent'
    )}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-0.5 group">
          <span className={clsx('text-xl font-black tracking-tight transition-colors', scrolled ? 'text-navy' : 'text-white')}>
            Margin
          </span>
          <span className="text-xl font-black tracking-tight text-teal">COS</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => {
            const active = router.pathname === link.href;
            const Tag = link.external ? 'a' : Link;
            const props = link.external ? { href: link.href } : { href: link.href };
            return (
              <Tag key={link.href} {...props}
                className={clsx(
                  'text-sm font-medium transition-colors',
                  active
                    ? 'text-teal'
                    : scrolled ? 'text-slate-600 hover:text-navy' : 'text-white/80 hover:text-white'
                )}>
                {link.label}
              </Tag>
            );
          })}
          <Link href="/login"
            className={clsx(
              'text-sm font-semibold px-4 py-2 rounded-lg border transition-all',
              scrolled
                ? 'border-slate-200 text-navy hover:border-teal hover:text-teal'
                : 'border-white/30 text-white hover:border-white hover:bg-white/10'
            )}>
            Client Login
          </Link>
          <Link href="mailto:info@margincos.com"
            className="text-sm font-semibold px-5 py-2 rounded-lg bg-teal text-white hover:bg-teal-dark transition-all">
            Request Demo
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
          {mobileOpen
            ? <XMarkIcon className={clsx('h-6 w-6', scrolled ? 'text-navy' : 'text-white')} />
            : <Bars3Icon className={clsx('h-6 w-6', scrolled ? 'text-navy' : 'text-white')} />
          }
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <div className="px-6 py-4 space-y-3">
            {NAV_LINKS.map(link => {
              const Tag = link.external ? 'a' : Link;
              return (
                <Tag key={link.href} href={link.href}
                  className="block text-sm font-medium text-slate-700 hover:text-teal py-2">
                  {link.label}
                </Tag>
              );
            })}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login"
                className="text-sm font-semibold text-center px-4 py-2.5 rounded-lg border border-slate-200 text-navy hover:border-teal">
                Client Login
              </Link>
              <Link href="mailto:info@margincos.com"
                className="text-sm font-semibold text-center px-4 py-2.5 rounded-lg bg-teal text-white hover:bg-teal-dark">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
