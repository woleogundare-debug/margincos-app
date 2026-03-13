import { n } from '../../formatters';

export function computeP2(active) {
  let p2Results = [], totalAbsorbed = 0, totalCostShock = 0;

  active.forEach(r => {
    const cogs        = n(r.cogs_per_unit);
    const vol         = n(r.monthly_volume_units);
    const fxExposure  = n(r.fx_exposure_pct);  // new v4.0

    // Actual inflation: use prior period COGS if provided, else self-reported rate
    const priorCogs = n(r.cogs_prior_period);  // new v4.0
    const inf = (priorCogs > 0 && cogs > 0)
      ? (cogs - priorCogs) / priorCogs
      : n(r.cogs_inflation_rate);

    const pt = n(r.pass_through_rate);

    const cogsTotal = cogs * vol;
    const shock     = cogsTotal * inf;
    const passed    = shock * pt;
    const absorbed  = shock - passed;

    // FX decomposition — new v4.0
    const fxAbsorbed    = absorbed * fxExposure;
    const nonFxAbsorbed = absorbed - fxAbsorbed;

    totalCostShock += shock;
    totalAbsorbed  += absorbed;

    if (shock > 0) {
      p2Results.push({
        sku: r.sku_name || r.sku_id,
        skuId: r.sku_id,
        category: r.category || '—',
        shock, passed, absorbed,
        inf, pt,
        fxExposure, fxAbsorbed, nonFxAbsorbed,
        usedActualInflation: priorCogs > 0,
        absorbedPct: shock > 0 ? absorbed / shock * 100 : 0,
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
