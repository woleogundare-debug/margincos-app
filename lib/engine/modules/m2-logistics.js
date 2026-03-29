import { n } from '../../formatters';

/**
 * M2 — Fuel Price Scenario Engine
 *
 * Same 5-scenario projection as m2-inflation.js but reads logistics field names.
 * Scenarios project margin impact under 40% cost inflation at 0–100% recovery rates.
 *
 * Return shape is identical to m2-inflation.js.
 */
export function computeLogisticsM2(active, base, inflationRate = 0.40) {
  const { totalRevenue, totalCurrentMargin } = base;

  const totalCogsBase = active.reduce(
    (s, r) => s + n(r.fully_loaded_cost_ngn) * n(r.monthly_trips),
    0
  );

  const scenarios = [0, 0.25, 0.50, 0.75, 1.0].map(recoveryRate => {
    const inf           = inflationRate;
    const costShock     = totalCogsBase * inf;
    const absorbed      = costShock * (1 - recoveryRate);
    const projMargin    = totalCurrentMargin - absorbed;
    const marginChange  = projMargin - totalCurrentMargin;
    const projMarginPct = totalRevenue > 0 ? projMargin / totalRevenue * 100 : 0;
    const baseMarginPct = totalRevenue > 0 ? totalCurrentMargin / totalRevenue * 100 : 0;
    const pctPtChange   = projMarginPct - baseMarginPct;

    let riskLevel, riskColor, riskBg;
    if (recoveryRate === 0)        { riskLevel = '⚠ Critical'; riskColor = '#991b1b'; riskBg = '#fee2e2'; }
    else if (recoveryRate <= 0.25) { riskLevel = '⚠ High';     riskColor = '#991b1b'; riskBg = '#fee2e2'; }
    else if (recoveryRate <= 0.50) { riskLevel = '▲ Elevated'; riskColor = '#92400e'; riskBg = '#fef3c7'; }
    else if (recoveryRate <= 0.75) { riskLevel = '◎ Moderate'; riskColor = '#1e40af'; riskBg = '#dbeafe'; }
    else                           { riskLevel = '✓ Protected'; riskColor = '#065f46'; riskBg = '#dcfce7'; }

    return {
      recoveryRate, costShock, absorbed, projMargin,
      marginChange, projMarginPct, pctPtChange,
      riskLevel, riskColor, riskBg,
    };
  });

  return {
    scenarios,
    totalCogsBase,
    worstCase: scenarios[0].marginChange,
    baseCase:  scenarios[2].projMargin,
  };
}
