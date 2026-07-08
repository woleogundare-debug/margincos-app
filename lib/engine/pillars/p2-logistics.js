import { n, nOrNull } from '../../formatters';

/**
 * P2 - Fuel Cost Recovery
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
    const fxExposure = n(r.fx_exposure_pct);  // 0/absent = no FX (benign default)

    // Actual inflation: use prior period cost if provided, else self-reported
    // rate. nOrNull preserves "missing" so a blank inflation is not read as 0%.
    const priorCost   = n(r.prior_period_cost_ngn);
    const infReported = nOrNull(r.cost_inflation_pct);  // decimal 0..1 or null
    const inf = (priorCost > 0 && cogs > 0)
      ? (cogs - priorCost) / priorCost
      : infReported;

    // nOrNull preserves "missing" so a blank pass-through is not read as 0% recovery.
    const pt = nOrNull(r.pass_through_rate);  // decimal 0..1 or null

    // Missing data: inflation or pass-through unknown -> recovery is not
    // computable. Surface as a data-missing row and EXCLUDE from aggregates
    // rather than counting it as 100% absorbed. See CONVENTIONS.md.
    if (inf === null || pt === null) {
      p2Results.push({
        sku: r.lane_name || r.lane_id,
        skuId: r.lane_id,
        category: r.route_region || '-',
        shock: null, passed: null, absorbed: null,
        inf, pt,
        fxExposure, fxAbsorbed: null, nonFxAbsorbed: null,
        usedActualInflation: priorCost > 0,
        absorbedPct: null,
        dataMissing: true,
        _division: r._division || null,
      });
      return;
    }

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
        category: r.route_region || '-',
        shock, passed, absorbed,
        inf, pt,
        fxExposure, fxAbsorbed, nonFxAbsorbed,
        usedActualInflation: priorCost > 0,
        absorbedPct: shock > 0 ? absorbed / shock * 100 : 0,
        dataMissing: false,
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
