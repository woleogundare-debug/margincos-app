import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PlusIcon, TrashIcon, ChevronRightIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, XMarkIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/index';
import { getTaxonomy } from '../../lib/taxonomy/index';
import { PRIMARY_CHANNELS, SEGMENTS, REGIONS } from '../../lib/constants';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

// Column definitions
const COLUMNS = [
  // Always visible (identity core)
  { key: 'sku_id',        label: 'SKU ID',           group: 'identity', required: true,  type: 'text',   width: 'w-28',  tip: 'Your internal product code. Must be unique.' },
  { key: 'sku_name',      label: 'Product Name',     group: 'identity', required: true,  type: 'text',   width: 'w-40',  tip: 'Full product name as it appears on-pack or in your ERP.' },
  { key: 'category',      label: 'Category',         group: 'identity', required: true,  type: 'select', width: 'w-56',  tip: 'Product category from your vertical\u2019s taxonomy.' },
  { key: 'rrp',           label: 'RRP ₦',       group: 'identity', required: true,  type: 'number', width: 'w-36',  minWidth: 130, tip: 'Recommended Retail Price in Naira per unit.' },
  { key: 'active',        label: 'Active',           group: 'identity', required: true,  type: 'bool',   width: 'w-16',  tip: 'Include in analysis.' },
  // Identity extended
  { key: 'segment',       label: 'Segment',          group: 'ext-identity', required: false, type: 'select', width: 'w-32',  tip: 'Price positioning: Mass Market, Mid-Range, or Premium.' },
  { key: 'business_unit', label: 'Business Unit',    group: 'ext-identity', required: false, type: 'text',   width: 'w-32',  tip: 'Division or brand cluster.' },
  { key: 'region',        label: 'Region',           group: 'ext-identity', required: false, type: 'select', width: 'w-32',  tip: 'Primary geographic region.' },
  // Pricing P1
  { key: 'competitor_price',         label: 'Comp. Price ₦', group: 'pricing',  required: false, type: 'number', width: 'w-40',  minWidth: 140, tip: 'Nearest competitor\u2019s shelf price.' },
  { key: 'target_margin_floor_pct',  label: 'Margin Floor %', group: 'pricing', required: false, type: 'pct',    width: 'w-28',  tip: 'Minimum acceptable gross margin %.' },
  { key: 'price_elasticity',         label: 'Elasticity',    group: 'pricing',  required: false, type: 'number', width: 'w-24',  tip: 'Demand sensitivity to price change.' },
  { key: 'proposed_price_change_pct',label: 'Prop. Chg %',   group: 'pricing',  required: false, type: 'pct',    width: 'w-24',  tip: 'Proposed price increase/decrease %.' },
  { key: 'wtp_premium_pct',          label: 'WTP Premium %', group: 'pricing',  required: false, type: 'pct',    width: 'w-28',  tip: 'Willingness-to-pay premium %.' },
  // Cost P2
  { key: 'cogs_per_unit',      label: 'COGS ₦',         group: 'cost', required: true,  type: 'number', width: 'w-36',  minWidth: 130, tip: 'Cost of Goods Sold per unit.' },
  { key: 'cogs_prior_period',  label: 'Prior COGS ₦',   group: 'cost', required: false, type: 'number', width: 'w-40',  minWidth: 140, tip: 'COGS per unit in the previous period.' },
  { key: 'cogs_inflation_rate',label: 'COGS Infl. %',   group: 'cost', required: false, type: 'pct',    width: 'w-24',  tip: 'Annual input cost inflation rate.' },
  { key: 'pass_through_rate',  label: 'Pass-Through %', group: 'cost', required: false, type: 'pct',    width: 'w-28',  tip: '% of cost increase passed on to trade.' },
  { key: 'fx_exposure_pct',    label: 'FX Exposure %',  group: 'cost', required: false, type: 'pct',    width: 'w-28',  tip: '% of COGS linked to foreign currency.' },
  // Channel P3
  { key: 'primary_channel',       label: 'Channel',       group: 'channel', required: true,  type: 'select', width: 'w-48',  tip: 'Primary route-to-market.' },
  { key: 'channel_revenue_split', label: 'Prim. Ch. Vol %', group: 'channel', required: false, type: 'number', width: 'w-28',  tip: '% of volume through primary channel.' },
  { key: 'distributor_name',      label: 'Distributor',   group: 'channel', required: false, type: 'text',   width: 'w-36',  tip: 'Primary distributor name.' },
  { key: 'distributor_margin_pct',label: 'Dist. Margin %',group: 'channel', required: false, type: 'pct',    width: 'w-28',  tip: 'Distributor margin %.' },
  { key: 'trade_rebate_pct',      label: 'Rebate %',      group: 'channel', required: false, type: 'pct',    width: 'w-24',  tip: 'Retrospective rebate %.' },
  { key: 'logistics_cost_per_unit',label: 'Logistics ₦',  group: 'channel', required: false, type: 'number', width: 'w-36',  minWidth: 130, tip: 'Delivery cost per unit.' },
  { key: 'credit_days',           label: 'Credit Days',   group: 'channel', required: false, type: 'number', width: 'w-24',  tip: 'Payment terms in days.' },
  // Trade P4
  { key: 'monthly_volume_units', label: 'Volume',       group: 'trade', required: true,  type: 'number', width: 'w-24',  tip: 'Units sold in the period.' },
  { key: 'promo_depth_pct',      label: 'Promo Depth %',group: 'trade', required: false, type: 'pct',    width: 'w-28',  tip: 'Promotional discount %.' },
  { key: 'promo_lift_pct',       label: 'Promo Lift %', group: 'trade', required: false, type: 'pct',    width: 'w-28',  tip: 'Expected volume uplift %.' },
];

