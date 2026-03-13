import { n } from '../../formatters';

export function computeM1(active, base) {
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

    let classification, action, classColor, classBg;
    if (highMargin && highVol) {
      classification = '★ Protect';
      action = 'Core value driver — defend pricing and volume';
      classColor = '#065f46'; classBg = '#dcfce7';
    } else if (highMargin && !highVol) {
      classification = '▲ Grow';
      action = 'Strong margin, low volume — invest to scale';
      classColor = '#1e40af'; classBg = '#dbeafe';
    } else if (!highMargin && highVol) {
      classification = '⚠ Reprice';
      action = 'High volume, dilutive margin — pricing review required';
      classColor = '#92400e'; classBg = '#fef3c7';
    } else {
      classification = '✗ Review';
      action = 'Low margin, low volume — delist or restructure';
      classColor = '#991b1b'; classBg = '#fee2e2';
    }

    results.push({
      sku: r.sku_name || r.sku_id,
      category: r.category || '—',
      skuMarginPct, skuMarginAbs, revShare, vsAvg,
      classification, action, classColor, classBg,
      highMargin, highVol,
    });
  });

  const dilutiveCount  = results.filter(s => !s.highMargin).length;
  const dilutiveMargin = results.filter(s => !s.highMargin).reduce((s, r) => s + r.skuMarginAbs, 0);
  const marginAtStake  = Math.abs(
    totalCurrentMargin - results.filter(s => s.highMargin).reduce((s, r) => s + r.skuMarginAbs, 0)
  );

  return {
    results,
    portfolioAvgMarginPct,
    dilutiveCount,
    dilutiveMargin,
    marginAtStake,
  };
}
