import { n } from '../../formatters';
import { WORKING_CAPITAL_RATE } from '../../constants';

export function computeM4(active, base) {
  const { totalRevenue } = base;
  const distributorMap = {};

  active.filter(r => r.distributor_name).forEach(r => {
    const key      = r.distributor_name;
    const price    = n(r.rrp);
    const cogs     = n(r.cogs_per_unit);
    const vol      = n(r.monthly_volume_units);
    const distM    = n(r.distributor_margin_pct) / 100;
    const rebate   = (n(r.trade_rebate_pct) || 0) / 100;
    const logCost  = n(r.logistics_cost_per_unit) || 0;
    const credDays = n(r.credit_days)             || 0;

    const rev        = price * vol;
    const netPrice   = price * (1 - distM - rebate);
    const contMargin = (netPrice - cogs - logCost) * vol;

    // Working capital cost of credit extension
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

    const termKey = `${distM}-${rebate}-${logCost}-${credDays}`;
    if (!distributorMap[key].terms.find(t => t.key === termKey)) {
      distributorMap[key].terms.push({ key: termKey, distM, rebate, logCost, credDays });
    }
  });

  const results = Object.entries(distributorMap).map(([name, d]) => {
    const contPct  = d.rev > 0 ? d.trueContrib / d.rev * 100 : 0;
    const revShare = totalRevenue > 0 ? d.rev / totalRevenue * 100 : 0;

    let classification, action, classColor, classBg;
    if (contPct >= 15 && revShare >= 10) {
      classification = '★ Strategic';
      action = 'High-value, high-volume — protect terms, invest selectively';
      classColor = '#065f46'; classBg = '#dcfce7';
    } else if (contPct >= 15 && revShare < 10) {
      classification = '▲ Grow';
      action = 'Strong margin, low volume — explore geographic or category expansion';
      classColor = '#1e40af'; classBg = '#dbeafe';
    } else if (contPct < 15 && revShare >= 10) {
      classification = '⚠ Renegotiate';
      action = 'High volume, dilutive terms — restructure trade terms urgently';
      classColor = '#92400e'; classBg = '#fef3c7';
    } else {
      classification = '✗ Review';
      action = 'Low margin, low volume — evaluate continuation of relationship';
      classColor = '#991b1b'; classBg = '#fee2e2';
    }

    return { name, ...d, contPct, revShare, classification, action, classColor, classBg };
  }).sort((a, b) => b.trueContrib - a.trueContrib);

  const totalDistributors = results.length;
  const avgContPct = results.length
    ? results.reduce((s, r) => s + r.contPct, 0) / results.length
    : 0;
  const totalCreditCost = results.reduce((s, r) => s + r.creditCost, 0);
  const bestDistributor = results[0] || null;
  const renegotiateCount = results.filter(r => r.classification.includes('Renegotiate')).length;

  return {
    hasData:          results.length > 0,
    results,
    totalDistributors,
    avgContPct,
    totalCreditCost,
    bestDistributor,
    renegotiateCount,
  };
}
