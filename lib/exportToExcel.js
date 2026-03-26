/**
 * exportToExcel.js
 * Thin wrappers over the xlsx package for each MarginCOS data table.
 * All functions are async and trigger a browser file download.
 * No imports from other app files — only the xlsx package.
 */

async function getXLSX() {
  const mod = await import('xlsx');
  return mod.default ?? mod;
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

function makeWb(XLSX, sheetName, rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  wb.__xlsxRef = XLSX;
  return wb;
}

// ─── P1: Pricing Gap ──────────────────────────────────────────────────────────
export async function exportP1PricingGap(sorted, periodLabel = '') {
  const XLSX = await getXLSX();
  const rows = (sorted || []).map(r => ({
    'SKU':                   r.sku            ?? '',
    'Category':              r.category       ?? '',
    'Price (NGN)':           r.price          ?? '',
    'Margin %':              r.marginPct      != null ? +(r.marginPct  * 100).toFixed(2) : '',
    'Comp Gap (NGN)':        r.compGap        ?? '',
    'WTP Gap (NGN)':         r.wtpGap         ?? '',
    'Delta (NGN)':           r.delta          ?? '',
    'Floor Breach':          r.floorBreach    ? 'Yes' : 'No',
  }));
  const filename = periodLabel
    ? `MarginCOS_P1_PricingGap_${periodLabel}.xlsx`
    : 'MarginCOS_P1_PricingGap.xlsx';
  download(makeWb(XLSX, 'P1 Pricing Gap', rows), filename);
}

// ─── P2: Cost Pass-Through ────────────────────────────────────────────────────
export async function exportP2CostPassThrough(sorted, periodLabel = '') {
  const XLSX = await getXLSX();
  const rows = (sorted || []).map(r => ({
    'SKU':                   r.sku                  ?? '',
    'Category':              r.category             ?? '',
    'Cost Shock (NGN)':      r.shock                ?? '',
    'Pass-Through (NGN)':    r.pt                   ?? '',
    'Absorbed (NGN)':        r.absorbed             ?? '',
    'FX Absorbed (NGN)':     r.fxAbsorbed           ?? '',
    'Used Actual Inflation': r.usedActualInflation  ? 'Yes' : 'No',
  }));
  const filename = periodLabel
    ? `MarginCOS_P2_CostPassThrough_${periodLabel}.xlsx`
    : 'MarginCOS_P2_CostPassThrough.xlsx';
  download(makeWb(XLSX, 'P2 Cost Pass-Through', rows), filename);
}

// ─── P3: Channel Economics ────────────────────────────────────────────────────
export async function exportP3ChannelEconomics(sorted, periodLabel = '') {
  const XLSX = await getXLSX();
  const rows = (sorted || []).map(c => ({
    'Channel':                 c.channel     ?? '',
    'Revenue (NGN)':           c.rev         ?? '',
    'Contribution Margin (NGN)': c.contMargin ?? '',
    'Contribution %':          c.contPct     != null ? +(c.contPct * 100).toFixed(2) : '',
    'SKU Count':               c.skuCount    ?? '',
  }));
  const filename = periodLabel
    ? `MarginCOS_P3_ChannelEconomics_${periodLabel}.xlsx`
    : 'MarginCOS_P3_ChannelEconomics.xlsx';
  download(makeWb(XLSX, 'P3 Channel Economics', rows), filename);
}

// ─── P4: Trade Execution ──────────────────────────────────────────────────────
export async function exportP4TradeExecution(sorted, periodLabel = '') {
  const XLSX = await getXLSX();
  const rows = (sorted || []).map(r => ({
    'SKU':                  r.sku        ?? '',
    'Category':             r.category   ?? '',
    'Depth (%)':            r.depth      != null ? +(r.depth  * 100).toFixed(2) : '',
    'Lift (units)':         r.lift       ?? '',
    'Bev. Lift (units)':    r.bevLift    ?? '',
    'Net Impact (NGN)':     r.netImpact  ?? '',
    'Profitable':           r.profitable ? 'Yes' : 'No',
  }));
  const filename = periodLabel
    ? `MarginCOS_P4_TradeExecution_${periodLabel}.xlsx`
    : 'MarginCOS_P4_TradeExecution.xlsx';
  download(makeWb(XLSX, 'P4 Trade Execution', rows), filename);
}

// ─── Actions Tracker ─────────────────────────────────────────────────────────
export async function exportActions(filtered) {
  const XLSX = await getXLSX();
  const rows = (filtered || []).map(a => ({
    'ID':               a.id              ?? '',
    'Title':            a.title           ?? '',
    'Detail':           a.detail          ?? '',
    'Pillar':           a.pillar          ?? '',
    'Status':           a.status          ?? '',
    'Urgency':          a.urgency         ?? '',
    'Value (NGN/mo)':   a.value           ?? '',
    'Owner':            a.owner_name      ?? '',
    'Due Date':         a.due_date        ?? '',
    'Resolution Note':  a.resolution_note ?? '',
  }));
  download(makeWb(XLSX, 'Actions', rows), 'MarginCOS_Actions.xlsx');
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
export async function exportPortfolio(skuRows) {
  const XLSX = await getXLSX();
  const rows = (skuRows || []).map(r => ({
    'SKU ID':                   r.sku_id                 ?? '',
    'SKU Name':                 r.sku_name               ?? '',
    'Category':                 r.category               ?? '',
    'RRP (NGN)':                r.rrp                    ?? '',
    'Segment':                  r.segment                ?? '',
    'COGS/Unit (NGN)':          r.cogs_per_unit          ?? '',
    'COGS Prior Period (NGN)':  r.cogs_prior_period      ?? '',
    'COGS Inflation Rate':      r.cogs_inflation_rate    != null ? +(r.cogs_inflation_rate * 100).toFixed(2) : '',
    'Primary Channel':          r.primary_channel        ?? '',
    'Distributor Margin %':     r.distributor_margin_pct != null ? +(r.distributor_margin_pct * 100).toFixed(2) : '',
    'Monthly Volume (units)':   r.monthly_volume_units   ?? '',
    'Active':                   r.active ? 'Yes' : 'No',
  }));
  download(makeWb(XLSX, 'Portfolio', rows), 'MarginCOS_Portfolio.xlsx');
}
