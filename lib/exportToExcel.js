/**
 * exportToExcel.js
 * ExcelJS-based export helpers for each MarginCOS data table.
 * All functions are async and trigger a browser file download.
 * No imports from other app files — only the exceljs package.
 *
 * Formatting:
 *   Row 1  : header band — navy bg (FF1B2A4A), white bold 11pt, merged across all cols
 *   Row 2  : column headers — navy bg, white bold 10pt ALL CAPS, teal bottom border
 *   Rows 3+: data rows — alternating light (FFF5F7FA) even / white (FFFFFFFF) odd
 *   ws.views: freeze rows 1–2 so headers stay visible on scroll
 *
 * Number conventions:
 *   NGN amounts  → Math.round + toLocaleString('en-NG')  e.g. "4,337,514"
 *   Percentages  → +toFixed(1) numeric                   e.g. 23.5
 *   Volumes      → toLocaleString('en-NG')               e.g. "12,000"
 *   Booleans     → "Yes" / "No"
 *
 * Sign handling:
 *   P4 Net Impact → keep signed (negative = loss-making promo)
 *   Actions value → Math.abs (negative = absorbed cost, shown as opportunity)
 */

// ─── Colours ──────────────────────────────────────────────────────────────────
const NAVY  = 'FF1B2A4A';
const WHITE = 'FFFFFFFF';
const LIGHT = 'FFF5F7FA';
const TEAL  = 'FF0D8F8F';

// ─── Formatters ───────────────────────────────────────────────────────────────

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

// ─── Core builder ─────────────────────────────────────────────────────────────

/**
 * Build a workbook with a single sheet:
 *   - Row 1  : merged header band (navy bg, white bold 11pt)
 *   - Row 2  : ALL-CAPS column headers (navy bg, white bold 10pt, teal bottom border)
 *   - Rows 3+: data rows with alternating background
 *   - Frozen panes: rows 1-2
 *
 * @param {string} sheetName
 * @param {string} bandLabel   - pre-built band text (MARGINCOS · TITLE · …)
 * @param {Array}  columns     - [{ header, width, value: row => cellValue }, ...]
 * @param {Array}  dataRows    - raw data array
 * @returns {Promise<ExcelJS.Workbook>}
 */
async function buildWorkbook(sheetName, bandLabel, columns, dataRows) {
  const ExcelJS = (await import('exceljs')).default ?? (await import('exceljs'));
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MarginCOS';
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName);

  // ── Column widths ────────────────────────────────────────────────────────────
  ws.columns = columns.map(c => ({ width: c.width }));

  // ── Row 1: Header band ───────────────────────────────────────────────────────
  const bandRow = ws.addRow([bandLabel]);
  bandRow.height = 22;
  const bandCell = bandRow.getCell(1);
  bandCell.font  = { name: 'Arial', bold: true, size: 11, color: { argb: WHITE } };
  bandCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  bandCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Merge band across all columns
  ws.mergeCells(1, 1, 1, columns.length);

  // Fill the remaining merged cells to avoid white gaps in some Excel viewers
  for (let c = 2; c <= columns.length; c++) {
    const mc = bandRow.getCell(c);
    mc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  }

  // ── Row 2: Column headers ────────────────────────────────────────────────────
  const headerRow = ws.addRow(columns.map(c => c.header.toUpperCase()));
  headerRow.height = 18;
  headerRow.eachCell(cell => {
    cell.font      = { name: 'Arial', bold: true, size: 10, color: { argb: WHITE } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border    = { bottom: { style: 'medium', color: { argb: TEAL } } };
  });

  // ── Rows 3+: Data ────────────────────────────────────────────────────────────
  (dataRows || []).forEach((row, idx) => {
    const bgArgb = idx % 2 === 0 ? LIGHT : WHITE;
    const dataRow = ws.addRow(columns.map(c => c.value(row)));
    dataRow.height = 16;
    dataRow.eachCell({ includeEmpty: true }, cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.font      = { name: 'Arial', size: 10 };
    });
  });

  // ── Freeze rows 1–2 ──────────────────────────────────────────────────────────
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3' }];

  return wb;
}

