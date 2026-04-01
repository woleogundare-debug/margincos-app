import { n } from '../../formatters';

/**
 * M1 — Route Rationalisation
 *
 * Same 2×2 quadrant logic as m1-rationalisation.js (Protect / Grow / Reprice / Review)
 * but reads logistics field names.
 *
 * Return shape is identical to m1-rationalisation.js.
 */
export function computeLogisticsM1(active, base) {
  const { totalRevenue, totalCurrentMargin } = base;

  const priceRows = active.filter(r => n(r.contracted_rate_ngn) > 0);
  const portfolioAvgMarginPct = priceRows.length > 0
    ? priceRows.reduce((s, r) => {
        const price = n(r.contracted_rate_ngn);
        const cogs  = n(r.fully_loaded_cost_ngn);
        return price > 0 ? s + ((price - cogs) / price * 100) : s;
      }, 0) / priceRows.length
    : 0;

  const results = [];
  active.forEach(r => {
    const price = n(r.contracted_rate_ngn);
    const cogs  = n(r.fully_loaded_cost_ngn);
    const vol   = n(r.monthly_trips);
    if (price === 0 || vol === 0) return;

    const skuRevenue   = price * vol;
    const skuMarginAbs = (price - cogs) * vol;
    const skuMarginPct = (price - cogs) / price * 100;
    const revShare     = totalRevenue > 0 ? skuRevenue / totalRevenue * 100 : 0;
    const vsAvg        = skuMarginPct - portfolioAvgMarginPct;
    const highVol      = revShare >= 5;
    const highMargin   = skuMarginPct >= portfolioAvgMarginPct;

    let classification, action, classColor, classBg;
    if (highMargin && highVol) {
      classification = '★ Protect';
      action = 'Core value lane — defend rate and volume';
      classColor = '#065f46'; classBg = '#dcfce7';
    } else if (highMargin && !highVol) {
      classification = '▲ Grow';
      action = 'Strong margin, low trips — invest to scale frequency';
      classColor = '#1e40af'; classBg = '#dbeafe';
    } else if (!highMargin && highVol) {
      classification = '⚠ Reprice';
      action = 'High trips, dilutive margin — rate review required';
      classColor = '#92400e'; classBg = '#fef3c7';
    } else {
      classification = '✗ Review';
      action = 'Low margin, low trips — suspend or let contract lapse';
      classColor = '#991b1b'; classBg = '#fee2e2';
    }

    results.push({
      sku: r.lane_name || r.lane_id,
      category: r.route_region || '—',
      skuMarginPct, skuMarginAbs, revShare, vsAvg,
      classification, action, classColor, classBg,
      highMargin, highVol,
      _division: r._division || null,
    });
  });

  const dilutiveCount  = results.filter(s => !s.highMargin).length;
  const dilutiveMargin = results.filter(s => !s.highMargin).reduce((s, r) => s + r.skuMarginAbs, 0);
  const marginAtStake  = Math.abs(
    totalCurrentMargin - results.filter(s => s.highMargin).reduce((s, r) => s + r.skuMarginAbs, 0)
  );

  return {
    results,
    portfolioAvgMarginPct,
    dilutiveCount,
    dilutiveMargin,
    marginAtStake,
  };
}
