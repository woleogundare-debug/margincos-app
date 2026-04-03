import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { LoadingSpinner } from '../ui/index';
import { getSupabaseClient } from '../../lib/supabase/client';
import { TIER_ACCESS } from '../../lib/constants';
import {
  ChartBarIcon, CurrencyDollarIcon,
  ArrowTrendingDownIcon, BuildingStorefrontIcon,
  SparklesIcon, RectangleStackIcon, ArrowRightOnRectangleIcon,
  FolderOpenIcon, LockClosedIcon, UsersIcon, CheckCircleIcon,
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
      { href: '/dashboard/actions',  label: 'Actions',   icon: CheckCircleIcon },
      { href: '/dashboard/pricing',  label: 'Pricing',   icon: CurrencyDollarIcon },
      { href: '/dashboard/cost',     label: 'Cost',       icon: ArrowTrendingDownIcon,  pillar: 'cost' },
      { href: '/dashboard/channel',  label: 'Channel',    icon: BuildingStorefrontIcon, pillar: 'channel' },
      { href: '/dashboard/trade',    label: 'Trade',      icon: RectangleStackIcon,     pillar: 'trade' },
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

// Analysis pages that show the comparison period selector
const COMPARISON_PAGES = [
  '/dashboard/overview',
  '/dashboard/pricing',
  '/dashboard/cost',
  '/dashboard/channel',
  '/dashboard/trade',
  '/dashboard/modules',
];

// Renders the "Compare with…" period selector — uses context directly.
// Only mounted on analysis pages where comparison is meaningful.
function ComparisonBar() {
  const {
    periods,
    activePeriod,
    comparisonPeriodId,
    comparisonPeriodMeta,
    comparisonLoading,
    loadComparisonPeriod,
    clearComparison,
  } = useAnalysisContext();

  const otherPeriods = (periods || []).filter(p => p.id !== activePeriod?.id);
  if (otherPeriods.length === 0) return null;

  return (
    <div className="px-4 pb-4 pt-3 border-b border-white/10 flex-shrink-0"
      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2"
        style={{ color: 'rgba(255,255,255,0.35)' }}>
        Compare
      </p>
      <select
        value={comparisonPeriodId || ''}
        onChange={e => e.target.value ? loadComparisonPeriod(e.target.value) : clearComparison()}
        className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none truncate"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: comparisonPeriodId ? '#D4A843' : 'rgba(255,255,255,0.5)',
        }}>
        <option value="" style={{ color: '#1B2A4A' }}>No comparison</option>
        {otherPeriods
          .sort((a, b) => {
            // Sort by reporting month (label), not created_at — import order can differ from month order
            const ta = new Date(a.label || 0).getTime() || 0;
            const tb = new Date(b.label || 0).getTime() || 0;
            return tb - ta; // most recent reporting month first
          })
          .map(p => (
            <option key={p.id} value={p.id} style={{ color: '#1B2A4A', backgroundColor: '#fff' }}>
              {p.label}
            </option>
          ))}
      </select>
      {comparisonLoading && (
        <p className="text-[10px] mt-1.5 animate-pulse" style={{ color: '#D4A843' }}>Loading…</p>
      )}
      {comparisonPeriodId && !comparisonLoading && activePeriod && comparisonPeriodMeta && (() => {
        // Use label-parsed month, not created_at, for the sidebar arrow label
        const parseMonth = (label) => { const d = new Date(label || 0); return isNaN(d.getTime()) ? 0 : d.getTime(); };
        const activeTime = parseMonth(activePeriod.label);
        const compTime   = parseMonth(comparisonPeriodMeta.label);
        const earlier = activeTime <= compTime ? activePeriod.label : comparisonPeriodMeta.label;
        const later   = activeTime <= compTime ? comparisonPeriodMeta.label : activePeriod.label;
        return (
          <p className="text-[10px] mt-1.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {earlier} → {later}
          </p>
        );
      })()}
    </div>
  );
}

const TIER_COLORS = {
  enterprise:   'bg-[#FBF5E8] text-[#D4A843]',
  professional: 'bg-teal-100 text-teal-800',
  essentials:   'bg-slate-100 text-slate-600',
};

// Module-level: survives DashboardLayout remounts caused by Next.js page navigation.
// Each dashboard page renders its own <DashboardLayout>, so the component remounts
// on every route change and the nav's scrollTop resets to 0.
// We persist the scroll position here so it can be restored on the next mount.
let _savedNavScrollTop = 0;

