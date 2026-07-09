import { n } from '../../formatters';

// Local abbreviated-currency formatter (engine-side, honours the passed symbol
// like the Excel exporters do, rather than the module-global formatter symbol).
function fmtMoney(v, sym) {
  const abs = Math.abs(v || 0);
  const s = (v || 0) < 0 ? '-' : '';
  if (abs >= 1e9) return `${s}${sym}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${s}${sym}${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${s}${sym}${(abs / 1e3).toFixed(0)}K`;
  return `${s}${sym}${abs.toFixed(0)}`;
}

export function computeM1(active, base, currencySym = '₦') {
  const { totalRevenue, totalCurrentMargin } = base;

  const portfolioAvgMarginPct = totalRevenue > 0
    ? active.reduce((s, r) => {
        const price = n(r.rrp), cogs = n(r.cogs_per_unit);
        return price > 0 ? s + ((price - cogs) / price * 100) : s;
      }, 0) / active.filter(r => n(r.rrp) > 0).length
    : 0;

  const results = [];
  active.forEach(r => {
    const price = n(r.rrp), cogs = n(r.cogs_per_unit), vol = n(r.monthly_volume_units);
    if (price === 0 || vol === 0) return;

    const skuRevenue   = price * vol;
    const skuMarginAbs = (price - cogs) * vol;
    const skuMarginPct = (price - cogs) / price * 100;
    const revShare     = totalRevenue > 0 ? skuRevenue / totalRevenue * 100 : 0;
    const vsAvg        = skuMarginPct - portfolioAvgMarginPct;
    const highVol      = revShare >= 5;
    const highMargin   = skuMarginPct >= portfolioAvgMarginPct;

    // Per-SKU margin at stake: monthly margin forgone vs portfolio-average
    // margin. max(0, ...) naturally zeroes Protect/Grow (above-average) SKUs;
    // Reprice/Review (below-average) carry positive exposure. Derived field
    // only - classification logic is unchanged.
    const marginAtStake = Math.max(0, (portfolioAvgMarginPct - skuMarginPct) / 100 * skuRevenue);

    let classification, action, classColor, classBg;
    if (highMargin && highVol) {
      classification = '★ Protect';
      action = 'Core value driver - defend pricing and volume';
      classColor = '#065f46'; classBg = '#dcfce7';
    } else if (highMargin && !highVol) {
      classification = '▲ Grow';
      action = 'Strong margin, low volume - invest to scale';
      classColor = '#1e40af'; classBg = '#dbeafe';
    } else if (!highMargin && highVol) {
      classification = '⚠ Reprice';
      action = 'High volume, dilutive margin - pricing review required';
      classColor = '#92400e'; classBg = '#fef3c7';
    } else {
      classification = '✗ Review';
      action = 'Low margin, low volume - delist or restructure';
      classColor = '#991b1b'; classBg = '#fee2e2';
    }

    results.push({
      sku: r.sku_name || r.sku_id,
      skuId: r.sku_id,
      category: r.category || '-',
      skuRevenue, skuMarginPct, skuMarginAbs, revShare, vsAvg,
      marginAtStake,
      classification, action, classColor, classBg,
      highMargin, highVol,
      _division: r._division || null,
    });
  });

  const dilutiveCount  = results.filter(s => !s.highMargin).length;
  const dilutiveMargin = results.filter(s => !s.highMargin).reduce((s, r) => s + r.skuMarginAbs, 0);
  const marginAtStake  = Math.abs(
    totalCurrentMargin - results.filter(s => s.highMargin).reduce((s, r) => s + r.skuMarginAbs, 0)
  );

  // ── Finding sentence (engine-side, single source for dashboard/PDF/Excel).
  // "Exposure" = margin at stake (₦). The Marimekko finding and the ranked-bar
  // annotation both use this same numerator/denominator so the two M1 exhibits
  // tell one story (gate 4 unification).
  const reviewResults       = results.filter(s => s.classification.includes('Review'));
  const reviewRevenuePct    = Math.round(reviewResults.reduce((s, r) => s + r.revShare, 0));
  const atRiskCount         = dilutiveCount;                                  // Reprice + Review
  const totalMarginAtStake  = results.reduce((s, r) => s + r.marginAtStake, 0);
  const byStake             = results.filter(r => r.marginAtStake > 0).sort((a, b) => b.marginAtStake - a.marginAtStake);
  const topN                = Math.min(3, byStake.length);
  const topNStake           = byStake.slice(0, topN).reduce((s, r) => s + r.marginAtStake, 0);
  const topNShareOfExposure = totalMarginAtStake > 0 ? Math.round(topNStake / totalMarginAtStake * 100) : 0;

  let sentence;
  if (reviewResults.length === 0) {
    sentence = 'No products sit in the Review quadrant - portfolio margin and volume are concentrated in healthier positions.';
  } else {
    sentence = `${reviewRevenuePct}% of revenue sits in the Review quadrant - top ${topN} product${topN !== 1 ? 's' : ''} drive ${topNShareOfExposure}% of the margin at stake.`;
  }

  const finding = {
    label: 'M1 · SKU PORTFOLIO RATIONALISATION',
    sentence,
    // rankedBarNote pairs the ranked-bar annotation with the finding, one story.
    rankedBarNote: atRiskCount > 0
      ? `These ${atRiskCount} at-risk products represent ${fmtMoney(totalMarginAtStake, currencySym)}/month in margin at stake - top ${topN} drive ${topNShareOfExposure}% of the exposure.`
      : 'No products below portfolio-average margin.',
    metrics: { reviewRevenuePct, topN, topNShareOfExposure, atRiskCount, totalMarginAtStake },
  };

  return {
    results,
    portfolioAvgMarginPct,
    dilutiveCount,
    dilutiveMargin,
    marginAtStake,
    finding,
  };
}
