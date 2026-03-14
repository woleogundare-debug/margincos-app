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
import { CHANNEL_LABELS } from '../../lib/formatters';

export default function ChannelPage() {
  const { user } = useAuth();
  const { activePeriod, skuRows, tradeInvestment } = usePortfolio(user?.id);
  const { results, running, run, hasResults } = useAnalysis(skuRows, tradeInvestment);
  const p3 = results?.p3;

  const weakChannels = p3?.channelResults?.filter(c => c.contPct < 15 && c.rev > 0) || [];

  const ragStatus = !hasResults ? 'grey'
    : weakChannels.length > 0 ? 'amber'
    : 'green';

  return (
    <>
      <Head><title>Channel Economics | MarginCOS</title></Head>
      <DashboardLayout title="Channel Economics" activePeriod={activePeriod}>

        {!hasResults && (
          <EmptyState icon="🏪" title="Run analysis to see channel economics"
            description="Requires primary channel, distributor margin, and monthly volume for each SKU."
            action={<Button variant="navy" onClick={run} loading={running}>{running ? 'Analysing…' : 'Run Analysis'}</Button>} />
        )}

        {hasResults && p3 && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <KpiTile label="Channels Active"
                value={p3.channelResults?.length || 0}
                pill="Routes to market" accent="amber" />
              <KpiTile label="Distributor Exposure"
                value={fNAbs(p3.totalDistExposure)}
                pill="Revenue in distributor margin" accent="amber" />
              <KpiTile label="Weak Channels"
                value={weakChannels.length}
                pill={weakChannels.length > 0 ? 'Below 15% contribution' : 'All channels healthy'}
                accent={weakChannels.length > 0 ? 'red' : 'teal'} />
            </div>

            {/* Channel summary */}
            <PillarCard
              title="Channel Contribution Analysis"
              subtitle="Net contribution margin by primary route to market"
              accentColor="#D97706"
              ragStatus={ragStatus}>
              <AnalysisTable
                headers={['Channel', 'Revenue ₦/mo', 'Contribution ₦/mo', 'Cont. Margin %', 'SKUs', 'Status']}
                rows={(p3.channelResults || []).map(c => [
                  CHANNEL_LABELS[c.channel] || c.channel,
                  fNAbs(c.rev),
                  fNAbs(c.contMargin),
                  { content: (
                    <Badge color={c.contPct >= 20 ? 'green' : c.contPct >= 10 ? 'amber' : 'red'}>
                      {c.contPct.toFixed(1)}%
                    </Badge>
                  )},
                  c.skuCount,
                  { content: c.contPct < 15
                    ? <Badge color="red">⚠ Review</Badge>
                    : <Badge color="green">✓ Healthy</Badge>
                  },
                ])}
                emptyMessage="No channel data — set primary channel and distributor margin on each SKU."
              />
              <NarrativeBox>
                {p3.channelResults?.length > 0
                  ? `${p3.channelResults.length} active channels. Top channel by revenue: ${CHANNEL_LABELS[p3.channelResults[0]?.channel] || p3.channelResults[0]?.channel}. `
                  : 'No channel data yet. '}
                {weakChannels.length > 0
                  ? `${weakChannels.length} channel${weakChannels.length > 1 ? 's' : ''} below 15% contribution margin — recommend distributor margin renegotiation or volume rebalancing.`
                  : 'All channels above minimum contribution threshold.'}
                {p3.hasLogisticsCost && ' Logistics costs deducted in contribution calculation.'}
                {p3.hasRebate && ' Distributor rebates deducted from net price.'}
              </NarrativeBox>
            </PillarCard>

            {/* Distributor view — if data present */}
            {p3.hasDistributorName && (
              <PillarCard
                title="Distributor Breakdown"
                subtitle="Contribution margin grouped by named distributor"
                accentColor="#D97706"
                ragStatus={null}
                className="mt-6">
                <AnalysisTable
                  headers={['Distributor', 'Revenue ₦/mo', 'Contribution ₦/mo', 'SKUs']}
                  rows={Object.entries(p3.distributorMap).sort((a, b) => b[1].rev - a[1].rev).map(([name, d]) => [
                    name,
                    fNAbs(d.rev),
                    { content: <span className={d.contMargin < 0 ? 'text-red-600 font-semibold' : ''}>{fNAbs(d.contMargin)}</span> },
                    d.skuCount,
                  ])}
                  emptyMessage=""
                />
                <NarrativeBox>
                  Full distributor performance scoring (including credit days, rebates, and working capital costs) is available in the M4 Distributor Scorecard module under Enterprise.
                </NarrativeBox>
              </PillarCard>
            )}
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
