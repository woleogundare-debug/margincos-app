import { n } from '../../formatters';
import { WORKING_CAPITAL_RATE } from '../../constants';

/**
 * M4 — Customer Profitability Scorecard
 *
 * Reads logistics field names. Structurally identical to m4-distributor.js but
 * groups by customer_name, uses customer_margin_pct, rebate_pct, and
 * payment_terms_days instead of their FMCG counterparts.
 *
 * Return shape is identical to m4-distributor.js.
 */
export function computeLogisticsM4(active, base) {
  const { totalRevenue } = base;
  const distributorMap = {}; // key name kept for dashboard compatibility

  active.filter(r => r.customer_name).forEach(r => {
    const key      = r.customer_name;
    const price    = n(r.contracted_rate_ngn);
    const cogs     = n(r.fully_loaded_cost_ngn);
    const vol      = n(r.monthly_trips);
    const distM    = n(r.customer_margin_pct)  / 100;
    const rebate   = (n(r.rebate_pct) || 0)    / 100;
    const logCost  = 0; // already in fully_loaded_cost_ngn
    const credDays = n(r.payment_terms_days)   || 0;

    const rev        = price * vol;
    const netPrice   = price * (1 - distM - rebate);
    const contMargin = (netPrice - cogs - logCost) * vol;

    // Working capital cost of extended payment terms
    const creditCost = credDays > 0
      ? rev * distM * (credDays / 365) * WORKING_CAPITAL_RATE
      : 0;

    const trueContrib = contMargin - creditCost;

    if (!distributorMap[key]) {
      distributorMap[key] = {
        rev: 0, contMargin: 0, trueContrib: 0,
        vol: 0, skuCount: 0, creditCost: 0, terms: [],
      };
    }
    distributorMap[key].rev         += rev;
    distributorMap[key].contMargin  += contMargin;
    distributorMap[key].trueContrib += trueContrib;
    distributorMap[key].vol         += vol;
    distributorMap[key].skuCount++;
    distributorMap[key].creditCost  += creditCost;

    const termKey = `${distM}-${rebate}-${credDays}`;
    if (!distributorMap[key].terms.find(t => t.key === termKey)) {
      distributorMap[key].terms.push({ key: termKey, distM, rebate, logCost: 0, credDays });
    }
  });

  const results = Object.entries(distributorMap).map(([name, d]) => {
    const contPct  = d.rev > 0 ? d.trueContrib / d.rev * 100 : 0;
    const revShare = totalRevenue > 0 ? d.rev / totalRevenue * 100 : 0;

    let classification, action, classColor, classBg;
    if (contPct >= 15 && revShare >= 10) {
      classification = '★ Strategic';
      action = 'High-value customer — protect terms, invest selectively';
      classColor = '#065f46'; classBg = '#dcfce7';
    } else if (contPct >= 15 && revShare < 10) {
      classification = '▲ Grow';
      action = 'Strong margin, low lanes — expand routes or frequency';
      classColor = '#1e40af'; classBg = '#dbeafe';
    } else if (contPct < 15 && revShare >= 10) {
      classification = '⚠ Renegotiate';
      action = 'High volume, dilutive terms — restructure rate or payment terms urgently';
      classColor = '#92400e'; classBg = '#fef3c7';
    } else {
      classification = '✗ Review';
      action = 'Low margin, low lanes — evaluate continuation of relationship';
      classColor = '#991b1b'; classBg = '#fee2e2';
    }

    return { name, ...d, contPct, revShare, classification, action, classColor, classBg };
  }).sort((a, b) => b.trueContrib - a.trueContrib);

  const totalDistributors = results.length;
  const avgContPct = results.length
    ? results.reduce((s, r) => s + r.contPct, 0) / results.length
    : 0;
  const totalCreditCost  = results.reduce((s, r) => s + r.creditCost, 0);
  const bestDistributor  = results[0] || null;
  const renegotiateCount = results.filter(r => r.classification.includes('Renegotiate')).length;

  return {
    hasData: results.length > 0,
    results,
    totalDistributors,
    avgContPct,
    totalCreditCost,
    bestDistributor,
    renegotiateCount,
  };
}
