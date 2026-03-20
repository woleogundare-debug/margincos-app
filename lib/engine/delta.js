/**
 * Compute deltas between current and prior period analysis results.
 * Pure function — no side effects, no Supabase, no React.
 *
 * @param {Object} current - results from runFullAnalysis on active period
 * @param {Object} prior   - results from runFullAnalysis on comparison period
 * @returns {Object|null}  deltas - flat object with delta values and directions, or null
 */
export function computeDeltas(current, prior) {
  if (!current || !prior) return null;

  const delta = (curr, prev) => {
    if (curr == null || prev == null) return null;
    return {
      value:     curr - prev,
      direction: curr > prev ? 'up' : curr < prev ? 'down' : 'flat',
      pctChange: prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null,
    };
  };

  // P1 — Pricing Intelligence
  const p1 = {
    totalGain:          delta(current.p1?.totalGain,          prior.p1?.totalGain),
    totalWTPGap:        delta(current.p1?.totalWTPGap,        prior.p1?.totalWTPGap),
    totalRevenue:       delta(current.p1?.totalRevenue,       prior.p1?.totalRevenue),
    totalCurrentMargin: delta(current.p1?.totalCurrentMargin, prior.p1?.totalCurrentMargin),
    priceRealisation:   delta(current.p1?.priceRealisation,   prior.p1?.priceRealisation),
  };

  // P2 — Cost Pass-Through
  const p2 = {
    totalAbsorbed:   delta(current.p2?.totalAbsorbed,   prior.p2?.totalAbsorbed),
    totalCostShock:  delta(current.p2?.totalCostShock,  prior.p2?.totalCostShock),
    portRecoveryPct: delta(current.p2?.portRecoveryPct, prior.p2?.portRecoveryPct),
    avgAbsorbedPct:  delta(current.p2?.avgAbsorbedPct,  prior.p2?.avgAbsorbedPct),
  };

  // P3 — Channel Economics
  const p3 = {
    totalDistExposure: delta(current.p3?.totalDistExposure, prior.p3?.totalDistExposure),
  };

  // P4 — Trade Execution
  const p4 = {
    totalPromoImpact: delta(current.p4?.totalPromoImpact, prior.p4?.totalPromoImpact),
  };

  // M1 — SKU Rationalisation
  const m1 = {
    marginAtStake: delta(current.m1?.marginAtStake, prior.m1?.marginAtStake),
    dilutiveCount: delta(current.m1?.dilutiveCount,  prior.m1?.dilutiveCount),
  };

  // M2 — Inflation Scenario
  const m2 = {
    worstCase: delta(current.m2?.worstCase, prior.m2?.worstCase),
  };

  // M3 — Trade ROI
  const m3 = {
    blendedROI: delta(current.m3?.blendedROI, prior.m3?.blendedROI),
    totalSpend:  delta(current.m3?.totalSpend,  prior.m3?.totalSpend),
  };

  // M4 — Distributor Scoring
  const m4 = {
    totalCreditCost:  delta(current.m4?.totalCreditCost,  prior.m4?.totalCreditCost),
    renegotiateCount: delta(current.m4?.renegotiateCount, prior.m4?.renegotiateCount),
  };

  // Portfolio-level summary — uses top-level runFullAnalysis output keys
  const portfolio = {
    skuCount:           delta(current.skuCount,           prior.skuCount),
    revenue:            delta(current.totalRevenue,       prior.totalRevenue),
    totalCurrentMargin: delta(current.totalCurrentMargin, prior.totalCurrentMargin),
    revenueAtRisk:      delta(current.revenueAtRisk,      prior.revenueAtRisk),
    marginProtected:    delta(current.p1?.totalGain,      prior.p1?.totalGain),
    costAbsorbed:       delta(current.p2?.totalAbsorbed,  prior.p2?.totalAbsorbed),
    channelExposure:    delta(current.p3?.totalDistExposure, prior.p3?.totalDistExposure),
  };

  return { p1, p2, p3, p4, m1, m2, m3, m4, portfolio };
}

/**
 * Compute per-SKU deltas for pillar table Δ columns.
 * Matches SKUs by sku_id between periods.
 *
 * @param {Array}  currentRows - pillar results array from current period
 * @param {Array}  priorRows   - pillar results array from comparison period
 * @param {string} metricKey   - the key to diff (e.g. 'delta', 'absorbed', 'contMargin')
 * @returns {Map} sku_id → { value, direction, pctChange }
 */
export function computeSkuDeltas(currentRows, priorRows, metricKey) {
  if (!currentRows || !priorRows) return new Map();

  const priorMap = new Map();
  priorRows.forEach(row => {
    const id = row.skuId || row.sku_id || row.sku;
    if (id) priorMap.set(id, row[metricKey] ?? null);
  });

  const deltas = new Map();
  currentRows.forEach(row => {
    const id   = row.skuId || row.sku_id || row.sku;
    if (!id) return;
    const curr = row[metricKey] ?? null;
    const prev = priorMap.get(id) ?? null;
    if (curr != null && prev != null) {
      deltas.set(id, {
        value:     curr - prev,
        direction: curr > prev ? 'up' : curr < prev ? 'down' : 'flat',
        pctChange: prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null,
      });
    } else if (curr != null && prev == null) {
      deltas.set(id, { value: curr, direction: 'new', pctChange: null });
    }
  });

  return deltas;
}
