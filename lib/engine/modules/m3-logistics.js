import { n } from '../../formatters';

/**
 * M3 — Contract Discount ROI (Logistics)
 *
 * Two modes:
 *
 * 1. Commercial Investment mode (preferred):
 *    When logistics_commercial_investment rows are provided, calculates ROI per
 *    contract type as: netRev (P3 contribution margin) / total commercial investment spend.
 *    Mirrors the FMCG m3-trade-roi.js pattern exactly.
 *
 * 2. Lane Discount mode (fallback):
 *    When no commercial investment data exists, computes ROI from lane rows using
 *    discount depth / volume response — the original lane-based calculation.
 *
 * Return shape is identical to m3-trade-roi.js in both modes.
 */
export function computeLogisticsM3(active, commercialInvestment = [], p3Results = null) {

  // ── MODE 1: Commercial Investment path ───────────────────────
  if (commercialInvestment && commercialInvestment.length > 0 && p3Results) {
    // Build spend map from logistics_commercial_investment rows
    const channelSpend = {};
    commercialInvestment.forEach(row => {
      const ct    = row.contract_type;
      const total =
        n(row.volume_rebates) +
        n(row.fuel_surcharge_waivers) +
        n(row.rate_holddowns) +
        n(row.deadhead_absorption) +
        n(row.credit_extension_cost) +
        n(row.fleet_dedication_premium);

      channelSpend[ct] = {
        volume_rebates:           n(row.volume_rebates),
        fuel_surcharge_waivers:   n(row.fuel_surcharge_waivers),
        rate_holddowns:           n(row.rate_holddowns),
        deadhead_absorption:      n(row.deadhead_absorption),
        credit_extension_cost:    n(row.credit_extension_cost),
        fleet_dedication_premium: n(row.fleet_dedication_premium),
        total,
      };
    });

    // Build channel net revenue lookup from P3 results
    const channelNetRev = {};
    (p3Results.channelResults || []).forEach(c => {
      channelNetRev[c.channel] = c.contMargin;
    });

    // Compute ROI per contract type
    const results = Object.entries(channelSpend).map(([ct, spend]) => {
      const netRev         = channelNetRev[ct] || 0;
      const roi            = spend.total > 0 ? netRev / spend.total : null;
      const roiPct         = spend.total > 0 ? (netRev - spend.total) / spend.total * 100 : null;
      const channelRevData = (p3Results.channelResults || []).find(c => c.channel === ct);
      const grossRev       = channelRevData?.rev || 0;
      const spendIntensity = grossRev > 0 ? spend.total / grossRev * 100 : null;

      let status, statusColor, statusBg;
      if (roi === null)     { status = 'No Data';    statusColor = '#64748b'; statusBg = '#f1f5f9'; }
      else if (roi >= 2)    { status = 'Accretive';  statusColor = '#065f46'; statusBg = '#dcfce7'; }
      else if (roi >= 0.5)  { status = 'Neutral';    statusColor = '#92400e'; statusBg = '#fef3c7'; }
      else                  { status = 'Dilutive';   statusColor = '#991b1b'; statusBg = '#fee2e2'; }

      return {
        channel: ct,
        ...spend,
        netRev, roi, roiPct, spendIntensity,
        status, statusColor, statusBg,
      };
    }).sort((a, b) => (b.roi || -999) - (a.roi || -999));

    // Category totals
    const categoryTotals = {
      volume_rebates:           0,
      fuel_surcharge_waivers:   0,
      rate_holddowns:           0,
      deadhead_absorption:      0,
      credit_extension_cost:    0,
      fleet_dedication_premium: 0,
    };
    commercialInvestment.forEach(row => {
      Object.keys(categoryTotals).forEach(k => {
        categoryTotals[k] += n(row[k]);
      });
    });
    const totalSpend = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

    const withROI      = results.filter(r => r.roi !== null && r.total > 0);
    const bestChannel  = withROI.length ? withROI[0]                         : null;
    const worstChannel = withROI.length ? withROI[withROI.length - 1]        : null;
    const totalNetRev  = results.reduce((s, r) => s + r.netRev, 0);
    const blendedROI   = totalSpend > 0 ? totalNetRev / totalSpend : null;

    return { hasData: true, results, totalSpend, categoryTotals, blendedROI, bestChannel, worstChannel };
  }

  // ── MODE 2: Lane Discount fallback ──────────────────────────
  const channelMap = {};
  let   totalSpend = 0;

  active.forEach(r => {
    const ct    = r.contract_type || 'Other';
    const rate  = n(r.contracted_rate_ngn);
    const cogs  = n(r.fully_loaded_cost_ngn);
    const vol   = n(r.monthly_trips);
    const depth = n(r.discount_depth_pct) / 100;
    const lift  = n(r.volume_response_pct) / 100;

    if (depth <= 0) return;

    // Revenue foregone from discount
    const spend = rate * depth * vol;

    // Incremental margin from volume response
    const liftVol    = vol * lift;
    const liftMargin = (rate * (1 - depth) - cogs) * liftVol;

    // Net impact of this lane's discount
    const netReturn = liftMargin - spend;

    if (!channelMap[ct]) {
      channelMap[ct] = {
        total: 0, spend: 0, netReturn: 0, netRev: 0,
        roi: null, roiPct: null, laneCount: 0,
        statusColor: '', statusBg: '',
      };
    }
    channelMap[ct].total     += rate * vol;
    channelMap[ct].spend     += spend;
    channelMap[ct].netReturn += netReturn;
    channelMap[ct].laneCount++;

    totalSpend += spend;
  });

  // Build results array — mirror FMCG M3 result shape
  const results = Object.entries(channelMap).map(([channel, d]) => {
    const roi            = d.spend > 0 ? d.netReturn / d.spend : null;
    const roiPct         = d.spend > 0 ? (d.netReturn / d.spend) * 100 : null;
    const spendIntensity = d.total > 0 ? d.spend / d.total * 100 : null;

    let status, statusColor, statusBg;
    if (roi === null)    { status = 'No Data';   statusColor = '#64748b'; statusBg = '#f1f5f9'; }
    else if (roi >= 2)   { status = 'Accretive'; statusColor = '#065f46'; statusBg = '#dcfce7'; }
    else if (roi >= 0.5) { status = 'Neutral';   statusColor = '#92400e'; statusBg = '#fef3c7'; }
    else                 { status = 'Dilutive';  statusColor = '#991b1b'; statusBg = '#fee2e2'; }

    return {
      channel,
      // Spend breakdown mirrors FMCG columns (collapsed to 'other_trade_spend' equivalent)
      listing_fees:      0,
      coop_spend:        0,
      activation_budget: 0,
      gondola_payments:  0,
      other_trade_spend: d.spend,
      total: d.spend,
      netRev: d.netReturn,
      roi, roiPct, spendIntensity,
      status, statusColor, statusBg,
      // Logistics extras
      laneCount: d.laneCount,
      grossRevenue: d.total,
    };
  }).sort((a, b) => ((b.roi || -999) - (a.roi || -999)));

  // Category totals — logistics only has other_trade_spend equivalent
  const categoryTotals = {
    listing_fees:      0,
    coop_spend:        0,
    activation_budget: 0,
    gondola_payments:  0,
    other_trade_spend: totalSpend,
  };

  // Best/worst ROI channel — full objects to match FMCG shape
  const withROI      = results.filter(r => r.roi !== null && r.total > 0);
  const bestChannel  = withROI.length ? withROI[0]                  : null;
  const worstChannel = withROI.length ? withROI[withROI.length - 1] : null;

  // Blended portfolio ROI
  const totalNetRev = results.reduce((s, r) => s + r.netRev, 0);
  const blendedROI  = totalSpend > 0 ? totalNetRev / totalSpend : null;

  return {
    hasData: results.length > 0,
    results,
    totalSpend,
    categoryTotals,
    blendedROI,
    bestChannel,
    worstChannel,
  };
}
