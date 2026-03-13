import { n } from '../../formatters';

export function computeM3(tradeInvestment, p3Results) {
  if (!tradeInvestment || tradeInvestment.length === 0) {
    return { hasData: false, results: [], totalSpend: 0, categoryTotals: {} };
  }

  // Build channel spend map from trade_investment rows
  const channelSpend = {};
  tradeInvestment.forEach(row => {
    const ch    = row.channel;
    const total =
      (n(row.listing_fees) +
       n(row.coop_spend) +
       n(row.activation_budget) +
       n(row.gondola_payments) +
       n(row.other_trade_spend));

    channelSpend[ch] = {
      listing_fees:      n(row.listing_fees),
      coop_spend:        n(row.coop_spend),
      activation_budget: n(row.activation_budget),
      gondola_payments:  n(row.gondola_payments),
      other_trade_spend: n(row.other_trade_spend),
      total,
    };
  });

  // Build channel net revenue lookup from P3 results
  const channelNetRev = {};
  (p3Results.channelResults || []).forEach(c => {
    channelNetRev[c.channel] = c.contMargin;
  });

  // Compute ROI per channel
  const results = Object.entries(channelSpend).map(([ch, spend]) => {
    const netRev         = channelNetRev[ch] || 0;
    const roi            = spend.total > 0 ? netRev / spend.total : null;
    const roiPct         = spend.total > 0 ? (netRev - spend.total) / spend.total * 100 : null;
    const channelRevData = (p3Results.channelResults || []).find(c => c.channel === ch);
    const grossRev       = channelRevData?.rev || 0;
    const spendIntensity = grossRev > 0 ? spend.total / grossRev * 100 : null;

    let status, statusColor, statusBg;
    if (roi === null)     { status = 'No Data';    statusColor = '#64748b'; statusBg = '#f1f5f9'; }
    else if (roi >= 2)    { status = 'Accretive';  statusColor = '#065f46'; statusBg = '#dcfce7'; }
    else if (roi >= 0.5)  { status = 'Neutral';    statusColor = '#92400e'; statusBg = '#fef3c7'; }
    else                  { status = 'Dilutive';   statusColor = '#991b1b'; statusBg = '#fee2e2'; }

    return { channel: ch, ...spend, netRev, roi, roiPct, spendIntensity, status, statusColor, statusBg };
  }).sort((a, b) => (b.roi || -999) - (a.roi || -999));

  // Category totals across all channels
  const categoryTotals = {
    listing_fees:      0,
    coop_spend:        0,
    activation_budget: 0,
    gondola_payments:  0,
    other_trade_spend: 0,
  };
  tradeInvestment.forEach(row => {
    Object.keys(categoryTotals).forEach(k => {
      categoryTotals[k] += n(row[k]);
    });
  });
  const totalSpend = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  // Best/worst ROI channel
  const withROI      = results.filter(r => r.roi !== null && r.total > 0);
  const bestChannel  = withROI.length ? withROI[0] : null;
  const worstChannel = withROI.length ? withROI[withROI.length - 1] : null;

  // Blended portfolio ROI
  const totalNetRev = results.reduce((s, r) => s + r.netRev, 0);
  const blendedROI  = totalSpend > 0 ? totalNetRev / totalSpend : null;

  return {
    hasData: true,
    results,
    totalSpend,
    categoryTotals,
    blendedROI,
    bestChannel,
    worstChannel,
  };
}
