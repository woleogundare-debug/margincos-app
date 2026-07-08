import { n, nOrNull } from '../../formatters';

export function computeP2(active) {
  let p2Results = [], totalAbsorbed = 0, totalCostShock = 0;

  active.forEach(r => {
    const cogs        = n(r.cogs_per_unit);
    const vol         = n(r.monthly_volume_units);
    const fxExposure  = n(r.fx_exposure_pct);  // 0/absent = no FX (benign default)

    // Actual inflation: use prior period COGS if provided, else self-reported
    // rate. nOrNull preserves "missing" so a blank inflation is not read as 0%.
    const priorCogs   = n(r.cogs_prior_period);  // new v4.0
    const infReported = nOrNull(r.cogs_inflation_rate);  // decimal 0..1 or null
    const inf = (priorCogs > 0 && cogs > 0)
      ? (cogs - priorCogs) / priorCogs
      : infReported;

    // nOrNull preserves "missing" so a blank pass-through is not read as 0% recovery.
    const pt = nOrNull(r.pass_through_rate);  // decimal 0..1 or null

    // Missing data: inflation or pass-through unknown -> recovery is not
    // computable. Surface as a data-missing row and EXCLUDE from aggregates
    // rather than counting it as 100% absorbed. See CONVENTIONS.md.
    if (inf === null || pt === null) {
      p2Results.push({
        sku: r.sku_name || r.sku_id,
        skuId: r.sku_id,
        category: r.category || '-',
        shock: null, passed: null, absorbed: null,
        inf, pt,
        fxExposure, fxAbsorbed: null, nonFxAbsorbed: null,
        usedActualInflation: priorCogs > 0,
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

    // FX decomposition - new v4.0
    const fxAbsorbed    = absorbed * fxExposure;
    const nonFxAbsorbed = absorbed - fxAbsorbed;

    totalCostShock += shock;
    totalAbsorbed  += absorbed;

    if (shock > 0) {
      p2Results.push({
        sku: r.sku_name || r.sku_id,
        skuId: r.sku_id,
        category: r.category || '-',
        shock, passed, absorbed,
        inf, pt,
        fxExposure, fxAbsorbed, nonFxAbsorbed,
        usedActualInflation: priorCogs > 0,
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
