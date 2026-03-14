import Head from 'next/head';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useAnalysis } from '../../hooks/useAnalysis';
import { fNAbs } from '../../lib/formatters';

export default function CostPage() {
  const { user } = useAuth();
  const { activePeriod, skuRows, tradeInvestment } = usePortfolio(user?.id);
  const { results, running, run, hasResults } = useAnalysis(skuRows, tradeInvestment);
  const p2 = results?.p2;

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
            <div className="grid grid-cols-3 gap-4 mb-6">
              <KpiTile label="Cost Absorbed" value={fNAbs(p2.totalAbsorbed)}
                pill="Not priced in — margin erosion" accent="red" />
              <KpiTile label="Total Cost Shock" value={fNAbs(p2.totalCostShock)}
                pill="Gross input cost increase" accent="red" />
              <KpiTile label="Portfolio Recovery Rate"
                value={(p2.portRecoveryPct || 0).toFixed(1) + '%'}
                pill={p2.portRecoveryPct < 40
                  ? `⚠ Critical — BUA Foods benchmark: 75%`
                  : p2.portRecoveryPct < 70 ? '▲ Below benchmark (75%)' : '✓ Above benchmark'}
                accent={p2.portRecoveryPct < 40 ? 'red' : p2.portRecoveryPct < 70 ? 'amber' : 'teal'} />
            </div>

            <PillarCard
              title="Cost Absorption by SKU"
              subtitle="Inflation shock, pass-through, and absorbed exposure per SKU"
              accentColor="#DC2626"
              ragStatus={ragStatus}>
              <AnalysisTable
                headers={['SKU', 'Category', 'Cost Shock ₦/mo', 'Pass-Through %', 'Absorbed ₦/mo', 'FX-Linked', 'Source']}
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
                  { content: <Badge color={r.usedActualInflation ? 'teal' : 'slate'}>
                      {r.usedActualInflation ? 'Actual' : 'Self-reported'}
                    </Badge>
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
