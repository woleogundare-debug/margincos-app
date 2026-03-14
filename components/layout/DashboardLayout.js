import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/index';
import {
  ChartBarIcon, CurrencyDollarIcon,
  ArrowTrendingDownIcon, BuildingStorefrontIcon,
  SparklesIcon, RectangleStackIcon, ArrowRightOnRectangleIcon,
  FolderOpenIcon, LockClosedIcon, UsersIcon,
} from '@heroicons/react/24/outline';

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { href: '/dashboard/portfolio', label: 'Portfolio', icon: FolderOpenIcon },
    ],
  },
  {
    label: 'ANALYSIS',
    items: [
      { href: '/dashboard/overview', label: 'Overview',  icon: ChartBarIcon },
      { href: '/dashboard/pricing',  label: 'Pricing',   icon: CurrencyDollarIcon },
      { href: '/dashboard/cost',     label: 'Cost',       icon: ArrowTrendingDownIcon },
      { href: '/dashboard/channel',  label: 'Channel',    icon: BuildingStorefrontIcon },
      { href: '/dashboard/trade',    label: 'Trade',      icon: RectangleStackIcon },
    ],
  },
  {
    label: 'ENTERPRISE',
    items: [
      { href: '/dashboard/modules', label: 'Enterprise Modules', icon: SparklesIcon, requiresEnterprise: true },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { href: '/dashboard/team', label: 'Team', icon: UsersIcon },
    ],
  },
];

const TIER_COLORS = {
  enterprise:   'bg-purple-100 text-purple-800',
  professional: 'bg-teal-100 text-teal-800',
  essentials:   'bg-slate-100 text-slate-600',
};

export function DashboardLayout({ children, title, activePeriod }) {
  const { user, tier, isEnterprise, signOut, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#1B2A4A' }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white p-1"
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
          <span className="text-white">Margin</span>
          <span style={{ color: '#C0392B' }}>COS</span>
        </span>
        <div className="w-8" />
      </div>

      {/* Backdrop — mobile only */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={clsx(
        'fixed md:static inset-y-0 left-0 z-50',
        'w-72 md:w-64 flex-shrink-0 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )} style={{ backgroundColor: '#1B2A4A', minHeight: '100vh' }}>

        {/* Inner flex wrapper — ensures footer stays pinned */}
        <div className="flex flex-col h-full">
          {/* Close button — mobile only */}
          <div className="md:hidden flex justify-end p-4 flex-shrink-0">
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Logo */}
          <div className="px-6 py-5 border-b border-white/10 flex-shrink-0">
            <Link href="/" className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                <span className="text-white">Margin</span>
                <span style={{ color: '#C0392B' }}>COS</span>
              </span>
              <span className="text-[8px] tracking-[0.18em] uppercase text-gray-400 font-medium mt-1.5 block">
                Commercial Operating System
              </span>
            </Link>
          </div>

          {/* Nav — scrollable area */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto min-h-0">
            {NAV_SECTIONS.map((section, si) => (
              <div key={si}>
                {section.label && (
                  <div className="px-4 pt-5 pb-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">{section.label}</span>
                    <div className="flex-1 border-t border-white/10" />
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map(({ href, label, icon: Icon, requiresEnterprise: reqEnt }) => {
                    const active = router.pathname === href || router.pathname.startsWith(href + '/');
                    const locked = reqEnt && !isEnterprise;
                    return (
                      <Link key={href} href={href}
                        onClick={() => setSidebarOpen(false)}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative',
                          active
                            ? 'bg-white text-navy shadow-sm'
                            : locked
                              ? 'text-gray-500 hover:text-gray-400 hover:bg-white/5'
                              : 'text-gray-300 hover:text-white hover:bg-white/10'
                        )}>
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ backgroundColor: '#C0392B' }} />
                        )}
                        <Icon className={clsx('w-5 h-5', active ? 'text-navy' : locked ? 'text-gray-500' : 'text-gray-400')} />
                        {label}
                        {locked && <LockClosedIcon className="w-3.5 h-3.5 text-gray-500 ml-auto" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User footer — always visible, pinned bottom */}
          <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/70 truncate">{user?.email}</p>
                <span className={clsx('text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded', TIER_COLORS[tier] || TIER_COLORS.essentials)}>
                  {tier}
                </span>
              </div>
            </div>
            <button onClick={signOut}
              className="mt-2 w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-xs font-medium transition-all">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pt-14 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