// Tab definitions — requiredTier: 'professional' means Professional or Enterprise
const TABS = [
  { key: 'identity',     label: 'Identity',             groups: ['identity', 'ext-identity'] },
  { key: 'pricing',      label: 'Pricing · P1',         groups: ['identity', 'pricing'] },
  { key: 'cost',         label: 'Cost · P2',            groups: ['identity', 'cost'],    requiredTier: 'professional' },
  { key: 'channel',      label: 'Channel · P3',         groups: ['identity', 'channel'], requiredTier: 'professional' },
  { key: 'trade',        label: 'Trade · P4',           groups: ['identity', 'trade'],   requiredTier: 'professional' },
];

const TAB_GROUP_LABELS = {
  'ext-identity': 'IDENTITY',
  pricing: 'PRICING INTELLIGENCE',
  cost: 'COST PASS-THROUGH',
  channel: 'CHANNEL ECONOMICS',
  trade: 'TRADE EXECUTION',
};

// ── CSV Import helpers ──
const CSV_FIELDS = COLUMNS.filter(c => c.key !== 'active').map(c => c.key);
const NUMERIC_KEYS = new Set(
  COLUMNS.filter(c => c.type === 'number' || c.type === 'pct').map(c => c.key)
);

function parseCSV(text) {
  const rows = [];
  let i = 0;
  while (i < text.length) {
    const row = [];
    while (i < text.length) {
      if (text[i] === '"') {
        i++;
        let field = '';
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else { field += text[i]; i++; }
        }
        row.push(field);
      } else {
        let field = '';
        while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i]; i++;
        }
        row.push(field.trim());
      }
      if (text[i] === ',') { i++; continue; }
      if (text[i] === '\r') i++;
      if (text[i] === '\n') { i++; break; }
      break;
    }
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) rows.push(row);
  }
  return rows;
}

