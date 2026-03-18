import Head from 'next/head';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ModuleGate } from '../../components/modules/ModuleGate';
import { PillarCard, AnalysisTable, NarrativeBox, EmptyState } from '../../components/dashboard/index';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/index';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import { fNAbs, fN } from '../../lib/formatters';
import clsx from 'clsx';

// ── M1 ────────────────────────────────────────────────────────────────────
function M1Module({ results }) {
  const m1 = results?.m1;
  if (!m1) return <div className="py-8 text-center text-sm text-slate-400">Run analysis to see SKU classification.</div>;

  return (
    <>
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
      <AnalysisTable
        headers={['SKU', 'Category', 'Margin %', 'Rev Share %', 'vs. Avg', 'Classification', 'Action']}
        rows={m1.results.sort((a, b) => b.skuMarginPct - a.skuMarginPct).map(r => [
          r.sku, r.category,
          r.skuMarginPct.toFixed(1) + '%',
          r.revShare.toFixed(1) + '%',
          { content: <span className={r.vsAvg >= 0 ? 'text-emerald-600' : 'text-red-500'}>{r.vsAvg >= 0 ? '+' : ''}{r.vsAvg.toFixed(1)}pp</span> },
          { content: <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: r.classBg, color: r.classColor }}>{r.classification}</span> },
          { content: <span className="text-xs text-slate-500">{r.action}</span> },
        ])}
      />
      <NarrativeBox>
        Portfolio average margin: {m1.portfolioAvgMarginPct.toFixed(1)}%. {m1.dilutiveCount} SKU{m1.dilutiveCount !== 1 ? 's' : ''} below average — diluting portfolio margin by {fNAbs(Math.abs(m1.dilutiveMargin))}/month. Margin at stake from sub-par SKUs: {fNAbs(m1.marginAtStake)}/month.
      </NarrativeBox>
    </>
  );
}

// ── M2 ────────────────────────────────────────────────────────────────────
function M2Module({ results }) {
  const m2 = results?.m2;
  if (!m2) return <div className="py-8 text-center text-sm text-slate-400">Run analysis to see inflation scenarios.</div>;

  return (
    <>
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
        At zero cost recovery (full absorption), margin impact is {fN(m2.worstCase)}/month. At 50% recovery: {fNAbs(m2.baseCase)}/month retained margin. Recommended: achieve minimum 75% recovery rate (BUA Foods benchmark) to remain above critical margin threshold.
      </NarrativeBox>
    </>
  );
}

// ── M3 ────────────────────────────────────────────────────────────────────
function M3Module({ results }) {
  const m3 = results?.m3;
  if (!m3?.hasData) return (
    <div className="py-8 text-center text-sm text-slate-400">
      No trade investment data. Populate the Trade Investment form in Portfolio Manager.
    </div>
  );
  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <p className="text-2xl font-black text-navy">{fNAbs(m3.totalSpend)}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Total Trade Spend/mo</p>
        </div>
        <div className="text-center p-4 bg-teal-50 rounded-xl">
          <p className="text-2xl font-black text-teal">{m3.blendedROI != null ? m3.blendedROI.toFixed(2) + '×' : '—'}</p>
          <p className="text-xs font-semibold text-teal-600 mt-1">Blended Portfolio ROI</p>
        </div>
        <div className="text-center p-4 bg-amber-50 rounded-xl">
          <p className="text-2xl font-black text-amber">{m3.bestChannel?.channel || '—'}</p>
          <p className="text-xs font-semibold text-amber-700 mt-1">Best ROI Channel</p>
        </div>
      </div>
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
        {m3.bestChannel && `Best performing channel: ${m3.bestChannel.channel} at ${m3.bestChannel.roi?.toFixed(2)}× ROI. `}
        {m3.worstChannel && m3.worstChannel.channel !== m3.bestChannel?.channel
          && `Lowest ROI: ${m3.worstChannel.channel} — review spend reallocation opportunity. `}
        Total portfolio trade spend: {fNAbs(m3.totalSpend)}/month.
      </NarrativeBox>
    </>
  );
}

