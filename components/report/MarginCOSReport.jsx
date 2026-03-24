import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font,
  Svg, Rect, Circle, Line, G, Text as SvgText, Path, Defs, LinearGradient, Stop,
} from '@react-pdf/renderer';
import { computeDeltas } from '../../lib/engine/delta';

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

// Disable React-PDF's automatic hyphenation globally
Font.registerHyphenationCallback(word => [word]);

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
  coverSub: { fontSize: 12, color: '#94A3B8', lineHeight: 1.6, maxWidth: 380 },
  coverMeta: { fontSize: 9, color: '#64748B', marginTop: 'auto' },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 16,
    fontWeight: 700,
    color: C.navy,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionSub: { fontSize: 9, color: C.muted, marginBottom: 16, lineHeight: 1.5 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
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
  badge: { fontSize: 7, fontWeight: 700, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
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
  divider: { borderBottom: `1px solid ${C.rule}`, marginVertical: 14 },
});

/* ── Helpers ───────────────────────────────────────────────── */
const fmt = (v, type) => {
  if (v === null || v === undefined || v === '') return '—';
  if (type === 'pct') {
    const num = parseFloat(v);
    return isNaN(num) ? '—' : `${(num * 100).toFixed(1)}%`;
  }
  if (type === 'pctRaw') {
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

/* ── Chart helpers ─────────────────────────────────────────── */
const fmtN = (v) => {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}NGN ${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}NGN ${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${sign}NGN ${(abs / 1e3).toFixed(0)}K`;
  return `${sign}NGN ${abs.toFixed(0)}`;
};

const TruncationNotice = ({ shown, total }) => (
  <View style={{
    marginTop: 6,
    padding: '5 10',
    backgroundColor: '#FFF8E6',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: C.gold,
    flexDirection: 'row',
  }}>
    <Text style={{ fontSize: 8, color: C.gold, fontWeight: 700 }}>
      {`Showing top ${shown} of ${total} SKUs — sorted by financial impact (largest first)`}
    </Text>
  </View>
);

/* ── Shared components ─────────────────────────────────────── */
const PageFooter = ({ companyName }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>MarginCOS | {companyName || 'Confidential'}</Text>
    <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

const NarrativeBlock = ({ lines }) => (
  <View style={{
    marginTop: 4,
    marginBottom: 14,
    padding: '14 16',
    backgroundColor: '#F4F6F8',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1B2A4A',
  }}>
    <Text style={{
      fontSize: 7,
      fontWeight: 700,
      color: '#1B2A4A',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 6,
    }}>Analysis</Text>
    {lines.map((line, i) => (
      <Text key={i} style={{
        fontSize: 9.5,
        color: '#2A3A4A',
        lineHeight: 1.7,
        marginBottom: i < lines.length - 1 ? 5 : 0,
      }}>{line}</Text>
    ))}
  </View>
);

/* ══════════════════════════════════════════════════════════════
   SVG CHART COMPONENTS — Phase A (inline) + Phase B (dedicated pages)
   ══════════════════════════════════════════════════════════════ */

/* ── Phase A: P2 Waterfall (Cost page inline) ─────────────── */
const P2WaterfallSvg = ({ p2 }) => {
  if (!p2) return null;
  const shock    = p2.totalCostShock || 0;
  const absorbed = p2.totalAbsorbed  || 0;
  const recovered = shock - absorbed;
  const max      = shock || 1;
  const W = 460; const H = 140; const barW = 80; const gap = 60;
  const barMaxH = 100;
  const b = [
    { label: 'Cost Shock',  value: shock,     color: C.navy },
    { label: 'Recovered',   value: recovered, color: C.teal },
    { label: 'Absorbed',    value: absorbed,  color: C.red  },
  ];
  const startX = 40;
  return (
    <View style={{ marginBottom: 10 }}>
      <Svg width={W} height={H + 30}>
        <G>
          {b.map((bar, i) => {
            const h = Math.max(4, (bar.value / max) * barMaxH);
            const x = startX + i * (barW + gap);
            const y = barMaxH - h + 10;
            return (
              <G key={i}>
                <Rect x={x} y={y} width={barW} height={h} fill={bar.color} rx={3} />
                <SvgText x={x + barW / 2} y={y - 5} fontSize={8} fill={bar.color} textAnchor="middle" fontWeight="700">
                  {fmtN(bar.value)}
                </SvgText>
                <SvgText x={x + barW / 2} y={H + 14} fontSize={8} fill={C.navy} textAnchor="middle">
                  {bar.label}
                </SvgText>
              </G>
            );
          })}
          <Line x1={startX} y1={barMaxH + 10} x2={startX + 2 * (barW + gap) + barW} y2={barMaxH + 10} stroke={C.rule} strokeWidth={1} />
        </G>
      </Svg>
    </View>
  );
};

/* ── Phase A: P3 Channel Grouped Bars (Channel page inline) ── */
const P3ChannelSvg = ({ channelResults }) => {
  if (!channelResults?.length) return null;
  const data = channelResults.slice(0, 6);
  const maxRev = Math.max(...data.map(d => d.rev || 0)) || 1;
  const W = 460; const H = 150; const bW = 22; const gapBar = 4; const gapGroup = 28;
  const barMaxH = 110; const startX = 50;
  return (
    <View style={{ marginBottom: 10 }}>
      <Svg width={W} height={H + 30}>
        <G>
          {data.map((ch, i) => {
            const groupW = bW * 2 + gapBar;
            const x = startX + i * (groupW + gapGroup);
            const hRev  = Math.max(3, ((ch.rev || 0) / maxRev) * barMaxH);
            const hCont = Math.max(3, ((ch.contMargin || 0) / maxRev) * barMaxH);
            return (
              <G key={i}>
                <Rect x={x}         y={barMaxH - hRev  + 10} width={bW} height={hRev}  fill={C.navy} rx={2} />
                <Rect x={x + bW + gapBar} y={barMaxH - hCont + 10} width={bW} height={hCont} fill={C.teal} rx={2} />
                <SvgText x={x + bW + gapBar / 2} y={H + 14} fontSize={7} fill={C.navy} textAnchor="middle">
                  {ch.channel?.length > 8 ? ch.channel.slice(0, 8) + '…' : ch.channel}
                </SvgText>
              </G>
            );
          })}
          <Line x1={startX - 5} y1={barMaxH + 10} x2={W - 10} y2={barMaxH + 10} stroke={C.rule} strokeWidth={1} />
          {/* Legend */}
          <Rect x={startX} y={H + 22} width={8} height={8} fill={C.navy} rx={1} />
          <SvgText x={startX + 11} y={H + 29} fontSize={7} fill={C.muted}>Revenue</SvgText>
          <Rect x={startX + 65} y={H + 22} width={8} height={8} fill={C.teal} rx={1} />
          <SvgText x={startX + 76} y={H + 29} fontSize={7} fill={C.muted}>Contribution</SvgText>
        </G>
      </Svg>
    </View>
  );
};

/* ── Phase A: M2 Scenario Area (M2 page inline) ───────────── */
const M2ScenarioSvg = ({ scenarios }) => {
  if (!scenarios?.length) return null;
  const data = scenarios.map(s => ({
    label: `${(s.recoveryRate * 100).toFixed(0)}%`,
    value: s.projMargin || 0,
    riskColor: s.riskColor || C.gold,
  }));
  const vals = data.map(d => d.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals) || 1;
  const range = maxV - minV || 1;
  const W = 460; const H = 130; const padL = 60; const padR = 20; const padT = 15; const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = data.length;
  const pts = data.map((d, i) => {
    const x = padL + (i / (n - 1)) * innerW;
    const y = padT + innerH - ((d.value - minV) / range) * innerH;
    return { x, y, ...d };
  });
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M ${pts[0].x},${pts[0].y} ` +
    pts.slice(1).map(p => `L ${p.x},${p.y}`).join(' ') +
    ` L ${pts[n-1].x},${padT + innerH} L ${pts[0].x},${padT + innerH} Z`;
  return (
    <View style={{ marginBottom: 10 }}>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="scenGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={C.teal} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={C.teal} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <G>
          {/* area fill */}
          <Path d={area} fill="url(#scenGrad)" />
          {/* line */}
          <Path d={`M ${pts.map(p => `${p.x},${p.y}`).join(' L ')}`} stroke={C.teal} strokeWidth={2} fill="none" />
          {/* dots */}
          {pts.map((p, i) => (
            <G key={i}>
              <Circle cx={p.x} cy={p.y} r={4} fill={C.teal} />
              <SvgText x={p.x} y={p.y - 7} fontSize={7} fill={C.teal} textAnchor="middle" fontWeight="700">
                {fmtN(p.value)}
              </SvgText>
              <SvgText x={p.x} y={H - 6} fontSize={7} fill={C.navy} textAnchor="middle">
                {p.label}
              </SvgText>
            </G>
          ))}
          <Line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} stroke={C.rule} strokeWidth={1} />
          <SvgText x={padL - 5} y={padT + innerH / 2} fontSize={7} fill={C.muted} textAnchor="middle">
            Margin
          </SvgText>
          <SvgText x={W / 2} y={H - 1} fontSize={7} fill={C.muted} textAnchor="middle">
            Cost Recovery Rate
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};

/* ── Phase A: M3 Trade ROI Horizontal Bars (M3 page inline) ── */
const M3TradeROISvg = ({ results }) => {
  if (!results?.length) return null;
  const statusColor = (status) => {
    if (!status) return C.muted;
    const sl = status.toLowerCase();
    if (sl.includes('accretive')) return C.teal;
    if (sl.includes('dilutive'))  return C.red;
    return C.gold;
  };
  const data = results
    .filter(r => r.roi != null)
    .sort((a, b) => (b.roi || 0) - (a.roi || 0))
    .slice(0, 8);
  const maxROI = Math.max(...data.map(d => d.roi || 0), 1);
  const barH = 16; const gap = 6; const labelW = 80; const barMaxW = 310; const W = 460; const padT = 10;
  const H = padT + data.length * (barH + gap) + 20;
  return (
    <View style={{ marginBottom: 10 }}>
      <Svg width={W} height={H}>
        <G>
          {/* breakeven line */}
          {(() => {
            const bx = labelW + (1 / maxROI) * barMaxW;
            return (
              <G>
                <Line x1={bx} y1={padT} x2={bx} y2={H - 20} stroke={C.gold} strokeWidth={1} strokeDasharray="4 3" />
                <SvgText x={bx + 2} y={padT + 8} fontSize={6} fill={C.gold}>Breakeven</SvgText>
              </G>
            );
          })()}
          {data.map((r, i) => {
            const bw = ((r.roi || 0) / maxROI) * barMaxW;
            const y  = padT + i * (barH + gap);
            const color = statusColor(r.status);
            return (
              <G key={i}>
                <SvgText x={labelW - 4} y={y + barH - 4} fontSize={8} fill={C.navy} textAnchor="end">
                  {r.channel?.length > 10 ? r.channel.slice(0, 10) + '…' : r.channel}
                </SvgText>
                <Rect x={labelW} y={y} width={Math.max(2, bw)} height={barH} fill={color} rx={2} />
                <SvgText x={labelW + Math.max(2, bw) + 4} y={y + barH - 4} fontSize={8} fill={color} fontWeight="700">
                  {r.roi?.toFixed(1)}x
                </SvgText>
              </G>
            );
          })}
          <Line x1={labelW} y1={H - 18} x2={W - 30} y2={H - 18} stroke={C.rule} strokeWidth={1} />
        </G>
      </Svg>
    </View>
  );
};

/* ══════════════════════════════════════════════════════════════
   PHASE B — DEDICATED CHART PAGES
   ══════════════════════════════════════════════════════════════ */

/* ── P1 Chart Page ────────────────────────────────────────── */
const P1ChartPage = ({ results, companyName }) => {
  if (!results?.p1?.results?.length) return null;
  const data = [...(results.p1.results)]
    .sort((a, b) => (b.delta || 0) - (a.delta || 0))
    .slice(0, 15);
  const maxDelta = Math.max(...data.map(d => Math.abs(d.delta || 0)), 1);
  const barH = 18; const gap = 5; const labelW = 120; const barMaxW = 280; const W = 499; const padT = 20;
  const H = padT + data.length * (barH + gap) + 30;
  const tealThresh = 0;
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>P1 · Repricing Opportunities</Text>
      <Text style={s.sectionSub}>Top 15 SKUs by margin gain potential — sorted by price delta descending</Text>
      <Svg width={W} height={H}>
        <G>
          {/* zero line */}
          <Line x1={labelW} y1={padT} x2={labelW} y2={padT + data.length * (barH + gap)} stroke={C.rule} strokeWidth={1} />
          {data.map((sku, i) => {
            const bw = (Math.abs(sku.delta || 0) / maxDelta) * barMaxW;
            const y  = padT + i * (barH + gap);
            const color = (sku.compGap || 0) >= tealThresh ? C.teal : C.gold;
            return (
              <G key={i}>
                <SvgText x={labelW - 4} y={y + barH - 5} fontSize={7.5} fill={C.navy} textAnchor="end">
                  {sku.sku?.length > 16 ? sku.sku.slice(0, 16) + '…' : sku.sku}
                </SvgText>
                <Rect x={labelW} y={y} width={Math.max(2, bw)} height={barH} fill={color} rx={2} />
                <SvgText x={labelW + Math.max(2, bw) + 4} y={y + barH - 5} fontSize={7.5} fill={color} fontWeight="700">
                  {fmtN(sku.delta)}
                </SvgText>
              </G>
            );
          })}
          <Line x1={labelW} y1={padT + data.length * (barH + gap) + 6} x2={W - 20} y2={padT + data.length * (barH + gap) + 6} stroke={C.rule} strokeWidth={1} />
          {/* Legend */}
          <Rect x={labelW} y={padT + data.length * (barH + gap) + 14} width={8} height={8} fill={C.teal} rx={1} />
          <SvgText x={labelW + 11} y={padT + data.length * (barH + gap) + 21} fontSize={7} fill={C.muted}>Below competitors</SvgText>
          <Rect x={labelW + 120} y={padT + data.length * (barH + gap) + 14} width={8} height={8} fill={C.gold} rx={1} />
          <SvgText x={labelW + 131} y={padT + data.length * (barH + gap) + 21} fontSize={7} fill={C.muted}>Above competitors</SvgText>
        </G>
      </Svg>
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── P4 Chart Page ────────────────────────────────────────── */
const P4ChartPage = ({ results, companyName }) => {
  if (!results?.p4?.results?.length) return null;
  const data = [...(results.p4.results)]
    .sort((a, b) => (b.netImpact || 0) - (a.netImpact || 0))
    .slice(0, 15);
  const maxAbs = Math.max(...data.map(d => Math.abs(d.netImpact || 0)), 1);
  const barH = 18; const gap = 5; const labelW = 120; const barMaxW = 280; const W = 499; const padT = 20;
  const H = padT + data.length * (barH + gap) + 30;
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>P4 · Promotion Net Impact</Text>
      <Text style={s.sectionSub}>Top 15 promotions by net margin impact — teal = profitable, red = loss-making</Text>
      <Svg width={W} height={H}>
        <G>
          <Line x1={labelW} y1={padT} x2={labelW} y2={padT + data.length * (barH + gap)} stroke={C.rule} strokeWidth={1} />
          {data.map((promo, i) => {
            const impact = promo.netImpact || 0;
            const bw = (Math.abs(impact) / maxAbs) * barMaxW;
            const y = padT + i * (barH + gap);
            const color = promo.profitable ? C.teal : C.red;
            return (
              <G key={i}>
                <SvgText x={labelW - 4} y={y + barH - 5} fontSize={7.5} fill={C.navy} textAnchor="end">
                  {promo.sku?.length > 16 ? promo.sku.slice(0, 16) + '…' : promo.sku}
                </SvgText>
                <Rect x={labelW} y={y} width={Math.max(2, bw)} height={barH} fill={color} rx={2} />
                <SvgText x={labelW + Math.max(2, bw) + 4} y={y + barH - 5} fontSize={7.5} fill={color} fontWeight="700">
                  {fmtN(impact)}
                </SvgText>
              </G>
            );
          })}
          <Line x1={labelW} y1={padT + data.length * (barH + gap) + 6} x2={W - 20} y2={padT + data.length * (barH + gap) + 6} stroke={C.rule} strokeWidth={1} />
          <Rect x={labelW} y={padT + data.length * (barH + gap) + 14} width={8} height={8} fill={C.teal} rx={1} />
          <SvgText x={labelW + 11} y={padT + data.length * (barH + gap) + 21} fontSize={7} fill={C.muted}>Profitable</SvgText>
          <Rect x={labelW + 80} y={padT + data.length * (barH + gap) + 14} width={8} height={8} fill={C.red} rx={1} />
          <SvgText x={labelW + 91} y={padT + data.length * (barH + gap) + 21} fontSize={7} fill={C.muted}>Loss-making</SvgText>
        </G>
      </Svg>
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── M1 Chart Page ────────────────────────────────────────── */
const M1ChartPage = ({ results, companyName }) => {
  if (!results?.m1?.results?.length) return null;
  const m1 = results.m1;
  const data = m1.results.map(r => ({
    x:    r.revShare || 0,
    y:    r.skuMarginPct || 0,
    sku:  r.sku,
    color: r.classColor || C.muted,
    cls:  r.classification,
  }));
  const avgMargin = m1.portfolioAvgMarginPct || 0;
  const W = 499; const H = 300;
  const padL = 50; const padR = 20; const padT = 20; const padB = 40;
  const iW = W - padL - padR; const iH = H - padT - padB;
  const maxX = Math.max(...data.map(d => d.x), 10) * 1.1;
  const maxY = Math.max(...data.map(d => d.y), 10) * 1.1;
  const minY = Math.min(...data.map(d => d.y), 0);
  const rangeY = maxY - minY || 1;
  const tx = (v) => padL + (v / maxX) * iW;
  const ty = (v) => padT + iH - ((v - minY) / rangeY) * iH;
  const avgY = ty(avgMargin);
  const refX = tx(5);
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>M1 · SKU Portfolio Quadrant</Text>
      <Text style={s.sectionSub}>Revenue share % vs SKU margin % · Reference lines at 5% share and portfolio average margin</Text>
      <Svg width={W} height={H}>
        <G>
          {/* grid lines */}
          <Line x1={padL} y1={padT} x2={padL} y2={padT + iH} stroke={C.rule} strokeWidth={1} />
          <Line x1={padL} y1={padT + iH} x2={padL + iW} y2={padT + iH} stroke={C.rule} strokeWidth={1} />
          {/* reference lines */}
          <Line x1={refX} y1={padT} x2={refX} y2={padT + iH} stroke={C.gold} strokeWidth={1} strokeDasharray="5 3" />
          <SvgText x={refX + 2} y={padT + 8} fontSize={6.5} fill={C.gold}>5% share</SvgText>
          <Line x1={padL} y1={avgY} x2={padL + iW} y2={avgY} stroke={C.gold} strokeWidth={1} strokeDasharray="5 3" />
          <SvgText x={padL + iW - 50} y={avgY - 3} fontSize={6.5} fill={C.gold}>Avg {avgMargin.toFixed(1)}%</SvgText>
          {/* dots */}
          {data.map((d, i) => (
            <Circle key={i} cx={tx(d.x)} cy={ty(d.y)} r={5} fill={d.color} fillOpacity={0.85} />
          ))}
          {/* axis labels */}
          <SvgText x={padL + iW / 2} y={H - 4} fontSize={7.5} fill={C.muted} textAnchor="middle">Revenue Share %</SvgText>
          <SvgText x={12} y={padT + iH / 2} fontSize={7.5} fill={C.muted} textAnchor="middle">
            SKU Margin %
          </SvgText>
        </G>
      </Svg>
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── M4 Chart Page ────────────────────────────────────────── */
const M4ChartPage = ({ results, companyName }) => {
  if (!results?.m4?.results?.length) return null;
  const m4 = results.m4;
  const data = m4.results.map(r => ({
    x:    r.revShare  || 0,
    y:    r.contPct   || 0,
    name: r.name,
    color: (() => {
      const cls = r.classification || '';
      if (cls.includes('Strategic')) return C.teal;
      if (cls.includes('Grow'))      return '#27AE60';
      if (cls.includes('Renegotiate')) return C.gold;
      return C.red;
    })(),
  }));
  const avgCont = data.reduce((s, d) => s + d.y, 0) / (data.length || 1);
  const W = 499; const H = 300;
  const padL = 50; const padR = 20; const padT = 20; const padB = 40;
  const iW = W - padL - padR; const iH = H - padT - padB;
  const maxX = Math.max(...data.map(d => d.x), 10) * 1.1;
  const maxY = Math.max(...data.map(d => d.y), 10) * 1.1;
  const minY = Math.min(...data.map(d => d.y), 0);
  const rangeY = maxY - minY || 1;
  const tx = (v) => padL + (v / maxX) * iW;
  const ty = (v) => padT + iH - ((v - minY) / rangeY) * iH;
  const avgY = ty(avgCont);
  const refX = tx(10);
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>M4 · Distributor Performance Matrix</Text>
      <Text style={s.sectionSub}>Revenue share % vs true contribution % · Reference lines at 10% share and average contribution</Text>
      <Svg width={W} height={H}>
        <G>
          <Line x1={padL} y1={padT} x2={padL} y2={padT + iH} stroke={C.rule} strokeWidth={1} />
          <Line x1={padL} y1={padT + iH} x2={padL + iW} y2={padT + iH} stroke={C.rule} strokeWidth={1} />
          <Line x1={refX} y1={padT} x2={refX} y2={padT + iH} stroke={C.gold} strokeWidth={1} strokeDasharray="5 3" />
          <SvgText x={refX + 2} y={padT + 8} fontSize={6.5} fill={C.gold}>10% share</SvgText>
          <Line x1={padL} y1={avgY} x2={padL + iW} y2={avgY} stroke={C.gold} strokeWidth={1} strokeDasharray="5 3" />
          <SvgText x={padL + iW - 60} y={avgY - 3} fontSize={6.5} fill={C.gold}>Avg {avgCont.toFixed(1)}%</SvgText>
          {data.map((d, i) => (
            <Circle key={i} cx={tx(d.x)} cy={ty(d.y)} r={5} fill={d.color} fillOpacity={0.85} />
          ))}
          <SvgText x={padL + iW / 2} y={H - 4} fontSize={7.5} fill={C.muted} textAnchor="middle">Revenue Share %</SvgText>
          <SvgText x={12} y={padT + iH / 2} fontSize={7.5} fill={C.muted} textAnchor="middle">
            Contribution %
          </SvgText>
        </G>
      </Svg>
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ══════════════════════════════════════════════════════════════
   NARRATIVE GENERATORS — P1 through P4
   ══════════════════════════════════════════════════════════════ */

const getPricingNarrative = (results) => {
  const p1 = results?.p1 || {};
  const skus = p1.results || [];
  const realisation = p1.priceRealisation || 0;
  const totalGain = p1.totalGain || 0;
  const floorBreaches = p1.floorBreaches?.length || 0;
  const wtpGap = p1.totalWTPGap || 0;
  const underpriced = skus.filter(sk => sk.wtpGap > 0).length;
  const lines = [];

  if (realisation >= 90) {
    lines.push(`Your portfolio is achieving ${realisation.toFixed(1)}% of its willingness-to-pay potential — a strong realisation score that indicates pricing is broadly aligned with market tolerance.`);
  } else if (realisation >= 75) {
    lines.push(`At ${realisation.toFixed(1)}% price realisation, your portfolio is capturing most but not all of its available pricing headroom. A targeted repricing exercise on the highest-gap SKUs would close this without broad price exposure.`);
  } else {
    lines.push(`A price realisation score of ${realisation.toFixed(1)}% indicates significant underpricing across the portfolio. Consumer willingness-to-pay has not been fully tested — this is recoverable margin that does not require new volume.`);
  }

  if (totalGain > 0) {
    lines.push(`Proposed price adjustments on ${underpriced} SKU${underpriced !== 1 ? 's' : ''} would add ${fmt(totalGain, 'nairaK')} per month in margin without volume impact, based on elasticity modelling against current RRP and competitor price anchors.`);
  }

  if (wtpGap > 0) {
    lines.push(`A combined ${fmt(wtpGap, 'nairaK')} in untapped willingness-to-pay headroom exists across the portfolio. This represents the gap between current pricing and the price point at which volume loss would begin — the priority is to sequence price moves from lowest-elasticity SKUs first.`);
  }

  if (floorBreaches > 0) {
    lines.push(`${floorBreaches} SKU${floorBreaches !== 1 ? 's are' : ' is'} currently priced below the minimum margin floor. Immediate corrective action is required — these SKUs are diluting portfolio margin with every unit sold.`);
  } else {
    lines.push(`No SKUs are currently breaching the minimum margin floor — the portfolio is structurally sound on pricing floor compliance.`);
  }

  return lines;
};

const getCostNarrative = (results) => {
  const p2 = results?.p2 || {};
  const skus = p2.results || [];
  const portRecovery = p2.portRecoveryPct || 0;
  const totalAbsorbed = p2.totalAbsorbed || 0;
  const totalShock = p2.totalCostShock || 0;
  const highAbsorption = skus.filter(sk => sk.absorbedPct > 70).length;
  const lines = [];

  if (portRecovery >= 70) {
    lines.push(`Your portfolio is recovering ${portRecovery.toFixed(1)}% of input cost inflation through pricing — broadly in line with the 70-75% benchmark achieved by Nigerian FMCG leaders operating in comparable categories.`);
  } else if (portRecovery >= 50) {
    lines.push(`At a ${portRecovery.toFixed(1)}% cost recovery rate, the portfolio is absorbing a meaningful portion of input cost inflation that peer companies are successfully passing through. The gap to the 70-75% leadership benchmark is ${(72.5 - portRecovery).toFixed(1)} percentage points.`);
  } else {
    lines.push(`A cost recovery rate of ${portRecovery.toFixed(1)}% is significantly below the 70-75% benchmark among Nigerian FMCG leaders. The portfolio is absorbing ${fmt(totalAbsorbed, 'nairaK')} per month in inflation costs that the market would likely accept being priced through.`);
  }

  if (totalAbsorbed > 0 && totalShock > 0) {
    const absorbedPct = ((totalAbsorbed / totalShock) * 100).toFixed(1);
    lines.push(`Of ${fmt(totalShock, 'nairaK')} in total input cost shock per month, ${fmt(totalAbsorbed, 'nairaK')} (${absorbedPct}%) is being absorbed rather than recovered. This compounds quarterly — the annualised exposure is ${fmt(totalAbsorbed * 12, 'nairaK')}.`);
  }

  if (highAbsorption > 0) {
    lines.push(`${highAbsorption} SKU${highAbsorption !== 1 ? 's' : ''} ${highAbsorption !== 1 ? 'are' : 'is'} absorbing more than 70% of their individual cost inflation. These represent the highest-priority intervention — either a pricing revision or a contractual cost-indexed escalation clause with distributors is required.`);
  }

  lines.push(`The window for cost pass-through narrows as inflationary periods extend — consumer price expectations reset around the new market level, making delayed recovery progressively harder. Early action on high-absorption SKUs preserves more recovery optionality than deferred action.`);
  return lines;
};

const getChannelNarrative = (results) => {
  const p3 = results?.p3 || {};
  const channels = p3.channelResults || [];
  const distExposure = p3.totalDistExposure || results?.distExposure || 0;
  const lowContrib = channels.filter(c => c.contPct < 15).length;
  const bestChannel = channels.length > 0 ? channels.reduce((a, b) => (b.contPct > a.contPct ? b : a), channels[0]) : null;
  const worstChannel = channels.length > 0 ? channels.reduce((a, b) => (b.contPct < a.contPct ? b : a), channels[0]) : null;
  const lines = [];

  if (bestChannel && worstChannel && bestChannel.channel !== worstChannel.channel) {
    lines.push(`Channel contribution margins range from ${fmt(worstChannel.contPct, 'pctRaw')} (${worstChannel.channel}) to ${fmt(bestChannel.contPct, 'pctRaw')} (${bestChannel.channel}). This spread of ${((bestChannel.contPct - worstChannel.contPct)).toFixed(1)} percentage points indicates the route-to-market architecture requires review — not all channels are earning their cost of capital.`);
  } else if (channels.length > 0) {
    lines.push(`Channel economics show varying contribution margins across active routes-to-market. Understanding the true net contribution per channel — after trade credit cost, logistics, and distributor margin — is essential for allocating volume and promotional investment correctly.`);
  }

  if (lowContrib > 0) {
    lines.push(`${lowContrib} channel${lowContrib !== 1 ? 's' : ''} ${lowContrib !== 1 ? 'are' : 'is'} contributing below the 15% minimum threshold. A channel delivering below this level is unlikely to cover its allocated overhead and trade credit financing cost — volume routed through these channels is diluting overall portfolio margin.`);
  }

  if (distExposure > 0) {
    lines.push(`Distributor credit exposure of ${fmt(distExposure, 'nairaK')} represents capital tied up in the trade that carries an implicit financing cost. In a naira-volatile environment, extended credit terms to open market distributors represent a compounding margin drag that rarely appears in standard P&L reporting.`);
  }

  lines.push(`The priority action is to renegotiate distributor margin terms and reduce credit days on the lowest-contribution channels before increasing volume allocation. Improving channel economics by 2-3 percentage points on the weakest route typically yields more margin per naira than equivalent promotional spend.`);
  return lines;
};

const getTradeNarrative = (results) => {
  const p4 = results?.p4 || {};
  const promos = p4.results || [];
  const totalImpact = p4.totalPromoImpact || 0;
  const lossMaking = promos.filter(p => !p.profitable).length;
  const profitable = promos.filter(p => p.profitable).length;
  const total = promos.length;
  const lines = [];

  if (total === 0) {
    lines.push(`No trade promotions were recorded in this period. Adding promotion data will enable breakeven lift analysis and ROI calculation across your trade investment portfolio.`);
  } else if (lossMaking === total) {
    lines.push(`All ${total} active promotion${total !== 1 ? 's' : ''} in this period ${total !== 1 ? 'are' : 'is'} loss-making at the current discount depth and volume lift combination. Total promotional spend is destroying ${fmt(Math.abs(totalImpact), 'nairaK')} per month in margin without generating sufficient incremental volume to justify the cost.`);
  } else if (lossMaking > profitable) {
    lines.push(`${lossMaking} of ${total} active promotions are loss-making — the majority of trade investment is not generating returns above the breakeven threshold. The ${profitable} profitable promotion${profitable !== 1 ? 's' : ''} demonstrate that the product can be promoted effectively; the issue is depth and lift calibration on the remainder.`);
  } else {
    lines.push(`${profitable} of ${total} active promotions are generating positive margin returns. The ${lossMaking} loss-making promotion${lossMaking !== 1 ? 's' : ''} require immediate restructuring — either depth reduction or a volume commitment from the trade partner that justifies the investment.`);
  }

  if (total > 0) {
    lines.push(`A promotion is margin-accretive only when the incremental volume generated exceeds the breakeven lift threshold — the additional units required to offset the margin cost of the discount. When actual lift falls below this threshold, each promotional unit sold destroys more margin than it generates in revenue.`);
  }

  if (lossMaking > 0) {
    lines.push(`For each loss-making promotion, the options are: (1) reduce discount depth until the required breakeven lift becomes achievable, (2) negotiate a guaranteed volume commitment from the trade partner, or (3) exit the promotion entirely and redeploy the investment into a channel or SKU with a confirmed positive ROI.`);
  }
  return lines;
};

/* ══════════════════════════════════════════════════════════════
   NARRATIVE GENERATORS — M1 through M4
   ══════════════════════════════════════════════════════════════ */

const getM1Narrative = (results) => {
  const m1 = results?.m1 || {};
  const skus = m1.results || [];
  const total = skus.length;
  const protect = skus.filter(sk => sk.classification.includes('Protect')).length;
  const grow = skus.filter(sk => sk.classification.includes('Grow')).length;
  const reprice = skus.filter(sk => sk.classification.includes('Reprice')).length;
  const review = skus.filter(sk => sk.classification.includes('Review')).length;
  const dilutive = m1.dilutiveCount || 0;
  const dilutiveMargin = m1.dilutiveMargin || 0;
  const avgMargin = m1.portfolioAvgMarginPct || 0;
  const lines = [];

  lines.push(`Of ${total} active SKUs, ${protect} are classified as Protect (high margin, high volume), ${grow} as Grow (high margin, low volume), ${reprice} as Reprice (low margin, high volume), and ${review} as Review (low margin, low volume). This distribution determines where management attention and investment should be concentrated.`);

  if (dilutive > 0) {
    lines.push(`${dilutive} SKU${dilutive !== 1 ? 's are' : ' is'} below the portfolio average margin of ${avgMargin.toFixed(1)}%, collectively contributing ${fmt(dilutiveMargin, 'nairaK')} in below-average margin. These dilutive SKUs compress the overall portfolio margin — the question is whether their volume contribution justifies the margin drag.`);
  }

  if (review > 0) {
    lines.push(`The ${review} SKU${review !== 1 ? 's' : ''} in the Review quadrant (low margin, low volume) are the strongest delist candidates. Exiting these SKUs would simplify the portfolio, reduce operational complexity, and remove the margin dilution they create — without material revenue impact given their low volume share.`);
  }

  if (reprice > 0) {
    lines.push(`The ${reprice} Reprice SKU${reprice !== 1 ? 's' : ''} present the highest-value opportunity — high-volume products that are underperforming on margin. A targeted pricing adjustment on these SKUs would have disproportionate portfolio impact due to their volume base.`);
  }

  return lines;
};

const getM2Narrative = (results) => {
  const m2 = results?.m2 || {};
  const scenarios = m2.scenarios || [];
  const totalCogsBase = m2.totalCogsBase || 0;
  const worstCase = m2.worstCase || 0;
  const baseCase = m2.baseCase || 0;
  const lines = [];

  if (scenarios.length > 0) {
    const zeroRecovery = scenarios[0];
    const halfRecovery = scenarios.find(sc => sc.recoveryRate === 0.50);
    const fullRecovery = scenarios[scenarios.length - 1];

    lines.push(`Under a 40% input cost inflation scenario with zero price recovery, portfolio margin would decline by ${fmt(Math.abs(zeroRecovery?.marginChange || worstCase), 'nairaK')} per month — the worst-case exposure. At 50% recovery, the decline moderates to ${fmt(Math.abs(halfRecovery?.marginChange || 0), 'nairaK')}, and at full recovery the portfolio is protected.`);

    if (zeroRecovery?.projMarginPct != null) {
      lines.push(`The zero-recovery scenario would compress the portfolio margin to ${zeroRecovery.projMarginPct.toFixed(1)}%, a ${Math.abs(zeroRecovery.pctPtChange).toFixed(1)} percentage point decline from the current baseline. At this level, several SKUs would be operating below breakeven.`);
    }
  }

  if (totalCogsBase > 0) {
    lines.push(`The portfolio has a monthly COGS base of ${fmt(totalCogsBase, 'nairaK')}. Every 10 percentage points of unrecovered inflation adds ${fmt(totalCogsBase * 0.04, 'nairaK')} per month in absorbed cost. The compounding effect over a quarter makes early pricing action significantly more valuable than delayed recovery.`);
  }

  lines.push(`The recommended approach is to pre-index pricing to the most likely inflation scenario rather than reacting to cost increases after they materialise. Companies that establish cost-indexed pricing clauses with distributors before inflationary pressure peaks recover 15-20% more of the cost shock than those that negotiate retroactively.`);
  return lines;
};

const getM3Narrative = (results) => {
  const m3 = results?.m3 || {};
  if (!m3.hasData) return ['No trade investment data was recorded in this period. Adding spend data by channel will enable trade ROI analysis and spend reallocation recommendations.'];

  const channelResults = m3.results || [];
  const totalSpend = m3.totalSpend || 0;
  const blendedROI = m3.blendedROI;
  const best = m3.bestChannel;
  const worst = m3.worstChannel;
  const accretive = channelResults.filter(r => r.status === 'Accretive').length;
  const dilutive = channelResults.filter(r => r.status === 'Dilutive').length;
  const lines = [];

  if (blendedROI != null) {
    const roiLabel = blendedROI >= 2 ? 'accretive' : blendedROI >= 0.5 ? 'marginal' : 'dilutive';
    lines.push(`The blended trade spend ROI across all channels is ${blendedROI.toFixed(2)}x — classified as ${roiLabel}. Total trade investment of ${fmt(totalSpend, 'nairaK')} per month ${blendedROI >= 1 ? 'is generating a positive net return' : 'is not generating a net positive return'} when measured against channel contribution margins.`);
  }

  if (best && worst && best.channel !== worst.channel) {
    lines.push(`${best.channel} delivers the highest trade ROI at ${best.roi?.toFixed(2) || '—'}x, while ${worst.channel} is the lowest-performing channel at ${worst.roi?.toFixed(2) || '—'}x. Reallocating spend from the lowest-ROI channel to the highest would improve portfolio trade efficiency without increasing total investment.`);
  }

  if (dilutive > 0) {
    lines.push(`${dilutive} channel${dilutive !== 1 ? 's are' : ' is'} generating a dilutive return on trade spend — the trade investment in ${dilutive !== 1 ? 'these channels' : 'this channel'} is destroying more margin than it generates. The spend categories to audit first are listing fees and co-op spend, which are typically the least volume-linked and most negotiable.`);
  }

  lines.push(`Trade spend reallocation is the highest-leverage margin action after pricing — it requires no price change, no volume growth, and no new customer acquisition. Simply redirecting investment from dilutive to accretive channels converts existing spend into margin improvement.`);
  return lines;
};

const getM4Narrative = (results) => {
  const m4 = results?.m4 || {};
  if (!m4.hasData) return ['No distributor data was recorded in this period. Adding distributor-level margin, rebate, and credit terms data will enable a full performance scorecard.'];

  const distributors = m4.results || [];
  const totalDist = m4.totalDistributors || 0;
  const avgCont = m4.avgContPct || 0;
  const totalCredit = m4.totalCreditCost || 0;
  const renegotiate = m4.renegotiateCount || 0;
  const strategic = distributors.filter(d => d.classification.includes('Strategic')).length;
  const reviewDist = distributors.filter(d => d.classification.includes('Review')).length;
  const lines = [];

  lines.push(`The portfolio operates through ${totalDist} active distributor${totalDist !== 1 ? 's' : ''} with an average true net contribution of ${avgCont.toFixed(1)}%. ${strategic} ${strategic !== 1 ? 'are' : 'is'} classified as Strategic (high margin, high volume) — these are the relationships to protect and invest in selectively.`);

  if (renegotiate > 0) {
    lines.push(`${renegotiate} distributor${renegotiate !== 1 ? 's' : ''} ${renegotiate !== 1 ? 'are' : 'is'} classified as Renegotiate — high volume but dilutive net contribution. These relationships carry disproportionate revenue but are eroding portfolio margin through excessive distributor margins, rebates, or credit terms. Restructuring these terms is the single highest-impact action.`);
  }

  if (totalCredit > 0) {
    lines.push(`Implicit credit financing cost across all distributors totals ${fmt(totalCredit, 'nairaK')} per month. This hidden cost of trade credit — calculated at the working capital rate against outstanding credit days — rarely appears in standard channel P&L but directly reduces true net contribution.`);
  }

  if (reviewDist > 0) {
    lines.push(`${reviewDist} distributor${reviewDist !== 1 ? 's' : ''} ${reviewDist !== 1 ? 'are' : 'is'} in the Review quadrant — low margin and low volume. These relationships should be evaluated for continuation. Exiting the bottom-quartile distributor relationships and consolidating volume through Strategic and Grow-classified partners typically improves portfolio contribution by 2-4 percentage points.`);
  }

  return lines;
};

/* ══════════════════════════════════════════════════════════════
   PAGE COMPONENTS
   ══════════════════════════════════════════════════════════════ */

/* ── Cover ─────────────────────────────────────────────────── */
const getCoverSubtitle = (tier) => {
  if (tier === 'enterprise') {
    return 'A full-spectrum margin intelligence analysis across pricing, cost recovery, channel economics, trade execution, and advanced commercial diagnostics — quantified in Naira across your active portfolio.';
  }
  if (tier === 'professional') {
    return 'A comprehensive analysis of pricing intelligence, cost pass-through, channel economics, and trade execution across your active portfolio — every margin leak quantified in Naira.';
  }
  return 'A pricing intelligence analysis across your active SKU portfolio — quantifying repricing opportunities, willingness-to-pay headroom, and margin floor compliance.';
};

const getSummaryIntro = (tier, skuCount) => {
  if (tier === 'enterprise') {
    return `This report analyses ${skuCount} active SKUs across all eight analytical engines — pricing intelligence, cost pass-through, channel economics, trade execution, and advanced commercial diagnostics. Every margin opportunity is quantified in Naira.`;
  }
  if (tier === 'professional') {
    return `This report analyses ${skuCount} active SKUs across four pillars — pricing intelligence, cost pass-through, channel economics, and trade execution. The analysis identifies actionable margin opportunities and quantifies recovery potential.`;
  }
  return `This report analyses ${skuCount} active SKUs across the Pricing Intelligence pillar — identifying repricing opportunities, willingness-to-pay headroom, and margin floor compliance across your active portfolio.`;
};

const CoverPage = ({ companyName, periodLabel, skuCount, tier }) => (
  <Page size="A4" style={s.coverPage}>
    <View>
      <Text style={{ fontSize: 10, color: C.teal, fontWeight: 700, letterSpacing: 2, marginBottom: 24, textTransform: 'uppercase' }}>
        MARGINCOS
      </Text>
      <Text style={s.coverTitle}>Margin Intelligence Report</Text>
      <Text style={s.coverSub}>
        {getCoverSubtitle(tier)}
      </Text>
    </View>
    <View style={s.coverMeta}>
      <Text style={{ fontSize: 11, color: C.white, fontWeight: 700, marginBottom: 6 }}>{companyName || 'Your Company'}</Text>
      <Text style={s.coverMeta}>Period: {periodLabel || 'Current'} | {skuCount || 0} active SKUs | Generated {today()}</Text>
      <Text style={[s.coverMeta, { marginTop: 10 }]}>A product of Carthena Advisory | carthenaadvisory.com</Text>
    </View>
  </Page>
);

/* ── Executive Summary ─────────────────────────────────────── */
const SummaryPage = ({ results, companyName, tier }) => {
  const { totalRevenue, totalCurrentMargin, skuCount, p1, p2, actions } = results;
  const marginPct = totalRevenue > 0 ? (totalCurrentMargin / totalRevenue * 100) : 0;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Executive Summary</Text>
      <Text style={s.sectionSub}>
        {getSummaryIntro(tier, skuCount)}
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

/* ── P1 Pricing Intelligence ───────────────────────────────── */
const PricingPage = ({ results, companyName }) => {
  const p1 = results?.p1;
  if (!p1?.results?.length) return null;
  const sorted = [...p1.results].sort((a, b) => (b.delta || 0) - (a.delta || 0));
  const rows = sorted.slice(0, 20);
  const truncated = sorted.length > 20;

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

      <NarrativeBlock lines={getPricingNarrative(results)} />

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
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.marginPct, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.wtpGap, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{r.compGap != null ? fmt(r.compGap, 'pctRaw') : '—'}</Text>
        </View>
      ))}
      {truncated && <TruncationNotice shown={20} total={sorted.length} />}
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── P2 Cost Pass-Through ──────────────────────────────────── */
const CostPage = ({ results, companyName }) => {
  const p2 = results?.p2;
  if (!p2?.results?.length) return null;
  const sorted = [...p2.results].sort((a, b) => (b.absorbed || 0) - (a.absorbed || 0));
  const rows = sorted.slice(0, 20);
  const truncated = sorted.length > 20;

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

      <NarrativeBlock lines={getCostNarrative(results)} />
      <P2WaterfallSvg p2={p2} />

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
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.inf, 'pct')}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.pt, 'pct')}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.absorbedPct, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.shock, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right' }]}>{fmt(r.absorbed, 'nairaK')}</Text>
        </View>
      ))}
      {truncated && <TruncationNotice shown={20} total={sorted.length} />}
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── P3 Channel Economics ──────────────────────────────────── */
const ChannelPage = ({ results, companyName }) => {
  const p3 = results?.p3;
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

      <NarrativeBlock lines={getChannelNarrative(results)} />
      <P3ChannelSvg channelResults={p3.channelResults} />

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
          <Text style={[s.tableCell, { width: '15%', textAlign: 'right', color: ch.contPct < 15 ? C.red : C.navy }]}>{fmt(ch.contPct, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '10%', textAlign: 'right' }]}>{ch.skuCount}</Text>
          <Text style={[s.tableCell, { width: '10%', textAlign: 'right' }]}>{ch.vol?.toLocaleString() || '—'}</Text>
        </View>
      ))}
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── P4 Trade Execution ────────────────────────────────────── */
const TradePage = ({ results, companyName }) => {
  const p4 = results?.p4;
  if (!p4?.results?.length) return null;
  const sorted = [...p4.results].sort((a, b) => Math.abs(b.netImpact || 0) - Math.abs(a.netImpact || 0));
  const rows = sorted.slice(0, 20);
  const truncated = sorted.length > 20;
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

      <NarrativeBlock lines={getTradeNarrative(results)} />

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
          <Text style={[s.tableCell, { width: '12%', textAlign: 'right' }]}>{fmt(r.depth, 'pct')}</Text>
          <Text style={[s.tableCell, { width: '12%', textAlign: 'right' }]}>{fmt(r.lift, 'pct')}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>
            {r.bevLift != null ? `${parseFloat(r.bevLift).toFixed(1)}%` : '—'}
          </Text>
          <Text style={[s.tableCell, { width: '16%', textAlign: 'right', color: r.profitable ? C.teal : C.red, fontWeight: 700 }]}>
            {fmt(r.netImpact, 'nairaK')}
          </Text>
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
      {truncated && <TruncationNotice shown={20} total={sorted.length} />}
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ══════════════════════════════════════════════════════════════
   ENTERPRISE MODULE PAGES — M1 through M4
   ══════════════════════════════════════════════════════════════ */

/* ── M1 SKU Portfolio Rationalisation ──────────────────────── */
const M1Page = ({ results, companyName }) => {
  const m1 = results?.m1;
  if (!m1?.results?.length) return null;
  const rows = m1.results.slice(0, 25);
  const truncated = m1.results.length > 25;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>M1 | SKU Portfolio Rationalisation</Text>
      <Text style={s.sectionSub}>
        Portfolio avg margin: {fmt(m1.portfolioAvgMarginPct, 'pctRaw')} | {m1.dilutiveCount} dilutive SKUs | Margin at stake: {fmt(m1.marginAtStake, 'nairaK')}
      </Text>

      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>Avg Margin</Text>
          <Text style={[s.kpiValue, { color: C.navy }]}>{fmt(m1.portfolioAvgMarginPct, 'pctRaw')}</Text>
          <Text style={s.kpiSub}>Portfolio average</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.red }]}>
          <Text style={s.kpiLabel}>Dilutive SKUs</Text>
          <Text style={[s.kpiValue, { color: C.red }]}>{m1.dilutiveCount}</Text>
          <Text style={s.kpiSub}>Below average margin</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.gold }]}>
          <Text style={s.kpiLabel}>Margin at Stake</Text>
          <Text style={[s.kpiValue, { color: C.gold }]}>{fmt(m1.marginAtStake, 'nairaK')}</Text>
          <Text style={s.kpiSub}>From dilutive SKUs</Text>
        </View>
      </View>

      <NarrativeBlock lines={getM1Narrative(results)} />

      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: '22%' }]}>SKU</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Margin %</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Rev Share</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>vs Avg</Text>
        <Text style={[s.tableHeaderCell, { width: '18%', textAlign: 'center' }]}>Class</Text>
        <Text style={[s.tableHeaderCell, { width: '18%', textAlign: 'right' }]}>Margin NGN</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
          <Text style={[s.tableCell, { width: '22%' }]} numberOfLines={1}>{r.sku}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.skuMarginPct, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.revShare, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right', color: r.vsAvg >= 0 ? C.teal : C.red }]}>
            {r.vsAvg >= 0 ? '+' : ''}{r.vsAvg.toFixed(1)}pp
          </Text>
          <View style={{ width: '18%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[s.badge, { color: r.classColor, backgroundColor: r.classBg }]}>
              {r.classification}
            </Text>
          </View>
          <Text style={[s.tableCell, { width: '18%', textAlign: 'right' }]}>{fmt(r.skuMarginAbs, 'nairaK')}</Text>
        </View>
      ))}
      {truncated && <TruncationNotice shown={25} total={m1.results.length} />}
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── M2 Forward Inflation Scenario ─────────────────────────── */
const M2Page = ({ results, companyName }) => {
  const m2 = results?.m2;
  if (!m2?.scenarios?.length) return null;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>M2 | Forward Inflation Scenario Engine</Text>
      <Text style={s.sectionSub}>
        COGS base: {fmt(m2.totalCogsBase, 'nairaK')} /month | Worst-case margin impact: {fmt(m2.worstCase, 'nairaK')} | 40% inflation scenario
      </Text>

      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { borderLeftColor: C.red }]}>
          <Text style={s.kpiLabel}>Worst Case</Text>
          <Text style={[s.kpiValue, { color: C.red }]}>{fmt(Math.abs(m2.worstCase), 'nairaK')}</Text>
          <Text style={s.kpiSub}>0% recovery scenario</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.gold }]}>
          <Text style={s.kpiLabel}>Base Case</Text>
          <Text style={[s.kpiValue, { color: C.gold }]}>{fmt(m2.baseCase, 'nairaK')}</Text>
          <Text style={s.kpiSub}>50% recovery margin</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>COGS Base</Text>
          <Text style={[s.kpiValue, { color: C.navy }]}>{fmt(m2.totalCogsBase, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Monthly input cost</Text>
        </View>
      </View>

      <NarrativeBlock lines={getM2Narrative(results)} />
      <M2ScenarioSvg scenarios={m2.scenarios} />

      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: '18%' }]}>Recovery Rate</Text>
        <Text style={[s.tableHeaderCell, { width: '16%', textAlign: 'right' }]}>Cost Shock</Text>
        <Text style={[s.tableHeaderCell, { width: '16%', textAlign: 'right' }]}>Absorbed</Text>
        <Text style={[s.tableHeaderCell, { width: '16%', textAlign: 'right' }]}>Proj. Margin</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Margin %</Text>
        <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'center' }]}>Risk Level</Text>
      </View>
      {m2.scenarios.map((sc, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
          <Text style={[s.tableCell, { width: '18%', fontWeight: 600 }]}>{(sc.recoveryRate * 100).toFixed(0)}% recovery</Text>
          <Text style={[s.tableCell, { width: '16%', textAlign: 'right' }]}>{fmt(sc.costShock, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '16%', textAlign: 'right' }]}>{fmt(sc.absorbed, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '16%', textAlign: 'right' }]}>{fmt(sc.projMargin, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(sc.projMarginPct, 'pctRaw')}</Text>
          <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[s.badge, { color: sc.riskColor, backgroundColor: sc.riskBg }]}>
              {sc.riskLevel.replace(/^[^\w]+/, '')}
            </Text>
          </View>
        </View>
      ))}
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── M3 Trade Spend ROI ────────────────────────────────────── */
const M3Page = ({ results, companyName }) => {
  const m3 = results?.m3;
  if (!m3?.hasData) return null;
  const rows = m3.results || [];

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>M3 | Trade Spend ROI Analyser</Text>
      <Text style={s.sectionSub}>
        Total trade spend: {fmt(m3.totalSpend, 'nairaK')} /month | Blended ROI: {m3.blendedROI != null ? `${m3.blendedROI.toFixed(2)}x` : '—'}
      </Text>

      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>Total Spend</Text>
          <Text style={[s.kpiValue, { color: C.navy }]}>{fmt(m3.totalSpend, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Monthly trade investment</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: m3.blendedROI >= 1 ? C.teal : C.red }]}>
          <Text style={s.kpiLabel}>Blended ROI</Text>
          <Text style={[s.kpiValue, { color: m3.blendedROI >= 1 ? C.teal : C.red }]}>
            {m3.blendedROI != null ? `${m3.blendedROI.toFixed(2)}x` : '—'}
          </Text>
          <Text style={s.kpiSub}>Contribution / spend</Text>
        </View>
        {m3.bestChannel && (
          <View style={[s.kpiCard, { borderLeftColor: C.gold }]}>
            <Text style={s.kpiLabel}>Best Channel</Text>
            <Text style={[s.kpiValue, { color: C.gold }]}>{m3.bestChannel.channel}</Text>
            <Text style={s.kpiSub}>{m3.bestChannel.roi?.toFixed(2) || '—'}x ROI</Text>
          </View>
        )}
      </View>

      <NarrativeBlock lines={getM3Narrative(results)} />
      <M3TradeROISvg results={m3.results} />

      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: '20%' }]}>Channel</Text>
        <Text style={[s.tableHeaderCell, { width: '16%', textAlign: 'right' }]}>Spend</Text>
        <Text style={[s.tableHeaderCell, { width: '16%', textAlign: 'right' }]}>Net Rev</Text>
        <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>ROI</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Intensity</Text>
        <Text style={[s.tableHeaderCell, { width: '22%', textAlign: 'center' }]}>Status</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
          <Text style={[s.tableCell, { width: '20%', fontWeight: 600 }]}>{r.channel}</Text>
          <Text style={[s.tableCell, { width: '16%', textAlign: 'right' }]}>{fmt(r.total, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '16%', textAlign: 'right' }]}>{fmt(r.netRev, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '12%', textAlign: 'right' }]}>{r.roi != null ? `${r.roi.toFixed(2)}x` : '—'}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{r.spendIntensity != null ? fmt(r.spendIntensity, 'pctRaw') : '—'}</Text>
          <View style={{ width: '22%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[s.badge, { color: r.statusColor, backgroundColor: r.statusBg }]}>{r.status}</Text>
          </View>
        </View>
      ))}
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── M4 Distributor Performance Scorecard ──────────────────── */
const M4Page = ({ results, companyName }) => {
  const m4 = results?.m4;
  if (!m4?.hasData) return null;
  const rows = m4.results.slice(0, 20);
  const truncated = m4.results.length > 20;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>M4 | Distributor Performance Scorecard</Text>
      <Text style={s.sectionSub}>
        {m4.totalDistributors} distributors | Avg net contribution: {fmt(m4.avgContPct, 'pctRaw')} | Credit financing cost: {fmt(m4.totalCreditCost, 'nairaK')} /month
      </Text>

      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>Distributors</Text>
          <Text style={[s.kpiValue, { color: C.navy }]}>{m4.totalDistributors}</Text>
          <Text style={s.kpiSub}>Active relationships</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.gold }]}>
          <Text style={s.kpiLabel}>Avg Contribution</Text>
          <Text style={[s.kpiValue, { color: C.gold }]}>{fmt(m4.avgContPct, 'pctRaw')}</Text>
          <Text style={s.kpiSub}>True net %</Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: C.red }]}>
          <Text style={s.kpiLabel}>Credit Cost</Text>
          <Text style={[s.kpiValue, { color: C.red }]}>{fmt(m4.totalCreditCost, 'nairaK')}</Text>
          <Text style={s.kpiSub}>Hidden financing drag</Text>
        </View>
      </View>

      <NarrativeBlock lines={getM4Narrative(results)} />

      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: '20%' }]}>Distributor</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Revenue</Text>
        <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>True Cont.</Text>
        <Text style={[s.tableHeaderCell, { width: '10%', textAlign: 'right' }]}>Cont. %</Text>
        <Text style={[s.tableHeaderCell, { width: '10%', textAlign: 'right' }]}>Rev %</Text>
        <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'right' }]}>Credit</Text>
        <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'center' }]}>Class</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
          <Text style={[s.tableCell, { width: '20%', fontWeight: 600 }]} numberOfLines={1}>{r.name}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.rev, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '14%', textAlign: 'right' }]}>{fmt(r.trueContrib, 'nairaK')}</Text>
          <Text style={[s.tableCell, { width: '10%', textAlign: 'right', color: r.contPct >= 15 ? C.teal : C.red }]}>
            {fmt(r.contPct, 'pctRaw')}
          </Text>
          <Text style={[s.tableCell, { width: '10%', textAlign: 'right' }]}>{fmt(r.revShare, 'pctRaw')}</Text>
          <Text style={[s.tableCell, { width: '12%', textAlign: 'right' }]}>{fmt(r.creditCost, 'nairaK')}</Text>
          <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[s.badge, { color: r.classColor, backgroundColor: r.classBg }]}>{r.classification}</Text>
          </View>
        </View>
      ))}
      {truncated && <TruncationNotice shown={20} total={m4.results.length} />}
      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── Trend narrative generator ─────────────────────────────── */
