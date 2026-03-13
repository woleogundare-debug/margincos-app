import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useAnalysis } from '../../hooks/useAnalysis';
import { fNAbs, fN } from '../../lib/formatters';

export default function PricingPage() {
  const { user } = useAuth();
  const { activePeriod, skuRows, tradeInvestment } = usePortfolio(user?.id);
  const { results, running, ranAt, run, hasResults } = useAnalysis(skuRows, tradeInvestment);
  const p1 = results?.p1;

  const ragStatus = !hasResults ? 'grey'
    : p1?.floorBreaches?.length > 0 ? 'red'
    : p1?.totalGain > 0 ? 'amber'
    : 'green';

  return (
    <>
      <Head><title>Pricing Intelligence — MarginCOS</title></Head>
      <DashboardLayout title="Pricing Intelligence" activePeriod={activePeriod}>

        {!hasResults && (
          <EmptyState icon="🏷️" title="Run analysis to see pricing results"
            description="Enter SKU data in Portfolio Manager and run the analysis engine."
            action={
              <Button variant="navy" onClick={run} loading={running}>
                {running ? 'Analysing…' : 'Run Analysis'}
              </Button>
            } />
        )}

        {hasResults && p1 && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <KpiTile label="P1 Repricing Opportunity" value={fN(p1.totalGain)} accent="teal"
                pill="vs. current pricing" />
              <KpiTile label="WTP Headroom" value={fNAbs(p1.totalWTPGap)} accent="teal"
                pill="Revenue left on table" />
              <KpiTile label="Price Realisation"
                value={(p1.priceRealisation || 0).toFixed(1) + '%'}
                pill={p1.priceRealisation < 90 ? '⚠ Below 90% — pricing gap' : '✓ Strong realisation'}
                accent={p1.priceRealisation < 90 ? 'amber' : 'teal'} />
            </div>

            {/* Margin Floor Breaches */}
            {p1.floorBreaches?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
                <p className="text-sm font-bold text-red-800 mb-1">
                  ⚠ {p1.floorBreaches.length} SKU{p1.floorBreaches.length > 1 ? 's' : ''} below margin floor
                </p>
                <p className="text-xs text-red-600">
                  {p1.floorBreaches.slice(0, 3).map(s => s.sku).join(', ')}
                  {p1.floorBreaches.length > 3 ? ` +${p1.floorBreaches.length - 3} more` : ''}
                  {' — current gross margin below defined minimum. Immediate pricing review required.'}
                </p>
              </div>
            )}

            {/* SKU Results */}
            <PillarCard
              title="SKU Pricing Analysis"
              subtitle="Repricing opportunity and competitor benchmarks by SKU"
              accentColor="#0D9488"
              ragStatus={ragStatus}>
              <AnalysisTable
                headers={['SKU', 'Category', 'RRP ₦', 'Gross Margin %', 'Competitor Gap', 'WTP Gap ₦/mo', 'Repricing Gain ₦/mo']}
                rows={p1.results.map(r => [
                  r.sku,
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
                emptyMessage="No pricing data — ensure RRP, COGS, and Volume are populated."
              />
              <NarrativeBox>
                {p1.totalGain > 0
                  ? `Portfolio pricing opportunity: ${fN(p1.totalGain)}/month. ${p1.results.filter(r => r.delta > 0).length} SKUs have positive repricing upside. ${p1.floorBreaches?.length || 0} SKUs are below their defined margin floor.`
                  : `Portfolio pricing is stable. Price realisation: ${(p1.priceRealisation || 0).toFixed(1)}%. ${p1.results.filter(r => r.wtp > 0.03).length} SKUs have WTP headroom not yet captured.`
                }
              </NarrativeBox>
            </PillarCard>
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