export function DashboardLayout({ children, title, activePeriod }) {
  const { user, tier, isEnterprise, signOut, loading, profileLoaded, mustChangePassword } = useAuth();
  const router = useRouter();
  const navRef = useRef(null);
  const { isConsolidated } = useAnalysisContext();
  const showComparison = COMPARISON_PAGES.includes(router.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Show all items while profile is loading — prevents nav items disappearing
  // then reappearing once the profile resolves (~200ms flash).
  const access = (loading || !profileLoaded)
    ? TIER_ACCESS.enterprise
    : (TIER_ACCESS[tier] || TIER_ACCESS.essentials);

  // ── Force password change (first-time login with temp password) ──────────────
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError,   setPassError]   = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [showNewPass,     setShowNewPass]     = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handlePasswordChange = useCallback(async () => {
    setPassError('');
    if (newPass.length < 8)          { setPassError('Password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass)      { setPassError('Passwords do not match.'); return; }
    setPassLoading(true);
    const sb = getSupabaseClient();
    const { error } = await sb.auth.updateUser({
      password: newPass,
      data: { must_change_password: false },
    });
    setPassLoading(false);
    if (error) { setPassError(error.message); return; }
    setPassSuccess(true);
    // Session will refresh via onAuthStateChange — modal disappears automatically
    // once mustChangePassword becomes false. Clear fields ready for that.
    setNewPass('');
    setConfirmPass('');
  }, [newPass, confirmPass]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Close sidebar on any route change (covers programmatic navigation, not just link clicks).
  // Also snapshot the nav's scrollTop here — routeChangeStart fires while the nav DOM
  // element still exists, before this DashboardLayout unmounts and the element is lost.
  useEffect(() => {
    const handleRouteChange = () => {
      setSidebarOpen(false);
      if (navRef.current) _savedNavScrollTop = navRef.current.scrollTop;
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => { router.events.off('routeChangeStart', handleRouteChange); };
  }, [router.events]);

  // Restore the nav's scroll position after this DashboardLayout mounts.
  // Each page creates a fresh instance, so the nav scrollTop starts at 0 —
  // we set it back to wherever the user had it before navigating.
  useEffect(() => {
    if (navRef.current && _savedNavScrollTop > 0) {
      navRef.current.scrollTop = _savedNavScrollTop;
    }
  }, []); // intentionally empty — run once on mount only

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

  // ── Force-change password modal ─────────────────────────────────────────────
  if (mustChangePassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#FEF2F2' }}>
              <svg className="w-5 h-5" style={{ color: '#C0392B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>Set your password</h2>
            <p className="text-sm text-slate-500 mt-1">
              You&rsquo;re using a temporary password. Please set a permanent one to continue.
            </p>
          </div>

          {passSuccess ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-emerald-700 font-medium">Password updated — loading your dashboard…</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="New password (min. 8 characters)"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
                  className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#4DD9C0' }}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowNewPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showNewPass ? 'Hide password' : 'Show password'}>
                  {showNewPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
                  className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#4DD9C0' }}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowConfirmPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirmPass ? 'Hide password' : 'Show password'}>
                  {showConfirmPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {passError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2.5 rounded-lg">
                  {passError}
                </div>
              )}
              <button
                onClick={handlePasswordChange}
                disabled={passLoading || !newPass || !confirmPass}
                className="w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#C0392B' }}
              >
                {passLoading ? 'Updating…' : 'Set Password & Continue'}
              </button>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center mt-5">
            Signed in as <span className="font-medium text-slate-500">{user?.email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F5F7FA' }}>
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
          <nav ref={navRef} className="flex-1 px-3 py-4 overflow-y-auto min-h-0">
            {NAV_SECTIONS.map((section, si) => {
              // Hide items the user's tier can't access; skip the section entirely if empty
              const visibleItems = section.items.filter(({ pillar, requiresEnterprise: reqEnt }) => {
                if (pillar && !access.pillars.includes(pillar)) return false;
                if (reqEnt && !access.modules) return false;
                return true;
              });
              if (visibleItems.length === 0) return null;
              return (
                <div key={si}>
                  {section.label && (
                    <div className="px-4 pt-5 pb-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">{section.label}</span>
                      <div className="flex-1 border-t border-white/10" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {visibleItems.map(({ href, label, icon: Icon, requiresEnterprise: reqEnt }) => {
                      const active = router.pathname === href || router.pathname.startsWith(href + '/');
                      const locked = reqEnt && !isEnterprise;
                      return (
                        <Link key={href} href={href}
                          onClick={() => setSidebarOpen(false)}
                          className={clsx(
                            'flex items-center gap-3 px-4 py-3.5 md:py-3 rounded-xl text-sm font-medium transition-all relative',
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
              );
            })}
          </nav>

          {/* Comparison period selector — analysis pages only */}
          {showComparison && !isConsolidated && <ComparisonBar />}

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
              className="mt-2 w-full flex items-center gap-2 px-4 py-3 md:py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-sm md:text-xs font-medium transition-all">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pt-20 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