function validateCSVRows(rawRows) {
  if (rawRows.length < 2) return { valid: [], errors: [{ row: 0, msg: 'File is empty or has no data rows' }] };
  const headers = rawRows[0].map(h => h.trim().toLowerCase());
  const keyMap = {};
  headers.forEach((h, i) => { keyMap[h] = i; });
  const valid = [];
  const errors = [];
  const seenIds = new Set();

  for (let r = 1; r < rawRows.length; r++) {
    const cells = rawRows[r];
    const rowErrors = [];
    const row = { active: true };
    CSV_FIELDS.forEach(key => {
      const idx = keyMap[key];
      const raw = idx !== undefined ? (cells[idx] || '').trim() : '';
      if (NUMERIC_KEYS.has(key)) {
        row[key] = raw === '' ? null : parseFloat(raw);
        if (raw !== '' && isNaN(row[key])) rowErrors.push(`${key}: "${raw}" is not a number`);
      } else {
        row[key] = raw || '';
      }
    });
    if (!row.sku_id) rowErrors.push('sku_id is missing');
    if (row.sku_id && seenIds.has(row.sku_id)) rowErrors.push(`Duplicate sku_id "${row.sku_id}"`);
    if (row.sku_id) seenIds.add(row.sku_id);
    if (rowErrors.length > 0) {
      errors.push({ row: r, sku: row.sku_id || `(row ${r})`, issues: rowErrors });
    } else {
      valid.push(row);
    }
  }
  return { valid, errors };
}

