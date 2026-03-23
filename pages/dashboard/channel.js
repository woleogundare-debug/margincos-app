import { useState, useMemo } from 'react';
import Head from 'next/head';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState, PillarGate } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { fNAbs, CHANNEL_LABELS } from '../../lib/formatters';
import { computeDeltas } from '../../lib/engine/delta';
import { TIER_ACCESS } from '../../lib/constants';

export default function ChannelPage() {
  const { tier } = useAuth();
  const { activePeriod, results, running, run, hasResults, chronologicalDelta } = useAnalysisContext();
  const p3 = results?.p3;
  const deltas = useMemo(() => {
    if (!chronologicalDelta) return null;
    return computeDeltas(chronologicalDelta.laterResults, chronologicalDelta.earlierResults);
  }, [chronologicalDelta]);

  const [tableExpanded, setTableExpanded] = useState(false);

  // Tier gate — all hooks called above, safe to early-return here
  const access = TIER_ACCESS[tier] || TIER_ACCESS.essentials;
  if (!access.pillars.includes('channel')) {
    return (
      <>
        <Head><title>Channel Economics | MarginCOS</title></Head>
        <DashboardLayout title="Channel Economics" activePeriod={activePeriod}>
          <PillarGate requiredTier="Professional" pillarName="Channel Economics" />
        </DashboardLayout>
      </>
    );
  }

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <KpiTile label="Channels Active"
                value={p3.channelResults?.length || 0}
                pill="Routes to market" accent="amber" />
              <KpiTile label="Distributor Exposure"
                value={fNAbs(p3.totalDistExposure)}
                pill="Revenue in distributor margin" accent="amber"
                delta={deltas?.p3?.totalDistExposure ? {
                  label: fNAbs(Math.abs(deltas.p3.totalDistExposure.value)),
                  direction: deltas.p3.totalDistExposure.direction,
                  isPositive: false,
                } : null} />
              <KpiTile label="Weak Channels"
                value={weakChannels.length}
                pill={weakChannels.length > 0 ? 'Below 15% contribution' : 'All channels healthy'}
                accent={weakChannels.length > 0 ? 'red' : 'teal'} />
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
                  {ragStatus === 'green' ? 'Healthy' : ragStatus === 'amber' ? 'Watch' : ragStatus === 'red' ? 'At Risk' : 'Pending'}
                </span>
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {p3.channelResults?.length > 0
                    ? `${p3.channelResults.length} active channels. ${weakChannels.length > 0 ? weakChannels.length + ' below 15% contribution.' : 'All above threshold.'}`
                    : 'No channel data yet.'}
                </p>
              </div>
            </div>

            {/* Mobile collapsible table */}
            <div className="md:hidden mb-4">
              <button onClick={() => setTableExpanded(!tableExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-semibold"
                style={{ color: '#1B2A4A' }}>
                <span>View Channel Detail ({p3.channelResults?.length || 0} channels)</span>
                <span className="text-gray-400">{tableExpanded ? '▲' : '▼'}</span>
              </button>
              {tableExpanded && (
                <div className="mt-2 overflow-x-auto scrollbar-hide rounded-xl border border-gray-100 bg-white"
                  style={{ WebkitOverflowScrolling: 'touch' }}>
                  <AnalysisTable
                    headers={['Channel', 'Revenue ₦/mo', 'Cont. %', 'Status']}
                    rows={(p3.channelResults || []).map(c => [
                      CHANNEL_LABELS[c.channel] || c.channel,
                      fNAbs(c.rev),
                      c.contPct.toFixed(1) + '%',
                      { content: c.contPct < 15
                        ? <Badge color="red">Review</Badge>
                        : <Badge color="green">Healthy</Badge>
                      },
                    ])}
                    emptyMessage="No channel data."
                  />
                </div>
              )}
            </div>

            {/* Desktop: Channel summary */}
            <div className="hidden md:block">
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
            </div>

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
  if (auth.redirect) return { redirect: { destination: '/login', permanent: false } };
  return { props: {} };
}
