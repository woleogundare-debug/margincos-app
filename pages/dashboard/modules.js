import { useMemo } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ModuleGate } from '../../components/modules/ModuleGate';
import { KpiTile, PillarCard, AnalysisTable, NarrativeBox, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { computeDeltas } from '../../lib/engine/delta';
import M1QuadrantChart   from '../../components/charts/M1QuadrantChart';
import M2ScenarioChart   from '../../components/charts/M2ScenarioChart';
import M3TradeROIChart   from '../../components/charts/M3TradeROIChart';
import M4DistributorChart from '../../components/charts/M4DistributorChart';
import { fNAbs, fN } from '../../lib/formatters';
import { getSectorConfig } from '../../lib/sectorConfig';
import clsx from 'clsx';

// ── M1 ────────────────────────────────────────────────────────────────────
function M1Module({ results, deltas, cfg, isConsolidated }) {
  const m1 = results?.m1;
  if (!m1) return <div className="py-8 text-center text-sm text-slate-400">Run analysis to see {cfg.unit} classification.</div>;

  return (
    <>
      {/* Delta KPIs — period-over-period trend */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <KpiTile
          label="Margin at Stake"
          value={fNAbs(m1.marginAtStake)}
          pill={`/month from dilutive ${cfg.unitPlural}`}
          accent="red"
          delta={deltas?.m1?.marginAtStake && deltas.m1.marginAtStake.direction !== 'flat' && Math.abs(deltas.m1.marginAtStake.value) >= 1 ? {
            label: fNAbs(Math.abs(deltas.m1.marginAtStake.value)),
            direction: deltas.m1.marginAtStake.direction,
            isPositive: false,
          } : null}
        />
        <KpiTile
          label={`Dilutive ${cfg.unitPlural}`}
          value={m1.dilutiveCount}
          pill="below portfolio avg margin"
          accent="red"
          delta={deltas?.m1?.dilutiveCount && deltas.m1.dilutiveCount.direction !== 'flat' && Math.abs(deltas.m1.dilutiveCount.value) >= 1 ? {
            label: Math.abs(Math.round(deltas.m1.dilutiveCount.value)) + ' ' + cfg.unitPlural,
            direction: deltas.m1.dilutiveCount.direction,
            isPositive: false,
          } : null}
        />
      </div>

      {/* Classification breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-4 bg-emerald-50 rounded-xl">
          <p className="text-2xl font-black text-emerald-700">{m1.results.filter(s => s.classification.includes('Protect')).length}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-1">★ Protect</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <p className="text-2xl font-black text-blue-700">{m1.results.filter(s => s.classification.includes('Grow')).length}</p>
          <p className="text-xs font-semibold text-blue-600 mt-1">▲ Grow</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-xl">
          <p className="text-2xl font-black text-red-700">{m1.dilutiveCount}</p>
          <p className="text-xs font-semibold text-red-600 mt-1">Review / Reprice</p>
        </div>
      </div>
      <M1QuadrantChart results={m1.results} portfolioAvgMarginPct={m1.portfolioAvgMarginPct} cfg={cfg} />
      <AnalysisTable
        headers={[cfg.unitId, ...(isConsolidated ? ['Division'] : []), 'Category', 'Margin %', 'Rev Share %', 'vs. Avg', cfg.fields.classification, cfg.fields.action]}
        rows={m1.results.sort((a, b) => b.skuMarginPct - a.skuMarginPct).map(r => [
          r.sku,
          ...(isConsolidated ? [r._division || '—'] : []),
          r.category,
          r.skuMarginPct.toFixed(1) + '%',
          r.revShare.toFixed(1) + '%',
          { content: <span className={r.vsAvg >= 0 ? 'text-emerald-600' : 'text-red-500'}>{r.vsAvg >= 0 ? '+' : ''}{r.vsAvg.toFixed(1)}pp</span> },
          { content: <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: r.classBg, color: r.classColor }}>{r.classification}</span> },
          { content: <span className="text-xs text-slate-500">{r.action}</span> },
        ])}
      />
      <NarrativeBox>
        Portfolio average margin: {m1.portfolioAvgMarginPct.toFixed(1)}%. {m1.dilutiveCount} {m1.dilutiveCount !== 1 ? cfg.unitPlural : cfg.unit} below average — diluting portfolio margin by {fNAbs(Math.abs(m1.dilutiveMargin))}/month. Margin at stake from sub-par {cfg.unitPlural}: {fNAbs(m1.marginAtStake)}/month.
      </NarrativeBox>
    </>
  );
}

// ── M2 ────────────────────────────────────────────────────────────────────
function M2Module({ results, deltas, cfg }) {
  const m2 = results?.m2;
  if (!m2) return <div className="py-8 text-center text-sm text-slate-400">Run analysis to see inflation scenarios.</div>;

  return (
    <>
      {/* Delta KPI — worst-case scenario trend */}
      <div className="mb-4">
        <KpiTile
          label="Zero Recovery Impact"
          value={fN(m2.worstCase)}
          pill="worst-case margin /month at 0% cost recovery"
          accent="red"
          delta={deltas?.m2?.worstCase && deltas.m2.worstCase.direction !== 'flat' && Math.abs(deltas.m2.worstCase.value) >= 1 ? {
            label: fNAbs(Math.abs(deltas.m2.worstCase.value)),
            direction: deltas.m2.worstCase.direction,
            isPositive: false,
          } : null}
        />
      </div>
      <M2ScenarioChart scenarios={m2.scenarios} totalCogsBase={m2.totalCogsBase} />
      <AnalysisTable
        headers={['Recovery Rate', 'Cost Absorbed ₦/mo', 'Margin Change ₦/mo', 'Projected Margin %', 'Risk Level']}
        rows={m2.scenarios.map(s => [
          (s.recoveryRate * 100).toFixed(0) + '%',
          fNAbs(s.absorbed),
          { content: <span className={s.marginChange >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{fN(s.marginChange)}</span> },
          s.projMarginPct.toFixed(1) + '%',
          { content: <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s.riskBg, color: s.riskColor }}>{s.riskLevel}</span> },
        ])}
      />
      <NarrativeBox>
        At zero cost recovery (full absorption), margin impact is {fN(m2.worstCase)}/month. At 50% recovery: {fNAbs(m2.baseCase)}/month retained margin. Recommended: achieve minimum {cfg.benchmark.costRecoveryShort} recovery rate ({cfg.benchmark.costRecoveryLabel}) to remain above critical margin threshold.
      </NarrativeBox>
    </>
  );
}

// ── M3 ────────────────────────────────────────────────────────────────────
function M3Module({ results, deltas, cfg }) {
  const m3 = results?.m3;
  if (!m3?.hasData) return (
    <div className="py-8 text-center text-sm text-slate-400">
      No trade investment data. Populate the Trade Investment form in Portfolio Manager.
    </div>
  );
  return (
    <>
      {/* KpiTile replaces plain stat boxes for delta-tracked metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KpiTile
          label="Total Trade Spend"
          value={fNAbs(m3.totalSpend)}
          pill="/month"
          accent="navy"
          delta={deltas?.m3?.totalSpend && deltas.m3.totalSpend.direction !== 'flat' && Math.abs(deltas.m3.totalSpend.value) >= 1 ? {
            label: fNAbs(Math.abs(deltas.m3.totalSpend.value)),
            direction: deltas.m3.totalSpend.direction,
            isPositive: false,
          } : null}
        />
        <KpiTile
          label="Blended Portfolio ROI"
          value={m3.blendedROI != null ? m3.blendedROI.toFixed(2) + '×' : '—'}
          pill="across all trade channels"
          accent="teal"
          delta={deltas?.m3?.blendedROI && deltas.m3.blendedROI.direction !== 'flat' && Math.abs(deltas.m3.blendedROI.value) >= 0.01 ? {
            label: Math.abs(deltas.m3.blendedROI.value).toFixed(2) + '×',
            direction: deltas.m3.blendedROI.direction,
            isPositive: true,
          } : null}
        />
        {(() => {
          const bestIsPositive = (m3.bestChannel?.roi ?? -Infinity) > 0;
          return bestIsPositive ? (
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-black text-amber-600">{m3.bestChannel.channel}</p>
              <p className="text-xs font-semibold text-amber-700 mt-1">Best ROI Channel · {m3.bestChannel.roi.toFixed(2)}×</p>
            </div>
          ) : (
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-black text-red-500">—</p>
              <p className="text-xs font-semibold text-red-600 mt-1">All channels dilutive</p>
            </div>
          );
        })()}
      </div>
      <M3TradeROIChart results={m3.results} />
      <AnalysisTable
        headers={['Channel', 'Total Spend ₦', 'Net Contribution ₦', 'ROI', 'Spend Intensity', 'Status']}
        rows={m3.results.map(r => [
          r.channel,
          fNAbs(r.total),
          fNAbs(r.netRev),
          { content: r.roi != null ? <span className={r.roi >= 1 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{r.roi.toFixed(2)}×</span> : '—' },
          r.spendIntensity != null ? r.spendIntensity.toFixed(1) + '%' : '—',
          { content: <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: r.statusBg, color: r.statusColor }}>{r.status}</span> },
        ])}
      />
      <NarrativeBox>
        {m3.bestChannel && (m3.bestChannel.roi ?? -Infinity) > 0
          ? `Best performing channel: ${m3.bestChannel.channel} at ${m3.bestChannel.roi?.toFixed(2)}× ROI. `
          : m3.bestChannel
            ? `All channels are generating a sub-zero return on trade spend — no channel is currently ROI-positive. `
            : null}
        {m3.worstChannel && m3.worstChannel.channel !== m3.bestChannel?.channel
          && `Lowest ROI: ${m3.worstChannel.channel} — review spend reallocation opportunity. `}
        Total portfolio trade spend: {fNAbs(m3.totalSpend)}/month.
      </NarrativeBox>
    </>
  );
}

// ── M4 ────────────────────────────────────────────────────────────────────
function M4Module({ results, deltas, cfg }) {
  const m4 = results?.m4;
  if (!m4?.hasData) return (
    <div className="py-8 text-center text-sm text-slate-400">
      {cfg.narrative.m4EmptyState}
    </div>
  );
  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <p className="text-2xl font-black text-navy">{m4.totalDistributors}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">{cfg.fields.partner}s Scored</p>
        </div>
        <div className="text-center p-4 bg-teal-50 rounded-xl">
          <p className="text-2xl font-black text-teal-700">{m4.avgContPct.toFixed(1)}%</p>
          <p className="text-xs font-semibold text-teal-600 mt-1">Avg True Contribution</p>
        </div>
        <KpiTile
          label="Need Renegotiation"
          value={m4.renegotiateCount}
          pill={`${cfg.fields.partner.toLowerCase()}s flagged`}
          accent="red"
          delta={deltas?.m4?.renegotiateCount && deltas.m4.renegotiateCount.direction !== 'flat' && Math.abs(deltas.m4.renegotiateCount.value) >= 1 ? {
            label: Math.abs(Math.round(deltas.m4.renegotiateCount.value)) + ` ${cfg.fields.partner.toLowerCase()}s`,
            direction: deltas.m4.renegotiateCount.direction,
            isPositive: false,
          } : null}
        />
      </div>
      {m4.totalCreditCost > 0 && (
        <div className="mb-4">
          <KpiTile
            label="Working Capital Credit Cost"
            value={fNAbs(m4.totalCreditCost)}
            pill="/month at 28% WACC"
            accent="red"
            delta={deltas?.m4?.totalCreditCost && deltas.m4.totalCreditCost.direction !== 'flat' && Math.abs(deltas.m4.totalCreditCost.value) >= 1 ? {
              label: fNAbs(Math.abs(deltas.m4.totalCreditCost.value)),
              direction: deltas.m4.totalCreditCost.direction,
              isPositive: false,
            } : null}
          />
        </div>
      )}
      <M4DistributorChart results={m4.results} cfg={cfg} />
      <AnalysisTable
        headers={[cfg.fields.partner, 'Revenue ₦/mo', 'True Contrib. ₦/mo', 'Contrib. %', 'Rev Share %', cfg.fields.creditCost, cfg.fields.classification]}
        rows={m4.results.map(r => [
          r.name,
          fNAbs(r.rev),
          { content: <span className={r.trueContrib >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{fNAbs(r.trueContrib)}</span> },
          r.contPct.toFixed(1) + '%',
          r.revShare.toFixed(1) + '%',
          r.creditCost > 0 ? fNAbs(r.creditCost) : '—',
          { content: <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: r.classBg, color: r.classColor }}>{r.classification}</span> },
        ])}
      />
      <NarrativeBox>
        {m4.renegotiateCount > 0
          ? `${m4.renegotiateCount} ${m4.renegotiateCount > 1 ? cfg.fields.partner.toLowerCase() + 's' : cfg.fields.partner.toLowerCase()} classified as Renegotiate — high volume but dilutive terms. Priority for commercial renegotiation. `
          : `All ${cfg.fields.partner.toLowerCase()}s generating positive true contribution. `}
        {m4.totalCreditCost > 0 && `Working capital cost of credit extension: ${fNAbs(m4.totalCreditCost)}/month (at 28% WACC rate). `}
        True contribution includes {cfg.fields.partner.toLowerCase()} margin, rebates, logistics costs, and credit cost.
      </NarrativeBox>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ModulesPage() {
  const { tier } = useAuth();
  const { activePeriod, activeResults: results, running, run, activeHasResults: hasResults, chronologicalDelta, isConsolidated } = useAnalysisContext();
  const cfg = getSectorConfig(activePeriod?.vertical);

  const deltas = useMemo(() => {
    if (!chronologicalDelta) return null;
    return computeDeltas(chronologicalDelta.laterResults, chronologicalDelta.earlierResults);
  }, [chronologicalDelta]);

  return (
    <>
      <Head><title>Enterprise Modules | MarginCOS</title></Head>
      <DashboardLayout title="Enterprise Modules" activePeriod={activePeriod}>

        {!hasResults && (
          <div className="mb-6">
            <Button variant="navy" size="md" onClick={run} loading={running}>
              {running ? 'Analysing…' : '▶ Run Analysis'}
            </Button>
            <p className="text-xs text-slate-400 mt-2">Run analysis before viewing module outputs.</p>
          </div>
        )}

        <div className="space-y-12">
          {/* M1 */}
          <section>
            <ModuleGate tier={tier} moduleName={`M1 · ${cfg.m1.name}`}
              description={`Classifies every ${cfg.unit} into a strategic quadrant based on margin and revenue share. Identifies dilutive ${cfg.unitPlural}, delist candidates, and high-value defenders.`}>
              <PillarCard code="M1" title={cfg.m1.name}
                subtitle="Quadrant classification: Protect · Grow · Reprice · Review"
                accentColor="#7C3AED" ragStatus={null}>
                <M1Module results={results} deltas={deltas} cfg={cfg} isConsolidated={isConsolidated} />
              </PillarCard>
            </ModuleGate>
          </section>

          <hr className="border-slate-200" />

          {/* M2 */}
          <section>
            <ModuleGate tier={tier} moduleName={`M2 · ${cfg.m2.name}`}
              description="Projects margin impact under five cost recovery scenarios from 0% to 100%. Identifies the minimum recovery rate required to defend the portfolio.">
              <PillarCard code="M2" title={cfg.m2.name}
                subtitle="Five scenarios: 0% → 100% cost recovery rate"
                accentColor="#DC2626" ragStatus={null}>
                <M2Module results={results} deltas={deltas} cfg={cfg} />
              </PillarCard>
            </ModuleGate>
          </section>

          <hr className="border-slate-200" />

          {/* M3 */}
          <section>
            <ModuleGate tier={tier} moduleName={`M3 · ${cfg.m3.name}`}
              description="Computes return on trade investment by channel. Identifies dilutive spend, accretive channels, and reallocation opportunities.">
              <PillarCard code="M3" title={cfg.m3.name}
                subtitle="ROI per channel · Blended portfolio ROI · Spend intensity"
                accentColor="#D97706" ragStatus={null}>
                <M3Module results={results} deltas={deltas} cfg={cfg} />
              </PillarCard>
            </ModuleGate>
          </section>

          <hr className="border-slate-200" />

          {/* M4 */}
          <section>
            <ModuleGate tier={tier} moduleName={`M4 · ${cfg.m4.name}`}
              description={`Scores every named ${cfg.fields.partner.toLowerCase()} on true contribution margin (net of margin, rebates, logistics, and credit cost). Classifies into Strategic, Grow, Renegotiate, Review.`}>
              <PillarCard code="M4" title={cfg.m4.name}
                subtitle="True contribution · Credit cost · 2×2 quadrant scoring"
                accentColor="#0D9488" ragStatus={null}>
                <M4Module results={results} deltas={deltas} cfg={cfg} />
              </PillarCard>
            </ModuleGate>
          </section>
        </div>
      </DashboardLayout>
    </>
  );
}
