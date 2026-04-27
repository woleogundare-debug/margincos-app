import { n } from '../formatters';
import { computeLogisticsP1 } from './pillars/p1-logistics';
import { computeLogisticsP2 } from './pillars/p2-logistics';
import { computeLogisticsP3 } from './pillars/p3-logistics';
import { computeLogisticsP4 } from './pillars/p4-logistics';
import { computeLogisticsM1 } from './modules/m1-logistics';
import { computeLogisticsM2 } from './modules/m2-logistics';
import { computeLogisticsM3 } from './modules/m3-logistics';
import { computeLogisticsM4 } from './modules/m4-logistics';

/**
 * computeLogisticsBase — base revenue & margin totals (mirrors computeBase in analysis.js)
 */
function computeLogisticsBase(active) {
  let totalRevenue = 0, totalCurrentMargin = 0;
  active.forEach(r => {
    const price = n(r.contracted_rate_ngn);
    const cogs  = n(r.fully_loaded_cost_ngn);
    const vol   = n(r.monthly_trips);
    totalRevenue       += price * vol;
    totalCurrentMargin += (price - cogs) * vol;
  });
  return { totalRevenue, totalCurrentMargin };
}

/**
 * computeLogisticsActions — generates prioritised action list using logistics vocabulary.
 * Mirrors computeActions in analysis.js, adapted for lane/route/rate context.
 */
// Returns a single division name, 'Multiple divisions', or null
function getDivisionTag(items) {
  const divs = [...new Set((items || []).map(r => r._division).filter(Boolean))];
  if (divs.length === 0) return null;
  if (divs.length === 1) return divs[0];
  return 'Multiple divisions';
}

