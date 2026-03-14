import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/index';
import {
  ChartBarIcon, CogIcon, CurrencyDollarIcon,
  ArrowTrendingDownIcon, BuildingStorefrontIcon,
  SparklesIcon, RectangleStackIcon, ArrowRightOnRectangleIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';

const NAV = [
  { href: '/dashboard/portfolio', label: 'Portfolio',  icon: FolderOpenIcon,          color: 'text-slate-500' },
  { href: '/dashboard/overview',  label: 'Overview',   icon: ChartBarIcon,            color: 'text-slate-500' },
  { href: '/dashboard/pricing',   label: 'Pricing',    icon: CurrencyDollarIcon,      color: 'text-teal-600' },
  { href: '/dashboard/cost',      label: 'Cost',       icon: ArrowTrendingDownIcon,   color: 'text-red-500' },
  { href: '/dashboard/channel',   label: 'Channel',    icon: BuildingStorefrontIcon,  color: 'text-amber-500' },
  { href: '/dashboard/trade',     label: 'Trade',      icon: RectangleStackIcon,      color: 'text-purple-600' },
  { href: '/dashboard/modules',   label: 'Modules',    icon: SparklesIcon,            color: 'text-slate-500' },
];

const TIER_COLORS = {
  enterprise:   'bg-purple-100 text-purple-800',
  professional: 'bg-teal-100 text-teal-800',
  essentials:   'bg-slate-100 text-slate-600',
};

export function DashboardLayout({ children, title, activePeriod }) {
  const { user, tier, signOut, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if auth check has completed and there is no user
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
      <aside className="w-56 flex-shrink-0 bg-navy flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex flex-col">
            <span className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-white tracking-tight">Margin</span>
              <span className="text-xl font-black tracking-tight" style={{color: '#C0392B'}}>COS</span>
            </span>
            <span className="text-[9px] tracking-[0.15em] uppercase text-white/40 font-medium leading-none mt-0.5">
              Commercial Operating System
            </span>
          </Link>
          {activePeriod && (
            <p className="mt-1 text-xs text-white/40 truncate">{activePeriod.label}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, color }) => {
            const active = router.pathname === href || router.pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}>
                <Icon className={clsx('h-4 w-4', active ? 'text-teal' : color)} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/70 truncate">{user?.email}</p>
              <span className={clsx('text-xs font-semibold capitalize px-1.5 py-0.5 rounded', TIER_COLORS[tier] || TIER_COLORS.essentials)}>
                {tier}
              </span>
            </div>
          </div>
          <button onClick={signOut}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-xs font-medium transition-all">
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        {title && (
          <header className="flex-shrink-0 bg-white border-b border-slate-100 px-8 py-4">
            <h1 className="text-lg font-bold text-navy">{title}</h1>
          </header>
        )}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
