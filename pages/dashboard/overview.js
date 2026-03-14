import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { KpiTile, ActionItem, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useAnalysis } from '../../hooks/useAnalysis';
import { fNAbs, fN } from '../../lib/formatters';
import clsx from 'clsx';

export default function OverviewPage() {
  const { user } = useAuth();
  const { activePeriod, skuRows, tradeInvestment, loading: portfolioLoading } = usePortfolio(user?.id);
  const { results, running, ranAt, error, run, hasResults } = useAnalysis(skuRows, tradeInvestment);
  const autoRanRef = useRef(false);

  // Auto-run analysis when portfolio data finishes loading.
  // This handles the flow: Portfolio "Run Analysis →" link → navigate here → auto-run.
  useEffect(() => {
    if (!portfolioLoading && skuRows.length > 0 && !hasResults && !running && !autoRanRef.current) {
      autoRanRef.current = true;
      run();
    }
  }, [portfolioLoading, skuRows.length, hasResults, running, run]);

  const noData = !portfolioLoading && skuRows.length === 0;

  return (
    <>
      <Head><title>Overview | MarginCOS</title></Head>
      <DashboardLayout title="Overview" activePeriod={activePeriod}>

        {/* Run Analysis banner */}
        {!noData && (
          <div className={clsx(
            'flex items-center justify-between px-6 py-4 rounded-2xl mb-6 border',
            hasResults
              ? 'bg-teal-50 border-teal/20'
              : 'bg-navy/5 border-navy/10'
          )}>
            <div>
              <p className="text-sm font-bold text-navy">
                {hasResults
                  ? `Analysis complete · ${activePeriod?.label}`
                  : 'Ready to analyse'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasResults
                  ? `Last run: ${ranAt?.toLocaleTimeString()} · ${results?.skuCount} active SKUs`
                  : `${skuRows.filter(r => r.active === 'Y' || r.active === true).length} SKUs in portfolio`}
              </p>
            </div>
            <Button variant={hasResults ? 'secondary' : 'navy'} size="md" onClick={run} loading={running}>
              {hasResults ? '↻ Re-run' : '▶ Run Analysis'}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* No data empty state */}
        {noData && (
          <EmptyState
            icon="📊"
            title="No portfolio data yet"
            description="Add SKUs in Portfolio Manager to run your first margin analysis."
            action={<Link href="/dashboard/portfolio"><Button variant="navy">Go to Portfolio Manager</Button></Link>}
          />
        )}

        {/* Results */}
        {hasResults && results && (
          <>
            {/* KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <KpiTile
                label="Total Revenue"
                value={fNAbs(results.totalRevenue)}
                pill={`${results.skuCount} active SKUs`}
                accent="teal"
              />
              <KpiTile
                label="Portfolio Margin"
                value={results.totalRevenue > 0
                  ? (results.totalCurrentMargin / results.totalRevenue * 100).toFixed(1) + '%'
                  : '—'}
                pill={fNAbs(results.totalCurrentMargin) + ' gross margin'}
                accent="teal"
              />
              <KpiTile
                label="Revenue at Risk"
                value={fNAbs(results.revenueAtRisk)}
                pill="Cost absorbed, not priced in"
                accent="red"
              />
              <KpiTile
                label="P1 Opportunity"
                value={results.p1?.totalGain > 0 ? fN(results.p1.totalGain) : '₦0'}
                pill="Repricing upside /month"
                accent="amber"
              />
            </div>

            {/* Priority Actions */}
            {results.actions?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-navy">Priority Actions</h2>
                  <span className="text-xs text-slate-400">{results.actions.length} identified</span>
                </div>
                <div>
                  {results.actions.map((action, i) => (
                    <ActionItem key={i} action={action} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Pillar Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Pricing Intelligence', color: '#0D9488', href: '/dashboard/pricing',
                  stat: results.p1?.totalGain > 0 ? fN(results.p1.totalGain) : 'No gap',
                  sub: 'repricing opportunity' },
                { label: 'Cost Pass-Through', color: '#DC2626', href: '/dashboard/cost',
                  stat: fNAbs(results.p2?.totalAbsorbed || 0),
                  sub: 'cost absorbed /month' },
                { label: 'Channel Economics', color: '#D97706', href: '/dashboard/channel',
                  stat: results.p3?.channelResults?.length
                    ? results.p3.channelResults[0]?.channel + ' top channel'
                    : '—',
                  sub: 'by revenue' },
                { label: 'Trade Execution', color: '#7C3AED', href: '/dashboard/trade',
                  stat: results.p4?.results?.filter(r => !r.profitable).length > 0
                    ? results.p4.results.filter(r => !r.profitable).length + ' loss-making promos'
                    : 'All promos profitable',
                  sub: '' },
              ].map(({ label, color, href, stat, sub }) => (
                <Link key={href} href={href}>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group">
                    <div className="w-3 h-3 rounded-full mb-3" style={{ background: color }} />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-lg font-black text-navy leading-tight">{stat}</p>
                    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                    <p className="text-xs text-teal font-semibold mt-3 group-hover:underline">View detail →</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Skeleton placeholders before first run */}
        {!hasResults && !noData && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
                <div className="h-3 bg-slate-100 rounded mb-3 w-3/4" />
                <div className="h-7 bg-slate-100 rounded mb-2 w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  const auth = await requireAuth(req, res);
  if (auth.redirect) return auth;
  return { props: {} };
}
