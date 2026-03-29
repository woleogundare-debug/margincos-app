import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getSupabaseClient } from '../../lib/supabase/client';

/* ── Platform dropdown items ── */
const PLATFORM_SECTORS = [
  { href: '/platform',             label: 'Overview',               soon: false, dividerBefore: false },
  { href: '/platform/fmcg',        label: 'FMCG',                   soon: false, dividerBefore: true  },
  { href: '/platform/manufacturing',label: 'Manufacturing',          soon: false, dividerBefore: false },
  { href: '/platform/retail',      label: 'Retail',                 soon: false, dividerBefore: false },
  { href: '/platform/logistics',   label: 'Logistics',              soon: false, dividerBefore: true  },
  { href: '/platform/it-services', label: 'IT Services',            soon: true,  dividerBefore: false },
  { href: '/platform/telecoms',    label: 'Telecoms',               soon: true,  dividerBefore: false },
  { href: '/platform/aviation',    label: 'Aviation',               soon: true,  dividerBefore: false },
];

/* ── Links that map 1:1 to a nav item (Platform handled separately) ── */
const NAV_LINKS = [
  { href: '/',        label: 'Home' },
  { href: '/blog',    label: 'Insights' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

export function PublicNav() {
  const [scrolled,           setScrolled]           = useState(false);
  const [mobileOpen,         setMobileOpen]         = useState(false);
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(false);
  const [desktopDropOpen,    setDesktopDropOpen]    = useState(false);
  const dropTimeoutRef = useRef(null);
  const router = useRouter();

  /* Scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile drawer on route change */
  useEffect(() => {
    setMobileOpen(false);
    setMobilePlatformOpen(false);
  }, [router.pathname]);

  /* Login click — route to dashboard if session exists */
  const handleLoginClick = useCallback(async (e) => {
    e.preventDefault();
    const sb = getSupabaseClient();
    if (sb) {
      const { data: { session } } = await sb.auth.getSession();
      if (session) { router.push('/dashboard/portfolio'); return; }
    }
    router.push('/login');
  }, [router]);

  /* Desktop dropdown hover handlers with 150ms delay */
  const handleDropEnter = () => {
    clearTimeout(dropTimeoutRef.current);
    dropTimeoutRef.current = setTimeout(() => setDesktopDropOpen(true), 150);
  };
  const handleDropLeave = () => {
    clearTimeout(dropTimeoutRef.current);
    dropTimeoutRef.current = setTimeout(() => setDesktopDropOpen(false), 150);
  };

  /* Is any /platform route active? */
  const platformActive = router.pathname.startsWith('/platform');

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
        : 'bg-transparent'
    )}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex flex-col group">
          <span className="text-2xl font-bold tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
            <span className={clsx('transition-colors', scrolled ? 'text-navy' : 'text-white')}>Margin</span>
            <span style={{ color: '#C0392B' }}>COS</span>
          </span>
          <span className={clsx('text-[9px] tracking-[0.18em] uppercase font-medium mt-1.5 block transition-colors', scrolled ? 'text-gray-400' : 'text-white/40')}>
            Commercial Operating System
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-8">

          {/* Home */}
          <Link href="/"
            className={clsx(
              'text-sm font-medium transition-colors',
              router.pathname === '/'
                ? 'text-teal'
                : scrolled ? 'text-slate-600 hover:text-navy' : 'text-white/80 hover:text-white'
            )}>
            Home
          </Link>

          {/* Platform — dropdown trigger */}
          <div
            className="relative"
            onMouseEnter={handleDropEnter}
            onMouseLeave={handleDropLeave}
          >
            <button
              className={clsx(
                'text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer',
                platformActive
                  ? 'text-teal'
                  : scrolled ? 'text-slate-600 hover:text-navy' : 'text-white/80 hover:text-white'
              )}>
              Platform
              <ChevronDownIcon className={clsx(
                'w-3.5 h-3.5 transition-transform duration-200',
                desktopDropOpen && 'rotate-180'
              )} />
            </button>

            {/* Dropdown panel */}
            {desktopDropOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                {PLATFORM_SECTORS.map((item) => (
                  <div key={item.href}>
                    {item.dividerBefore && (
                      <div className="my-1.5 mx-3 border-t border-slate-100" />
                    )}
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center justify-between px-4 py-2 text-[13px] font-medium transition-colors',
                        router.pathname === item.href
                          ? 'text-teal bg-teal/5 border-l-2 border-teal pl-[14px]'
                          : 'text-navy hover:bg-slate-50'
                      )}>
                      {item.label}
                      {item.soon && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-teal ml-2">
                          Soon
                        </span>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remaining nav links */}
          {NAV_LINKS.filter(l => l.href !== '/').map(link => {
            const active = router.pathname === link.href;
            return (
              <Link key={link.href} href={link.href}
                className={clsx(
                  'text-sm font-medium transition-colors',
                  active
                    ? 'text-teal'
                    : scrolled ? 'text-slate-600 hover:text-navy' : 'text-white/80 hover:text-white'
                )}>
                {link.label}
              </Link>
            );
          })}

          {/* Client Login */}
          <a href="/login" onClick={handleLoginClick}
            className={clsx(
              'text-sm font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer',
              scrolled
                ? 'border-slate-200 text-navy hover:border-teal hover:text-teal'
                : 'border-white/30 text-white hover:border-white hover:bg-white/10'
            )}>
            Client Login
          </a>

          {/* Request Demo */}
          <Link href="/contact"
            className="text-sm font-semibold px-5 py-2 rounded-lg bg-red-brand text-white hover:bg-red-light transition-all">
            Request Demo
          </Link>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2">
          {mobileOpen
            ? <XMarkIcon  className={clsx('h-6 w-6', scrolled ? 'text-navy' : 'text-white')} />
            : <Bars3Icon  className={clsx('h-6 w-6', scrolled ? 'text-navy' : 'text-white')} />
          }
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <div className="px-6 py-4 space-y-1">

            {/* Home */}
            <Link href="/" className="block text-sm font-medium text-slate-700 hover:text-teal py-2">
              Home
            </Link>

            {/* Platform — expandable section */}
            <div>
              <button
                onClick={() => setMobilePlatformOpen(!mobilePlatformOpen)}
                className="w-full flex items-center justify-between text-sm font-medium text-slate-700 py-2">
                Platform
                <ChevronDownIcon className={clsx(
                  'w-4 h-4 text-slate-400 transition-transform duration-200',
                  mobilePlatformOpen && 'rotate-180'
                )} />
              </button>

              {mobilePlatformOpen && (
                <div className="pl-3 pb-1 space-y-0.5 border-l-2 border-teal/20 ml-1 mt-0.5">
                  {PLATFORM_SECTORS.map((item) => (
                    <div key={item.href}>
                      {item.dividerBefore && (
                        <div className="my-1.5 border-t border-slate-100" />
                      )}
                      <Link
                        href={item.href}
                        className={clsx(
                          'flex items-center justify-between py-1.5 text-sm transition-colors',
                          router.pathname === item.href
                            ? 'text-teal font-semibold'
                            : 'text-slate-600 hover:text-teal'
                        )}>
                        {item.label}
                        {item.soon && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-teal ml-2">
                            Soon
                          </span>
                        )}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remaining links */}
            {NAV_LINKS.filter(l => l.href !== '/').map(link => (
              <Link key={link.href} href={link.href}
                className="block text-sm font-medium text-slate-700 hover:text-teal py-2">
                {link.label}
              </Link>
            ))}

            {/* CTAs */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <a href="/login" onClick={handleLoginClick}
                className="text-sm font-semibold text-center px-4 py-2.5 rounded-lg border border-slate-200 text-navy hover:border-teal cursor-pointer">
                Client Login
              </a>
              <Link href="/contact"
                className="text-sm font-semibold text-center px-4 py-2.5 rounded-lg bg-red-brand text-white hover:bg-red-light">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