function generateTrendNarrative(deltas, earlierLabel, laterLabel, prevSkuCount, currSkuCount) {
  if (!deltas) return '';

  const metrics = [
    { name: 'Revenue',            d: deltas.portfolio?.revenue,            positive: true  },
    { name: 'Portfolio margin',   d: deltas.portfolio?.totalCurrentMargin,  positive: true  },
    { name: 'Revenue at risk',    d: deltas.portfolio?.revenueAtRisk,       positive: false },
    { name: 'Repricing gain',     d: deltas.portfolio?.marginProtected,     positive: true  },
    { name: 'Cost absorbed',      d: deltas.portfolio?.costAbsorbed,        positive: false },
    { name: 'Channel exposure',   d: deltas.portfolio?.channelExposure,     positive: false },
  ].filter(m => m.d && m.d.direction !== 'flat');

  if (metrics.length === 0) {
    return `No material movement was detected between ${earlierLabel} and ${laterLabel}. Both periods are broadly consistent across all six tracked metrics.`;
  }

  const improved    = metrics.filter(m => m.positive ? m.d.direction === 'up'   : m.d.direction === 'down');
  const deteriorated = metrics.filter(m => m.positive ? m.d.direction === 'down' : m.d.direction === 'up');

  const parts = [];

  // Sentence 0 — SKU count context (only if portfolio size changed between periods)
  if (prevSkuCount != null && currSkuCount != null && prevSkuCount !== currSkuCount) {
    const diff = currSkuCount - prevSkuCount;
    const abs  = Math.abs(diff);
    const dir  = diff > 0 ? 'expanded' : 'contracted';
    parts.push(
      `Note: the active portfolio ${dir} from ${prevSkuCount} to ${currSkuCount} SKUs between ${earlierLabel} and ${laterLabel} — the ${diff > 0 ? 'addition' : 'removal'} of ${abs} SKU${abs !== 1 ? 's' : ''} means some revenue and margin movement below reflects structural portfolio change, not purely like-for-like commercial performance.`
    );
  }

  // Sentence 1 — opening: overall revenue direction
  const rev = deltas.portfolio?.revenue;
  if (rev && rev.direction !== 'flat') {
    const pct = Math.abs(rev.pctChange || 0).toFixed(1);
    parts.push(
      `Portfolio revenue ${rev.direction === 'up' ? 'grew' : 'declined'} ${pct}% from ${earlierLabel} to ${laterLabel}.`
    );
  }

  // Sentence 2 — what improved (if any), worded by direction type
  if (improved.length > 0) {
    const hiUp   = improved.filter(m =>  m.positive); // higher-is-better, went up
    const loDown = improved.filter(m => !m.positive); // lower-is-better, went down

    if (hiUp.length > 0 && loDown.length > 0) {
      const upNames = hiUp.map(m => m.name.toLowerCase()).join(' and ');
      const dnNames = loDown.map(m => m.name.toLowerCase()).join(' and ');
      const upCap   = upNames.charAt(0).toUpperCase() + upNames.slice(1);
      parts.push(`${upCap} grew over the period, while ${dnNames} declined — both positive signals.`);
    } else if (hiUp.length > 0) {
      const names = hiUp.map(m => m.name.toLowerCase()).join(', ');
      parts.push(
        hiUp.length === 1
          ? `${hiUp[0].name.charAt(0).toUpperCase() + hiUp[0].name.slice(1)} improved over the period.`
          : `Positive movement was recorded in ${names}.`
      );
    } else {
      // All improvements are lower-is-better metrics declining — make it explicit
      const names = loDown.map(m => m.name.toLowerCase()).join(', ');
      const cap   = names.charAt(0).toUpperCase() + names.slice(1);
      parts.push(
        loDown.length === 1
          ? `${loDown[0].name.charAt(0).toUpperCase() + loDown[0].name.slice(1)} declined — a positive signal.`
          : `${cap} all declined, reflecting improved cost discipline and tighter channel management.`
      );
    }
  }

  // Sentence 3 — what deteriorated, largest named specifically
  if (deteriorated.length > 0) {
    const sorted = [...deteriorated].sort((a, b) => Math.abs(b.d.value) - Math.abs(a.d.value));
    const worst = sorted[0];
    const worstPct = Math.abs(worst.d.pctChange || 0).toFixed(1);
    const worstName = worst.name.charAt(0).toUpperCase() + worst.name.slice(1);

    if (deteriorated.length === 1) {
      parts.push(
        `${worstName} moved unfavourably by ${worstPct}% and should be reviewed before the next period close.`
      );
    } else {
      const otherNames = sorted.slice(1).map(m => m.name.toLowerCase()).join(' and ');
      parts.push(
        `${worstName} deteriorated by ${worstPct}%, alongside ${otherNames} — these areas require immediate attention to prevent further margin compression.`
      );
    }
  }

  // Sentence 4 — closing action statement
  if (deteriorated.length > improved.length) {
    // Identify the specific priority action based on the worst metric
    const sorted = [...deteriorated].sort((a, b) => Math.abs(b.d.value) - Math.abs(a.d.value));
    const actionMap = {
      'Cost absorbed':    'Accelerating cost pass-through recovery is the highest-priority action to prevent the absorption gap compounding into next period.',
      'Portfolio margin': 'Margin recovery should be the immediate commercial priority — review pricing and channel terms before the next period close.',
      'Revenue at risk':  'Revenue at risk has widened — a targeted review of below-floor SKUs and WTP headroom capture is required.',
      'Channel exposure': 'Channel economics have weakened — distributor margin and rebate terms should be reviewed as a priority.',
      'Repricing gain':   'Pricing headroom capture has slowed — review the SKUs with the largest WTP gaps to recover margin pace.',
      'Revenue':          'Top-line pressure requires investigation — volume, pricing, and channel mix should all be reviewed.',
    };
    const actionKey = sorted[0].name;
    parts.push(actionMap[actionKey] || 'The balance of movement is negative — prioritise the highest-value corrective actions before the next reporting cycle.');
  } else if (improved.length > deteriorated.length) {
    parts.push('The overall trend is positive — areas of deterioration should be monitored to sustain momentum heading into the next period.');
  } else if (improved.length > 0 && deteriorated.length > 0) {
    parts.push('Performance is mixed — sustain the gains in improving metrics while addressing the deteriorating areas before they compound.');
  }

  return parts.join(' ');
}

