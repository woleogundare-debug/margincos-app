import { n } from '../../formatters';

/**
 * P4 — Load Profitability
 *
 * Reads logistics field names. Structurally identical to p4-trade.js but uses
 * discount_depth_pct / volume_response_pct instead of promo_depth_pct / promo_lift_pct.
 *
 * Return shape is identical to p4-trade.js.
 */
export function computeLogisticsP4(active) {
  let p4Results = [], totalPromoImpact = 0;

  active.forEach(r => {
    const price = n(r.contracted_rate_ngn);
    const cogs  = n(r.fully_loaded_cost_ngn);
    const vol   = n(r.monthly_trips);
    const depth = n(r.discount_depth_pct)    / 100;
    const lift  = n(r.volume_response_pct)   / 100;
    if (depth === 0 && lift === 0) return;

    const baseMargin  = (price - cogs) * vol;
    const effPrice    = price * (1 - depth);
    const unitMargin  = effPrice - cogs;
    const promoVol    = vol * (1 + lift);
    const promoMargin = unitMargin * promoVol;
    const netImpact   = promoMargin - baseMargin;

    // Break-even lift required
    const bevLift = (unitMargin > 0 && vol > 0)
      ? (baseMargin / unitMargin - vol) / vol * 100
      : null;

    totalPromoImpact += netImpact;
    p4Results.push({
      sku: r.lane_name || r.lane_id,
      skuId: r.lane_id,
      category: r.route_region || '—',
      baseMargin, netImpact, depth, lift,
      bevLift, effPrice, unitMargin,
      profitable: netImpact >= 0,
    });
  });

  return {
    results: p4Results,
    totalPromoImpact,
  };
}
