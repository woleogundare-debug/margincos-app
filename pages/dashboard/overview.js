import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { KpiTile, ActionItem, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { useTeam } from '../../hooks/useTeam';
import { useActions } from '../../hooks/useActions';
import { fNAbs, fN, getFormatterSym } from '../../lib/formatters';
import { computeDeltas } from '../../lib/engine/delta';
import { getSectorConfig } from '../../lib/sectorConfig';
import clsx from 'clsx';

const DownloadReportButton = dynamic(
  () => import('../../components/report/DownloadReportButton'),
  { ssr: false }
);

export default function OverviewPage() {
  const { user, companyName, tier, isProfessional, isEnterprise } = useAuth();
  const { activePeriod, skuRows, portfolioLoading, activeResults: results, running, ranAt, error, run, activeHasResults: hasResults, isConsolidated, consolidatedDivisionBreakdown, consolidatedMissing, consolidatedSector, consolidatedMonth, chronologicalDelta, activeDivision } = useAnalysisContext();
  const cfg = getSectorConfig(activePeriod?.vertical);

  // In division mode, show "Company - Division" so the report header identifies
  // which division it covers. Consolidated and default-division reports use the
  // plain company name (the default division IS the company level).
  const reportCompanyName = isConsolidated
    ? companyName
    : (activeDivision && !activeDivision.is_default)
      ? `${companyName} - ${activeDivision.name}`
      : companyName;
  const deltas = useMemo(() => {
    if (!chronologicalDelta) return null;
    return computeDeltas(chronologicalDelta.laterResults, chronologicalDelta.earlierResults);
  }, [chronologicalDelta]);
  const autoRanRef = useRef(false);
  const prevPeriodRef = useRef(null);
  const lastSavedAt = useRef(null); // tracks ranAt timestamp of last saved actions

  const { team } = useTeam();
  const { stats: actionStats, bulkAddFromAnalysis, loadActions } = useActions(team?.id, activePeriod?.id);

  // Auto-save actions to DB when analysis completes.
  // [ranAt] is the sole dependency — this effect fires exactly once per analysis
  // run and never again until a new run produces a different ranAt value.
  // Refs capture the latest values of bulkAddFromAnalysis / loadActions /
  // activePeriod without adding them to the dep array (avoids cascade re-fires).
  const bulkAddRef = useRef(bulkAddFromAnalysis);
  const loadActionsRef = useRef(loadActions);
  const activePeriodRef = useRef(activePeriod);
  const resultsRef = useRef(results);
  const teamRef = useRef(team);
  bulkAddRef.current = bulkAddFromAnalysis;
  loadActionsRef.current = loadActions;
  activePeriodRef.current = activePeriod;
  resultsRef.current = results;
  teamRef.current = team;

  useEffect(() => {
    if (!ranAt || !resultsRef.current || !teamRef.current?.id) return;
    if (lastSavedAt.current === ranAt) return; // already saved this exact run
    lastSavedAt.current = ranAt;

    const save = async () => {
      try {
        if (!activePeriodRef.current?.id) return; // never write period_id=null — would poison dedup guard
        if (resultsRef.current?.actions?.length) {
          await bulkAddRef.current(
            resultsRef.current.actions,
            activePeriodRef.current?.id
          );
          await loadActionsRef.current();
        }
      } catch (err) {
        console.error('Failed to save actions:', err);
      }
    };
    save();
  }, [ranAt, team?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset auto-run guard when the active period changes.
  // Without this, autoRanRef stays true forever after the first run, blocking
  // re-analysis when the user switches periods.
  useEffect(() => {
    if (activePeriod?.id && activePeriod.id !== prevPeriodRef.current) {
      prevPeriodRef.current = activePeriod.id;
      autoRanRef.current = false;
    }
  }, [activePeriod?.id]);

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
                  ? `Last run: ${ranAt?.toLocaleTimeString()} · ${results?.skuCount} active ${cfg.unitPlural}`
                  : `${skuRows.filter(r => r.active === 'Y' || r.active === true).length} ${cfg.unitPlural} in portfolio`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasResults && isProfessional && (
                <DownloadReportButton
                  results={results}
                  companyName={reportCompanyName}
                  periodLabel={isConsolidated ? `Consolidated — ${consolidatedMonth}` : activePeriod?.label}
                  tier={tier}
                  isEnterprise={isEnterprise}
                  chronologicalDelta={chronologicalDelta}
                  vertical={activePeriod?.vertical}
                />
              )}
              <Button variant={hasResults ? 'secondary' : 'navy'} size="md" onClick={run} loading={running}>
                {hasResults ? '↻ Re-run' : '▶ Run Analysis'}
              </Button>
            </div>
          </div>
        )}

        {/* Action summary strip */}
        {actionStats.open > 0 && (
          <div className="mb-4 rounded-xl border border-gray-100 bg-white overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#FEF2F2' }}>
                  <span className="text-sm font-bold" style={{ color: '#C0392B' }}>
                    {actionStats.open}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
                    {actionStats.open} open action{actionStats.open !== 1 ? 's' : ''}
                    {actionStats.totalValue > 0 && (
                      <span style={{ color: '#0D8F8F' }}>
                        {' '}&middot; {fNAbs(actionStats.totalValue)} recoverable
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: '#8899AA' }}>
                    {actionStats.resolved} of {actionStats.total} resolved this period
                  </p>
                </div>
              </div>
              <Link href="/dashboard/actions"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white flex-shrink-0"
                style={{ backgroundColor: '#1B2A4A' }}>
                View Actions →
              </Link>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div className="h-1 transition-all"
                style={{
                  width: `${actionStats.total > 0 ? (actionStats.resolved / actionStats.total) * 100 : 0}%`,
                  backgroundColor: '#0D8F8F',
                }} />
            </div>
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
            description={cfg.narrative.emptyState}
            action={<Link href="/dashboard/portfolio"><Button variant="navy">Go to Portfolio Manager</Button></Link>}
          />
        )}

        {/* Results */}
        {hasResults && results && (
          <>
            {/* Mobile pillar scorecard — horizontal scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide mb-4">
              <div className="flex gap-2 min-w-max py-1">
                {[
                  { label: 'Pricing', color: '#0D9488',
                    rag: results.p1?.floorBreaches?.length > 0 ? 'red' : results.p1?.totalGain > 0 ? 'amber' : 'green' },
                  { label: 'Cost', color: '#DC2626',
                    rag: results.p2?.avgAbsorbedPct > 60 ? 'red' : results.p2?.avgAbsorbedPct > 30 ? 'amber' : 'green' },
                  { label: 'Channel', color: '#D97706',
                    rag: results.p3?.channelResults?.some(c => c.contPct < 15 && c.rev > 0) ? 'amber' : 'green' },
                  { label: 'Trade', color: '#7C3AED',
                    rag: results.p4?.results?.some(r => !r.profitable) ? 'red' : results.p4?.results?.length > 0 ? 'green' : 'grey' },
                ].map(p => (
                  <div key={p.label}
                    className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border border-gray-100 bg-white min-w-[90px]"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span className={clsx('w-2.5 h-2.5 rounded-full',
                      p.rag === 'green' ? 'bg-teal-500' : p.rag === 'amber' ? 'bg-amber-400' : p.rag === 'red' ? 'bg-red-500' : 'bg-gray-300'
                    )} />
                    <span className="text-xs font-semibold text-center" style={{ color: '#1B2A4A' }}>{p.label}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{p.rag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <KpiTile
                label="Total Revenue"
                value={fNAbs(results.totalRevenue)}
                pill={`${results.skuCount} active ${cfg.unitPlural}`}
                accent="teal"
                description={`Monthly revenue across all active ${cfg.unitPlural}`}
                delta={deltas?.portfolio?.revenue && deltas.portfolio.revenue.direction !== 'flat' && Math.abs(deltas.portfolio.revenue.value) >= 1 ? {
                  label: fNAbs(Math.abs(deltas.portfolio.revenue.value)),
                  direction: deltas.portfolio.revenue.direction,
                  isPositive: true,
                } : null}
              />
              <KpiTile
                label="Portfolio Margin"
                value={results.totalRevenue > 0
                  ? (results.totalCurrentMargin / results.totalRevenue * 100).toFixed(1) + '%'
                  : '—'}
                pill={fNAbs(results.totalCurrentMargin) + ' gross margin'}
                accent="teal"
                description={`Weighted average gross margin across all active ${cfg.unitPlural}`}
                delta={deltas?.portfolio?.totalCurrentMargin && deltas.portfolio.totalCurrentMargin.direction !== 'flat' && Math.abs(deltas.portfolio.totalCurrentMargin.value) >= 1 ? {
                  label: fNAbs(Math.abs(deltas.portfolio.totalCurrentMargin.value)),
                  direction: deltas.portfolio.totalCurrentMargin.direction,
                  isPositive: true,
                } : null}
              />
              <KpiTile
                label="Revenue at Risk"
                value={fNAbs(results.revenueAtRisk)}
                pill="Cost absorbed, not priced in"
                accent="red"
                description={`Revenue from ${cfg.unitPlural} priced below their cost floor`}
                delta={deltas?.portfolio?.revenueAtRisk && deltas.portfolio.revenueAtRisk.direction !== 'flat' && Math.abs(deltas.portfolio.revenueAtRisk.value) >= 1 ? {
                  label: fNAbs(Math.abs(deltas.portfolio.revenueAtRisk.value)),
                  direction: deltas.portfolio.revenueAtRisk.direction,
                  isPositive: false,
                } : null}
              />
              <KpiTile
                label="P1 Opportunity"
                value={results.p1?.totalGain > 0 ? fN(results.p1.totalGain) : (getFormatterSym() + '0')}
                pill="Repricing upside /month"
                accent="amber"
                description="Monthly margin gain from optimal repricing"
                delta={deltas?.portfolio?.marginProtected && deltas.portfolio.marginProtected.direction !== 'flat' && Math.abs(deltas.portfolio.marginProtected.value) >= 1 ? {
                  label: fNAbs(Math.abs(deltas.portfolio.marginProtected.value)),
                  direction: deltas.portfolio.marginProtected.direction,
                  isPositive: true,
                } : null}
              />
            </div>

            {/* Consolidated Division Breakdown — shown only in consolidated view */}
            {isConsolidated && consolidatedDivisionBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-navy">Division Breakdown</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{consolidatedSector} · {consolidatedMonth}</p>
                  </div>
                  {consolidatedMissing?.length > 0 && (
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                      {consolidatedMissing.length} division{consolidatedMissing.length > 1 ? 's' : ''} missing data
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="text-left px-6 py-3">Division</th>
                        <th className="text-right px-6 py-3">Active {cfg.unitPlural}</th>
                        <th className="text-right px-6 py-3">Revenue</th>
                        <th className="text-right px-6 py-3">Margin %</th>
                        <th className="text-right px-6 py-3">Revenue at Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {consolidatedDivisionBreakdown.map((div, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-semibold text-navy">{div.divisionName}</td>
                          <td className="px-6 py-3 text-right text-gray-600">{div.rowCount}</td>
                          <td className="px-6 py-3 text-right text-gray-700 font-medium">{fNAbs(div.totalRevenue)}</td>
                          <td className="px-6 py-3 text-right">
                            <span className={`font-semibold ${div.portfolioMarginPct >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                              {div.portfolioMarginPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-red-500 font-medium">{fNAbs(div.revenueAtRisk)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {consolidatedMissing?.length > 0 && (
                  <div className="px-6 py-3 border-t border-slate-100 text-xs text-gray-400">
                    Missing data for: {consolidatedMissing.map(d => d.name).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Priority Actions — mobile card layout */}
            {results.actions?.length > 0 && (
              <>
                <div className="md:hidden space-y-2 mb-6">
                  <p className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
                    Priority Actions · {results.actions.length} identified
                  </p>
                  {results.actions.map((action, i) => (
                    <div key={i} className="bg-white rounded-xl border-l-4 border-gray-100 px-4 py-3 flex items-start gap-3"
                      style={{ borderLeftColor: action.color }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
                        style={{ background: action.color + '20', color: action.color }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>{action.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{action.detail}</p>
                        <p className="text-[10px] font-semibold mt-1 uppercase tracking-wide" style={{ color: action.color }}>
                          {action.pillar} · {action.timeline}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: Priority Actions (unchanged) */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
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
              </>
            )}

            {/* Pillar Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: cfg.p1.name, color: '#0D9488', href: '/dashboard/pricing',
                  stat: results.p1?.totalGain > 0 ? fN(results.p1.totalGain) : 'No gap',
                  sub: 'repricing opportunity' },
                { label: cfg.p2.name, color: '#DC2626', href: '/dashboard/cost',
                  stat: fNAbs(results.p2?.totalAbsorbed || 0),
                  sub: 'cost absorbed /month' },
                { label: cfg.p3.name, color: '#D97706', href: '/dashboard/channel',
                  stat: results.p3?.channelResults?.length
                    ? results.p3.channelResults[0]?.channel + ' top channel'
                    : '—',
                  sub: 'by revenue' },
                { label: cfg.p4.name, color: '#7C3AED', href: '/dashboard/trade',
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
