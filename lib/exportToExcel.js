/**
 * exportToExcel.js
 * Thin wrappers over the xlsx package for each MarginCOS data table.
 * All functions are async and trigger a browser file download.
 * No imports from other app files — only the xlsx package.
 *
 * Formatting (free xlsx 0.18.5 — no cell styles):
 *   Row 0  : header band merged across all columns
 *   Row 1  : column headers in ALL CAPS
 *   Rows 2+: data rows
 *   ws['!cols']   : column widths (wch)
 *   ws['!merges'] : header band merge
 *   ws['!freeze'] : freeze rows 0-1 so headers stay visible on scroll
 *
 * Number conventions:
 *   NGN amounts  → Math.round + toLocaleString('en-NG')  e.g. "4,337,514"
 *   Percentages  → +toFixed(1) numeric                   e.g. 23.5
 *   Volumes      → toLocaleString('en-NG')               e.g. "12,000"
 *   Booleans     → "Yes" / "No"
 */

async function getXLSX() {
  const mod = await import('xlsx');
  return mod.default ?? mod;
}

/** Round and comma-format an NGN monetary value as a string. */
function fmtNGN(v) {
  if (v == null || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? '' : Math.round(num).toLocaleString('en-NG');
}

/** Format a percentage value to 1 decimal place (returns a number). */
function fmtPct(v) {
  if (v == null || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? '' : +num.toFixed(1);
}

/**
 * Build a worksheet with header band + ALL-CAPS column headers + data + widths + freeze.
 *
 * @param {object} XLSX       - the xlsx module
 * @param {object} config
 * @param {string} config.title       - e.g. 'P1 Pricing Gap'
 * @param {string} config.periodLabel - period identifier (may be empty)
 * @param {Array}  config.cols        - [{ header, width, value: row => cellValue }, ...]
 * @param {Array}  config.dataRows    - raw data array
 */
function makeSheet(XLSX, { title, periodLabel, cols, dataRows }) {
  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const parts = ['MARGINCOS', title.toUpperCase()];
  if (periodLabel) parts.push(periodLabel.toUpperCase());
  parts.push(`Exported: ${date}`);
  const band = parts.join('  ·  ');

  const numCols = cols.length;
  const aoa = [
    [band, ...Array(numCols - 1).fill('')],               // row 0: header band
    cols.map(c => c.header.toUpperCase()),                 // row 1: column headers
    ...dataRows.map(row => cols.map(c => c.value(row))),  // rows 2+: data
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];
  ws['!cols']   = cols.map(c => ({ wch: c.width }));
  ws['!freeze'] = { xSplit: 0, ySplit: 2 };
  return ws;
}

function buildWb(XLSX, sheetName, config) {
  const ws = makeSheet(XLSX, config);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  wb.__xlsxRef = XLSX;
  return wb;
}

function download(wb, filename) {
  const XLSX = wb.__xlsxRef;
  delete wb.__xlsxRef;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob  = new Blob([wbout], { type: 'application/octet-stream' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── P1: Pricing Gap ──────────────────────────────────────────────────────────
// compGap: (price - compPrice) / compPrice * 100 → percentage, not NGN
// wtpGap:  price * wtp * vol                     → NGN/mo
// delta:   newMargin - curMargin                 → NGN/mo
export async function exportP1PricingGap(sorted, periodLabel = '') {
  const XLSX = await getXLSX();
  const cols = [
    { header: 'SKU',           width: 35, value: r => r.sku      ?? '' },
    { header: 'Category',      width: 22, value: r => r.category ?? '' },
    { header: 'Price (NGN)',   width: 20, value: r => fmtNGN(r.price) },
    { header: 'Margin %',      width: 18, value: r => fmtPct(r.marginPct) },
    { header: 'Comp Gap (%)',  width: 18, value: r => r.compGap != null ? fmtPct(r.compGap) : '' },
    { header: 'WTP Gap (NGN)', width: 20, value: r => fmtNGN(r.wtpGap) },
    { header: 'Delta (NGN)',   width: 20, value: r => fmtNGN(r.delta) },
    { header: 'Floor Breach',  width: 15, value: r => r.floorBreach ? 'Yes' : 'No' },
  ];
  const filename = periodLabel
    ? `MarginCOS_P1_PricingGap_${periodLabel}.xlsx`
    : 'MarginCOS_P1_PricingGap.xlsx';
  download(
    buildWb(XLSX, 'P1 Pricing Gap', { title: 'P1 Pricing Gap', periodLabel, cols, dataRows: sorted || [] }),
    filename,
  );
}

// ─── P2: Cost Pass-Through ────────────────────────────────────────────────────
// r.pt: pass_through_rate / 100 → 0-1 decimal; display as percentage (× 100)
export async function exportP2CostPassThrough(sorted, periodLabel = '') {
  const XLSX = await getXLSX();
  const cols = [
    { header: 'SKU',                   width: 35, value: r => r.sku      ?? '' },
    { header: 'Category',              width: 22, value: r => r.category ?? '' },
    { header: 'Cost Shock (NGN)',       width: 22, value: r => fmtNGN(r.shock) },
    { header: 'Pass-Through Rate (%)', width: 24, value: r => r.pt != null ? fmtPct(r.pt * 100) : '' },
    { header: 'Absorbed (NGN)',         width: 22, value: r => fmtNGN(r.absorbed) },
    { header: 'FX Absorbed (NGN)',      width: 22, value: r => fmtNGN(r.fxAbsorbed) },
    { header: 'Used Actual Inflation',  width: 22, value: r => r.usedActualInflation ? 'Yes' : 'No' },
  ];
  const filename = periodLabel
    ? `MarginCOS_P2_CostPassThrough_${periodLabel}.xlsx`
    : 'MarginCOS_P2_CostPassThrough.xlsx';
  download(
    buildWb(XLSX, 'P2 Cost Pass-Through', { title: 'P2 Cost Pass-Through', periodLabel, cols, dataRows: sorted || [] }),
    filename,
  );
}

// ─── P3: Channel Economics ────────────────────────────────────────────────────
// contPct: contMargin / rev * 100 → already 0-100 scale
export async function exportP3ChannelEconomics(sorted, periodLabel = '') {
  const XLSX = await getXLSX();
  const cols = [
    { header: 'Channel',                   width: 22, value: c => c.channel    ?? '' },
    { header: 'Revenue (NGN)',              width: 22, value: c => fmtNGN(c.rev) },
    { header: 'Contribution Margin (NGN)', width: 28, value: c => fmtNGN(c.contMargin) },
    { header: 'Contribution %',            width: 20, value: c => fmtPct(c.contPct) },
    { header: 'SKU Count',                 width: 15, value: c => c.skuCount   ?? '' },
  ];
  const filename = periodLabel
    ? `MarginCOS_P3_ChannelEconomics_${periodLabel}.xlsx`
    : 'MarginCOS_P3_ChannelEconomics.xlsx';
  download(
    buildWb(XLSX, 'P3 Channel Economics', { title: 'P3 Channel Economics', periodLabel, cols, dataRows: sorted || [] }),
    filename,
  );
}

// ─── P4: Trade Execution ──────────────────────────────────────────────────────
// r.depth:   promo_depth_pct / 100    → 0-1 decimal; × 100 for display
// r.lift:    promo_lift_pct  / 100    → 0-1 decimal; × 100 for display  (Bug 1 fix)
// r.bevLift: (baseMargin/unitMargin - vol) / vol * 100 → already % scale (Bug 2 label fix)
export async function exportP4TradeExecution(sorted, periodLabel = '') {
  const XLSX = await getXLSX();
  const cols = [
    { header: 'SKU',                width: 35, value: r => r.sku      ?? '' },
    { header: 'Category',           width: 22, value: r => r.category ?? '' },
    { header: 'Depth (%)',          width: 15, value: r => r.depth   != null ? fmtPct(r.depth   * 100) : '' },
    { header: 'Lift Required (%)',  width: 20, value: r => r.lift    != null ? fmtPct(r.lift    * 100) : '' },
    { header: 'Breakeven Lift (%)', width: 22, value: r => r.bevLift != null ? fmtPct(r.bevLift)       : '' },
    { header: 'Net Impact (NGN)',   width: 22, value: r => fmtNGN(r.netImpact) },
    { header: 'Profitable',         width: 15, value: r => r.profitable ? 'Yes' : 'No' },
  ];
  const filename = periodLabel
    ? `MarginCOS_P4_TradeExecution_${periodLabel}.xlsx`
    : 'MarginCOS_P4_TradeExecution.xlsx';
  download(
    buildWb(XLSX, 'P4 Trade Execution', { title: 'P4 Trade Execution', periodLabel, cols, dataRows: sorted || [] }),
    filename,
  );
}

// ─── Actions Tracker ─────────────────────────────────────────────────────────
// a.value: engine output may be negative (absorbed cost); Math.abs for display  (Bug 3 fix)
export async function exportActions(filtered) {
  const XLSX = await getXLSX();
  const cols = [
    { header: 'ID',                   width: 12, value: a => a.id              ?? '' },
    { header: 'Title',                width: 40, value: a => a.title           ?? '' },
    { header: 'Detail',               width: 50, value: a => a.detail          ?? '' },
    { header: 'Pillar',               width: 12, value: a => a.pillar          ?? '' },
    { header: 'Status',               width: 15, value: a => a.status          ?? '' },
    { header: 'Urgency',              width: 15, value: a => a.urgency         ?? '' },
    { header: 'Monthly Impact (NGN)', width: 26, value: a => a.value != null ? fmtNGN(Math.abs(a.value)) : '' },
    { header: 'Owner',                width: 22, value: a => a.owner_name      ?? '' },
    { header: 'Due Date',             width: 18, value: a => a.due_date        ?? '' },
    { header: 'Resolution Note',      width: 45, value: a => a.resolution_note ?? '' },
  ];
  download(
    buildWb(XLSX, 'Actions', { title: 'Actions Tracker', periodLabel: '', cols, dataRows: filtered || [] }),
    'MarginCOS_Actions.xlsx',
  );
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
// cogs_inflation_rate, distributor_margin_pct: user-entered 0-100 percentage scale
export async function exportPortfolio(skuRows) {
  const XLSX = await getXLSX();
  const cols = [
    { header: 'SKU ID',                    width: 18, value: r => r.sku_id              ?? '' },
    { header: 'SKU Name',                  width: 35, value: r => r.sku_name            ?? '' },
    { header: 'Category',                  width: 22, value: r => r.category            ?? '' },
    { header: 'RRP (NGN)',                 width: 18, value: r => fmtNGN(r.rrp) },
    { header: 'Segment',                   width: 18, value: r => r.segment             ?? '' },
    { header: 'COGS/Unit (NGN)',           width: 20, value: r => fmtNGN(r.cogs_per_unit) },
    { header: 'COGS Prior Period (NGN)',   width: 26, value: r => fmtNGN(r.cogs_prior_period) },
    { header: 'COGS Inflation Rate (%)',   width: 24, value: r => r.cogs_inflation_rate    != null ? fmtPct(r.cogs_inflation_rate)    : '' },
    { header: 'Primary Channel',           width: 22, value: r => r.primary_channel        ?? '' },
    { header: 'Distributor Margin (%)',    width: 24, value: r => r.distributor_margin_pct != null ? fmtPct(r.distributor_margin_pct) : '' },
    { header: 'Monthly Volume (Units)',    width: 24, value: r => r.monthly_volume_units    != null ? Number(r.monthly_volume_units).toLocaleString('en-NG') : '' },
    { header: 'Active',                    width: 12, value: r => r.active ? 'Yes' : 'No' },
  ];
  download(
    buildWb(XLSX, 'Portfolio', { title: 'Portfolio', periodLabel: '', cols, dataRows: skuRows || [] }),
    'MarginCOS_Portfolio.xlsx',
  );
}
