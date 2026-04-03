import { useState, useMemo } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PillarCard, KpiTile, AnalysisTable, NarrativeBox, EmptyState, PillarGate } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { fNAbs, CHANNEL_LABELS } from '../../lib/formatters';
import { computeDeltas } from '../../lib/engine/delta';
import { getSectorConfig } from '../../lib/sectorConfig';
import P3ChannelChart from '../../components/charts/P3ChannelChart';
import { TIER_ACCESS } from '../../lib/constants';
import ExportButton from '../../components/ExportButton';
import { exportP3ChannelEconomics } from '../../lib/exportToExcel';

export default function ChannelPage() {
  const { tier, loading: authLoading, profileLoaded } = useAuth();
  const { activePeriod, activeResults: results, running, run, activeHasResults: hasResults, chronologicalDelta } = useAnalysisContext();
  const cfg = getSectorConfig(activePeriod?.vertical);
  const p3 = results?.p3;
  const deltas = useMemo(() => {
    if (!chronologicalDelta) return null;
    return computeDeltas(chronologicalDelta.laterResults, chronologicalDelta.earlierResults);
  }, [chronologicalDelta]);

  const [tableExpanded, setTableExpanded] = useState(false);
  const [sortCol, setSortCol] = useState('rev');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };
  const si = (col) => sortCol === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

  const sorted = [...(p3?.channelResults || [])].sort((a, b) => {
    const av = a[sortCol] ?? 0;
    const bv = b[sortCol] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  // Keep access computed unconditionally so the single DashboardLayout
  // instance stays mounted throughout loading → avoids scroll-reset on content reveal.
  const access = TIER_ACCESS[tier] || TIER_ACCESS.essentials;

  const weakChannels = p3?.channelResults?.filter(c => c.contPct < 15 && c.rev > 0) || [];

  const ragStatus = !hasResults ? 'grey'
    : weakChannels.length > 0 ? 'amber'
    : 'green';

  return (
    <>
      <Head><title>Channel Economics | MarginCOS</title></Head>
        {(authLoading || !profileLoaded) && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0D8F8F] border-t-transparent" />
          </div>
        )}
        {!authLoading && profileLoaded && !access.pillars.includes('channel') && (
          <PillarGate requiredTier="Professional" pillarName="Channel Economics" />
        )}
        {!authLoading && profileLoaded && access.pillars.includes('channel') && !hasResults && (
          <EmptyState icon="🏪" title="Run analysis to see channel economics"
            description={cfg.narrative.p3EmptyState}
            action={<Button variant="navy" onClick={run} loading={running}>{running ? 'Analysing…' : 'Run Analysis'}</Button>} />
        )}

        {!authLoading && profileLoaded && access.pillars.includes('channel') && hasResults && p3 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <KpiTile label="Channels Active"
                value={p3.channelResults?.length || 0}
                pill="Routes to market" accent="amber" />
              <KpiTile label={cfg.fields.partnerExposure}
                value={fNAbs(p3.totalDistExposure)}
                pill={`Revenue in ${cfg.fields.partner.toLowerCase()} margin`} accent="amber"
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

            {/* Channel Revenue vs Contribution Chart */}
            <P3ChannelChart channelResults={p3.channelResults} />

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
                    headers={['Channel', 'Revenue /mo', 'Cont. %', 'Status']}
                    rows={sorted.map(c => [
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
            <div className="hidden md:flex justify-end mb-2">
              <ExportButton
                show={tier === 'professional' || tier === 'enterprise'}
                onExport={() => exportP3ChannelEconomics(sorted, activePeriod?.label)}
              />
            </div>
            <div className="hidden md:block">
            <PillarCard
              title="Channel Contribution Analysis"
              subtitle="Net contribution margin by primary route to market"
              accentColor="#D97706"
              ragStatus={ragStatus}>
              <AnalysisTable
                headers={[
                  'Channel',
                  <span key="rev" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('rev')}>Revenue /mo{si('rev')}</span>,
                  <span key="contMargin" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('contMargin')}>Contribution /mo{si('contMargin')}</span>,
                  <span key="contPct" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('contPct')}>Cont. Margin %{si('contPct')}</span>,
                  cfg.unitPlural, cfg.fields.status,
                ]}
                rows={sorted.map(c => [
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
                emptyMessage={`No channel data — set primary channel and ${cfg.fields.partner.toLowerCase()} margin on each ${cfg.unit}.`}
              />
              <NarrativeBox>
                {p3.channelResults?.length > 0
                  ? `${p3.channelResults.length} active channels. Top channel by revenue: ${CHANNEL_LABELS[p3.channelResults[0]?.channel] || p3.channelResults[0]?.channel}. `
                  : 'No channel data yet. '}
                {weakChannels.length > 0
                  ? `${weakChannels.length} channel${weakChannels.length > 1 ? 's' : ''} below 15% contribution margin — recommend ${cfg.fields.partner.toLowerCase()} margin renegotiation or volume rebalancing.`
                  : 'All channels above minimum contribution threshold.'}
                {p3.hasLogisticsCost && ' Logistics costs deducted in contribution calculation.'}
                {p3.hasRebate && ` ${cfg.fields.partner} rebates deducted from net price.`}
              </NarrativeBox>
            </PillarCard>
            </div>

            {/* Partner view — if data present */}
            {p3.hasDistributorName && (
              <PillarCard
                title={`${cfg.fields.partner} Breakdown`}
                subtitle={`Contribution margin grouped by named ${cfg.fields.partner.toLowerCase()}`}
                accentColor="#D97706"
                ragStatus={null}
                className="mt-6">
                <AnalysisTable
                  headers={[cfg.fields.partner, 'Revenue /mo', 'Contribution /mo', cfg.unitPlural]}
                  rows={Object.entries(p3.distributorMap).sort((a, b) => b[1].rev - a[1].rev).map(([name, d]) => [
                    name,
                    fNAbs(d.rev),
                    { content: <span className={d.contMargin < 0 ? 'text-red-600 font-semibold' : ''}>{fNAbs(d.contMargin)}</span> },
                    d.skuCount,
                  ])}
                  emptyMessage=""
                />
                <NarrativeBox>
                  Full {cfg.fields.partner.toLowerCase()} performance scoring (including credit days, rebates, and working capital costs) is available in the {cfg.m4.name} module under Enterprise.
                </NarrativeBox>
              </PillarCard>
            )}
          </>
        )}
    </>
  );
}

ChannelPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
