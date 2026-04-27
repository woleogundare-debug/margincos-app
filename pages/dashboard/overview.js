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
import { TIER_ACCESS } from '../../lib/constants';
import clsx from 'clsx';

const DownloadReportButton = dynamic(
  () => import('../../components/report/DownloadReportButton'),
  { ssr: false }
);

export default function OverviewPage() {
  const { user, companyName, tier, isProfessional, isEnterprise } = useAuth();
  const { activePeriod, skuRows, portfolioLoading, activeResults: results, running, ranAt, error, run, activeHasResults: hasResults, isConsolidated, consolidatedDivisionBreakdown, consolidatedMissing, consolidatedSector, consolidatedMonth, chronologicalDelta, activeDivision, isAdmin, profileLoaded, teamLoading, divisionsLoading } = useAnalysisContext();
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
  const { stats: actionStats, bulkAddFromAnalysis, loadActions } = useActions(team?.id, activePeriod?.id, activeDivision?.id);

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

  // Lockout: non-admin user with no assigned division. Render only the lockout
  // empty state - suppress banner, action strip, error, noData, and results.
  // Gated on identity resolution flags to prevent a first-paint flash:
  // useAuth / useTeam / useDivisions resolve on different timelines, so the
  // (!isAdmin && !activeDivision) pair is briefly true for everyone before
  // their profile / team membership / division assignment loads.
  const isLockedOut =
    !isAdmin &&
    !activeDivision &&
    !portfolioLoading &&
    profileLoaded &&
    !teamLoading &&
    !divisionsLoading;

  if (isLockedOut) {
    return (
      <>
        <Head><title>Overview | MarginCOS</title></Head>
        <EmptyState
          icon="🔒"
          title="You have not been assigned to a division"
          description="Ask your team admin to assign you to a division so you can start working. If you are the admin, visit the Team page and select your division."
          action={<Link href="/dashboard/team"><Button variant="navy">Go to Team Page</Button></Link>}
        />
      </>
    );
  }

  return (
    <>
      <Head><title>Overview | MarginCOS</title></Head>
        {/* ── Doc Head (editorial header + status + buttons) ── */}
        {!noData && (
          <div className="doc-head">
            <div>
              <div className="doc-meta">Commercial Intelligence — Briefing {activePeriod?.label ? activePeriod.label.replace(/\s/g, '·') : ''}</div>
              <h1 className="doc-title">Overview</h1>
              <div className="doc-period">
                {hasResults
                  ? `Analysis complete · ${activePeriod?.label} · ${results?.skuCount} active ${cfg.unitPlural} · last run ${ranAt?.toLocaleTimeString() || '—'}`
                  : `Ready to analyse · ${skuRows.filter(r => r.active === 'Y' || r.active === true).length} ${cfg.unitPlural} in portfolio`}
              </div>
            </div>
            <div className="doc-actions">
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
            {/* ── Insight headline ── */}
            {results.revenueAtRisk > 0 && (
              <div className="insight">
                <div className="insight-label">Headline</div>
                <div className="insight-body">
                  <div className="insight-text">
                    Portfolio margin at <strong>{results.totalRevenue > 0 ? (results.totalCurrentMargin / results.totalRevenue * 100).toFixed(1) : '—'}%</strong>.{' '}
                    <em>{fNAbs(results.revenueAtRisk)} of revenue is priced below its cost floor</em>.{' '}
                    {results.actions?.length > 0 && (
                      <>{results.actions.length} prioritised actions identified across {new Set(results.actions.map(a => a.pillar)).size} pillars.</>
                    )}
                  </div>
                  <div className="insight-delta">
                    <span><strong>Margin</strong> {results.totalRevenue > 0 ? (results.totalCurrentMargin / results.totalRevenue * 100).toFixed(1) + '%' : '—'}
                      {deltas?.portfolio?.totalCurrentMargin && deltas.portfolio.totalCurrentMargin.direction !== 'flat' && (
                        <span className={deltas.portfolio.totalCurrentMargin.direction === 'up' ? 'up' : 'down'}> {deltas.portfolio.totalCurrentMargin.direction === 'up' ? '▲' : '▼'} {fNAbs(Math.abs(deltas.portfolio.totalCurrentMargin.value))}</span>
                      )}
                    </span>
                    <span><strong>At-risk revenue</strong> {fNAbs(results.revenueAtRisk)}
                      {deltas?.portfolio?.revenueAtRisk && deltas.portfolio.revenueAtRisk.direction !== 'flat' && (
                        <span className="up"> {deltas.portfolio.revenueAtRisk.direction === 'up' ? '▲' : '▼'} {fNAbs(Math.abs(deltas.portfolio.revenueAtRisk.value))}</span>
                      )}
                    </span>
                    {results.p1?.totalGain > 0 && (
                      <span><strong>P1 upside</strong> {fN(results.p1.totalGain)}/mo</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Exhibit 1: Portfolio at a glance (KPIs) ── */}
            <div className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 1</div>
                <div className="exhibit-title">Portfolio at a glance</div>
                <div className="exhibit-sub">Snapshot · {activePeriod?.label} · monthly basis</div>
              </div>
              <div className="exhibit-meta">
                <div className="total">All values monthly</div>
              </div>
            </div>

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

            {/* ── Exhibit 2: Four-pillar health ── */}
            <div className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 2</div>
                <div className="exhibit-title">Four-pillar health</div>
                <div className="exhibit-sub">RAG status across the four commercial levers · {activePeriod?.label}</div>
              </div>
              <div className="exhibit-meta">
                <Link href="/dashboard/actions" style={{ color: 'var(--teal)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>View action queue →</Link>
              </div>
            </div>
            <div className="pillars mb-6">
              {[
                { code: 'P1', name: cfg.p1.name,
                  rag: results.p1?.floorBreaches?.length > 0 ? 'red' : results.p1?.totalGain > 0 ? 'amber' : 'green',
                  status: results.p1?.floorBreaches?.length > 0 ? 'At Risk' : results.p1?.totalGain > 0 ? 'Watch' : 'Managed',
                  value: results.p1?.totalGain > 0 ? '+' + fNAbs(results.p1.totalGain) : '—',
                  sub: 'repricing upside' },
                { code: 'P2', name: cfg.p2.name,
                  rag: results.p2?.avgAbsorbedPct > 60 ? 'red' : results.p2?.avgAbsorbedPct > 30 ? 'amber' : 'green',
                  status: results.p2?.avgAbsorbedPct > 60 ? 'At Risk' : results.p2?.avgAbsorbedPct > 30 ? 'Watch' : 'Managed',
                  value: results.p2?.totalAbsorbed ? '−' + fNAbs(results.p2.totalAbsorbed) : '—',
                  sub: 'cost absorbed' },
                { code: 'P3', name: cfg.p3.name,
                  rag: results.p3?.channelResults?.some(c => c.contPct < 15 && c.rev > 0) ? 'amber' : 'green',
                  status: results.p3?.channelResults?.some(c => c.contPct < 15 && c.rev > 0) ? 'Watch' : 'Managed',
                  value: results.p3?.channelResults?.[0] ? results.p3.channelResults[0].channel + ' leads' : '—',
                  sub: 'by revenue' },
                { code: 'P4', name: cfg.p4.name,
                  rag: results.p4?.results?.some(r => !r.profitable) ? 'red' : results.p4?.results?.length > 0 ? 'green' : 'grey',
                  status: results.p4?.results?.some(r => !r.profitable) ? 'At Risk' : 'Managed',
                  value: results.p4?.results?.filter(r => !r.profitable).length > 0 ? results.p4.results.filter(r => !r.profitable).length + ' loss-making' : 'All profitable',
                  sub: 'promos' },
              ].map(p => (
                <div className="pillar" key={p.code}>
                  <span className={`rag ${p.rag}`}></span>
                  <div className="meta">
                    <div className="row1">
                      <span className="code">{p.code}</span>
                      <span>{p.name}</span>
                    </div>
                    <div className={`row2 ${p.rag}`}>● {p.status}</div>
                  </div>
                  <div className="figure">
                    <strong>{p.value}</strong>
                    <span>{p.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Consolidated Division Breakdown — shown only in consolidated view */}
            {isConsolidated && consolidatedDivisionBreakdown.length > 0 && (
              <>
                <div className="exhibit-head">
                  <div>
                    <div className="exhibit-num">Exhibit 2b</div>
                    <div className="exhibit-title">Division breakdown</div>
                    <div className="exhibit-sub">{consolidatedSector} · {consolidatedMonth}</div>
                  </div>
                  {consolidatedMissing?.length > 0 && (
                    <div className="exhibit-meta">
                      <span className="count" style={{ color: 'var(--gold)' }}>{consolidatedMissing.length} division{consolidatedMissing.length > 1 ? 's' : ''} missing data</span>
                    </div>
                  )}
                </div>
                <div className="panel">
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th>Division</th>
                        <th className="right">Active {cfg.unitPlural}</th>
                        <th className="right">Revenue</th>
                        <th className="right">Margin %</th>
                        <th className="right">Revenue at Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consolidatedDivisionBreakdown.map((div, i) => (
                        <tr key={i}>
                          <td className="bold">{div.divisionName}</td>
                          <td className="right muted">{div.rowCount}</td>
                          <td className="right">{fNAbs(div.totalRevenue)}</td>
                          <td className={`right ${div.portfolioMarginPct >= 0 ? 'pos' : 'neg'}`}>
                            {div.portfolioMarginPct.toFixed(1)}%
                          </td>
                          <td className="right neg">{fNAbs(div.revenueAtRisk)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {consolidatedMissing?.length > 0 && (
                    <div className="source-line">
                      <span>Missing data for: {consolidatedMissing.map(d => d.name).join(', ')}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Exhibit 3: Priority Actions — filtered by tier entitlement ── */}
            {(() => {
              const allowedPillars = TIER_ACCESS[tier]?.allowedPillars || ['P1'];
              const gatedActions = (results.actions || []).filter(a => allowedPillars.includes(a.pillar));
              if (!gatedActions.length) return null;

              // Sort by absolute value descending
              const sortedActions = [...gatedActions].sort((a, b) => Math.abs(b.value || 0) - Math.abs(a.value || 0));

              // Compute total recoverable (positive values only).
              // Sum-distinct-by-pool: actions sharing a recoverable_pool_id contribute
              // their value once (the max within the pool). Standalone actions
              // (null pool_id) contribute their full value.
              const totalRecoverable = (() => {
                const seenPools = new Map();
                let standaloneTotal = 0;
                for (const a of sortedActions) {
                  const v = a.value || 0;
                  if (v <= 0) continue;
                  if (a.recoverable_pool_id) {
                    const prev = seenPools.get(a.recoverable_pool_id) || 0;
                    if (v > prev) seenPools.set(a.recoverable_pool_id, v);
                  } else {
                    standaloneTotal += v;
                  }
                }
                const pooledTotal = Array.from(seenPools.values()).reduce((s, v) => s + v, 0);
                return standaloneTotal + pooledTotal;
              })();

              return (
                <>
                  <div className="exhibit-head">
                    <div>
                      <div className="exhibit-num">Exhibit 3</div>
                      <div className="exhibit-title">Priority actions</div>
                      <div className="exhibit-sub">Sorted by recoverable margin impact · per month</div>
                    </div>
                    <div className="exhibit-meta">
                      {totalRecoverable > 0 && (
                        <><span className="total">{fNAbs(totalRecoverable)} total recoverable</span><span className="total-suffix"> /month</span><span className="sep">·</span></>
                      )}
                      <span className="count">{sortedActions.length} identified</span>
                    </div>
                  </div>

                  {/* Mobile card layout */}
                  <div className="md:hidden space-y-2 mb-6">
                    {sortedActions.map((action, i) => (
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
                  {/* Desktop: Priority Actions with urgency bars */}
                  <div className="hidden md:block panel panel-tabular action-table mb-6">
                    <div className="table-head">
                      <div></div>
                      <div>#</div>
                      <div>Recommendation</div>
                      <div style={{ textAlign: 'right' }}>Recoverable</div>
                      <div></div>
                    </div>
                    {sortedActions.map((action, i) => {
                      const urgClass = action.timeline === 'IMMEDIATE' ? 'u-immediate'
                        : action.timeline?.includes('30') ? 'u-30' : 'u-week';
                      const urgTagClass = action.timeline === 'IMMEDIATE' ? 'urg-imm'
                        : action.timeline?.includes('30') ? 'urg-30' : 'urg-wk';
                      return (
                        <div className="action" key={i}>
                          <div className={`urgency-bar ${urgClass}`}></div>
                          <div className="a-rank">{String(i + 1).padStart(2, '0')}</div>
                          <div className="a-body">
                            <h4 className="a-title">{action.title}</h4>
                            <p className="a-detail">{action.detail}</p>
                            <div className="a-tags">
                              <span className="a-tag"><span className="pill">{action.pillar}</span></span>
                              <span className={`a-tag ${urgTagClass}`}>● {action.timeline}</span>
                            </div>
                          </div>
                          <div className="a-recov">
                            {action.value ? (
                              <>
                                <div className={`v ${action.value < 0 ? 'v-neg' : ''}`}>
                                  {action.value > 0 ? '+' : ''}{fNAbs(Math.abs(action.value))}
                                </div>
                                <div className="per">/month</div>
                              </>
                            ) : <div className="v">—</div>}
                          </div>
                          <div></div>
                        </div>
                      );
                    })}
                    <div className="source-line">
                      <span><strong>Methodology:</strong> Net margin impact, holding volume constant; 30-day window</span>
                      <span><strong>Source:</strong> P1–P4 analysis engine</span>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* ── Commentary callout ── */}
            <div className="commentary">
              <div className="commentary-label">Analyst commentary</div>
              <div className="commentary-text">
                {results.revenueAtRisk > 0 ? (
                  <>The compression is <em>concentrated in P2 (cost)</em>, where {results.p2?.floorBreaches?.length || 'several'} {cfg.unitPlural} account for the bulk of absorbed input-cost pressure. </>
                ) : (
                  <>Portfolio is in good standing. </>
                )}
                {results.p1?.totalGain > 0 && (
                  <><strong>P1 repricing opportunity of {fN(results.p1.totalGain)}/month</strong> is available across {cfg.unitPlural} with WTP headroom. </>
                )}
                {results.p4?.results?.some(r => !r.profitable) && (
                  <>Trade pillar shows {results.p4.results.filter(r => !r.profitable).length} loss-making promotions that should be reviewed.</>
                )}
              </div>
            </div>

            {/* ── Pillar navigation grid ── */}
            <div className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 4</div>
                <div className="exhibit-title">Pillar deep-dives</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: cfg.p1.name, code: 'P1', href: '/dashboard/pricing',
                  rag: results.p1?.floorBreaches?.length > 0 ? 'red' : results.p1?.totalGain > 0 ? 'amber' : 'green',
                  stat: results.p1?.totalGain > 0 ? fN(results.p1.totalGain) : 'No gap',
                  sub: 'repricing opportunity' },
                { label: cfg.p2.name, code: 'P2', href: '/dashboard/cost',
                  rag: results.p2?.avgAbsorbedPct > 60 ? 'red' : results.p2?.avgAbsorbedPct > 30 ? 'amber' : 'green',
                  stat: fNAbs(results.p2?.totalAbsorbed || 0),
                  sub: 'cost absorbed /month' },
                { label: cfg.p3.name, code: 'P3', href: '/dashboard/channel',
                  rag: results.p3?.channelResults?.some(c => c.contPct < 15 && c.rev > 0) ? 'amber' : 'green',
                  stat: results.p3?.channelResults?.length
                    ? results.p3.channelResults[0]?.channel + ' top channel'
                    : '—',
                  sub: 'by revenue' },
                { label: cfg.p4.name, code: 'P4', href: '/dashboard/trade',
                  rag: results.p4?.results?.some(r => !r.profitable) ? 'red' : results.p4?.results?.length > 0 ? 'green' : 'grey',
                  stat: results.p4?.results?.filter(r => !r.profitable).length > 0
                    ? results.p4.results.filter(r => !r.profitable).length + ' loss-making promos'
                    : 'All promos profitable',
                  sub: '' },
              ].map(({ label, code, href, rag, stat, sub }) => (
                <Link key={href} href={href}>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`rag ${rag}`}></span>
                      <span className="page-pillar-code">{code}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-lg font-black text-navy leading-tight">{stat}</p>
                    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                    <p className="text-xs font-semibold mt-3 group-hover:underline" style={{ color: 'var(--teal)' }}>View detail →</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── Doc Footer ── */}
            <div className="doc-footer">
              <span>MarginCOS · Commercial Operating System</span>
              <span>Confidential · prepared for {companyName} · Rev {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace('/', '·')}</span>
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
    </>
  );
}

OverviewPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
