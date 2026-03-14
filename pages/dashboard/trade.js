import { useState } from 'react';
import Head from 'next/head';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useAnalysis } from '../../hooks/useAnalysis';
import { fNAbs, fN } from '../../lib/formatters';

export default function TradePage() {
  const { user } = useAuth();
  const { activePeriod, skuRows, tradeInvestment } = usePortfolio(user?.id);
  const { results, running, run, hasResults } = useAnalysis(skuRows, tradeInvestment);
  const p4 = results?.p4;

  const [tableExpanded, setTableExpanded] = useState(false);
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
            description="Requires promo depth % and promo lift % on SKUs with promotional activity."
            action={<Button variant="navy" onClick={run} loading={running}>{running ? 'Analysing…' : 'Run Analysis'}</Button>} />
        )}

        {hasResults && p4 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <KpiTile label="Promos Analysed" value={p4.results?.length || 0}
                pill="SKUs with promo data" accent="purple" />
              <KpiTile label="Net Promo Impact"
                value={fN(p4.totalPromoImpact)}
                pill={p4.totalPromoImpact >= 0 ? 'Net positive' : 'Net loss-making'}
                accent={p4.totalPromoImpact >= 0 ? 'teal' : 'red'} />
              <KpiTile label="Loss-Making Promos"
                value={lossCount}
                pill={lossCount > 0 ? 'Promo depth exceeds margin' : 'All promotions profitable'}
                accent={lossCount > 0 ? 'red' : 'teal'} />
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
                  {ragStatus === 'green' ? 'Profitable' : ragStatus === 'red' ? 'At Risk' : 'Pending'}
                </span>
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {p4.results?.length > 0
                    ? `${p4.results.length} promos analysed. Net impact: ${fN(p4.totalPromoImpact)}/month. ${lossCount > 0 ? lossCount + ' loss-making.' : 'All profitable.'}`
                    : 'No promotional data captured.'}
                </p>
              </div>
            </div>

            {/* Mobile collapsible table */}
            <div className="md:hidden mb-4">
              <button onClick={() => setTableExpanded(!tableExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-semibold"
                style={{ color: '#1B2A4A' }}>
                <span>View Promo Detail ({p4.results?.length || 0} SKUs)</span>
                <span className="text-gray-400">{tableExpanded ? '▲' : '▼'}</span>
              </button>
              {tableExpanded && (
                <div className="mt-2 overflow-x-auto scrollbar-hide rounded-xl border border-gray-100 bg-white"
                  style={{ WebkitOverflowScrolling: 'touch' }}>
                  <AnalysisTable
                    headers={['SKU', 'Depth', 'Lift', 'Impact ₦/mo', 'Status']}
                    rows={(p4.results || []).sort((a, b) => a.netImpact - b.netImpact).map(r => [
                      r.sku,
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
            <div className="hidden md:block">
            <PillarCard
              title="Promotion Performance by SKU"
              subtitle="Net margin impact of current promotional activity"
              accentColor="#7C3AED"
              ragStatus={ragStatus}>
              {p4.results?.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No promotional data — populate Promo Depth % and Promo Lift % on relevant SKUs.
                </div>
              ) : (
                <AnalysisTable
                  headers={['SKU', 'Category', 'Promo Depth', 'Volume Lift', 'Break-even Lift', 'Net Impact ₦/mo', 'Status']}
                  rows={p4.results.sort((a, b) => a.netImpact - b.netImpact).map(r => [
                    r.sku, r.category,
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
                  ? `${p4.results.length} SKUs with promotional activity. Net portfolio promo impact: ${fN(p4.totalPromoImpact)}/month. `
                  : 'No promotional data captured. '}
                {lossCount > 0
                  ? `${lossCount} promotion${lossCount > 1 ? 's' : ''} are loss-making — actual volume lift does not justify discount depth. Recommend capping depth or increasing co-funded trade investment from distributors.`
                  : p4.results?.length > 0 ? 'All promotions generating positive margin contribution.' : ''}
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
