import { n } from '../formatters';
import { computeP1 } from './pillars/p1-pricing';
import { computeP2 } from './pillars/p2-cost';
import { computeP3 } from './pillars/p3-channel';
import { computeP4 } from './pillars/p4-trade';
import { computeM1 } from './modules/m1-rationalisation';
import { computeM2 } from './modules/m2-inflation';
import { computeM3 } from './modules/m3-trade-roi';
import { computeM4 } from './modules/m4-distributor';
import { runLogisticsAnalysis } from './analysis-logistics';

function computeBase(active) {
  let totalRevenue = 0, totalCurrentMargin = 0;
  active.forEach(r => {
    const price = n(r.rrp), cogs = n(r.cogs_per_unit), vol = n(r.monthly_volume_units);
    totalRevenue       += price * vol;
    totalCurrentMargin += (price - cogs) * vol;
  });
  return { totalRevenue, totalCurrentMargin };
}

function computeActions(p1, p2, p3, p4, m1, m2, m3, m4) {
  const actions = [];

  // P1: underpriced SKUs with WTP headroom
  const upricedSKUs = (p1.results || [])
    .filter(s => s.wtp > 0.03 && s.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);
  if (upricedSKUs.length) {
    actions.push({
      pillar: 'P1', color: '#0D9488', priority: 1,
      title:  `Apply proposed price increases on ${upricedSKUs.length} underpriced SKU${upricedSKUs.length > 1 ? 's' : ''}`,
      detail: upricedSKUs.slice(0, 3).map(s => s.sku).join(', ') +
              (upricedSKUs.length > 3 ? ` +${upricedSKUs.length - 3} more` : '') +
              ' — WTP headroom above current RRP confirmed',
      value:    upricedSKUs.reduce((s, r) => s + r.delta, 0),
      timeline: 'Within 30 days',
    });
  }

  // P1: floor breaches
  if (p1.floorBreaches?.length) {
    const floorBreachValue = p1.floorBreaches.reduce((sum, s) => {
      const price = parseFloat(s.price) || 0;
      const vol   = parseFloat(s.vol)   || 0;
      return sum + (price * vol);
    }, 0);
    const n = p1.floorBreaches.length;
    actions.push({
      pillar: 'P1', color: '#0D9488', priority: 0,
      title:  `${n} SKU${n > 1 ? 's' : ''} breaching minimum margin floor`,
      detail: `${n} SKU${n !== 1 ? 's' : ''} currently priced below the defined margin floor. Immediate corrective action required — review RRP or cost structure.`,
      value:  floorBreachValue,
      timeline: 'Immediate',
    });
  }

  // P2: high-absorption SKUs
  const highAbsorb = (p2.results || [])
    .filter(s => s.absorbedPct > 50)
    .sort((a, b) => b.absorbed - a.absorbed)
    .slice(0, 5);
  if (highAbsorb.length) {
    actions.push({
      pillar: 'P2', color: '#DC2626', priority: 0,
      title:  `Review pass-through terms on ${highAbsorb.length} high-absorption SKU${highAbsorb.length > 1 ? 's' : ''}`,
      detail: `Price recovery below 50% on ${highAbsorb.length} SKU${highAbsorb.length > 1 ? 's' : ''} — introduce cost-indexed pricing or escalation clauses`,
      value:  -(highAbsorb.reduce((s, r) => s + r.absorbed, 0)),
      timeline: 'Immediate',
    });
  }

  // P3: weak channel contribution
  const weakChannels = (p3.channelResults || []).filter(c => c.contPct < 15 && c.rev > 0);
  if (weakChannels.length) {
    actions.push({
      pillar: 'P3', color: '#D97706', priority: 2,
      title:  `Audit contribution margins in ${weakChannels.map(c => c.channel).join(', ')}`,
      detail: 'Channel contribution below 15% — review distributor margin terms or volume mix',
      value:  weakChannels.reduce((s, c) => s + c.wtpGap, 0),
      timeline: 'Within 14 days',
    });
  }

  // P4: loss-making promos
  const badPromos = (p4.results || []).filter(p => !p.profitable).sort((a, b) => a.netImpact - b.netImpact);
  if (badPromos.length) {
    actions.push({
      pillar: 'P4', color: '#7C3AED', priority: 1,
      title:  `Halt or restructure ${badPromos.length} loss-making promotion${badPromos.length > 1 ? 's' : ''}`,
      detail: badPromos.slice(0, 3).map(p => p.sku).join(', ') + (badPromos.length > 3 ? ` +${badPromos.length - 3} more` : '') + ' — net margin negative at current depth',
      value:  Math.abs(badPromos.reduce((s, p) => s + p.netImpact, 0)),
      timeline: 'This week',
    });
  }

  // ── M1: Portfolio Rationalisation ────────────────────────────────────────
  if (m1) {
    // M1a: Reprice — high volume, margin below portfolio average
    const repriceSKUs = (m1.results || []).filter(s => s.classification.includes('Reprice'));
    if (repriceSKUs.length) {
      actions.push({
        pillar: 'M1', color: '#1B2A4A', priority: 1,
        title:  `Reprice ${repriceSKUs.length} dilutive SKU${repriceSKUs.length > 1 ? 's' : ''} below portfolio margin average`,
        detail: repriceSKUs.slice(0, 3).map(s => s.sku).join(', ') +
                (repriceSKUs.length > 3 ? ` +${repriceSKUs.length - 3} more` : '') +
                ' — high revenue share but margin dragging portfolio average',
        value:    Math.abs(repriceSKUs.reduce((s, r) => s + r.skuMarginAbs, 0)),
        timeline: 'Within 30 days',
      });
    }

    // M1b: Review — low volume AND dilutive margin, delist candidates
    const reviewSKUs = (m1.results || []).filter(s => s.classification.includes('Review'));
    if (reviewSKUs.length) {
      actions.push({
        pillar: 'M1', color: '#1B2A4A', priority: 2,
        title:  `Review ${reviewSKUs.length} SKU${reviewSKUs.length > 1 ? 's' : ''} for potential delisting`,
        detail: reviewSKUs.slice(0, 3).map(s => s.sku).join(', ') +
                (reviewSKUs.length > 3 ? ` +${reviewSKUs.length - 3} more` : '') +
                ' — low revenue share and dilutive margin, limited strategic value',
        value:    Math.abs(reviewSKUs.reduce((s, r) => s + r.skuMarginAbs, 0)),
        timeline: 'Within 14 days',
      });
    }
  }

  // ── M2: Forward Scenario Engine ──────────────────────────────────────────
  if (m2) {
    const worstScenario = (m2.scenarios || [])[0]; // 0% recovery = worst case

    // M2a: Worst case projects negative margin — immediate price floor action
    if (m2.worstCase < 0) {
      actions.push({
        pillar: 'M2', color: '#C0392B', priority: 0,
        title:  'Portfolio margin at risk under 40% inflation scenario — implement price floor buffer',
        detail: `Zero cost pass-through projects ${Math.abs(m2.worstCase / 1e6).toFixed(1)}M NGN margin erosion — set RRP floors to protect downside`,
        value:    Math.abs(m2.worstCase),
        timeline: 'Immediate',
      });
    }

    // M2b: Margin compressed >20pp even at worst case — pre-index pricing now
    if (worstScenario && worstScenario.pctPtChange < -20) {
      actions.push({
        pillar: 'M2', color: '#C0392B', priority: 1,
        title:  'Pre-index pricing for inflation resilience',
        detail: `Worst-case scenario projects ${Math.abs(worstScenario.pctPtChange).toFixed(1)}pp margin compression — introduce contractual price escalation clauses before next supplier review`,
        value:    Math.abs(m2.worstCase),
        timeline: 'Within 30 days',
      });
    }
  }

  // ── M3: Commercial Spend ROI Analyser ────────────────────────────────────
  if (m3?.hasData) {
    const dilutiveChannels = (m3.results || []).filter(c => c.status === 'Dilutive' && c.total > 0);
    if (dilutiveChannels.length) {
      const negativeSpend = dilutiveChannels.reduce((s, c) => s + c.total, 0);
      actions.push({
        pillar: 'M3', color: '#0D8F8F', priority: 1,
        title:  `Reallocate trade spend in ${dilutiveChannels.length} negative-ROI channel${dilutiveChannels.length > 1 ? 's' : ''}`,
        detail: dilutiveChannels.slice(0, 3).map(c => c.channel).join(', ') +
                (dilutiveChannels.length > 3 ? ` +${dilutiveChannels.length - 3} more` : '') +
                ' — spend not generating sufficient contribution margin return',
        value:    negativeSpend,
        timeline: 'This week',
      });
    }
  }

  // ── M4: Partner Performance Scorecard ────────────────────────────────────
  if (m4?.hasData) {
    // M4a: Renegotiate — high volume but dilutive terms
    const renegotiateDist = (m4.results || []).filter(d => d.classification.includes('Renegotiate'));
    if (renegotiateDist.length) {
      actions.push({
        pillar: 'M4', color: '#D4A843', priority: 1,
        title:  `Renegotiate terms with ${renegotiateDist.length} underperforming distributor${renegotiateDist.length > 1 ? 's' : ''}`,
        detail: renegotiateDist.slice(0, 3).map(d => d.name).join(', ') +
                (renegotiateDist.length > 3 ? ` +${renegotiateDist.length - 3} more` : '') +
                ' — high revenue share but dilutive margin or credit terms',
        value:    renegotiateDist.reduce((s, d) => s + d.creditCost, 0),
        timeline: 'Within 14 days',
      });
    }

    // M4b: Exit — low volume AND low margin (✗ Review in engine = exit candidates)
    const exitDist = (m4.results || []).filter(d => d.classification.includes('✗'));
    if (exitDist.length) {
      actions.push({
        pillar: 'M4', color: '#D4A843', priority: 0,
        title:  `Exit ${exitDist.length} margin-negative distributor relationship${exitDist.length > 1 ? 's' : ''}`,
        detail: exitDist.slice(0, 3).map(d => d.name).join(', ') +
                (exitDist.length > 3 ? ` +${exitDist.length - 3} more` : '') +
                ' — low revenue contribution and dilutive true margin after credit costs',
        value:    Math.abs(exitDist.reduce((s, d) => s + d.trueContrib, 0)),
        timeline: 'Immediate',
      });
    }
  }

  return actions.sort((a, b) => a.priority - b.priority);
}

