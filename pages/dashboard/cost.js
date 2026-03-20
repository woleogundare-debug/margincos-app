import { useState, useMemo } from 'react';
import Head from 'next/head';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { fNAbs } from '../../lib/formatters';
import { computeDeltas } from '../../lib/engine/delta';

export default function CostPage() {
  const { activePeriod, results, running, run, hasResults, comparisonResults } = useAnalysisContext();
  const p2 = results?.p2;
  const deltas = useMemo(() => computeDeltas(results, comparisonResults), [results, comparisonResults]);

  const [tableExpanded, setTableExpanded] = useState(false);

  const ragStatus = !hasResults ? 'grey'
    : p2?.avgAbsorbedPct > 60 ? 'red'
    : p2?.avgAbsorbedPct > 30 ? 'amber'
    : 'green';

  return (
    <>
      <Head><title>Cost Pass-Through | MarginCOS</title></Head>
      <DashboardLayout title="Cost Pass-Through" activePeriod={activePeriod}>

        {!hasResults && (
          <EmptyState icon="📉" title="Run analysis to see cost absorption results"
            description="Requires COGS, inflation rate, and pass-through rate for each SKU."
            action={<Button variant="navy" onClick={run} loading={running}>{running ? 'Analysing…' : 'Run Analysis'}</Button>} />
        )}

        {hasResults && p2 && (
          <>
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
                  ? `⚠ Critical — BUA Foods benchmark: 75%`
                  : p2.portRecoveryPct < 70 ? '▲ Below benchmark (75%)' : '✓ Above benchmark'}
                accent={p2.portRecoveryPct < 40 ? 'red' : p2.portRecoveryPct < 70 ? 'amber' : 'teal'}
                delta={deltas?.p2?.portRecoveryPct ? {
                  label: Math.abs(deltas.p2.portRecoveryPct.value).toFixed(1) + 'pp',
                  direction: deltas.p2.portRecoveryPct.direction,
                  isPositive: true,
                } : null} />
            </div>

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
                <span>View SKU Detail ({p2.results?.length || 0} SKUs)</span>
                <span className="text-gray-400">{tableExpanded ? '▲' : '▼'}</span>
              </button>
              {tableExpanded && (
                <div className="mt-2 overflow-x-auto scrollbar-hide rounded-xl border border-gray-100 bg-white"
                  style={{ WebkitOverflowScrolling: 'touch' }}>
                  <AnalysisTable
                    headers={['SKU', 'Shock ₦/mo', 'Pass-Through', 'Absorbed ₦/mo']}
                    rows={p2.results.map(r => [
                      r.sku,
                      fNAbs(r.shock),
                      (r.pt * 100).toFixed(0) + '%',
                      { content: <span className="text-red-600 font-semibold">{fNAbs(r.absorbed)}</span> },
                    ])}
                    emptyMessage="No cost data."
                  />
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
            <PillarCard
              title="Cost Absorption by SKU"
              subtitle="Inflation shock, pass-through, and absorbed exposure per SKU"
              accentColor="#DC2626"
              ragStatus={ragStatus}>
              <AnalysisTable
                headers={['SKU', 'Category', 'Cost Shock ₦/mo', 'Pass-Through %', 'Absorbed ₦/mo', 'FX-Linked', <span>Source <span title="How the inflation rate was determined for this SKU" className="ml-0.5 text-gray-400 cursor-help">?</span></span>]}
                rows={p2.results.map(r => [
                  r.sku, r.category,
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
                    ? <Badge color="teal"><span title="Inflation rate calculated from your Prior Period COGS — not self-reported. More reliable." className="cursor-help">Actual</span></Badge>
                    : <Badge color="slate"><span title="Based on the self-reported COGS Inflation Rate % you entered. Add Prior Period COGS for a verified rate." className="cursor-help">Estimated</span></Badge>
                  },
                ])}
                emptyMessage="No cost data — populate COGS and COGS inflation rate fields."
              />
              <NarrativeBox>
                {`Portfolio recovery rate: ${(p2.portRecoveryPct || 0).toFixed(1)}% — BUA Foods benchmark: 75%. `}
                {p2.totalAbsorbed > 0
                  ? `${fNAbs(p2.totalAbsorbed)}/month absorbed into margin and not priced through. `
                  : 'No cost absorption detected. '}
                {p2.results.some(r => r.fxAbsorbed > 0)
                  ? `FX-linked exposure identified on ${p2.results.filter(r => r.fxAbsorbed > 0).length} SKUs — priority for FX-indexed pricing clauses.`
                  : 'No FX exposure data captured — populate FX Exposure % to decompose absorbed inflation.'}
              </NarrativeBox>
            </PillarCard>
            </div>
          </>
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