function downloadTemplate() {
  const csv = CSV_FIELDS.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'margincos-sku-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import Preview Modal ──
function ImportPreviewModal({ result, onConfirm, onCancel, importing }) {
  if (!result) return null;
  const { valid, errors } = result;
  return (
    <>
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-30" onClick={onCancel} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-navy">CSV Import Preview</h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-2 rounded-xl bg-teal-50 text-teal-700 text-sm font-bold">{valid.length} valid rows</div>
              {errors.length > 0 && (
                <div className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold">{errors.length} with errors</div>
              )}
            </div>
            {errors.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Errors (skipped):</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {errors.map((e, i) => (
                    <div key={i} className="text-xs bg-red-50 rounded-lg px-3 py-2 text-red-700">
                      <strong>Row {e.row}</strong> ({e.sku}): {e.issues.join('; ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {valid.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Preview:</p>
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-2 py-1.5 text-left">SKU ID</th>
                        <th className="px-2 py-1.5 text-left">Product Name</th>
                        <th className="px-2 py-1.5 text-right">RRP</th>
                        <th className="px-2 py-1.5 text-right">COGS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valid.slice(0, 10).map((r, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="px-2 py-1.5 font-medium">{r.sku_id}</td>
                          <td className="px-2 py-1.5">{r.sku_name || '\u2014'}</td>
                          <td className="px-2 py-1.5 text-right">{r.rrp ?? '\u2014'}</td>
                          <td className="px-2 py-1.5 text-right">{r.cogs_per_unit ?? '\u2014'}</td>
                        </tr>
                      ))}
                      {valid.length > 10 && (
                        <tr><td colSpan={4} className="px-2 py-1.5 text-center text-slate-400">+{valid.length - 10} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" size="md" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" size="md" onClick={onConfirm} loading={importing} disabled={valid.length === 0}>
              Import {valid.length} SKUs
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Cell Input ──
function CellInput({ col, value, onChange, onBlur, vertical }) {
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => { setLocal(value ?? ''); }, [value]);
  const { categories } = getTaxonomy(vertical || 'FMCG');
  const handleChange = (v) => { setLocal(v); onChange(v); };

  const baseClass = 'w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal rounded px-1.5 py-1.5 transition-all';

  if (col.type === 'select') {
    let options = [];
    if (col.key === 'category')        options = categories.map(c => ({ value: c, label: c }));
    else if (col.key === 'segment')    options = SEGMENTS.map(s => ({ value: s, label: s }));
    else if (col.key === 'primary_channel') options = PRIMARY_CHANNELS.map(c => ({ value: c.code, label: c.label }));
    else if (col.key === 'region')     options = REGIONS.map(r => ({ value: r, label: r }));
    return (
      <select value={local || ''} onChange={e => handleChange(e.target.value)} onBlur={onBlur}
        className={clsx(baseClass, 'cursor-pointer appearance-none')}>
        <option value="">-</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  if (col.type === 'bool') {
    const isYes = local === true || local === 'Y' || local === 'y' || local === 'true' || local === 'Active';
    return (
      <button
        type="button"
        onClick={() => { const next = isYes ? 'N' : 'Y'; handleChange(next); onBlur(); }}
        className={clsx(
          'px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer',
          isYes
            ? 'bg-teal-100 text-teal-700'
            : 'bg-slate-100 text-slate-400'
        )}>
        {isYes ? 'Active' : 'Off'}
      </button>
    );
  }

  const isNumeric = col.type === 'number' || col.type === 'pct';
  const isCurrency = isNumeric && col.label.includes('₦');
  const [focused, setFocused] = useState(false);

  const handleInputBlur = () => {
    setFocused(false);
    if (isCurrency && local !== '' && !isNaN(local)) {
      setLocal(Number(local).toLocaleString('en-NG'));
    }
    onBlur();
  };

  const handleInputFocus = () => {
    setFocused(true);
    if (isCurrency && typeof local === 'string') {
      setLocal(local.replace(/,/g, ''));
    }
  };

  return (
    <div className="flex items-center">
      {isCurrency && <span className="text-sm font-medium text-gray-400 mr-0.5 select-none">₦</span>}
      <input type={focused || !isCurrency ? (isNumeric ? 'number' : 'text') : 'text'}
        value={local}
        step={col.type === 'pct' ? '0.01' : col.type === 'number' ? '1' : undefined}
        onChange={e => {
          const raw = e.target.value;
          const v = isNumeric ? (raw === '' ? '' : parseFloat(raw.replace(/,/g, ''))) : raw;
          handleChange(v);
          setLocal(raw);
        }}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        placeholder={col.required ? '-' : ''}
        className={clsx(baseClass, isNumeric && 'text-right', '[appearance:textfield]')}
      />
      {col.type === 'pct' && <span className="text-sm font-medium text-gray-400 ml-0.5 select-none">%</span>}
    </div>
  );
}

// ── Completeness dot ──
function CompletenessDot({ row }) {
  const requiredFilled = row.sku_id && row.sku_name && row.category && row.rrp && row.cogs_per_unit && row.monthly_volume_units && row.primary_channel;
  const hasOptionalGaps = !row.competitor_price || !row.segment || !row.region;

  let color = 'bg-red-400';   // required missing
  if (requiredFilled && hasOptionalGaps) color = 'bg-amber-400';
  if (requiredFilled && !hasOptionalGaps) color = 'bg-emerald-400';

  return <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', color)} />;
}

// ── Row Action Menu ──
function RowActionMenu({ onDetail, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1 rounded text-slate-300 hover:text-navy hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100">
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
          <button onClick={() => { onDetail(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            Open detail panel
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
            Delete row
          </button>
        </div>
      )}
    </div>
  );
}

export function SkuGrid({ skuRows, onSave, onAdd, onDelete, onRowClick, onBulkImport, saving, activePeriod, isProfessional, isEnterprise }) {
  const [activeTab, setActiveTab] = useState('identity');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const pendingEdits = useRef({});
  const flushTimer = useRef(null);
  const savingKeys = useRef(new Set());
  const skuRowsRef = useRef(skuRows);
  const onSaveRef = useRef(onSave);
  useEffect(() => { skuRowsRef.current = skuRows; }, [skuRows]);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  const vertical = activePeriod?.vertical || 'FMCG';

  // Detect duplicate SKU IDs
  const duplicateSkuIds = useMemo(() => {
    const counts = {};
    skuRows.forEach(r => {
      const id = r.sku_id?.trim();
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter(k => counts[k] > 1));
  }, [skuRows]);

  // Determine visible columns based on active tab
  const currentTab = TABS.find(t => t.key === activeTab) || TABS[0];
  const visibleCols = COLUMNS.filter(c => currentTab.groups.includes(c.group));

  // ── Flush logic ──
  const flushPendingEdits = useCallback(() => {
    const pending = pendingEdits.current;
    const keys = Object.keys(pending);
    if (keys.length === 0) return;
    keys.forEach(key => {
      if (savingKeys.current.has(key)) return;
      const edits = pending[key];
      if (!edits || Object.keys(edits).length === 0) return;
      const row = skuRowsRef.current.find(r => r.id === key || r._tempId === key);
      if (!row) return;
      savingKeys.current.add(key);
      const merged = { ...row, ...edits };
      onSaveRef.current(merged).then(() => { savingKeys.current.delete(key); }).catch(() => { savingKeys.current.delete(key); });
    });
  }, []);

  const scheduleFlush = useCallback((delay = 2000) => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flushPendingEdits, delay);
  }, [flushPendingEdits]);

  const handleCellChange = useCallback((rowId, colKey, value) => {
    if (!pendingEdits.current[rowId]) pendingEdits.current[rowId] = {};
    pendingEdits.current[rowId][colKey] = value;
    scheduleFlush(2000);
  }, [scheduleFlush]);

  const handleCellBlur = useCallback(() => {
    scheduleFlush(500);
  }, [scheduleFlush]);

  useEffect(() => {
    const pending = pendingEdits.current;
    Object.keys(pending).forEach(key => {
      const dbRow = skuRows.find(r => r.id === key || r._tempId === key);
      if (!dbRow) return;
      const edits = pending[key];
      const stale = Object.keys(edits).every(col => edits[col] === dbRow[col]);
      if (stale) delete pending[key];
    });
  }, [skuRows]);

  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushPendingEdits();
    };
  }, [flushPendingEdits]);

  // ── CSV Import ──
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rawRows = parseCSV(text);
      const result = validateCSVRows(rawRows);
      setImportResult(result);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!importResult?.valid?.length || !onBulkImport) return;
    setImporting(true);
    try { await onBulkImport(importResult.valid); }
    finally { setImporting(false); setImportResult(null); }
  }, [importResult, onBulkImport]);

  // Determine save status
  const hasPending = Object.keys(pendingEdits.current).length > 0;
  const saveStatus = saving ? 'saving' : hasPending ? 'unsaved' : 'saved';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
      {/* Column group tabs */}
      <div className="flex items-center justify-between px-5 py-0 border-b border-slate-200">
        <div className="flex items-center gap-0">
          {TABS.map(tab => {
            const locked = tab.requiredTier === 'professional' && !isProfessional;
            return (
              <button key={tab.key}
                onClick={() => !locked && setActiveTab(tab.key)}
                disabled={locked}
                className={clsx(
                  'px-4 py-3 text-xs font-semibold transition-all relative uppercase tracking-wide flex items-center gap-1.5',
                  locked
                    ? 'text-slate-300 cursor-not-allowed'
                    : activeTab === tab.key
                      ? 'text-navy'
                      : 'text-slate-400 hover:text-slate-600'
                )}>
                {tab.label}
                {locked && <LockClosedIcon className="w-3 h-3 text-slate-300" />}
                {activeTab === tab.key && !locked && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 py-2">
          <button onClick={downloadTemplate} title="Download CSV template"
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal hover:bg-teal-50 transition-colors">
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} id="csv-import-trigger" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            {/* Group label row — only for non-identity tabs */}
            {activeTab !== 'identity' && (() => {
              // Build group spans for colSpan labels
              const groups = [];
              let lastGroup = null;
              visibleCols.forEach(col => {
                if (col.group !== lastGroup) {
                  groups.push({ group: col.group, span: 1 });
                  lastGroup = col.group;
                } else {
                  groups[groups.length - 1].span++;
                }
              });
              return (
                <tr>
                  <th className="w-8" />
                  {groups.map(g => (
                    <th key={g.group} colSpan={g.span} className="px-2 py-2 text-left">
                      {TAB_GROUP_LABELS[g.group] && (
                        <span className="text-xs font-semibold text-teal uppercase tracking-widest">
                          {TAB_GROUP_LABELS[g.group]}
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              );
            })()}
            {/* Column headers */}
            <tr className="border-b border-slate-200" style={{ backgroundColor: '#E8EBF0' }}>
              <th className="w-8 px-2 py-2.5" />
              {visibleCols.map(col => (
                <th key={col.key} className={clsx('px-2 py-2.5 text-left font-semibold text-navy/70 whitespace-nowrap uppercase tracking-wide', col.width)}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}>
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.required && <span className="text-red-400 text-[10px]">*</span>}
                    <Tooltip text={col.tip} />
                  </span>
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {/* Empty state */}
            {skuRows.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length + 2} className="py-16 text-center">
                  <p className="text-sm text-slate-400 mb-4">
                    Click <strong className="text-navy">+ Add SKU</strong> to begin building your portfolio, or <strong className="text-navy">Import CSV</strong> to bulk-load your data.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <ArrowUpTrayIcon className="h-3.5 w-3.5" /> Import CSV
                    </Button>
                    <Button variant="primary" size="sm" onClick={onAdd}>
                      <PlusIcon className="h-3.5 w-3.5" /> Add SKU
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {skuRows.map((row, ri) => {
              const rowKey = row.id || row._tempId;
              return (
                <tr key={rowKey}
                  className={clsx(
                    'border-b border-gray-100 group transition-colors h-12',
                    ri % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                    'hover:bg-teal-50'
                  )}>
                  <td className="px-2 py-0 w-8 text-center">
                    <CompletenessDot row={row} />
                  </td>
                  {visibleCols.map(col => {
                    const val = pendingEdits.current[rowKey]?.[col.key] ?? row[col.key];
                    const isEmpty = col.required && (val === '' || val === null || val === undefined);
                    const isDuplicate = col.key === 'sku_id' && val && duplicateSkuIds.has(val.toString().trim());
                    return (
                      <td key={col.key}
                        className={clsx(
                          'px-2 py-0',
                          col.width,
                          isEmpty && 'bg-red-50/50',
                          isDuplicate && 'bg-red-50'
                        )}
                        style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                        title={isDuplicate ? `Duplicate SKU ID "${val}" — each row must have a unique ID` : undefined}>
                        <div className={clsx(isDuplicate && 'ring-1 ring-red-400 rounded')}>
                          <CellInput
                            col={col} value={val} vertical={vertical}
                            onChange={v => handleCellChange(rowKey, col.key, v)}
                            onBlur={() => handleCellBlur()}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-1 py-0 w-10">
                    <RowActionMenu
                      onDetail={() => onRowClick(row)}
                      onDelete={() => onDelete(rowKey)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Add SKU row button */}
        {skuRows.length > 0 && (
          <button onClick={onAdd}
            className="w-full py-3 text-xs font-semibold text-navy/40 hover:text-navy hover:bg-slate-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-1.5">
            <PlusIcon className="h-3.5 w-3.5" />
            Add SKU
          </button>
        )}
      </div>

      {/* Footer: row count + save status */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/40">
        <span className="text-[11px] text-slate-400">
          {skuRows.length} SKU{skuRows.length !== 1 ? 's' : ''}
        </span>
        <span className={clsx('text-[11px] font-medium flex items-center gap-1.5',
          saveStatus === 'saved' && 'text-emerald-500',
          saveStatus === 'saving' && 'text-teal',
          saveStatus === 'unsaved' && 'text-amber-500'
        )}>
          {saveStatus === 'saved' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All changes saved
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving...
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved changes
            </>
          )}
        </span>
      </div>

      {/* CSV Import Preview Modal */}
      <ImportPreviewModal
        result={importResult}
        onConfirm={handleImportConfirm}
        onCancel={() => setImportResult(null)}
        importing={importing}
      />
    </div>
  );
}