export function runFullAnalysis(rows, tradeInvestment = [], vertical) {
  if (!rows || rows.length === 0) return null;

  // Dispatch to Logistics engine when vertical is Logistics
  if (vertical === 'Logistics') {
    return runLogisticsAnalysis(rows, tradeInvestment);
  }

  // active column is text ('Y'/'N') in Supabase, but may also arrive as boolean
  const active = rows.filter(r => {
    const v = r.active;
    return v === 'Y' || v === 'y' || v === true || v === 'true' || v === 'Active' || v === 'active';
  });
  if (active.length === 0) return null;

  const base    = computeBase(active);
  const p1      = computeP1(active);
  const p2      = computeP2(active);
  const p3      = computeP3(active);
  const p4      = computeP4(active);
  const m1      = computeM1(active, base);
  const m2      = computeM2(active, base);
  const m3      = computeM3(tradeInvestment, p3);
  const m4      = computeM4(active, base);
  const actions = computeActions(p1, p2, p3, p4, m1, m2, m3, m4);

  return {
    ...base,
    skuCount:  active.length,
    totalSkus: rows.length,
    p1, p2, p3, p4,
    m1, m2, m3, m4,
    actions,
    protectedMargin: base.totalCurrentMargin - p2.totalAbsorbed,
    revenueAtRisk:   p2.totalAbsorbed,
    distExposure:    p3.totalDistExposure,
  };
}