/* ── Period Comparison ─────────────────────────────────────── */
const ComparisonPage = ({ chronologicalDelta, companyName }) => {
  if (!chronologicalDelta) return null;
  const { laterResults, earlierResults, laterPeriod, earlierPeriod } = chronologicalDelta;
  const deltas = computeDeltas(laterResults, earlierResults);
  if (!deltas) return null;

  const earlier = earlierPeriod?.label || 'Prior';
  const later   = laterPeriod?.label   || 'Current';

  const trendArrow = (direction) => {
    if (direction === 'up')   return '+';
    if (direction === 'down') return '-';
    return '';
  };

  const trendColor = (direction, isPositive) => {
    if (direction === 'flat') return C.muted;
    if (direction === 'up')   return isPositive ? C.teal : C.red;
    return isPositive ? C.red : C.teal;
  };

  const metrics = [
    {
      label:      'Total Revenue',
      sub:        'Monthly portfolio revenue',
      delta:      deltas.portfolio.revenue,
      isPositive: true,
    },
    {
      label:      'Portfolio Margin',
      sub:        'Gross contribution margin',
      delta:      deltas.portfolio.totalCurrentMargin,
      isPositive: true,
    },
    {
      label:      'Revenue at Risk',
      sub:        'Below-floor / WTP gap exposure',
      delta:      deltas.portfolio.revenueAtRisk,
      isPositive: false, // lower is better
    },
    {
      label:      'Margin Protected',
      sub:        'Repricing gain vs prior period',
      delta:      deltas.portfolio.marginProtected,
      isPositive: true,
    },
  ];

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>Period-over-Period Comparison</Text>
      <Text style={s.sectionSub}>
        {earlier} to {later} | Positive deltas reflect improvement in each metric direction.
      </Text>

      <View style={s.kpiRow}>
        {metrics.slice(0, 2).map((m, i) => {
          const d = m.delta;
          const color = d ? trendColor(d.direction, m.isPositive) : C.muted;
          return (
            <View key={i} style={[s.kpiCard, { borderLeftColor: color }]}>
              <Text style={s.kpiLabel}>{m.label}</Text>
              <Text style={[s.kpiValue, { color }]}>
                {d && d.direction !== 'flat'
                  ? `${trendArrow(d.direction)} ${fmt(Math.abs(d.value), 'nairaK')}`
                  : 'No change'}
              </Text>
              <Text style={s.kpiSub}>
                {d?.pctChange != null
                  ? `${d.pctChange > 0 ? '+' : ''}${d.pctChange.toFixed(1)}% · ${m.sub}`
                  : m.sub}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={s.kpiRow}>
        {metrics.slice(2, 4).map((m, i) => {
          const d = m.delta;
          const color = d ? trendColor(d.direction, m.isPositive) : C.muted;
          return (
            <View key={i} style={[s.kpiCard, { borderLeftColor: color }]}>
              <Text style={s.kpiLabel}>{m.label}</Text>
              <Text style={[s.kpiValue, { color }]}>
                {d && d.direction !== 'flat'
                  ? `${trendArrow(d.direction)} ${fmt(Math.abs(d.value), 'nairaK')}`
                  : 'No change'}
              </Text>
              <Text style={s.kpiSub}>
                {d?.pctChange != null
                  ? `${d.pctChange > 0 ? '+' : ''}${d.pctChange.toFixed(1)}% · ${m.sub}`
                  : m.sub}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Trend summary table */}
      <View style={{ marginTop: 8 }}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, { width: '30%' }]}>Metric</Text>
          <Text style={[s.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>{earlier}</Text>
          <Text style={[s.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>{later}</Text>
          <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Δ Change</Text>
        </View>

        {/* SKU Count — context row, always first, styled distinctly */}
        {(() => {
          const prevCount = earlierResults.skuCount ?? null;
          const currCount = laterResults.skuCount  ?? null;
          const skuDiff   = (currCount != null && prevCount != null) ? currCount - prevCount : null;
          return (
            <View style={[s.tableRow, { backgroundColor: '#EEF2F7' }]}>
              <Text style={[s.tableCell, { width: '30%', fontWeight: 700, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.5, color: C.navy }]}>
                Active SKUs
              </Text>
              <Text style={[s.tableCell, { width: '25%', textAlign: 'right', fontWeight: 600 }]}>{prevCount ?? '—'}</Text>
              <Text style={[s.tableCell, { width: '25%', textAlign: 'right', fontWeight: 600 }]}>{currCount ?? '—'}</Text>
              <Text style={[s.tableCell, { width: '20%', textAlign: 'right', fontWeight: 700,
                color: skuDiff == null ? C.muted : skuDiff === 0 ? C.muted : skuDiff > 0 ? C.teal : C.gold }]}>
                {skuDiff != null ? `${skuDiff > 0 ? '+' : ''}${skuDiff} SKUs` : '—'}
              </Text>
            </View>
          );
        })()}

        {/* Financial metric rows */}
        {[
          { label: 'Revenue',          curr: laterResults.totalRevenue,           prev: earlierResults.totalRevenue,           pos: true  },
          { label: 'Portfolio Margin', curr: laterResults.totalCurrentMargin,      prev: earlierResults.totalCurrentMargin,      pos: true  },
          { label: 'Revenue at Risk',  curr: laterResults.revenueAtRisk,           prev: earlierResults.revenueAtRisk,           pos: false },
          { label: 'Pricing Gain',     curr: laterResults.p1?.totalGain,           prev: earlierResults.p1?.totalGain,           pos: true  },
          { label: 'Cost Absorbed',    curr: laterResults.p2?.totalAbsorbed,       prev: earlierResults.p2?.totalAbsorbed,       pos: false },
          { label: 'Channel Exposure', curr: laterResults.p3?.totalDistExposure,   prev: earlierResults.p3?.totalDistExposure,   pos: false },
        ].map((row, i) => {
          const diff = (row.curr != null && row.prev != null) ? row.curr - row.prev : null;
          const diffPct = (diff != null && row.prev !== 0) ? (diff / Math.abs(row.prev) * 100) : null;
          // Polarity-aware colour: improvement = teal, deterioration = red
          const isImprovement = diff == null ? null
            : row.pos ? diff >= 0 : diff <= 0;
          const deltaColor = diff == null ? C.muted : isImprovement ? C.teal : C.red;
          return (
            <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
              <Text style={[s.tableCell, { width: '30%', fontWeight: 600 }]}>{row.label}</Text>
              <Text style={[s.tableCell, { width: '25%', textAlign: 'right' }]}>{fmt(row.prev, 'nairaK')}</Text>
              <Text style={[s.tableCell, { width: '25%', textAlign: 'right' }]}>{fmt(row.curr, 'nairaK')}</Text>
              <Text style={[s.tableCell, { width: '20%', textAlign: 'right', color: deltaColor }]}>
                {diff != null
                  ? `${diff >= 0 ? '+' : ''}${fmt(diff, 'nairaK')}${diffPct != null ? ` (${diffPct.toFixed(1)}%)` : ''}`
                  : '—'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Trend Narrative */}
      <View style={{
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: C.teal,
      }}>
        <Text style={{
          fontSize: 7,
          fontWeight: 700,
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}>
          Trend Analysis
        </Text>
        <Text style={{
          fontSize: 9.5,
          color: C.navy,
          lineHeight: 1.7,
        }}>
          {generateTrendNarrative(deltas, earlier, later, earlierResults.skuCount, laterResults.skuCount)}
        </Text>
      </View>

      <PageFooter companyName={companyName} />
    </Page>
  );
};

/* ── Disclaimer ────────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════════
   MAIN DOCUMENT
   ══════════════════════════════════════════════════════════════ */
export default function MarginCOSReport({ results, companyName, periodLabel, tier, isEnterprise, chronologicalDelta }) {
  if (!results) return null;

  return (
    <Document
      title={`MarginCOS Report - ${companyName || 'Portfolio'}`}
      author="MarginCOS | Carthena Advisory"
      subject="Margin Intelligence Report"
    >
      <CoverPage companyName={companyName} periodLabel={periodLabel} skuCount={results.skuCount} tier={tier} />
      <SummaryPage results={results} companyName={companyName} tier={tier} />
      {chronologicalDelta && (
        <ComparisonPage
          chronologicalDelta={chronologicalDelta}
          companyName={companyName}
        />
      )}
      <PricingPage results={results} companyName={companyName} />
      <P1ChartPage results={results} companyName={companyName} />
      <CostPage results={results} companyName={companyName} />
      <ChannelPage results={results} companyName={companyName} />
      <TradePage results={results} companyName={companyName} />
      <P4ChartPage results={results} companyName={companyName} />
      {isEnterprise && <M1Page results={results} companyName={companyName} />}
      {isEnterprise && <M1ChartPage results={results} companyName={companyName} />}
      {isEnterprise && <M2Page results={results} companyName={companyName} />}
      {isEnterprise && <M3Page results={results} companyName={companyName} />}
      {isEnterprise && <M4Page results={results} companyName={companyName} />}
      {isEnterprise && <M4ChartPage results={results} companyName={companyName} />}
      <DisclaimerPage companyName={companyName} />
    </Document>
  );
}
