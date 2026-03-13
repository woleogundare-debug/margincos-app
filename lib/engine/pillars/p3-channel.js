import { n } from '../../formatters';

/**
 * P3 — Channel Economics
 *
 * `channel_revenue_split` (displayed as "Primary Ch. Vol %") represents the
 * percentage of a single SKU's volume that flows through its primary channel.
 * Each SKU is independent — values across rows do NOT need to sum to 100%.
 *
 * This module aggregates revenue, contribution margin, and WTP gap by channel
 * using `primary_channel` as the grouping key. `channel_revenue_split` is NOT
 * used in the P3 calculation itself; it exists as a user-facing data field for
 * portfolio-level visibility into channel concentration.
 */
export function computeP3(active) {
  const channelMap     = {};
  const distributorMap = {};
  let   totalDistExposure = 0;

  active.forEach(r => {
    const ch      = r.primary_channel || 'OT';
    const price   = n(r.rrp);
    const cogs    = n(r.cogs_per_unit);
    const vol     = n(r.monthly_volume_units);
    const distM   = n(r.distributor_margin_pct);
    const rebate  = n(r.trade_rebate_pct)      || 0;  // new v4.0
    const logCost = n(r.logistics_cost_per_unit) || 0; // new v4.0
    const wtp     = n(r.wtp_premium_pct);

    const rev      = price * vol;
    // v4.0 net price: accounts for distributor margin AND rebate
    const netPrice = price * (1 - distM - rebate);
    // v4.0 contribution: subtracts logistics cost
    const contMargin = (netPrice - cogs - logCost) * vol;
    const wtpGap     = price * wtp * vol;

    // Channel aggregation
    if (!channelMap[ch]) {
      channelMap[ch] = { rev: 0, contMargin: 0, wtpGap: 0, vol: 0, skuCount: 0 };
    }
    channelMap[ch].rev        += rev;
    channelMap[ch].contMargin += contMargin;
    channelMap[ch].wtpGap     += wtpGap;
    channelMap[ch].vol        += vol;
    channelMap[ch].skuCount++;

    // Distributor aggregation — new v4.0
    const distName = r.distributor_name;
    if (distName) {
      if (!distributorMap[distName]) {
        distributorMap[distName] = { rev: 0, contMargin: 0, vol: 0, skuCount: 0, terms: [] };
      }
      distributorMap[distName].rev        += rev;
      distributorMap[distName].contMargin += contMargin;
      distributorMap[distName].vol        += vol;
      distributorMap[distName].skuCount++;
      // Track distinct terms for this distributor
      const termKey = `${distM}-${rebate}-${logCost}`;
      if (!distributorMap[distName].terms.find(t => t.key === termKey)) {
        distributorMap[distName].terms.push({ key: termKey, distM, rebate, logCost });
      }
    }

    totalDistExposure += rev * distM;
  });

  const channelResults = Object.entries(channelMap).map(([ch, d]) => ({
    channel: ch,
    ...d,
    contPct: d.rev > 0 ? d.contMargin / d.rev * 100 : 0,
  })).sort((a, b) => b.rev - a.rev);

  return {
    channelResults,
    distributorMap,
    totalDistExposure,
    hasLogisticsCost:  active.some(r => n(r.logistics_cost_per_unit) > 0),
    hasRebate:         active.some(r => n(r.trade_rebate_pct) > 0),
    hasDistributorName: active.some(r => r.distributor_name),
  };
}
