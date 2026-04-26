import { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { fNAbs, fN } from '../../lib/formatters';
import { computeDeltas } from '../../lib/engine/delta';
import { getSectorConfig } from '../../lib/sectorConfig';
import P1RepricingChart from '../../components/charts/P1RepricingChart';
import ExportButton from '../../components/ExportButton';
import { exportP1PricingGap } from '../../lib/exportToExcel';

export default function PricingPage() {
  const { tier } = useAuth();
  const { activePeriod, activeResults: results, running, ranAt, run, activeHasResults: hasResults, chronologicalDelta, isConsolidated } = useAnalysisContext();
  const cfg = getSectorConfig(activePeriod?.vertical);
  const p1 = results?.p1;
  const deltas = useMemo(() => {
    if (!chronologicalDelta) return null;
    return computeDeltas(chronologicalDelta.laterResults, chronologicalDelta.earlierResults);
  }, [chronologicalDelta]);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [sortCol, setSortCol] = useState('delta');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };
  const si = (col) => sortCol === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

  const sorted = [...(p1?.results || [])].sort((a, b) => {
    const av = a[sortCol] ?? 0;
    const bv = b[sortCol] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const ragStatus = !hasResults ? 'grey'
    : p1?.floorBreaches?.length > 0 ? 'red'
    : p1?.totalGain > 0 ? 'amber'
    : 'green';

  return (
    <>
      <Head><title>Pricing Intelligence | MarginCOS</title></Head>
        {!hasResults && (
          <EmptyState icon="🏷️" title="Run analysis to see pricing results"
            description={cfg.narrative.emptyState}
            action={
              <Button variant="navy" onClick={run} loading={running}>
                {running ? 'Analysing…' : 'Run Analysis'}
              </Button>
            } />
        )}

        {hasResults && p1 && (
          <>
            <div className="doc-head">
              <div>
                <div className="doc-meta"><span className="page-pillar-code">P1</span>Pricing pillar</div>
                <h1 className="doc-title">Pricing</h1>
                <div className="doc-period">{activePeriod?.label}</div>
              </div>
              <div className="doc-actions"></div>
            </div>

            {p1 && (
              <div className="insight">
                <div className="insight-label">Opportunity</div>
                <div className="insight-body">
                  <div className="insight-text">
                    {p1.totalGain > 0
                      ? <><em>{fN(p1.totalGain)}/month</em> repricing opportunity available across portfolio</>
                      : <>WTP headroom of <em>{fNAbs(p1.totalWTPGap)}</em> not yet captured</>
                    }
                  </div>
                </div>
              </div>
            )}

            <div className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 1</div>
                <div className="exhibit-title">Pricing health</div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <KpiTile label="P1 Repricing Opportunity" value={fN(p1.totalGain)} accent="teal"
                pill="vs. current pricing"
                delta={deltas?.p1?.totalGain ? {
                  label: fNAbs(Math.abs(deltas.p1.totalGain.value)),
                  direction: deltas.p1.totalGain.direction,
                  isPositive: true,
                } : null} />
              <KpiTile label="WTP Headroom" value={fNAbs(p1.totalWTPGap)} accent="teal"
                pill="Revenue left on table"
                delta={deltas?.p1?.totalWTPGap ? {
                  label: fNAbs(Math.abs(deltas.p1.totalWTPGap.value)),
                  direction: deltas.p1.totalWTPGap.direction,
                  isPositive: true,
                } : null} />
              <KpiTile label="Price Realisation"
                value={(p1.priceRealisation || 0).toFixed(1) + '%'}
                pill={p1.priceRealisation < 90 ? '⚠ Below 90% — pricing gap' : '✓ Strong realisation'}
                accent={p1.priceRealisation < 90 ? 'amber' : 'teal'}
                delta={deltas?.p1?.priceRealisation ? {
                  label: Math.abs(deltas.p1.priceRealisation.value).toFixed(1) + 'pp',
                  direction: deltas.p1.priceRealisation.direction,
                  isPositive: true,
                } : null} />
            </div>

            {/* Margin Floor Breaches */}
            {p1.floorBreaches?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
                <p className="text-sm font-bold text-red-800 mb-1">
                  ⚠ {cfg.narrative.p1FloorBreach(p1.floorBreaches.length)}
                </p>
                <p className="text-xs text-red-600">
                  {p1.floorBreaches.slice(0, 3).map(s => s.sku).join(', ')}
                  {p1.floorBreaches.length > 3 ? ` +${p1.floorBreaches.length - 3} more` : ''}
                  {' — current gross margin below defined minimum. Immediate pricing review required.'}
                </p>
              </div>
            )}

            {/* Repricing Chart */}
            <P1RepricingChart results={p1.results} cfg={cfg} />

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
                  {ragStatus === 'green' ? 'Managed' : ragStatus === 'amber' ? 'Opportunity' : ragStatus === 'red' ? 'At Risk' : 'Pending'}
                </span>
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {p1.totalGain > 0
                    ? `Portfolio pricing opportunity: ${fN(p1.totalGain)}/month across ${p1.results.filter(r => r.delta > 0).length} ${cfg.unitPlural}.`
                    : `Portfolio pricing is stable. Price realisation: ${(p1.priceRealisation || 0).toFixed(1)}%.`
                  }
                </p>
              </div>
            </div>

            {/* Mobile collapsible table */}
            <div className="md:hidden mb-4">
              <button onClick={() => setTableExpanded(!tableExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-semibold"
                style={{ color: '#1B2A4A' }}>
                <span>View {cfg.unit} detail ({p1.results?.length || 0} {cfg.unitPlural})</span>
                <span className="text-gray-400">{tableExpanded ? '▲' : '▼'}</span>
              </button>
              {tableExpanded && (
                <div className="mt-2 overflow-x-auto scrollbar-hide rounded-xl border border-gray-100 bg-white"
                  style={{ WebkitOverflowScrolling: 'touch' }}>
                  <AnalysisTable
                    headers={[cfg.unitId, ...(isConsolidated ? ['Division'] : []), cfg.fields.priceUnit, 'Margin %', cfg.fields.compGap, cfg.fields.gainPerMonth]}
                    rows={sorted.map(r => [
                      r.sku,
                      ...(isConsolidated ? [r._division || '—'] : []),
                      fNAbs(r.price),
                      r.marginPct.toFixed(1) + '%',
                      r.compGap !== null ? (r.compGap > 0 ? '+' : '') + r.compGap.toFixed(1) + '%' : '—',
                      { content: <span className={r.delta > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500'}>{fN(r.delta)}</span> },
                    ])}
                    emptyMessage="No pricing data."
                  />
                </div>
              )}
            </div>

            <div className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 2</div>
                <div className="exhibit-title">{cfg.unitName} pricing detail</div>
                <div className="exhibit-sub">{cfg.unitPlural} with WTP headroom above current RRP, ranked by monthly upside</div>
              </div>
            </div>

            {/* Desktop: SKU Results (unchanged) */}
            <div className="hidden md:flex justify-end mb-2">
              <ExportButton
                show={tier === 'professional' || tier === 'enterprise'}
                onExport={() => exportP1PricingGap(sorted, activePeriod?.label, cfg.unitId)}
              />
            </div>
            <div className="hidden md:block">
            <PillarCard
              title={`${cfg.unitName} Pricing Analysis`}
              subtitle={`Repricing opportunity and competitor benchmarks by ${cfg.unit}`}
              accentColor="#0D9488"
              ragStatus={ragStatus}>
              <AnalysisTable
                headers={[
                  cfg.unitId, ...(isConsolidated ? ['Division'] : []), cfg.fields.classification, cfg.fields.priceUnit,
                  <span key="marginPct" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('marginPct')}>Gross Margin %{si('marginPct')}</span>,
                  'Competitor Gap',
                  <span key="wtpGap" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('wtpGap')}>WTP Gap /mo{si('wtpGap')}</span>,
                  <span key="delta" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('delta')}>Repricing Gain /mo{si('delta')}</span>,
                ]}
                rows={sorted.map(r => [
                  r.sku,
                  ...(isConsolidated ? [r._division || '—'] : []),
                  r.category,
                  fNAbs(r.price),
                  { content: (
                    <span className={r.floorBreach ? 'text-red-600 font-bold' : ''}>
                      {r.marginPct.toFixed(1)}%
                      {r.floorBreach && <span className="ml-1 text-red-500">⚠</span>}
                    </span>
                  )},
                  { content: r.compGap !== null
                    ? <Badge color={r.compGap > 5 ? 'amber' : r.compGap < -5 ? 'green' : 'slate'}>
                        {r.compGap > 0 ? '+' : ''}{r.compGap.toFixed(1)}%
                      </Badge>
                    : <span className="text-slate-300">—</span>
                  },
                  r.wtpGap > 0 ? fNAbs(r.wtpGap) : '—',
                  { content: <span className={r.delta > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500'}>{fN(r.delta)}</span> },
                ])}
                emptyMessage={`No pricing data — ensure ${cfg.fields.price}, ${cfg.fields.cost}, and Volume are populated.`}
              />
              <NarrativeBox>
                {p1.totalGain > 0
                  ? `Portfolio pricing opportunity: ${fN(p1.totalGain)}/month. ${p1.results.filter(r => r.delta > 0).length} ${cfg.unitPlural} have positive repricing upside. ${p1.floorBreaches?.length || 0} ${cfg.unitPlural} are below their defined margin floor.`
                  : `Portfolio pricing is stable. Price realisation: ${(p1.priceRealisation || 0).toFixed(1)}%. ${p1.results.filter(r => r.wtp > 0.03).length} ${cfg.unitPlural} have WTP headroom not yet captured.`
                }
              </NarrativeBox>
            </PillarCard>
            </div>

            <div className="source-line">
              <span><strong>Source:</strong> elasticity model · 18-mo regression, retailer scanner data, NGN deflator-adjusted</span>
              <span><strong>Confidence:</strong> regression R² × distribution of price-test results</span>
            </div>

            <div className="commentary">
              <div className="commentary-label">Analyst commentary</div>
              <div className="commentary-text">
                {p1.totalGain > 0
                  ? `Current pricing strategy leaves ${fN(p1.totalGain)}/month on the table. Recommend repricing review for ${p1.results.filter(r => r.delta > 0).length} ${cfg.unitPlural} with positive upside. ${p1.floorBreaches?.length > 0 ? `Priority: ${p1.floorBreaches.length} ${cfg.unitPlural} below margin floor require immediate attention.` : ''}`
                  : `Pricing execution is strong at ${(p1.priceRealisation || 0).toFixed(1)}% realisation. Opportunity exists to capture WTP on ${p1.results.filter(r => r.wtp > 0.03).length} ${cfg.unitPlural} with available headroom.`
                }
              </div>
            </div>

            <div className="doc-footer">
              <span>MarginCOS · P1 Pricing</span>
              <span>Rev {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '·').replace(/\b(\d)\b/g, '0$1')}</span>
            </div>
          </>
        )}
    </>
  );
}

PricingPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
