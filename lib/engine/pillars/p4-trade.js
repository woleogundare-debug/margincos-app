import { n } from '../../formatters';

export function computeP4(active) {
  let p4Results = [], totalPromoImpact = 0;

  active.forEach(r => {
    const price = n(r.rrp), cogs = n(r.cogs_per_unit), vol = n(r.monthly_volume_units);
    const depth = n(r.promo_depth_pct), lift = n(r.promo_lift_pct);
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
      sku: r.sku_name || r.sku_id,
      skuId: r.sku_id,
      category: r.category || '—',
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
