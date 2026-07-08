import { n, nOrNull } from '../../formatters';

export function computeP1(active) {
  let p1Results = [], p1TotalGain = 0, totalWTPGap = 0;
  let totalRevenue = 0, totalPotentialRevenue = 0, totalCurrentMargin = 0;

  active.forEach(r => {
    const price = n(r.rrp), cogs = n(r.cogs_per_unit), vol = n(r.monthly_volume_units);
    const el    = nOrNull(r.price_elasticity) ?? -0.7;  // default only when missing; respect an explicit 0
    const pc    = n(r.proposed_price_change_pct);  // template-decimal 0..1
    const wtp   = n(r.wtp_premium_pct);            // template-decimal 0..1

    // Competitor gap - new in v4.0
    const compPrice = n(r.competitor_price);
    const compGap   = (compPrice > 0 && price > 0)
      ? ((price - compPrice) / compPrice * 100)
      : null;

    // Margin floor breach - new in v4.0
    // floorPct holds the raw template decimal (0.20 = 20%). marginPct is
    // computed as a percentage point above, so the comparison multiplies
    // floorPct by 100 to align scales. Matches the logistics pattern at
    // p1-logistics.js:64.
    const marginPct      = price > 0 ? (price - cogs) / price * 100 : 0;
    const floorPct       = n(r.target_margin_floor_pct);
    const floorBreach    = floorPct > 0 ? marginPct < (floorPct * 100) : null;

    const curMargin  = (price - cogs) * vol;
    totalCurrentMargin += curMargin;

    const newPrice   = price * (1 + pc);
    const newVol     = vol  * (1 + el * pc);
    const newMargin  = (newPrice - cogs) * Math.max(0, newVol);
    const delta      = newMargin - curMargin;
    p1TotalGain     += delta;

    const wtpGap = price * wtp * vol;
    totalWTPGap += wtpGap;

    const rev = price * vol;
    totalRevenue          += rev;
    totalPotentialRevenue += price * (1 + wtp) * vol;

    p1Results.push({
      sku: r.sku_name || r.sku_id,
      skuId: r.sku_id,
      category: r.category || '-',
      curMargin, delta, pc, el, wtp, wtpGap,
      marginPct,
      floorPct, floorBreach,
      compPrice, compGap,
      price, cogs, vol,
      _division: r._division || null,
    });
  });

  const priceRealisation = totalPotentialRevenue > 0
    ? totalRevenue / totalPotentialRevenue * 100
    : 100;

  const floorBreaches = p1Results.filter(r => r.floorBreach === true);

  return {
    results: p1Results,
    totalGain: p1TotalGain,
    totalWTPGap,
    totalRevenue,
    totalCurrentMargin,
    priceRealisation,
    floorBreaches,
  };
}
