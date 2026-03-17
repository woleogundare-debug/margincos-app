import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';

/* ── Fonts (TTF required — React-PDF cannot parse woff2) ──── */
Font.register({
  family: 'PlayfairDisplay',
  src: '/fonts/playfair-display-700.ttf',
  fontWeight: 700,
});
Font.register({
  family: 'DMSans',
  fonts: [
    { src: '/fonts/dm-sans-400.ttf', fontWeight: 400 },
    { src: '/fonts/dm-sans-500.ttf', fontWeight: 500 },
    { src: '/fonts/dm-sans-700.ttf', fontWeight: 700 },
  ],
});

/* ── Brand palette ─────────────────────────────────────────── */
const C = {
  navy:  '#1B2A4A',
  teal:  '#0D8F8F',
  red:   '#C0392B',
  gold:  '#D4A843',
  bg:    '#F8FAFC',
  rule:  '#E2E8F0',
  muted: '#64748B',
  white: '#FFFFFF',
};

/* ── Styles ────────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: {
    fontFamily: 'DMSans',
    fontSize: 9,
    color: C.navy,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 48,
    backgroundColor: C.white,
  },
  /* Cover */
  coverPage: {
    fontFamily: 'DMSans',
    backgroundColor: C.navy,
    paddingHorizontal: 48,
    paddingTop: 120,
    paddingBottom: 60,
    justifyContent: 'space-between',
    height: '100%',
  },
  coverTitle: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 28,
    color: C.white,
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 16,
  },
  coverSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 1.6,
    maxWidth: 380,
  },
  coverMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 'auto',
  },
  /* Section headers */
  sectionTitle: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 16,
    fontWeight: 700,
    color: C.navy,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionSub: {
    fontSize: 9,
    color: C.muted,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  /* KPI row */
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 12,
    borderLeft: `3px solid ${C.teal}`,
  },
  kpiLabel: { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  kpiValue: { fontSize: 16, fontWeight: 700 },
  kpiSub:   { fontSize: 7, color: C.muted, marginTop: 2 },
  /* Tables */
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: { color: C.white, fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `0.5px solid ${C.rule}`,
  },
  tableRowAlt: { backgroundColor: '#F8FAFC' },
  tableCell: { fontSize: 8 },
  /* Actions */
  actionCard: {
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderLeft: '3px solid',
  },
  actionTitle: { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  actionDetail: { fontSize: 8, color: C.muted, lineHeight: 1.4 },
  actionMeta: { fontSize: 7, color: C.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  /* Badge */
  badge: { fontSize: 7, fontWeight: 700, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `0.5px solid ${C.rule}`,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: C.muted },
  /* Divider */
  divider: { borderBottom: `1px solid ${C.rule}`, marginVertical: 14 },
});

/* ── Helpers ───────────────────────────────────────────────── */
const fmt = (v, type) => {
  if (v === null || v === undefined || v === '') return '—';
  if (type === 'pct') {
    // value is 0-1 decimal, convert to percentage display
    const num = parseFloat(v);
    return isNaN(num) ? '—' : `${(num * 100).toFixed(1)}%`;
  }
  if (type === 'pctRaw') {
    // value is already 0-100 scale, display as-is with %
    const num = parseFloat(v);
    return isNaN(num) ? '—' : `${num.toFixed(1)}%`;
  }
  if (type === 'naira') {
    const num = parseFloat(v);
    return isNaN(num) ? '—' : `NGN ${Number(num).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }
  if (type === 'nairaK') {
    const num = parseFloat(v);
    if (isNaN(num)) return '—';
    if (Math.abs(num) >= 1e9) return `NGN ${(num / 1e9).toFixed(1)}B`;
    if (Math.abs(num) >= 1e6) return `NGN ${(num / 1e6).toFixed(1)}M`;
    if (Math.abs(num) >= 1e3) return `NGN ${(num / 1e3).toFixed(0)}K`;
    return `NGN ${num.toFixed(0)}`;
  }
  return String(v);
};

const today = () => {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

/* ── Footer component ──────────────────────────────────────── */
const PageFooter = ({ companyName }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>MarginCOS | {companyName || 'Confidential'}</Text>
    <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

/* ── Cover Page ────────────────────────────────────────────── */
const CoverPage = ({ companyName, periodLabel, skuCount }) => (
  <Page size="A4" style={s.coverPage}>
    <View>
      <Text style={{ fontSize: 10, color: C.teal, fontWeight: 700, letterSpacing: 2, marginBottom: 24, textTransform: 'uppercase' }}>
        MARGINCOS
      </Text>
      <Text style={s.coverTitle}>Margin Intelligence Report</Text>
      <Text style={s.coverSub}>
        A comprehensive analysis of pricing, cost recovery, channel economics, and trade execution across your portfolio.
      </Text>
    </View>
    <View style={s.coverMeta}>
      <Text style={{ fontSize: 11, color: C.white, fontWeight: 700, marginBottom: 6 }}>{companyName || 'Your Company'}</Text>
      <Text style={s.coverMeta}>Period: {periodLabel || 'Current'} | {skuCount || 0} active SKUs | Generated {today()}</Text>
      <Text style={[s.coverMeta, { marginTop: 10 }]}>A product of Carthena Advisory | carthenaadvisory.com</Text>
    </View>
  </Page>
);

/* ── Executive Summary Page ────────────────────────────────── */
const SummaryPage = ({ results, companyName }) => {
  const { totalRevenue, totalCurrentMargin, skuCount, p1, p2, p3, p4, actions } = results;
  const marginPct = totalRevenue > 0 ? (totalCurrentMargin / totalRevenue * 100) : 0;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Executive Summary</Text>
      <Text style={s.sectionSub}>
        This report analyses {skuCount} active SKUs across pricing, cost pass-through, channel economics, and trade execution.
        The analysis identifies actionable margin opportunities and quantifies recovery potential.
      </Text>

      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>Total Revenue</Text>
          <Text style={[s.kpiValue, { color: C.navy }]}>{fmt(totalRevenue, 'nairaK')}</Text>
          <Text style={s.kpiSub}>{skuCount} active SKUs</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.teal }]}>
          <Text style={s.kpiLabel}>Portfolio Margin</Text>
          <Text style={[s.kpiValue, { color: C.teal }]}>{fmt(marginPct, 'pctRaw')}</Text>
          <Text style={s.kpiSub}>{fmt(totalCurrentMargin, 'nairaK')} gross</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.red }]}>
          <Text style={s.kpiLabel}>Revenue at Risk</Text>
          <Text style={[s.kpiValue, { color: C.red }]}>{fmt(p2?.totalAbsorbed, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Cost absorbed, not priced in</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.gold }]}>
          <Text style={s.kpiLabel}>Repricing Upside</Text>
          <Text style={[s.kpiValue, { color: C.gold }]}>{fmt(p1?.totalGain, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Monthly opportunity</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* Priority Actions */}
      {actions?.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { fontSize: 13 }]}>Priority Actions</Text>
          {actions.slice(0, 8).map((a, i) => (
            <View key={i} style={[s.actionCard, { borderLeftColor: a.color || C.teal }]}>
              <Text style={s.actionTitle}>{i + 1}. {a.title}</Text>
              <Text style={s.actionDetail}>{a.detail}</Text>
              <Text style={s.actionMeta}>{a.pillar} | {a.timeline}</Text>
            </View>
          ))}
        </>
      )}

      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── P1 Pricing Intelligence Page ──────────────────────────── */
/* Engine: marginPct 0-100, compGap 0-100 (already %), priceRealisation 0-100 */
const PricingPage = ({ p1, companyName }) => {
  if (!p1?.results?.length) return null;
  const rows = p1.results.slice(0, 20);

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>P1 | Pricing Intelligence</Text>
      <Text style={s.sectionSub}>
        Price realisation score: {fmt(p1.priceRealisation, 'pctRaw')} | Total repricing opportunity: {fmt(p1.totalGain, 'nairaK')} /month
        {p1.floorBreaches?.length > 0 ? ` | ${p1.floorBreaches.length} SKUs below margin floor` : ''}
      </Text>

      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>Price Realisation</Text>
          <Text style={[s.kpiValue, { color: C.teal }]}>{fmt(p1.priceRealisation, 'pctRaw')}</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.gold }]}>
          <Text style={s.kpiLabel}>WTP Gap</Text>
          <Text style={[s.kpiValue, { color: C.gold }]}>{fmt(p1.totalWTPGap, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Willingness-to-pay headroom</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.red }]}>
          <Text style={s.kpiLabel}>Floor Breaches</Text>
          <Text style={[s.kpiValue, { color: C.red }]}>{p1.floorBreaches?.length || 0}</Text>
          <Text style={s.kpiSub}>SKUs below margin floor</Text>
        </View>
      </View>

      {/* Table */}
      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: '25%' }]}>SKU</Text>
        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Price</Text>
        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>COGS</Text>
        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Margin %</Text>
        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>WTP Gap</Text>
        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Comp Gap</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
          <Text style={[s.tableCell, { width: '25%' }]} numberOfLines={1}>{r.sku}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.price, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.cogs, 'nairaK')}</Text>
          {/* marginPct is 0-100 from engine */}
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.marginPct, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.wtpGap, 'nairaK')}</Text>
          {/* compGap is already 0-100 from engine (percentage) */}
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{r.compGap != null ? fmt(r.compGap, 'pctRaw') : '—'}</Text>
        </View>
      ))}

      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── P2 Cost Pass-Through Page ─────────────────────────────── */
/* Engine: inf 0-1 decimal, pt 0-1 decimal, absorbedPct 0-100, portRecoveryPct 0-100, avgAbsorbedPct 0-100 */
const CostPage = ({ p2, companyName }) => {
  if (!p2?.results?.length) return null;
  const rows = p2.results.slice(0, 20);

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>P2 | Cost Pass-Through</Text>
      <Text style={s.sectionSub}>
        Portfolio recovery rate: {fmt(p2.portRecoveryPct, 'pctRaw')} | Total cost absorbed: {fmt(p2.totalAbsorbed, 'nairaK')} /month
        | Average SKU absorption: {fmt(p2.avgAbsorbedPct, 'pctRaw')}
      </Text>

      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { borderLeftColor: C.red }]}>
          <Text style={s.kpiLabel}>Total Absorbed</Text>
          <Text style={[s.kpiValue, { color: C.red }]}>{fmt(p2.totalAbsorbed, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Monthly cost not passed through</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>Recovery Rate</Text>
          <Text style={[s.kpiValue, { color: C.teal }]}>{fmt(p2.portRecoveryPct, 'pctRaw')}</Text>
          <Text style={s.kpiSub}>vs 70-75% benchmark</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.gold }]}>
          <Text style={s.kpiLabel}>Cost Shock</Text>
          <Text style={[s.kpiValue, { color: C.gold }]}>{fmt(p2.totalCostShock, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Total input cost inflation</Text>
        </View>
      </View>

      {/* Table */}
      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: '28%' }]}>SKU</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Inflation</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Pass-Thru</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Absorbed %</Text>
        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Shock</Text>
        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Absorbed</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
          <Text style={[s.tableCell, { width: '28%' }]} numberOfLines={1}>{r.sku}</Text>
          {/* inf is 0-1 decimal */}
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.inf, 'pct')}</Text>
          {/* pt is 0-1 decimal */}
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.pt, 'pct')}</Text>
          {/* absorbedPct is 0-100 from engine */}
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.absorbedPct, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.shock, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.absorbed, 'nairaK')}</Text>
        </View>
      ))}

      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── P3 Channel Economics Page ─────────────────────────────── */
/* Engine: contPct is 0-100 */
const ChannelPage = ({ p3, companyName }) => {
  if (!p3?.channelResults?.length) return null;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>P3 | Channel Economics</Text>
      <Text style={s.sectionSub}>
        Contribution margin by channel | Distributor exposure: {fmt(p3.totalDistExposure, 'nairaK')}
      </Text>

      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>Channels Active</Text>
          <Text style={[s.kpiValue, { color: C.navy }]}>{p3.channelResults.length}</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.gold }]}>
          <Text style={s.kpiLabel}>Distributor Exposure</Text>
          <Text style={[s.kpiValue, { color: C.gold }]}>{fmt(p3.totalDistExposure, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Trade credit at risk</Text>
        </View>
      </View>

      {/* Channel table */}
      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: '25%' }]}>Channel</Text>
        <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Revenue</Text>
        <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Contribution</Text>
        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Cont. %</Text>
        <Text style={[s.tableHeaderCell, { width: '10%', textAlign: 'right' }]}>SKUs</Text>
        <Text style={[s.tableHeaderCell, { width: '10%', textAlign: 'right' }]}>Vol</Text>
      </View>
      {p3.channelResults.map((ch, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
          <Text style={[s.tableCell, { width: '25%', fontWeight: 600 }]}>{ch.channel}</Text>
          <Text style={[s.tableCell, { width: '20%', textAlign: 'right' }]}>{fmt(ch.rev, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '20%', textAlign: 'right' }]}>{fmt(ch.contMargin, 'nairaK')}</Text>
          {/* contPct is 0-100 from engine */}
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right', color: ch.contPct < 15 ? C.red : C.navy }]}>{fmt(ch.contPct, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '10%', textAlign: 'right' }]}>{ch.skuCount}</Text>
          <Text style={[s.tableCell, { width: '10%', textAlign: 'right' }]}>{ch.vol?.toLocaleString() || '—'}</Text>
        </View>
      ))}

      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── P4 Trade Execution Page ───────────────────────────────── */
/* Engine: depth 0-1, lift 0-1, bevLift already x100 (percentage), baseMargin is NAIRA (absolute), netImpact is NAIRA */
const TradePage = ({ p4, companyName }) => {
  if (!p4?.results?.length) return null;
  const rows = p4.results.slice(0, 20);
  const lossMaking = p4.results.filter(r => !r.profitable).length;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>P4 | Trade Execution</Text>
      <Text style={s.sectionSub}>
        Promotional impact: {fmt(p4.totalPromoImpact, 'nairaK')} | {lossMaking} loss-making promotions identified
      </Text>

      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { borderLeftColor: '#7C3AED' }]}>
          <Text style={s.kpiLabel}>Promo Impact</Text>
          <Text style={[s.kpiValue, { color: '#7C3AED' }]}>{fmt(p4.totalPromoImpact, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Net margin impact of promotions</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.red }]}>
          <Text style={s.kpiLabel}>Loss-Making Promos</Text>
          <Text style={[s.kpiValue, { color: C.red }]}>{lossMaking}</Text>
          <Text style={s.kpiSub}>Promos destroying margin</Text>
        </View>
      </View>

      {/* Table */}
      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: '22%' }]}>SKU</Text>
        <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>Depth</Text>
        <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>Lift</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>BEV Lift</Text>
        <Text style={[s.tableHeaderCell, { width: '16%', textAlign: 'right' }]}>Net Impact</Text>
        <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>Base Margin</Text>
        <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>Status</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
          <Text style={[s.tableCell, { width: '22%' }]} numberOfLines={1}>{r.sku}</Text>
          {/* depth is 0-1 decimal */}
          <Text style={[s.tableCell, { width: '12%', textAlign: 'right' }]}>{fmt(r.depth, 'pct')}</Text>
          {/* lift is 0-1 decimal */}
          <Text style={[s.tableCell, { width: '12%', textAlign: 'right' }]}>{fmt(r.lift, 'pct')}</Text>
          {/* bevLift is already x100 from engine — display as percentage */}
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>
            {r.bevLift != null ? `${parseFloat(r.bevLift).toFixed(1)}%` : '—'}
          </Text>
          {/* netImpact is absolute naira */}
          <Text style={[s.tableCell, { width: '16%', textAlign: 'right', color: r.profitable ? C.teal : C.red, fontWeight: 700 }]}>
            {fmt(r.netImpact, 'nairaK')}
          </Text>
          {/* baseMargin is absolute naira (price - cogs) * vol, NOT a percentage */}
          <Text style={[s.tableCell, { width: '12%', textAlign: 'right' }]}>{fmt(r.baseMargin, 'nairaK')}</Text>
          <View style={{ width: '12%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[s.badge, {
              color: r.profitable ? C.teal : C.red,
              backgroundColor: r.profitable ? '#E8F5F5' : '#FEF2F2',
            }]}>
              {r.profitable ? 'Profitable' : 'Loss'}
            </Text>
          </View>
        </View>
      ))}

      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── Disclaimer Page ───────────────────────────────────────── */
const DisclaimerPage = ({ companyName }) => (
  <Page size="A4" style={s.page}>
    <Text style={s.sectionTitle}>Disclaimer</Text>
    <Text style={[s.sectionSub, { lineHeight: 1.7, maxWidth: 420 }]}>
      This report is generated by MarginCOS, a product of Carthena Advisory Limited, using data provided by the user.
      It is intended for internal decision-support purposes only and does not constitute financial advice.
      The accuracy of outputs depends on the quality and completeness of input data.
      Carthena Advisory accepts no liability for decisions made based on this analysis.
    </Text>
    <View style={{ marginTop: 40 }}>
      <Text style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 4 }}>MarginCOS</Text>
      <Text style={{ fontSize: 8, color: C.muted }}>A product of Carthena Advisory | carthenaadvisory.com</Text>
      <Text style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>Generated {today()}</Text>
    </View>
    <PageFooter companyName={companyName} />
  </Page>
);

/* ── Main Document ─────────────────────────────────────────── */
export default function MarginCOSReport({ results, companyName, periodLabel }) {
  if (!results) return null;

  return (
    <Document
      title={`MarginCOS Report - ${companyName || 'Portfolio'}`}
      author="MarginCOS | Carthena Advisory"
      subject="Margin Intelligence Report"
    >
      <CoverPage
        companyName={companyName}
        periodLabel={periodLabel}
        skuCount={results.skuCount}
      />
      <SummaryPage results={results} companyName={companyName} />
      <PricingPage p1={results.p1} companyName={companyName} />
      <CostPage p2={results.p2} companyName={companyName} />
      <ChannelPage p3={results.p3} companyName={companyName} />
      <TradePage p4={results.p4} companyName={companyName} />
      <DisclaimerPage companyName={companyName} />
    </Document>
  );
}
