import { useState, useMemo } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState, PillarGate } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { fNAbs } from '../../lib/formatters';
import { computeDeltas } from '../../lib/engine/delta';
import { getSectorConfig } from '../../lib/sectorConfig';
import P2WaterfallChart from '../../components/charts/P2WaterfallChart';
import { TIER_ACCESS } from '../../lib/constants';
import ExportButton from '../../components/ExportButton';
import { exportP2CostPassThrough } from '../../lib/exportToExcel';

export default function CostPage() {
  const { tier, loading: authLoading, profileLoaded } = useAuth();
  const { activePeriod, activeResults: results, running, run, activeHasResults: hasResults, chronologicalDelta, isConsolidated } = useAnalysisContext();
  const cfg = getSectorConfig(activePeriod?.vertical);
  const p2 = results?.p2;
  const deltas = useMemo(() => {
    if (!chronologicalDelta) return null;
    return computeDeltas(chronologicalDelta.laterResults, chronologicalDelta.earlierResults);
  }, [chronologicalDelta]);

  const [tableExpanded, setTableExpanded] = useState(false);
  const [sortCol, setSortCol] = useState('absorbed');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };
  const si = (col) => sortCol === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

  const sorted = [...(p2?.results || [])].sort((a, b) => {
    const av = a[sortCol] ?? 0;
    const bv = b[sortCol] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  // Keep access + ragStatus computed unconditionally so the single DashboardLayout
  // instance stays mounted throughout loading → avoids scroll-reset on content reveal.
  const access = TIER_ACCESS[tier] || TIER_ACCESS.essentials;

  const ragStatus = !hasResults ? 'grey'
    : p2?.avgAbsorbedPct > 60 ? 'red'
    : p2?.avgAbsorbedPct > 30 ? 'amber'
    : 'green';

  return (
    <>
      <Head><title>Cost Pass-Through | MarginCOS</title></Head>
        {(authLoading || !profileLoaded) && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0D8F8F] border-t-transparent" />
          </div>
        )}
        {!authLoading && profileLoaded && !access.pillars.includes('cost') && (
          <PillarGate requiredTier="Professional" pillarName="Cost Pass-Through Analysis" />
        )}
        {!authLoading && profileLoaded && access.pillars.includes('cost') && !hasResults && (
          <EmptyState icon="📉" title="Run analysis to see cost absorption results"
            description={cfg.narrative.p2EmptyState}
            action={<Button variant="navy" onClick={run} loading={running}>{running ? 'Analysing…' : 'Run Analysis'}</Button>} />
        )}

        {!authLoading && profileLoaded && access.pillars.includes('cost') && hasResults && p2 && (
          <>
            <div className="doc-head">
              <div>
                <div className="doc-meta"><span className="page-pillar-code">P2</span>Cost pillar</div>
                <h1 className="doc-title">Cost Pass-Through</h1>
                <div className="doc-period">{activePeriod?.label}</div>
              </div>
              <div className="doc-actions">
                <button className="btn-ed">Export drivers</button>
                <button className="btn-ed" style={{ background: 'var(--teal, #0D8F8F)', color: '#fff', borderColor: 'var(--teal, #0D8F8F)' }}>Run scenario</button>
              </div>
            </div>

            {p2 && (
              <div className="insight">
                <div className="insight-label">At Risk</div>
                <div className="insight-body">
                  <div className="insight-text">
                    {p2.avgAbsorbedPct > 60
                      ? <><em>{fNAbs(p2.totalAbsorbed)}/month</em> cost exposure embedded in margin</>
                      : p2.avgAbsorbedPct > 30
                      ? <><em>{p2.results?.filter(r => r.floorBreach)?.length || 0} items</em> approaching cost floor</>
                      : <>Cost absorption managed at <em>{(p2.avgAbsorbedPct || 0).toFixed(1)}%</em></>
                    }
                  </div>
                </div>
              </div>
            )}

            <div className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 1</div>
                <div className="exhibit-title">Cost absorption analysis</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <KpiTile label="Cost Absorbed" value={fNAbs(p2.totalAbsorbed)}
                pill="Not priced in — margin erosion" accent="red"
                delta={deltas?.p2?.totalAbsorbed ? {
                  label: fNAbs(Math.abs(deltas.p2.totalAbsorbed.value)),
                  direction: deltas.p2.totalAbsorbed.direction,
                  isPositive: false,
                } : null} />
              <KpiTile label="Total Cost Shock" value={fNAbs(p2.totalCostShock)}
                pill="Gross input cost increase" accent="red"
                delta={deltas?.p2?.totalCostShock ? {
                  label: fNAbs(Math.abs(deltas.p2.totalCostShock.value)),
                  direction: deltas.p2.totalCostShock.direction,
                  isPositive: false,
                } : null} />
              <KpiTile label="Portfolio Recovery Rate"
                value={(p2.portRecoveryPct || 0).toFixed(1) + '%'}
                pill={p2.portRecoveryPct < 40
                  ? `⚠ Critical — below benchmark (${cfg.benchmark.costRecoveryShort})`
                  : p2.portRecoveryPct < 70 ? `▲ Below benchmark (${cfg.benchmark.costRecoveryShort})` : '✓ Above benchmark'}
                accent={p2.portRecoveryPct < 40 ? 'red' : p2.portRecoveryPct < 70 ? 'amber' : 'teal'}
                delta={deltas?.p2?.portRecoveryPct ? {
                  label: Math.abs(deltas.p2.portRecoveryPct.value).toFixed(1) + 'pp',
                  direction: deltas.p2.portRecoveryPct.direction,
                  isPositive: true,
                } : null} />
            </div>

            {/* Cost Recovery Waterfall Chart */}
            <P2WaterfallChart p2={p2} />

            {/* Mobile summary strip */}
            <div className="md:hidden rounded-xl overflow-hidden border border-gray-100 mb-4">
              <div className={`px-4 py-2.5 flex items-center gap-2 ${
                ragStatus === 'green' ? 'bg-teal-50' : ragStatus === 'amber' ? 'bg-amber-50' : ragStatus === 'red' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  ragStatus === 'green' ? 'bg-teal-500' : ragStatus === 'amber' ? 'bg-amber-400' : ragStatus === 'red' ? 'bg-red-500' : 'bg-gray-300'
                }`} />
                <span className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: ragStatus === 'green' ? '#0D8F8F' : ragStatus === 'red' ? '#C0392B' : '#92400E' }}>
                  {ragStatus === 'green' ? 'Managed' : ragStatus === 'amber' ? 'Watch' : ragStatus === 'red' ? 'At Risk' : 'Pending'}
                </span>
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {`Recovery rate: ${(p2.portRecoveryPct || 0).toFixed(1)}% — ${fNAbs(p2.totalAbsorbed)}/month absorbed into margin.`}
                </p>
              </div>
            </div>

            {/* Mobile collapsible table */}
            <div className="md:hidden mb-4">
              <button onClick={() => setTableExpanded(!tableExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-semibold"
                style={{ color: '#1B2A4A' }}>
                <span>View {cfg.unit} detail ({p2.results?.length || 0} {cfg.unitPlural})</span>
                <span className="text-gray-400">{tableExpanded ? '▲' : '▼'}</span>
              </button>
              {tableExpanded && (
                <div className="mt-2 overflow-x-auto scrollbar-hide rounded-xl border border-gray-100 bg-white"
                  style={{ WebkitOverflowScrolling: 'touch' }}>
                  <AnalysisTable
                    headers={[cfg.unitId, ...(isConsolidated ? ['Division'] : []), cfg.fields.shock, cfg.fields.passThrough, cfg.fields.absorbed]}
                    rows={sorted.map(r => [
                      r.sku,
                      ...(isConsolidated ? [r._division || '—'] : []),
                      fNAbs(r.shock),
                      (r.pt * 100).toFixed(0) + '%',
                      { content: <span className="text-red-600 font-semibold">{fNAbs(r.absorbed)}</span> },
                    ])}
                    emptyMessage="No cost data."
                  />
                </div>
              )}
            </div>

            <div className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 2</div>
                <div className="exhibit-title">{cfg.unitName} cost detail</div>
                <div className="exhibit-sub">Year-on-year price change &amp; monthly margin impact</div>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:flex justify-end mb-2">
              <ExportButton
                show={tier === 'professional' || tier === 'enterprise'}
                onExport={() => exportP2CostPassThrough(sorted, activePeriod?.label, cfg.unitId)}
              />
            </div>
            <div className="hidden md:block">
            <PillarCard
              title={`Cost Absorption by ${cfg.unitName}`}
              subtitle={`Inflation shock, pass-through, and absorbed exposure per ${cfg.unit}`}
              accentColor="#DC2626"
              ragStatus={ragStatus}>
              <AnalysisTable
                headers={[
                  cfg.unitId, ...(isConsolidated ? ['Division'] : []), cfg.fields.classification,
                  <span key="shock" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('shock')}>Cost Shock /mo{si('shock')}</span>,
                  <span key="pt" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('pt')}>Pass-Through %{si('pt')}</span>,
                  <span key="absorbed" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('absorbed')}>Absorbed /mo{si('absorbed')}</span>,
                  'FX-Linked',
                  <span key="src">Source <span title={`How the inflation rate was determined for this ${cfg.unit}`} className="ml-0.5 text-gray-400 cursor-help">?</span></span>,
                ]}
                rows={sorted.map(r => [
                  r.sku,
                  ...(isConsolidated ? [r._division || '—'] : []),
                  r.category,
                  fNAbs(r.shock),
                  { content: (
                    <Badge color={r.pt >= 0.7 ? 'green' : r.pt >= 0.4 ? 'amber' : 'red'}>
                      {(r.pt * 100).toFixed(0)}%
                    </Badge>
                  )},
                  { content: <span className="text-red-600 font-semibold">{fNAbs(r.absorbed)}</span> },
                  { content: r.fxAbsorbed > 0
                    ? <Badge color="amber">{fNAbs(r.fxAbsorbed)}</Badge>
                    : <span className="text-slate-300">—</span>
                  },
                  { content: r.usedActualInflation
                    ? <Badge color="teal"><span title={`Inflation rate calculated from your ${cfg.fields.costPrior} — not self-reported. More reliable.`} className="cursor-help">Actual</span></Badge>
                    : <Badge color="slate"><span title={`Based on the self-reported ${cfg.fields.costInflation} you entered. Add ${cfg.fields.costPrior} for a verified rate.`} className="cursor-help">Estimated</span></Badge>
                  },
                ])}
                emptyMessage={`No cost data — populate ${cfg.fields.cost} and ${cfg.fields.costInflation} fields.`}
              />
              <NarrativeBox>
                {cfg.narrative.benchmarkNarrative(p2.portRecoveryPct || 0) + ' '}
                {p2.totalAbsorbed > 0
                  ? `${fNAbs(p2.totalAbsorbed)}/month absorbed into margin and not priced through. `
                  : 'No cost absorption detected. '}
                {p2.results.some(r => r.fxAbsorbed > 0)
                  ? `FX-linked exposure identified on ${p2.results.filter(r => r.fxAbsorbed > 0).length} ${cfg.unitPlural} — priority for FX-indexed pricing clauses.`
                  : 'No FX exposure data captured — populate FX Exposure % to decompose absorbed inflation.'}
              </NarrativeBox>
            </PillarCard>
            </div>

            <div className="source-line">
              <span><strong>Source:</strong> vendor invoice ledger, FX-adjusted to NGN</span>
              <span><strong>Severity:</strong> normalised YoY price change, capped at 33%</span>
            </div>

            <div className="commentary">
              <div className="commentary-label">Analyst commentary</div>
              <div className="commentary-text">
                Recovery rate at {(p2.portRecoveryPct || 0).toFixed(1)}% indicates {p2.portRecoveryPct < 40 ? 'significant cost absorption requiring immediate pricing intervention' : p2.portRecoveryPct < 70 ? 'opportunity to improve cost pass-through mechanism' : 'strong cost management discipline'}. {p2.totalAbsorbed > 0 ? `${fNAbs(p2.totalAbsorbed)}/month exposure represents key margin pressure point requiring repricing strategy.` : 'Cost shocks well-managed through current pricing.'} {p2.results.some(r => r.fxAbsorbed > 0) ? `FX-indexed pricing clauses recommended to mitigate foreign exchange volatility.` : ''}
              </div>
            </div>

            <div className="doc-footer">
              <span>MarginCOS · P2 Cost Pass-Through</span>
              <span>Rev {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '·').replace(/\b(\d)\b/g, '0$1')}</span>
            </div>
          </>
        )}
    </>
  );
}

CostPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
