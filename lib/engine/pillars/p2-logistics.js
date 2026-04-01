import { n } from '../../formatters';

/**
 * P2 — Fuel Cost Recovery
 *
 * Reads logistics field names. Logic is structurally identical to p2-cost.js
 * but uses logistics columns for cost, inflation rate, and pass-through.
 *
 * Return shape is identical to p2-cost.js.
 */
export function computeLogisticsP2(active) {
  let p2Results = [], totalAbsorbed = 0, totalCostShock = 0;

  active.forEach(r => {
    const cogs       = n(r.fully_loaded_cost_ngn);
    const vol        = n(r.monthly_trips);
    const fxExposure = n(r.fx_exposure_pct) / 100;

    // Actual inflation: use prior period cost if provided, else self-reported rate
    const priorCost = n(r.prior_period_cost_ngn);
    const inf = (priorCost > 0 && cogs > 0)
      ? (cogs - priorCost) / priorCost
      : n(r.cost_inflation_pct) / 100;

    const pt = n(r.pass_through_rate) / 100;

    const cogsTotal = cogs * vol;
    const shock     = cogsTotal * inf;
    const passed    = shock * pt;
    const absorbed  = shock - passed;

    // FX decomposition
    const fxAbsorbed    = absorbed * fxExposure;
    const nonFxAbsorbed = absorbed - fxAbsorbed;

    totalCostShock += shock;
    totalAbsorbed  += absorbed;

    if (shock > 0) {
      p2Results.push({
        sku: r.lane_name || r.lane_id,
        skuId: r.lane_id,
        category: r.route_region || '—',
        shock, passed, absorbed,
        inf, pt,
        fxExposure, fxAbsorbed, nonFxAbsorbed,
        usedActualInflation: priorCost > 0,
        absorbedPct: shock > 0 ? absorbed / shock * 100 : 0,
        _division: r._division || null,
      });
    }
  });

  const avgAbsorbedPct = totalCostShock > 0
    ? totalAbsorbed / totalCostShock * 100
    : 0;
  const portRecoveryPct = 100 - avgAbsorbedPct;

  return {
    results: p2Results,
    totalAbsorbed,
    totalCostShock,
    avgAbsorbedPct,
    portRecoveryPct,
  };
}
