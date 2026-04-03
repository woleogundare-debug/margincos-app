import { useState, useMemo } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState, PillarGate } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { fNAbs, fN } from '../../lib/formatters';
import { computeDeltas } from '../../lib/engine/delta';
import { getSectorConfig } from '../../lib/sectorConfig';
import P4PromoChart from '../../components/charts/P4PromoChart';
import { TIER_ACCESS } from '../../lib/constants';
import ExportButton from '../../components/ExportButton';
import { exportP4TradeExecution } from '../../lib/exportToExcel';

export default function TradePage() {
  const { tier, loading: authLoading, profileLoaded } = useAuth();
  const { activePeriod, activeResults: results, running, run, activeHasResults: hasResults, chronologicalDelta, isConsolidated } = useAnalysisContext();
  const cfg = getSectorConfig(activePeriod?.vertical);
  const p4 = results?.p4;
  const deltas = useMemo(() => {
    if (!chronologicalDelta) return null;
    return computeDeltas(chronologicalDelta.laterResults, chronologicalDelta.earlierResults);
  }, [chronologicalDelta]);

  const [tableExpanded, setTableExpanded] = useState(false);
  const [sortCol, setSortCol] = useState('netImpact');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };
  const si = (col) => sortCol === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

  const sorted = [...(p4?.results || [])].sort((a, b) => {
    const av = a[sortCol] ?? 0;
    const bv = b[sortCol] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  // Tier gate — all hooks called above, safe to early-return here
  if (authLoading || !profileLoaded) {
    return (
      <>
        <Head><title>Trade Execution | MarginCOS</title></Head>
        <DashboardLayout title="Trade Execution" activePeriod={activePeriod}>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0D8F8F] border-t-transparent" />
          </div>
        </DashboardLayout>
      </>
    );
  }
  const access = TIER_ACCESS[tier] || TIER_ACCESS.essentials;
  if (!access.pillars.includes('trade')) {
    return (
      <>
        <Head><title>Trade Execution | MarginCOS</title></Head>
        <DashboardLayout title="Trade Execution" activePeriod={activePeriod}>
          <PillarGate requiredTier="Professional" pillarName="Trade Execution" />
        </DashboardLayout>
      </>
    );
  }

  const lossCount = p4?.results?.filter(r => !r.profitable).length || 0;
  const ragStatus = !hasResults ? 'grey'
    : lossCount > 0 ? 'red'
    : p4?.results?.length > 0 ? 'green'
    : 'grey';

  return (
    <>
      <Head><title>Trade Execution | MarginCOS</title></Head>
      <DashboardLayout title="Trade Execution" activePeriod={activePeriod}>

        {!hasResults && (
          <EmptyState icon="🎯" title="Run analysis to see trade execution results"
            description={cfg.narrative.p4EmptyState}
            action={<Button variant="navy" onClick={run} loading={running}>{running ? 'Analysing…' : 'Run Analysis'}</Button>} />
        )}

        {hasResults && p4 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <KpiTile label={`${cfg.narrative.p4ItemName.charAt(0).toUpperCase() + cfg.narrative.p4ItemName.slice(1)}s Analysed`} value={p4.results?.length || 0}
                pill={`${cfg.unitPlural} with ${cfg.narrative.p4Activity}`} accent="purple" />
              <KpiTile label={`Net ${cfg.narrative.p4ItemName.charAt(0).toUpperCase() + cfg.narrative.p4ItemName.slice(1)} Impact`}
                value={fN(p4.totalPromoImpact)}
                pill={p4.totalPromoImpact >= 0 ? 'Net positive' : 'Net loss-making'}
                accent={p4.totalPromoImpact >= 0 ? 'teal' : 'red'}
                delta={deltas?.p4?.totalPromoImpact ? {
                  label: fNAbs(Math.abs(deltas.p4.totalPromoImpact.value)),
                  direction: deltas.p4.totalPromoImpact.direction,
                  isPositive: true,
                } : null} />
              <KpiTile label={`Loss-Making ${cfg.narrative.p4ItemName.charAt(0).toUpperCase() + cfg.narrative.p4ItemName.slice(1)}s`}
                value={lossCount}
                pill={lossCount > 0 ? `${cfg.narrative.p4ItemName.charAt(0).toUpperCase() + cfg.narrative.p4ItemName.slice(1)} depth exceeds margin` : cfg.narrative.p4AllProfitable}
                accent={lossCount > 0 ? 'red' : 'teal'} />
            </div>

            {/* P4 Net Impact Chart */}
            <P4PromoChart results={p4.results} cfg={cfg} />

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
                  {ragStatus === 'green' ? 'Profitable' : ragStatus === 'red' ? 'At Risk' : 'Pending'}
                </span>
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {p4.results?.length > 0
                    ? `${p4.results.length} ${cfg.narrative.p4ItemName}s analysed. Net impact: ${fN(p4.totalPromoImpact)}/month. ${lossCount > 0 ? lossCount + ' loss-making.' : 'All profitable.'}`
                    : cfg.narrative.p4NoData}
                </p>
              </div>
            </div>

            {/* Mobile collapsible table */}
            <div className="md:hidden mb-4">
              <button onClick={() => setTableExpanded(!tableExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-semibold"
                style={{ color: '#1B2A4A' }}>
                <span>View Promo Detail ({p4.results?.length || 0} {cfg.unitPlural})</span>
                <span className="text-gray-400">{tableExpanded ? '▲' : '▼'}</span>
              </button>
              {tableExpanded && (
                <div className="mt-2 overflow-x-auto scrollbar-hide rounded-xl border border-gray-100 bg-white"
                  style={{ WebkitOverflowScrolling: 'touch' }}>
                  <AnalysisTable
                    headers={[cfg.unitId, ...(isConsolidated ? ['Division'] : []), cfg.fields.depth, cfg.fields.lift, cfg.fields.impact, cfg.fields.status]}
                    rows={sorted.map(r => [
                      r.sku,
                      ...(isConsolidated ? [r._division || '—'] : []),
                      (r.depth * 100).toFixed(1) + '%',
                      (r.lift * 100).toFixed(1) + '%',
                      { content: <span className={r.netImpact >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{fN(r.netImpact)}</span> },
                      { content: r.profitable ? <Badge color="green">OK</Badge> : <Badge color="red">Loss</Badge> },
                    ])}
                    emptyMessage="No promo data."
                  />
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:flex justify-end mb-2">
              <ExportButton
                show={tier === 'professional' || tier === 'enterprise'}
                onExport={() => exportP4TradeExecution(sorted, activePeriod?.label, cfg.unitId)}
              />
            </div>
            <div className="hidden md:block">
            <PillarCard
              title={`Promotion Performance by ${cfg.unitName}`}
              subtitle="Net margin impact of current promotional activity"
              accentColor="#7C3AED"
              ragStatus={ragStatus}>
              {p4.results?.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  {cfg.narrative.p4NoData} Populate {cfg.fields.promoDepth} and {cfg.fields.promoLift} on relevant {cfg.unitPlural}.
                </div>
              ) : (
                <AnalysisTable
                  headers={[
                    cfg.unitId, ...(isConsolidated ? ['Division'] : []), cfg.fields.classification,
                    <span key="depth" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('depth')}>{cfg.fields.promoDepth.replace(' (%)', '')}{si('depth')}</span>,
                    <span key="lift" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('lift')}>Volume Lift{si('lift')}</span>,
                    'Break-even Lift',
                    <span key="netImpact" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('netImpact')}>Net Impact /mo{si('netImpact')}</span>,
                    'Status',
                  ]}
                  rows={sorted.map(r => [
                    r.sku,
                    ...(isConsolidated ? [r._division || '—'] : []),
                    r.category,
                    (r.depth * 100).toFixed(1) + '%',
                    (r.lift * 100).toFixed(1) + '%',
                    r.bevLift !== null ? (r.bevLift * 100).toFixed(1) + '%' : '—',
                    { content: <span className={r.netImpact >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{fN(r.netImpact)}</span> },
                    { content: r.profitable
                        ? <Badge color="green">✓ Profitable</Badge>
                        : <Badge color="red">✗ Loss-Making</Badge>
                    },
                  ])}
                />
              )}
              <NarrativeBox>
                {p4.results?.length > 0
                  ? `${p4.results.length} ${cfg.unitPlural} with ${cfg.narrative.p4Activity}. Net portfolio ${cfg.narrative.p4ItemName} impact: ${fN(p4.totalPromoImpact)}/month. `
                  : `${cfg.narrative.p4NoData} `}
                {lossCount > 0
                  ? cfg.narrative.p4LossMaking(lossCount)
                  : p4.results?.length > 0 ? cfg.narrative.p4AllProfitable : ''}
              </NarrativeBox>
            </PillarCard>
            </div>
          </>
        )}
      </DashboardLayout>
    </>
  );
}
