import { n } from '../../formatters';

/**
 * P3 — Customer Mix Analysis
 *
 * Groups by contract_type (→ channelResults) and customer_name (→ distributorMap).
 * The distributorMap key name is preserved for dashboard compatibility —
 * consumers that render distributor data will see customer names under the same key.
 *
 * logistics_cost_per_unit is set to 0 because it is already baked into
 * fully_loaded_cost_ngn. hasLogisticsCost is always false for the same reason.
 *
 * Return shape is identical to p3-channel.js, with one additive field: truckResults.
 */
export function computeLogisticsP3(active) {
  const channelMap     = {};
  const distributorMap = {};
  const truckMap       = {};
  let   totalDistExposure = 0;

  active.forEach(r => {
    const ch      = r.contract_type || 'OT';
    const price   = n(r.contracted_rate_ngn);
    const cogs    = n(r.fully_loaded_cost_ngn);
    const vol     = n(r.monthly_trips);
    const distM   = n(r.customer_margin_pct)  / 100;
    const rebate  = n(r.rebate_pct)           / 100 || 0;
    const logCost = 0; // already in fully_loaded_cost_ngn
    const wtp     = n(r.rate_headroom_pct)    / 100;

    const rev        = price * vol;
    const netPrice   = price * (1 - distM - rebate);
    const contMargin = (netPrice - cogs - logCost) * vol;
    const wtpGap     = price * wtp * vol;

    // Channel aggregation (by contract_type)
    if (!channelMap[ch]) {
      channelMap[ch] = { rev: 0, contMargin: 0, wtpGap: 0, vol: 0, skuCount: 0 };
    }
    channelMap[ch].rev        += rev;
    channelMap[ch].contMargin += contMargin;
    channelMap[ch].wtpGap     += wtpGap;
    channelMap[ch].vol        += vol;
    channelMap[ch].skuCount++;

    // Customer aggregation (replaces distributor — same key name for dashboard compat)
    const custName = r.customer_name;
    if (custName) {
      if (!distributorMap[custName]) {
        distributorMap[custName] = { rev: 0, contMargin: 0, vol: 0, skuCount: 0, terms: [] };
      }
      distributorMap[custName].rev        += rev;
      distributorMap[custName].contMargin += contMargin;
      distributorMap[custName].vol        += vol;
      distributorMap[custName].skuCount++;
      const termKey = `${distM}-${rebate}`;
      if (!distributorMap[custName].terms.find(t => t.key === termKey)) {
        distributorMap[custName].terms.push({ key: termKey, distM, rebate, logCost: 0 });
      }
    }

    // Truck aggregation — logistics-specific
    const truckId = r.truck_id;
    if (truckId) {
      if (!truckMap[truckId]) {
        truckMap[truckId] = { rev: 0, contMargin: 0, vol: 0, laneCount: 0 };
      }
      truckMap[truckId].rev        += rev;
      truckMap[truckId].contMargin += contMargin;
      truckMap[truckId].vol        += vol;
      truckMap[truckId].laneCount++;
    }

    totalDistExposure += rev * distM;
  });

  const channelResults = Object.entries(channelMap).map(([ch, d]) => ({
    channel: ch,
    ...d,
    contPct: d.rev > 0 ? d.contMargin / d.rev * 100 : 0,
  })).sort((a, b) => b.rev - a.rev);

  const truckResults = Object.entries(truckMap).map(([truckId, d]) => ({
    truckId,
    ...d,
    contPct: d.rev > 0 ? d.contMargin / d.rev * 100 : 0,
  })).sort((a, b) => b.rev - a.rev);

  return {
    channelResults,
    distributorMap,
    totalDistExposure,
    hasLogisticsCost:   false, // always false — already in fully_loaded_cost_ngn
    hasRebate:          active.some(r => n(r.rebate_pct) > 0),
    hasDistributorName: active.some(r => r.customer_name),
    // Logistics bonus field (dashboard renders if present)
    truckResults,
  };
}
