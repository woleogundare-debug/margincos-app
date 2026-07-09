/**
 * exportToExcel.js
 * ExcelJS-based export helpers for each MarginCOS data table.
 * All functions are async and trigger a browser file download.
 * No imports from other app files - only the exceljs package.
 *
 * Formatting:
 *   Row 1  : header band - navy bg (FF1B2A4A), white bold 11pt, merged across all cols
 *   Row 2  : column headers - navy bg, white bold 10pt ALL CAPS, teal bottom border
 *   Rows 3+: data rows - alternating light (FFF5F7FA) even / white (FFFFFFFF) odd
 *   ws.views: freeze rows 1-2 so headers stay visible on scroll
 *
 * Number conventions (F-11 - numeric cells, not text):
 *   Numeric columns carry a raw JavaScript Number in the cell and a `numFmt`
 *   on the column definition. buildWorkbook applies the format and right-aligns
 *   the cell, so Excel/Numbers treat the value as a number (summable, sortable,
 *   sum-bar total on selection).
 *     Currency        → numFmt '#,##0'         (symbol carried in the header)
 *     Signed currency → numFmt '#,##0;-#,##0'  (P4 Net Impact, Delta, absorbed)
 *     Percentage      → numFmt '0.0"%"'        (value stored as 23.5, shows 23.5%)
 *     Volume / count  → numFmt '#,##0'
 *   Text and boolean columns carry a string and are left-aligned (no numFmt).
 *
 * Currency:
 *   Each export accepts a `currencySym` argument (default '₦') threaded from
 *   the calling dashboard page via useCurrency(). It is interpolated into the
 *   monetary column headers so the export matches the team's operating currency.
 *   The cell format stays currency-neutral ('#,##0'); the symbol lives in the
 *   header, so a non-NGN team is never mislabelled.
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

// ─── Number formats ─────────────────────────────────────────────────────────
const FMT_NUM    = '#,##0';        // currency (symbol in header) + volume + count
const FMT_SIGNED = '#,##0;-#,##0'; // signed currency (losses show as negative)
const FMT_PCT    = '0.0"%"';       // percentage point stored as a number

// ─── Value coercion ─────────────────────────────────────────────────────────

/** Return a raw Number for a numeric cell, or '' for a blank/NaN cell. The
 *  numeric cell format is applied per column in buildWorkbook. */