// ── M4 ────────────────────────────────────────────────────────────────────
function M4Module({ results }) {
  const m4 = results?.m4;
  if (!m4?.hasData) return (
    <div className="py-8 text-center text-sm text-slate-400">
      No distributor data. Populate the Distributor Name field on SKUs to unlock this module.
    </div>
  );
  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <p className="text-2xl font-black text-navy">{m4.totalDistributors}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Distributors Scored</p>
        </div>
        <div className="text-center p-4 bg-teal-50 rounded-xl">
          <p className="text-2xl font-black text-teal">{m4.avgContPct.toFixed(1)}%</p>
          <p className="text-xs font-semibold text-teal-600 mt-1">Avg True Contribution</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-xl">
          <p className="text-2xl font-black text-red">{m4.renegotiateCount}</p>
          <p className="text-xs font-semibold text-red-600 mt-1">Need Renegotiation</p>
        </div>
      </div>
      <AnalysisTable
        headers={['Distributor', 'Revenue ₦/mo', 'True Contrib. ₦/mo', 'Contrib. %', 'Rev Share %', 'Credit Cost ₦', 'Classification']}
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
          ? `${m4.renegotiateCount} distributor${m4.renegotiateCount > 1 ? 's' : ''} classified as Renegotiate — high volume but dilutive terms. Priority for commercial renegotiation. `
          : 'All distributors generating positive true contribution. '}
        {m4.totalCreditCost > 0 && `Working capital cost of credit extension: ${fNAbs(m4.totalCreditCost)}/month (at 28% WACC rate). `}
        True contribution includes distributor margin, rebates, logistics costs, and credit cost.
      </NarrativeBox>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ModulesPage() {
  const { tier } = useAuth();
  const { activePeriod, results, running, run, hasResults } = useAnalysisContext();

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

        <div className="space-y-6">
          {/* M1 */}
          <ModuleGate tier={tier} moduleName="M1 · SKU Portfolio Rationalisation"
            description="Classifies every SKU into a strategic quadrant based on margin and revenue share. Identifies dilutive SKUs, delist candidates, and high-value defenders.">
            <PillarCard title="M1 · SKU Portfolio Rationalisation"
              subtitle="Quadrant classification: Protect · Grow · Reprice · Review"
              accentColor="#7C3AED" ragStatus={null}>
              <M1Module results={results} />
            </PillarCard>
          </ModuleGate>

          {/* M2 */}
          <ModuleGate tier={tier} moduleName="M2 · Forward Inflation Scenario Engine"
            description="Projects margin impact under five cost recovery scenarios from 0% to 100%. Identifies the minimum recovery rate required to defend the portfolio.">
            <PillarCard title="M2 · Forward Inflation Scenario Engine"
              subtitle="Five scenarios: 0% → 100% cost recovery rate"
              accentColor="#DC2626" ragStatus={null}>
              <M2Module results={results} />
            </PillarCard>
          </ModuleGate>

          {/* M3 */}
          <ModuleGate tier={tier} moduleName="M3 · Trade Spend ROI Analyser"
            description="Computes return on trade investment by channel. Identifies dilutive spend, accretive channels, and reallocation opportunities.">
            <PillarCard title="M3 · Trade Spend ROI Analyser"
              subtitle="ROI per channel · Blended portfolio ROI · Spend intensity"
              accentColor="#D97706" ragStatus={null}>
              <M3Module results={results} />
            </PillarCard>
          </ModuleGate>

          {/* M4 */}
          <ModuleGate tier={tier} moduleName="M4 · Distributor Performance Scorecard"
            description="Scores every named distributor on true contribution margin (net of margin, rebates, logistics, and credit cost). Classifies into Strategic, Grow, Renegotiate, Review.">
            <PillarCard title="M4 · Distributor Performance Scorecard"
              subtitle="True contribution · Credit cost · 2×2 quadrant scoring"
              accentColor="#0D9488" ragStatus={null}>
              <M4Module results={results} />
            </PillarCard>
          </ModuleGate>
        </div>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  const auth = await requireAuth(req, res);
  if (auth.redirect) return auth;
  return { props: {} };
}