function computeLogisticsActions(p1, p2, p3, p4, m1, m2, m3, m4) {
  const actions = [];

  // P1: underpriced lanes with proposed rate increase
  const underpricedLanes = (p1.results || [])
    .filter(r => r.wtp > 0.03 && r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);
  if (underpricedLanes.length) {
    actions.push({
      pillar: 'P1', color: '#0D9488', priority: 1,
      title:  `Apply proposed rate increases on ${underpricedLanes.length} underpriced lane${underpricedLanes.length > 1 ? 's' : ''}`,
      detail: underpricedLanes.slice(0, 3).map(r => r.sku).join(', ') +
              (underpricedLanes.length > 3 ? ` +${underpricedLanes.length - 3} more` : '') +
              ' — rate headroom above current contracted rate confirmed',
      value:    underpricedLanes.reduce((s, r) => s + r.delta, 0),
      timeline: 'Within 30 days',
      _division: getDivisionTag(underpricedLanes),
    });
  }

  // P1: floor breaches
  if (p1.floorBreaches?.length) {
    const floorBreachValue = p1.floorBreaches.reduce((sum, lane) => {
      const price = parseFloat(lane.price) || 0;
      const vol   = parseFloat(lane.vol)   || 0;
      return sum + (price * vol);
    }, 0);
    const n = p1.floorBreaches.length;
    actions.push({
      pillar: 'P1', color: '#0D9488', priority: 0,
      title:  `${n} lane${n > 1 ? 's' : ''} breaching minimum margin floor`,
      detail: `${n} lane${n !== 1 ? 's' : ''} operating below defined margin threshold. Review rates or consider lane suspension.`,
      value:  floorBreachValue,
      timeline: 'Immediate',
      _division: getDivisionTag(p1.floorBreaches),
    });
  }

  // P2: high-absorption lanes
  const highAbsorb = (p2.results || [])
    .filter(r => r.absorbedPct > 50)
    .sort((a, b) => b.absorbed - a.absorbed)
    .slice(0, 5);
  if (highAbsorb.length) {
    actions.push({
      pillar: 'P2', color: '#DC2626', priority: 0,
      title:  `Review rate recovery on ${highAbsorb.length} high-absorption lane${highAbsorb.length > 1 ? 's' : ''}`,
      detail: `Rate recovery below 50% on ${highAbsorb.length} lane${highAbsorb.length > 1 ? 's' : ''} — introduce cost-indexed rate clauses or fuel surcharge to recover absorbed costs`,
      value:  -(highAbsorb.reduce((s, r) => s + r.absorbed, 0)),
      timeline: 'Immediate',
      _division: getDivisionTag(highAbsorb),
    });
  }

  // P3: weak contract type contribution
  const weakChannels = (p3.channelResults || []).filter(c => c.contPct < 15 && c.rev > 0);
  if (weakChannels.length) {
    actions.push({
      pillar: 'P3', color: '#D97706', priority: 2,
      title:  `Audit contribution margins on ${weakChannels.map(c => c.channel).join(', ')} contracts`,
      detail: 'Contract type contribution below 15% — review customer margin terms or route mix',
      value:  weakChannels.reduce((s, c) => s + c.wtpGap, 0),
      timeline: 'Within 14 days',
    });
  }

  // P4: loss-making discounts
  const badDiscounts = (p4.results || []).filter(p => !p.profitable).sort((a, b) => a.netImpact - b.netImpact);
  if (badDiscounts.length) {
    actions.push({
      pillar: 'P4', color: '#7C3AED', priority: 1,
      title:  `Halt or restructure ${badDiscounts.length} loss-making discount${badDiscounts.length > 1 ? 's' : ''}`,
      detail: badDiscounts.slice(0, 3).map(p => p.sku).join(', ') +
              (badDiscounts.length > 3 ? ` +${badDiscounts.length - 3} more` : '') +
              ' — net margin negative at current discount depth',
      value:  Math.abs(badDiscounts.reduce((s, p) => s + p.netImpact, 0)),
      timeline: 'This week',
      _division: getDivisionTag(badDiscounts),
    });
  }

  // M1: Portfolio Rationalisation
  if (m1) {
    const repriceLanes = (m1.results || []).filter(r => r.classification.includes('Reprice'));
    if (repriceLanes.length) {
      actions.push({
        pillar: 'M1', color: '#1B2A4A', priority: 1,
        title:  `Reprice ${repriceLanes.length} dilutive lane${repriceLanes.length > 1 ? 's' : ''} below portfolio margin average`,
        detail: repriceLanes.slice(0, 3).map(r => r.sku).join(', ') +
                (repriceLanes.length > 3 ? ` +${repriceLanes.length - 3} more` : '') +
                ' — high revenue share but margin dragging portfolio average',
        value:    Math.abs(repriceLanes.reduce((s, r) => s + r.skuMarginAbs, 0)),
        timeline: 'Within 30 days',
        _division: getDivisionTag(repriceLanes),
      });
    }

    const reviewLanes = (m1.results || []).filter(r => r.classification.includes('Review'));
    if (reviewLanes.length) {
      actions.push({
        pillar: 'M1', color: '#1B2A4A', priority: 2,
        title:  `Review ${reviewLanes.length} lane${reviewLanes.length > 1 ? 's' : ''} for potential suspension`,
        detail: reviewLanes.slice(0, 3).map(r => r.sku).join(', ') +
                (reviewLanes.length > 3 ? ` +${reviewLanes.length - 3} more` : '') +
                ' — low revenue share and dilutive margin, limited strategic value',
        value:    Math.abs(reviewLanes.reduce((s, r) => s + r.skuMarginAbs, 0)),
        timeline: 'Within 14 days',
        _division: getDivisionTag(reviewLanes),
      });
    }
  }

  // M2: Fuel Price Scenario Engine
  // Single action: one recoverable pool (40% fuel inflation x 0% pass-through),
  // two sequenced intervention facets (immediate floor + structural indexation).
  if (m2 && m2.worstCase < 0) {
    const worstScenario = (m2.scenarios || [])[0]; // 0% recovery = worst case
    const compressionPp = worstScenario ? Math.abs(worstScenario.pctPtChange).toFixed(1) : null;
    const erosionM      = Math.abs(m2.worstCase / 1e6).toFixed(1);

    const detailLines = [
      `Zero fuel-cost pass-through projects ${erosionM}M NGN margin erosion under a 40% fuel inflation scenario` +
        (compressionPp ? ` (${compressionPp}pp margin compression).` : '.'),
      'Sequenced response: (1) immediate - set lane rate floors to protect downside; (2) within 30 days - introduce fuel-indexed escalation clauses in customer contracts before next quarterly review.',
    ];

    actions.push({
      pillar: 'M2', color: '#C0392B', priority: 0,
      title:  'Margin protection under 40% fuel inflation scenario',
      detail: detailLines.join(' '),
      value:    Math.abs(m2.worstCase),
      timeline: 'Immediate',
      recoverable_pool_id: 'm2-logistics-fuel-40pct-0pt',
    });
  }

  // M3: Discount ROI
  if (m3?.hasData) {
    const dilutiveChannels = (m3.results || []).filter(c => c.status === 'Dilutive' && c.total > 0);
    if (dilutiveChannels.length) {
      const negativeSpend = dilutiveChannels.reduce((s, c) => s + c.total, 0);
      actions.push({
        pillar: 'M3', color: '#0D8F8F', priority: 1,
        title:  `Reallocate discount spend in ${dilutiveChannels.length} negative-ROI contract type${dilutiveChannels.length > 1 ? 's' : ''}`,
        detail: dilutiveChannels.slice(0, 3).map(c => c.channel).join(', ') +
                (dilutiveChannels.length > 3 ? ` +${dilutiveChannels.length - 3} more` : '') +
                ' — discounts not generating sufficient volume response',
        value:    negativeSpend,
        timeline: 'This week',
      });
    }
  }

  // M4: Customer terms
  if (m4?.hasData) {
    const renegotiateCustomers = (m4.results || []).filter(d => d.classification.includes('Renegotiate'));
    if (renegotiateCustomers.length) {
      actions.push({
        pillar: 'M4', color: '#D4A843', priority: 1,
        title:  `Renegotiate terms with ${renegotiateCustomers.length} underperforming customer${renegotiateCustomers.length > 1 ? 's' : ''}`,
        detail: renegotiateCustomers.slice(0, 3).map(d => d.name).join(', ') +
                (renegotiateCustomers.length > 3 ? ` +${renegotiateCustomers.length - 3} more` : '') +
                ' — high revenue share but dilutive margin or payment terms',
        value:    renegotiateCustomers.reduce((s, d) => s + d.creditCost, 0),
        timeline: 'Within 14 days',
      });
    }

    const exitCustomers = (m4.results || []).filter(d => d.classification.includes('✗'));
    if (exitCustomers.length) {
      actions.push({
        pillar: 'M4', color: '#D4A843', priority: 0,
        title:  `Exit ${exitCustomers.length} margin-negative customer relationship${exitCustomers.length > 1 ? 's' : ''}`,
        detail: exitCustomers.slice(0, 3).map(d => d.name).join(', ') +
                (exitCustomers.length > 3 ? ` +${exitCustomers.length - 3} more` : '') +
                ' — low revenue contribution and dilutive true margin after payment costs',
        value:    Math.abs(exitCustomers.reduce((s, d) => s + d.trueContrib, 0)),
        timeline: 'Immediate',
      });
    }
  }

  return actions.sort((a, b) => a.priority - b.priority);
}

/**
 * runLogisticsAnalysis — main entry point for Logistics periods.
 * Called by runFullAnalysis when vertical === 'Logistics'.
 * Returns the identical shape as runFullAnalysis for FMCG.
 *
 * @param {Array} rows - logistics_rows for the period
 * @param {Array} commercialInvestment - logistics_commercial_investment rows (optional)
 */
export function runLogisticsAnalysis(rows, commercialInvestment = []) {
  if (!rows || rows.length === 0) return null;

  const active = rows.filter(r => {
    const v = r.active;
    return v === 'Y' || v === 'y' || v === true || v === 'true' || v === 'Active' || v === 'active';
  });
  if (active.length === 0) return null;

  const base    = computeLogisticsBase(active);
  const p1      = computeLogisticsP1(active);
  const p2      = computeLogisticsP2(active);
  const p3      = computeLogisticsP3(active);
  const p4      = computeLogisticsP4(active);
  const m1      = computeLogisticsM1(active, base);
  const m2      = computeLogisticsM2(active, base);
  const m3      = computeLogisticsM3(active, commercialInvestment, p3);
  const m4      = computeLogisticsM4(active, base);
  const actions = computeLogisticsActions(p1, p2, p3, p4, m1, m2, m3, m4);

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
