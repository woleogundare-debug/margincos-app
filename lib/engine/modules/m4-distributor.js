import { n } from '../../formatters';
import { WORKING_CAPITAL_RATE } from '../../constants';

// Local abbreviated-currency formatter (honours the passed symbol).
function fmtMoney(v, sym) {
  const abs = Math.abs(v || 0);
  const s = (v || 0) < 0 ? '-' : '';
  if (abs >= 1e9) return `${s}${sym}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${s}${sym}${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${s}${sym}${(abs / 1e3).toFixed(0)}K`;
  return `${s}${sym}${abs.toFixed(0)}`;
}

export function computeM4(active, base, currencySym = '₦') {
  const { totalRevenue } = base;
  const distributorMap = {};

  active.filter(r => r.distributor_name).forEach(r => {
    const key      = r.distributor_name;
    const price    = n(r.rrp);
    const cogs     = n(r.cogs_per_unit);
    const vol      = n(r.monthly_volume_units);
    const distM    = n(r.distributor_margin_pct);   // template-decimal 0..1
    const rebate   = n(r.trade_rebate_pct) || 0;    // template-decimal 0..1
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
      action = 'High-value, high-volume - protect terms, invest selectively';
      classColor = '#065f46'; classBg = '#dcfce7';
    } else if (contPct >= 15 && revShare < 10) {
      classification = '▲ Grow';
      action = 'Strong margin, low volume - explore geographic or category expansion';
      classColor = '#1e40af'; classBg = '#dbeafe';
    } else if (contPct < 15 && revShare >= 10) {
      classification = '⚠ Renegotiate';
      action = 'High volume, dilutive terms - restructure trade terms urgently';
      classColor = '#92400e'; classBg = '#fef3c7';
    } else {
      classification = '✗ Review';
      action = 'Low margin, low volume - evaluate continuation of relationship';
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

  // ── Waterfall data: worst -> best, with running cumulative + anchor total ──
  const resultsAsc = [...results].sort((a, b) => a.trueContrib - b.trueContrib);
  let cum = 0;
  const waterfall = resultsAsc.map(r => {
    cum += r.trueContrib;
    return {
      name: r.name,
      contribution: r.trueContrib,   // ₦ absolute (may be negative)
      cumulative: cum,
      classification: r.classification,
    };
  });
  const portfolioTotal = cum;

  // ── Finding sentence (engine-side) ──
  const bottomN   = Math.min(3, results.length);
  const bottom    = resultsAsc.slice(0, bottomN);
  const monthlyDestroy   = bottom.filter(r => r.trueContrib < 0).reduce((s, r) => s + r.trueContrib, 0);
  const annualDestruction = Math.abs(monthlyDestroy) * 12;
  const atRisk    = results.filter(r => r.classification.includes('Renegotiate') || r.classification.includes('Review'));
  const revenueAtRiskPct = Math.round(atRisk.reduce((s, r) => s + r.revShare, 0));
  const bottomAvgContPct = bottom.length ? bottom.reduce((s, r) => s + r.contPct, 0) / bottom.length : 0;

  let sentence;
  if (results.length === 0) {
    sentence = 'No distributor data captured - populate distributor names and terms to activate this exhibit.';
  } else if (annualDestruction > 0) {
    sentence = `Bottom ${bottomN} distributor${bottomN !== 1 ? 's are' : ' is'} destroying ${fmtMoney(annualDestruction, currencySym)} of contribution annually - ${revenueAtRiskPct}% of revenue at risk.`;
  } else {
    sentence = `${revenueAtRiskPct}% of revenue runs through Renegotiate or Review distributors - the weakest ${bottomN} net just ${bottomAvgContPct.toFixed(0)}% contribution.`;
  }

  // Adaptive primitive: a waterfall only tells its story when there is
  // destruction to show. With no negative-contribution distributor it collapses
  // into a Pareto climb, so fall back to a ranked bar. The renderer switches on
  // this field (PLATFORM.ADAPTIVE_CHART_PRIMITIVES).
  const anyNegative = results.some(r => r.trueContrib < 0);
  const renderPrimitive = anyNegative ? 'waterfall' : 'ranked_bar';

  const finding = {
    label: 'M4 · DISTRIBUTOR PERFORMANCE',
    sentence,
    metrics: { bottomN, annualDestruction, revenueAtRiskPct },
  };

  return {
    hasData:          results.length > 0,
    results,
    totalDistributors,
    avgContPct,
    totalCreditCost,
    bestDistributor,
    renegotiateCount,
    waterfall,
    portfolioTotal,
    renderPrimitive,
    finding,
  };
}
