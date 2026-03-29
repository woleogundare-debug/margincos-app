import { n } from '../../formatters';

/**
 * P1 — Lane Rate Intelligence
 *
 * Reads logistics field names. Includes backhaul corridor economics:
 * if a lane has backhaul rate data, effective price and cost account for
 * both the outbound and return leg, improving per-lane margin accuracy.
 *
 * Return shape is identical to p1-pricing.js.
 */
export function computeLogisticsP1(active) {
  let p1Results = [], p1TotalGain = 0, totalWTPGap = 0;
  let totalRevenue = 0, totalPotentialRevenue = 0, totalCurrentMargin = 0;

  active.forEach(r => {
    const price    = n(r.contracted_rate_ngn);
    const cogs     = n(r.fully_loaded_cost_ngn);
    const vol      = n(r.monthly_trips);
    const el       = n(r.rate_sensitivity) || -0.7;
    const pc       = n(r.proposed_rate_change_pct) / 100;
    const wtp      = n(r.rate_headroom_pct) / 100;
    const compPrice = n(r.market_rate_ngn);
    const floorPct  = n(r.min_margin_floor_pct) / 100;
    const distance  = n(r.distance_km);

    // Backhaul corridor economics
    const backhaulRate     = n(r.backhaul_rate_ngn);
    const backhaulCost     = n(r.backhaul_cost_ngn);
    const backhaulRecovery = n(r.backhaul_recovery_pct) / 100;

    // Corridor revenue = outbound rate + (backhaul rate × recovery %)
    // Corridor cost = outbound cost + backhaul cost (always incurred)
    const corridorRevenue = price + (backhaulRate * backhaulRecovery);
    const corridorCost    = cogs + backhaulCost;

    // Use corridor economics if backhaul data exists, otherwise single-lane
    const effectivePrice = backhaulRate > 0 ? corridorRevenue : price;
    const effectiveCost  = backhaulCost  > 0 ? corridorCost   : cogs;

    if (effectivePrice <= 0 || vol <= 0) return;

    const marginPerUnit = effectivePrice - effectiveCost;
    const curMargin     = marginPerUnit * vol;
    const marginPct     = effectivePrice > 0 ? (marginPerUnit / effectivePrice) * 100 : 0;

    // Repricing gain from proposed rate change
    const newPrice  = effectivePrice * (1 + pc);
    const newVol    = vol * (1 + el * pc);
    const newMargin = (newPrice - effectiveCost) * Math.max(0, newVol);
    const delta     = newMargin - curMargin;
    p1TotalGain    += delta;

    // WTP headroom
    const wtpGap = effectivePrice * wtp * vol;
    totalWTPGap += wtpGap;

    // Competitor / market rate gap (as % — matches FMCG shape)
    const compGap = (compPrice > 0 && effectivePrice > 0)
      ? ((effectivePrice - compPrice) / compPrice * 100)
      : null;

    // Floor breach — null when no floor set (matches FMCG)
    const floorBreach = floorPct > 0 ? marginPct < (floorPct * 100) : null;

    const rev = effectivePrice * vol;
    totalRevenue          += rev;
    totalPotentialRevenue += effectivePrice * (1 + wtp) * vol;
    totalCurrentMargin    += curMargin;

    p1Results.push({
      sku: r.lane_name || r.lane_id,
      skuId: r.lane_id,
      category: r.route_region || '—',
      price: effectivePrice,
      cogs: effectiveCost,
      vol,
      curMargin,
      delta,
      pc, el, wtp, wtpGap,
      marginPct,
      floorPct: floorPct * 100,
      floorBreach,
      compPrice: compPrice || null,
      compGap,
      // Logistics-specific extras (available in detail views)
      distance,
      backhaulRate,
      backhaulCost,
      backhaulRecovery,
      corridorRevenue,
      corridorCost,
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