// ─── Download ─────────────────────────────────────────────────────────────────

async function download(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href      = url;
  a.download  = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── Band label helper ────────────────────────────────────────────────────────

function bandFor(title, periodLabel) {
  const date  = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const parts = ['MARGINCOS', title.toUpperCase()];
  if (periodLabel) parts.push(periodLabel.toUpperCase());
  parts.push(`Exported: ${date}`);
  return parts.join('  ·  ');
}

// ─── P1: Pricing Gap ──────────────────────────────────────────────────────────
// compGap: (price - compPrice) / compPrice * 100 → percentage
// wtpGap:  price * wtp * vol                     → NGN/mo
// delta:   newMargin - curMargin                 → NGN/mo (signed)
export async function exportP1PricingGap(sorted, periodLabel = '', unitId = 'Product ID') {
  const cols = [
    { header: unitId,          width: 35, value: r => r.sku      ?? '' },
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
  const wb = await buildWorkbook('P1 Pricing Gap', bandFor('P1 Pricing Gap', periodLabel), cols, sorted || []);
  await download(wb, filename);
}

// ─── P2: Cost Pass-Through ────────────────────────────────────────────────────
// r.pt: pass_through_rate / 100 → 0-1 decimal; display as percentage (× 100)
export async function exportP2CostPassThrough(sorted, periodLabel = '', unitId = 'Product ID') {
  const cols = [
    { header: unitId,                  width: 35, value: r => r.sku      ?? '' },
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
  const wb = await buildWorkbook('P2 Cost Pass-Through', bandFor('P2 Cost Pass-Through', periodLabel), cols, sorted || []);
  await download(wb, filename);
}

// ─── P3: Channel Economics ────────────────────────────────────────────────────
// contPct: contMargin / rev * 100 → already 0-100 scale
export async function exportP3ChannelEconomics(sorted, periodLabel = '') {
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
  const wb = await buildWorkbook('P3 Channel Economics', bandFor('P3 Channel Economics', periodLabel), cols, sorted || []);
  await download(wb, filename);
}

// ─── P4: Trade Execution ──────────────────────────────────────────────────────
// r.depth:   promo_depth_pct / 100    → 0-1 decimal; × 100 for display
// r.lift:    promo_lift_pct  / 100    → 0-1 decimal; × 100 for display
// r.bevLift: (baseMargin/unitMargin - vol) / vol * 100 → already % scale
// r.netImpact: signed NGN — keep sign (negative = loss-making promo)
export async function exportP4TradeExecution(sorted, periodLabel = '', unitId = 'Product ID') {
  const cols = [
    { header: unitId,               width: 35, value: r => r.sku      ?? '' },
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
  const wb = await buildWorkbook('P4 Trade Execution', bandFor('P4 Trade Execution', periodLabel), cols, sorted || []);
  await download(wb, filename);
}

// ─── Actions Tracker ─────────────────────────────────────────────────────────
// No ID column — a.id is an internal UUID, meaningless in export context
// a.value: engine output may be negative (absorbed cost); Math.abs for display
export async function exportActions(filtered) {
  const cols = [
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
  const wb = await buildWorkbook('Actions', bandFor('Actions Tracker', ''), cols, filtered || []);
  await download(wb, 'MarginCOS_Actions.xlsx');
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
// cogs_inflation_rate, distributor_margin_pct: user-entered 0-100 percentage scale
export async function exportPortfolio(skuRows, periodLabel = '') {
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
  const filename = periodLabel
    ? `MarginCOS_Portfolio_${periodLabel}.xlsx`
    : 'MarginCOS_Portfolio.xlsx';
  const wb = await buildWorkbook('Portfolio', bandFor('Portfolio', periodLabel), cols, skuRows || []);
  await download(wb, filename);
}
