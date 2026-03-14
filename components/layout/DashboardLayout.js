import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/index';
import {
  ChartBarIcon, CurrencyDollarIcon,
  ArrowTrendingDownIcon, BuildingStorefrontIcon,
  SparklesIcon, RectangleStackIcon, ArrowRightOnRectangleIcon,
  FolderOpenIcon, LockClosedIcon,
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
];

const TIER_COLORS = {
  enterprise:   'bg-purple-100 text-purple-800',
  professional: 'bg-teal-100 text-teal-800',
  essentials:   'bg-slate-100 text-slate-600',
};

export function DashboardLayout({ children, title, activePeriod }) {
  const { user, tier, isEnterprise, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

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
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-navy flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/" className="flex flex-col">
            <span className="text-xl font-bold tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="text-white">Margin</span>
              <span style={{ color: '#C0392B' }}>COS</span>
            </span>
            <span className="text-[8px] tracking-[0.15em] uppercase text-gray-400 font-medium leading-none mt-0.5 block">
              Commercial Operating System
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
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

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/10">
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
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
