import { n } from '../formatters';
import { computeP1 } from './pillars/p1-pricing';
import { computeP2 } from './pillars/p2-cost';
import { computeP3 } from './pillars/p3-channel';
import { computeP4 } from './pillars/p4-trade';
import { computeM1 } from './modules/m1-rationalisation';
import { computeM2 } from './modules/m2-inflation';
import { computeM3 } from './modules/m3-trade-roi';
import { computeM4 } from './modules/m4-distributor';

function computeBase(active) {
  let totalRevenue = 0, totalCurrentMargin = 0;
  active.forEach(r => {
    const price = n(r.rrp), cogs = n(r.cogs_per_unit), vol = n(r.monthly_volume_units);
    totalRevenue       += price * vol;
    totalCurrentMargin += (price - cogs) * vol;
  });
  return { totalRevenue, totalCurrentMargin };
}

function computeActions(p1, p2, p3, p4) {
  const actions = [];

  // P1: underpriced SKUs with WTP headroom
  const upricedSKUs = (p1.results || [])
    .filter(s => s.wtp > 0.03 && s.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);
  if (upricedSKUs.length) {
    actions.push({
      pillar: 'Pricing Intelligence', color: '#0D9488', priority: 1,
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
    actions.push({
      pillar: 'Pricing Intelligence', color: '#0D9488', priority: 0,
      title:  `${p1.floorBreaches.length} SKU${p1.floorBreaches.length > 1 ? 's' : ''} breaching minimum margin floor`,
      detail: p1.floorBreaches.slice(0, 3).map(s => s.sku).join(', ') + ' — current gross margin below defined floor',
      value:  0,
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
      pillar: 'Cost Pass-Through', color: '#DC2626', priority: 0,
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
      pillar: 'Channel Economics', color: '#D97706', priority: 2,
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
      pillar: 'Trade Execution', color: '#7C3AED', priority: 1,
      title:  `Halt or restructure ${badPromos.length} loss-making promotion${badPromos.length > 1 ? 's' : ''}`,
      detail: badPromos.slice(0, 3).map(p => p.sku).join(', ') + (badPromos.length > 3 ? ` +${badPromos.length - 3} more` : '') + ' — net margin negative at current depth',
      value:  Math.abs(badPromos.reduce((s, p) => s + p.netImpact, 0)),
      timeline: 'This week',
    });
  }

  return actions.sort((a, b) => a.priority - b.priority);
}

export function runFullAnalysis(rows, tradeInvestment = []) {
  if (!rows || rows.length === 0) return null;

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
  const actions = computeActions(p1, p2, p3, p4);

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