function numOrBlank(v) {
  if (v == null || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? '' : num;
}

// ─── Core builder ─────────────────────────────────────────────────────────────

/**
 * Build a workbook with a single sheet:
 *   - Row 1  : merged header band (navy bg, white bold 11pt)
 *   - Row 2  : ALL-CAPS column headers (navy bg, white bold 10pt, teal bottom border)
 *   - Rows 3+: data rows with alternating background; numeric columns carry a
 *              Number and a numFmt and are right-aligned
 *   - Frozen panes: rows 1-2
 *
 * @param {string} sheetName
 * @param {string} bandLabel   - pre-built band text (MARGINCOS · TITLE · …)
 * @param {Array}  columns     - [{ header, width, value: row => cellValue, numFmt? }, ...]
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
  headerRow.eachCell((cell, colNumber) => {
    const col = columns[colNumber - 1];
    cell.font      = { name: 'Arial', bold: true, size: 10, color: { argb: WHITE } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: col && col.numFmt ? 'right' : 'left' };
    cell.border    = { bottom: { style: 'medium', color: { argb: TEAL } } };
  });

  // ── Rows 3+: Data ────────────────────────────────────────────────────────────
  (dataRows || []).forEach((row, idx) => {
    const bgArgb = idx % 2 === 0 ? LIGHT : WHITE;
    const dataRow = ws.addRow(columns.map(c => c.value(row)));
    dataRow.height = 16;
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = columns[colNumber - 1];
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.font = { name: 'Arial', size: 10 };
      if (col && col.numFmt) {
        cell.numFmt    = col.numFmt;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // ── Freeze rows 1-2 ──────────────────────────────────────────────────────────
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
// compGap: (price - compPrice) / compPrice * 100 → percentage point
// wtpGap:  price * wtp * vol                     → currency/mo
// delta:   newMargin - curMargin                 → currency/mo (signed)
export async function exportP1PricingGap(sorted, periodLabel = '', unitId = 'Product ID', currencySym = '₦') {
  const cols = [
    { header: unitId,                width: 35, value: r => r.sku      ?? '' },
    { header: 'Category',            width: 22, value: r => r.category ?? '' },
    { header: `Price (${currencySym})`,   width: 20, value: r => numOrBlank(r.price),   numFmt: FMT_NUM },
    { header: 'Margin %',            width: 18, value: r => numOrBlank(r.marginPct), numFmt: FMT_PCT },
    { header: 'Comp Gap (%)',        width: 18, value: r => r.compGap != null ? numOrBlank(r.compGap) : '', numFmt: FMT_PCT },
    { header: `WTP Gap (${currencySym})`, width: 20, value: r => numOrBlank(r.wtpGap), numFmt: FMT_NUM },
    { header: `Delta (${currencySym})`,   width: 20, value: r => numOrBlank(r.delta),  numFmt: FMT_SIGNED },
    { header: 'Floor Breach',        width: 15, value: r => r.floorBreach ? 'Yes' : 'No' },
  ];
  const filename = periodLabel
    ? `MarginCOS_P1_PricingGap_${periodLabel}.xlsx`
    : 'MarginCOS_P1_PricingGap.xlsx';
  const wb = await buildWorkbook('P1 Pricing Gap', bandFor('P1 Pricing Gap', periodLabel), cols, sorted || []);
  await download(wb, filename);
}

// ─── P2: Cost Pass-Through ────────────────────────────────────────────────────
// r.pt: pass_through_rate 0-1 decimal; display as percentage (× 100)
export async function exportP2CostPassThrough(sorted, periodLabel = '', unitId = 'Product ID', currencySym = '₦') {
  const cols = [
    { header: unitId,                      width: 35, value: r => r.sku      ?? '' },
    { header: 'Category',                  width: 22, value: r => r.category ?? '' },
    { header: `Cost Shock (${currencySym})`,    width: 22, value: r => numOrBlank(r.shock), numFmt: FMT_NUM },
    { header: 'Pass-Through Rate (%)',     width: 24, value: r => r.pt != null ? r.pt * 100 : '', numFmt: FMT_PCT },
    { header: `Absorbed (${currencySym})`,      width: 22, value: r => numOrBlank(r.absorbed),   numFmt: FMT_SIGNED },
    { header: `FX Absorbed (${currencySym})`,   width: 22, value: r => numOrBlank(r.fxAbsorbed), numFmt: FMT_NUM },
    { header: 'Used Actual Inflation',     width: 22, value: r => r.usedActualInflation ? 'Yes' : 'No' },
  ];
  const filename = periodLabel
    ? `MarginCOS_P2_CostPassThrough_${periodLabel}.xlsx`
    : 'MarginCOS_P2_CostPassThrough.xlsx';
  const wb = await buildWorkbook('P2 Cost Pass-Through', bandFor('P2 Cost Pass-Through', periodLabel), cols, sorted || []);
  await download(wb, filename);
}

// ─── P3: Channel Economics ────────────────────────────────────────────────────
// contPct: contMargin / rev * 100 → already 0-100 scale
export async function exportP3ChannelEconomics(sorted, periodLabel = '', currencySym = '₦') {
  const cols = [
    { header: 'Channel',                       width: 22, value: c => c.channel    ?? '' },
    { header: `Revenue (${currencySym})`,            width: 22, value: c => numOrBlank(c.rev),        numFmt: FMT_NUM },
    { header: `Contribution Margin (${currencySym})`, width: 28, value: c => numOrBlank(c.contMargin), numFmt: FMT_SIGNED },
    { header: 'Contribution %',                width: 20, value: c => numOrBlank(c.contPct),    numFmt: FMT_PCT },
    { header: 'SKU Count',                     width: 15, value: c => numOrBlank(c.skuCount),   numFmt: FMT_NUM },
  ];
  const filename = periodLabel
    ? `MarginCOS_P3_ChannelEconomics_${periodLabel}.xlsx`
    : 'MarginCOS_P3_ChannelEconomics.xlsx';
  const wb = await buildWorkbook('P3 Channel Economics', bandFor('P3 Channel Economics', periodLabel), cols, sorted || []);
  await download(wb, filename);
}

// ─── P4: Trade Execution ──────────────────────────────────────────────────────
// r.depth:   promo_depth_pct 0-1 decimal; × 100 for display
// r.lift:    promo_lift_pct  0-1 decimal; × 100 for display
// r.bevLift: (baseMargin/unitMargin - vol) / vol * 100 → already % scale
// r.netImpact: signed currency - keep sign (negative = loss-making promo)
export async function exportP4TradeExecution(sorted, periodLabel = '', unitId = 'Product ID', currencySym = '₦') {
  const cols = [
    { header: unitId,               width: 35, value: r => r.sku      ?? '' },
    { header: 'Category',           width: 22, value: r => r.category ?? '' },
    { header: 'Depth (%)',          width: 15, value: r => r.depth   != null ? r.depth * 100 : '', numFmt: FMT_PCT },
    { header: 'Lift Required (%)',  width: 20, value: r => r.lift    != null ? r.lift  * 100 : '', numFmt: FMT_PCT },
    { header: 'Breakeven Lift (%)', width: 22, value: r => r.bevLift != null ? numOrBlank(r.bevLift) : '', numFmt: FMT_PCT },
    { header: `Net Impact (${currencySym})`, width: 22, value: r => numOrBlank(r.netImpact), numFmt: FMT_SIGNED },
    { header: 'Profitable',         width: 15, value: r => r.profitable ? 'Yes' : 'No' },
  ];
  const filename = periodLabel
    ? `MarginCOS_P4_TradeExecution_${periodLabel}.xlsx`
    : 'MarginCOS_P4_TradeExecution.xlsx';
  const wb = await buildWorkbook('P4 Trade Execution', bandFor('P4 Trade Execution', periodLabel), cols, sorted || []);
  await download(wb, filename);
}

// ─── Actions Tracker ─────────────────────────────────────────────────────────
// No ID column - a.id is an internal UUID, meaningless in export context
// a.value: engine output may be negative (absorbed cost); Math.abs for display
export async function exportActions(filtered, currencySym = '₦') {
  const cols = [
    { header: 'Title',                    width: 40, value: a => a.title           ?? '' },
    { header: 'Detail',                   width: 50, value: a => a.detail          ?? '' },
    { header: 'Pillar',                   width: 12, value: a => a.pillar          ?? '' },
    { header: 'Status',                   width: 15, value: a => a.status          ?? '' },
    { header: 'Urgency',                  width: 15, value: a => a.urgency         ?? '' },
    { header: `Monthly Impact (${currencySym})`, width: 26, value: a => a.value != null ? Math.abs(Number(a.value)) : '', numFmt: FMT_NUM },
    { header: 'Owner',                    width: 22, value: a => a.owner_name      ?? '' },
    { header: 'Due Date',                 width: 18, value: a => a.due_date        ?? '' },
    { header: 'Resolution Note',          width: 45, value: a => a.resolution_note ?? '' },
  ];
  const wb = await buildWorkbook('Actions', bandFor('Actions Tracker', ''), cols, filtered || []);
  await download(wb, 'MarginCOS_Actions.xlsx');
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
// cogs_inflation_rate, distributor_margin_pct: stored as 0-1 decimals; × 100 for display
export async function exportPortfolio(skuRows, periodLabel = '', currencySym = '₦') {
  const cols = [
    { header: 'SKU ID',                    width: 18, value: r => r.sku_id              ?? '' },
    { header: 'SKU Name',                  width: 35, value: r => r.sku_name            ?? '' },
    { header: 'Category',                  width: 22, value: r => r.category            ?? '' },
    { header: `RRP (${currencySym})`,            width: 18, value: r => numOrBlank(r.rrp),               numFmt: FMT_NUM },
    { header: 'Segment',                   width: 18, value: r => r.segment             ?? '' },
    { header: `COGS/Unit (${currencySym})`,      width: 20, value: r => numOrBlank(r.cogs_per_unit),     numFmt: FMT_NUM },
    { header: `COGS Prior Period (${currencySym})`, width: 26, value: r => numOrBlank(r.cogs_prior_period), numFmt: FMT_NUM },
    { header: 'COGS Inflation Rate (%)',   width: 24, value: r => r.cogs_inflation_rate    != null ? r.cogs_inflation_rate    * 100 : '', numFmt: FMT_PCT },
    { header: 'Primary Channel',           width: 22, value: r => r.primary_channel        ?? '' },
    { header: 'Distributor Margin (%)',    width: 24, value: r => r.distributor_margin_pct != null ? r.distributor_margin_pct * 100 : '', numFmt: FMT_PCT },
    { header: 'Monthly Volume (Units)',    width: 24, value: r => numOrBlank(r.monthly_volume_units), numFmt: FMT_NUM },
    { header: 'Active',                    width: 12, value: r => r.active ? 'Yes' : 'No' },
  ];
  const filename = periodLabel
    ? `MarginCOS_Portfolio_${periodLabel}.xlsx`
    : 'MarginCOS_Portfolio.xlsx';
  const wb = await buildWorkbook('Portfolio', bandFor('Portfolio', periodLabel), cols, skuRows || []);
  await download(wb, filename);
}

// ─── M1: SKU Portfolio Rationalisation ─────────────────────────────────────────
// revShare / skuMarginPct are already 0-100; marginAtStake is monthly ₦.
const clsLabel = (s) => (s || '').replace(/^[^\w]+/, '').trim();

export async function exportM1Rationalisation(results, periodLabel = '', unitId = 'SKU ID', currencySym = '₦') {
  const sorted = [...(results || [])].sort((a, b) => (b.marginAtStake || 0) - (a.marginAtStake || 0));
  const cols = [
    { header: unitId,                              width: 18, value: r => r.skuId ?? '' },
    { header: 'SKU Name',                          width: 35, value: r => r.sku ?? '' },
    { header: 'Revenue Share (%)',                 width: 20, value: r => numOrBlank(r.revShare),     numFmt: FMT_PCT },
    { header: 'Margin (%)',                        width: 16, value: r => numOrBlank(r.skuMarginPct), numFmt: FMT_PCT },
    { header: 'Quadrant',                          width: 16, value: r => clsLabel(r.classification) },
    { header: `Margin at Stake (${currencySym})`,  width: 24, value: r => numOrBlank(r.marginAtStake), numFmt: FMT_NUM },
    { header: 'Recommended Action',                width: 46, value: r => r.action ?? '' },
  ];
  const filename = periodLabel
    ? `MarginCOS_M1_Rationalisation_${periodLabel}.xlsx`
    : 'MarginCOS_M1_Rationalisation.xlsx';
  const wb = await buildWorkbook('M1 Rationalisation', bandFor('M1 Rationalisation', periodLabel), cols, sorted);
  await download(wb, filename);
}

// ─── M4: Distributor Performance ───────────────────────────────────────────────
// Cumulative contribution runs best -> worst (matches the descending sort) and
// ends at the portfolio total on the final row.
export async function exportM4Distributor(results, periodLabel = '', partnerLabel = 'Distributor', currencySym = '₦') {
  const sorted = [...(results || [])].sort((a, b) => (b.trueContrib || 0) - (a.trueContrib || 0));
  let cum = 0;
  const withCum = sorted.map(r => { cum += (r.trueContrib || 0); return { ...r, _cum: cum }; });
  const cols = [
    { header: partnerLabel,                              width: 28, value: r => r.name ?? '' },
    { header: 'Revenue Share (%)',                       width: 20, value: r => numOrBlank(r.revShare), numFmt: FMT_PCT },
    { header: 'True Contribution (%)',                   width: 22, value: r => numOrBlank(r.contPct),  numFmt: FMT_PCT },
    { header: `Absolute Contribution (${currencySym})`,  width: 26, value: r => numOrBlank(r.trueContrib), numFmt: FMT_SIGNED },
    { header: `Cumulative Contribution (${currencySym})`, width: 28, value: r => numOrBlank(r._cum),        numFmt: FMT_SIGNED },
    { header: 'Classification',                          width: 18, value: r => clsLabel(r.classification) },
  ];
  const filename = periodLabel
    ? `MarginCOS_M4_Distributor_${periodLabel}.xlsx`
    : 'MarginCOS_M4_Distributor.xlsx';
  const wb = await buildWorkbook('M4 Distributor Performance', bandFor('M4 Distributor Performance', periodLabel), cols, withCum);
  await download(wb, filename);
}
