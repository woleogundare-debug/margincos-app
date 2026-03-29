import { n } from '../../formatters';

/**
 * M3 — Contract Discount ROI
 *
 * Unlike FMCG M3 which reads from the trade_investment table (which is empty for
 * Logistics periods), this module computes ROI directly from lane rows.
 *
 * Discount spend  = contracted_rate × discount_depth_pct × monthly_trips (revenue foregone)
 * Incremental return = margin on volume uplift driven by the discount
 *
 * Return shape is identical to m3-trade-roi.js.
 */
export function computeLogisticsM3(active) {
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
  const bestChannel  = withROI.length ? withROI[0] : null;
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
