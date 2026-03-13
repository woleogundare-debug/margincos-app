import { useState, useEffect, useRef, useCallback } from 'react';
import { PlusIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/index';
import { getTaxonomy } from '../../lib/taxonomy/index';
import { PRIMARY_CHANNELS, SEGMENTS, REGIONS } from '../../lib/constants';
import clsx from 'clsx';

// Column group colours
const GROUP_COLORS = {
  identity: 'bg-navy/5 text-navy',
  pricing:  'bg-teal-50 text-teal-800',
  cost:     'bg-red-50 text-red-800',
  channel:  'bg-amber-50 text-amber-800',
  trade:    'bg-purple-50 text-purple-800',
  meta:     'bg-slate-50 text-slate-600',
};

// Column definitions
const COLUMNS = [
  // Identity
  { key: 'sku_id',        label: 'SKU ID',           group: 'identity', required: true,  type: 'text',   width: 'w-28',  tip: 'Your internal product code. Must be unique \u2014 no two rows can share the same SKU ID.' },
  { key: 'sku_name',      label: 'Product Name',     group: 'identity', required: true,  type: 'text',   width: 'w-40',  tip: 'Full product name as it appears on-pack or in your ERP system.' },
  { key: 'category',      label: 'Category',         group: 'identity', required: true,  type: 'select', width: 'w-44',  tip: 'Product category from your vertical\u2019s standard taxonomy.' },
  { key: 'segment',       label: 'Segment',          group: 'identity', required: false, type: 'select', width: 'w-32',  tip: 'Price positioning: Mass Market (volume-driven), Mid-Range, or Premium.' },
  { key: 'business_unit', label: 'Business Unit',    group: 'identity', required: false, type: 'text',   width: 'w-32',  tip: 'Division or brand cluster this SKU belongs to (e.g. Flour, Pasta, Noodles).' },
  // Pricing P1
  { key: 'rrp',                      label: 'RRP \u20a6',         group: 'pricing',  required: true,  type: 'number', width: 'w-24',  tip: 'Recommended Retail Price \u2014 the shelf price consumers pay, in Naira per unit.' },
  { key: 'competitor_price',         label: 'Comp. Price \u20a6', group: 'pricing',  required: false, type: 'number', width: 'w-28',  tip: 'The shelf price of your nearest direct competitor\u2019s equivalent product, in \u20a6 per unit.' },
  { key: 'target_margin_floor_pct',  label: 'Margin Floor %', group: 'pricing', required: false, type: 'pct',    width: 'w-28',  tip: 'The minimum gross margin percentage you will accept for this SKU before flagging it for repricing or rationalisation.' },
  { key: 'price_elasticity',         label: 'Elasticity',    group: 'pricing',  required: false, type: 'number', width: 'w-24',  tip: 'How sensitive demand is to a price change. \u22121.5 means a 10% price rise reduces volume by 15%. Leave blank if unknown.' },
  { key: 'proposed_price_change_pct',label: 'Prop. Chg %',   group: 'pricing',  required: false, type: 'pct',    width: 'w-24',  tip: 'The price increase or decrease you are considering. Enter as a percentage \u2014 e.g. 5 for a 5% increase.' },
  { key: 'wtp_premium_pct',          label: 'WTP Premium %', group: 'pricing',  required: false, type: 'pct',    width: 'w-28',  tip: 'Willingness-to-pay premium: how much more (%) consumers are prepared to pay above current RRP before switching.' },
  // Cost P2
  { key: 'cogs_per_unit',      label: 'COGS \u20a6',         group: 'cost', required: true,  type: 'number', width: 'w-24',  tip: 'Cost of Goods Sold per unit \u2014 total landed cost including raw materials, packaging, and manufacturing.' },
  { key: 'cogs_prior_period',  label: 'Prior COGS \u20a6',   group: 'cost', required: false, type: 'number', width: 'w-28',  tip: 'COGS per unit in the previous month or period. Used to calculate actual cost movement rather than relying on self-reported inflation rate.' },
  { key: 'cogs_inflation_rate',label: 'COGS Infl. %',   group: 'cost', required: false, type: 'pct',    width: 'w-24',  tip: 'The annual rate at which this SKU\u2019s input costs are rising. Used to calculate cost absorption.' },
  { key: 'pass_through_rate',  label: 'Pass-Through %', group: 'cost', required: false, type: 'pct',    width: 'w-28',  tip: 'Percentage of cost increases already passed on to the trade. 100% means full pass-through; 0% means fully absorbed.' },
  { key: 'fx_exposure_pct',    label: 'FX Exposure %',  group: 'cost', required: false, type: 'pct',    width: 'w-28',  tip: 'Percentage of this SKU\u2019s COGS that is linked to foreign currency (imported raw materials, packaging, or machinery costs).' },
  // Channel P3
  { key: 'primary_channel',       label: 'Channel',       group: 'channel', required: true,  type: 'select', width: 'w-44',  tip: 'Primary route-to-market for this SKU. Select the channel that accounts for the majority of volume.' },
  { key: 'channel_revenue_split', label: 'Ch. Split %', group: 'channel', required: false, type: 'number', width: 'w-28',  tip: 'What percentage of this SKU\u2019s total volume goes through the selected primary channel. Must sum to 100% across your portfolio.' },
  { key: 'distributor_name',      label: 'Distributor',   group: 'channel', required: false, type: 'text',   width: 'w-36',  tip: 'Name of the primary distributor or wholesaler handling this SKU in this channel.' },
  { key: 'distributor_margin_pct',label: 'Dist. Margin %',group: 'channel', required: false, type: 'pct',    width: 'w-28',  tip: 'The margin percentage retained by the distributor or trade partner. Typically 8\u201315% for Nigerian FMCG.' },
  { key: 'trade_rebate_pct',      label: 'Rebate %',      group: 'channel', required: false, type: 'pct',    width: 'w-24',  tip: 'Retrospective rebate paid back to the trade at period-end, separate from the upfront distributor margin.' },
  { key: 'logistics_cost_per_unit',label: 'Logistics \u20a6',  group: 'channel', required: false, type: 'number', width: 'w-28',  tip: 'Cost to deliver one unit to the trade (\u20a6) \u2014 includes freight, last-mile, and handling.' },
  { key: 'credit_days',           label: 'Credit Days',   group: 'channel', required: false, type: 'number', width: 'w-24',  tip: 'Standard credit terms extended to distributors for this SKU \u2014 the number of days before payment is due.' },
  // Trade P4
  { key: 'monthly_volume_units', label: 'Volume',       group: 'trade', required: true,  type: 'number', width: 'w-24',  tip: 'Number of units sold or distributed in the period.' },
  { key: 'promo_depth_pct',      label: 'Promo Depth %',group: 'trade', required: false, type: 'pct',    width: 'w-28',  tip: 'The discount percentage applied during a promotional period \u2014 e.g. 15 for a 15% promotional price cut.' },
  { key: 'promo_lift_pct',       label: 'Promo Lift %', group: 'trade', required: false, type: 'pct',    width: 'w-28',  tip: 'Expected volume uplift during the promotion as a percentage \u2014 e.g. 20 means you expect 20% more units sold.' },
  // Meta
  { key: 'region', label: 'Region', group: 'meta', required: false, type: 'select', width: 'w-32', tip: 'Primary geographic region for this SKU.' },
  { key: 'active', label: 'Active', group: 'meta', required: true,  type: 'bool',   width: 'w-20', tip: 'Include in analysis. Set to No to exclude without deleting.' },
];

const GROUP_LABELS = {
  identity: 'Identity',
  pricing:  'Pricing · P1',
  cost:     'Cost · P2',
  channel:  'Channel · P3',
  trade:    'Trade · P4',
  meta:     'Meta',
};

function CellInput({ col, value, onChange, onBlur, vertical }) {
  // Local state so the input updates immediately on keystrokes.
  // The parent is notified via onChange (writes to pendingEdits ref)
  // but re-render is driven locally, not by the ref.
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => { setLocal(value ?? ''); }, [value]);

  const { categories } = getTaxonomy(vertical || 'FMCG');

  const handleChange = (v) => { setLocal(v); onChange(v); };

  if (col.type === 'select') {
    let options = [];
    if (col.key === 'category')        options = categories.map(c => ({ value: c, label: c }));
    else if (col.key === 'segment')    options = SEGMENTS.map(s => ({ value: s, label: s }));
    else if (col.key === 'primary_channel') options = PRIMARY_CHANNELS.map(c => ({ value: c.code, label: c.label }));
    else if (col.key === 'region')     options = REGIONS.map(r => ({ value: r, label: r }));

    return (
      <select value={local || ''} onChange={e => handleChange(e.target.value)} onBlur={onBlur}
        className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal/40 rounded px-1 py-0.5">
        <option value="">\u2014</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  if (col.type === 'bool') {
    return (
      <select value={local === true || local === 'Y' ? 'true' : 'false'}
        onChange={e => handleChange(e.target.value === 'true')} onBlur={onBlur}
        className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal/40 rounded px-1 py-0.5">
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  return (
    <input type={col.type === 'number' || col.type === 'pct' ? 'number' : 'text'}
      value={local}
      step={col.type === 'pct' ? '0.01' : col.type === 'number' ? '1' : undefined}
      onChange={e => {
        const v = col.type === 'number' || col.type === 'pct' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value;
        handleChange(v);
      }}
      onBlur={onBlur}
      placeholder={col.required ? '—' : ''}
      className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal/40 rounded px-1 py-0.5 [appearance:textfield]"
    />
  );
}

export function SkuGrid({ skuRows, onSave, onAdd, onDelete, onRowClick, saving, activePeriod }) {
  const [visibleGroups, setVisibleGroups] = useState(
    new Set(['identity', 'pricing', 'cost', 'channel', 'trade', 'meta'])
  );
  const [editingCell, setEditingCell] = useState(null); // { rowIdx, colKey }
  const pendingEdits = useRef({});
  const saveTimers = useRef({});
  // Stable refs so debounce callbacks always see current values
  const skuRowsRef = useRef(skuRows);
  const onSaveRef = useRef(onSave);
  useEffect(() => { skuRowsRef.current = skuRows; }, [skuRows]);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  const vertical = activePeriod?.vertical || 'FMCG';
  const visibleCols = COLUMNS.filter(c => visibleGroups.has(c.group));

  // Channel split sum for validation (all active SKUs should total 100%)
  const channelSplitSum = skuRows.reduce((sum, r) => {
    const v = pendingEdits.current[r.id || r._tempId]?.channel_revenue_split ?? r.channel_revenue_split;
    return sum + (parseFloat(v) || 0);
  }, 0);
  const channelSplitOk = channelSplitSum === 100;

  const handleCellChange = useCallback((rowId, colKey, value) => {
    if (!pendingEdits.current[rowId]) pendingEdits.current[rowId] = {};
    pendingEdits.current[rowId][colKey] = value;
    // Debounced autosave: persist to Supabase after 1.5s of inactivity.
    // This ensures data survives navigation even if blur doesn't fire.
    if (saveTimers.current[rowId]) clearTimeout(saveTimers.current[rowId]);
    saveTimers.current[rowId] = setTimeout(() => {
      const edits = pendingEdits.current[rowId];
      if (!edits || Object.keys(edits).length === 0) return;
      const row = skuRowsRef.current.find(r => r.id === rowId || r._tempId === rowId);
      if (row) onSaveRef.current({ ...row, ...edits });
    }, 1500);
  }, []);

  const handleCellBlur = useCallback((row, colKey) => {
    const key = row.id || row._tempId;
    // Cancel debounce timer — we're flushing immediately on blur
    if (saveTimers.current[key]) {
      clearTimeout(saveTimers.current[key]);
      delete saveTimers.current[key];
    }
    const edits = pendingEdits.current[key];
    if (edits && Object.keys(edits).length > 0) {
      // Don't clear pendingEdits here — the async save hasn't resolved yet.
      // If we clear now, CellInput re-renders with the stale row value before
      // skuRows updates, causing the selected value to vanish (especially selects).
      onSave({ ...row, ...edits });
    }
    setEditingCell(null);
  }, [onSave]);

  // Clear pendingEdits once skuRows actually updates (save completed)
  useEffect(() => {
    pendingEdits.current = {};
  }, [skuRows]);

  // Flush any unsaved edits on unmount (e.g. user navigates away)
  useEffect(() => {
    return () => {
      // Cancel all debounce timers
      Object.values(saveTimers.current).forEach(t => clearTimeout(t));
      // Flush pending edits immediately
      Object.entries(pendingEdits.current).forEach(([key, edits]) => {
        if (edits && Object.keys(edits).length > 0) {
          const row = skuRowsRef.current.find(r => r.id === key || r._tempId === key);
          if (row) onSaveRef.current({ ...row, ...edits });
        }
      });
    };
  }, []);

  const toggleGroup = (g) => {
    if (g === 'identity') return; // always visible
    setVisibleGroups(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

  const groups = [...new Set(COLUMNS.map(c => c.group))];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Columns:</span>
          {groups.map(g => (
            <button key={g} onClick={() => toggleGroup(g)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                visibleGroups.has(g)
                  ? GROUP_COLORS[g] + ' border-current/20'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              )}>
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-teal animate-pulse font-medium">Saving…</span>}
          <span className="text-xs text-slate-400">{skuRows.length} SKUs</span>
          <Button variant="primary" size="sm" onClick={onAdd}>
            <PlusIcon className="h-3.5 w-3.5" /> Add SKU
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            {/* Group headers */}
            <tr className="border-b border-slate-100">
              {groups.filter(g => visibleGroups.has(g)).map(g => {
                const count = visibleCols.filter(c => c.group === g).length;
                return (
                  <th key={g} colSpan={count}
                    className={clsx('px-3 py-2 text-xs font-bold text-center border-r border-slate-100 last:border-r-0', GROUP_COLORS[g])}>
                    {GROUP_LABELS[g]}
                  </th>
                );
              })}
              <th className="w-20 border-r-0" />
            </tr>
            {/* Column headers */}
            <tr className="border-b-2 border-slate-200">
              {visibleCols.map(col => (
                <th key={col.key} className={clsx('px-2 py-2 text-left font-semibold text-slate-500 whitespace-nowrap', col.width)}>
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.required && <span className="text-red-400">*</span>}
                    <Tooltip text={col.tip} />
                  </span>
                </th>
              ))}
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {skuRows.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length + 1} className="py-12 text-center text-sm text-slate-400">
                  No SKUs yet — click <strong>Add SKU</strong> to begin
                </td>
              </tr>
            )}
            {skuRows.map((row, ri) => {
              const rowKey = row.id || row._tempId;
              const hasError = row.active && (!row.sku_id || !row.sku_name || !row.category);
              const cogsGtRrp = row.rrp && row.cogs_per_unit && parseFloat(row.cogs_per_unit) > parseFloat(row.rrp);
              const rowSplit = parseFloat(pendingEdits.current[rowKey]?.channel_revenue_split ?? row.channel_revenue_split) || 0;
              const splitWarning = rowSplit > 0 && !channelSplitOk;
              return (
                <tr key={rowKey}
                  className={clsx(
                    'border-b border-slate-50 group hover:bg-teal-50/30 transition-colors',
                    ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                    hasError  && 'border-l-2 border-l-red-400',
                    cogsGtRrp && 'border-l-2 border-l-amber-400',
                  )}>
                  {visibleCols.map(col => {
                    const val = pendingEdits.current[rowKey]?.[col.key] ?? row[col.key];
                    return (
                      <td key={col.key}
                        className={clsx('px-2 py-0 border-r border-slate-50 last:border-r-0', col.width)}
                        onClick={() => setEditingCell({ rowIdx: ri, colKey: col.key })}>
                        <CellInput
                          col={col} value={val} vertical={vertical}
                          onChange={v => handleCellChange(rowKey, col.key, v)}
                          onBlur={() => handleCellBlur(row, col.key)}
                        />
                      </td>
                    );
                  })}
                  {/* Actions */}
                  <td className="px-2 py-1 w-20">
                    <div className="flex items-center gap-1">
                      {splitWarning && (
                        <span className="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600 whitespace-nowrap" title={`Channel splits total ${channelSplitSum}%, not 100%`}>
                          ≠100
                        </span>
                      )}
                      <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onRowClick(row)}
                          className="p-1 rounded text-slate-400 hover:text-teal hover:bg-teal-50 transition-colors"
                          title="View / Edit detail">
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => onDelete(rowKey)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete SKU">
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {skuRows.length > 0 && visibleGroups.has('channel') && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                {visibleCols.map(col => (
                  <td key={col.key} className="px-2 py-2 text-xs">
                    {col.key === 'channel_revenue_split' ? (
                      <span className={clsx('font-bold', channelSplitOk ? 'text-emerald-600' : 'text-red-600')}>
                        {channelSplitSum}%{' '}
                        <span className="font-normal">{channelSplitOk ? '✓' : '≠ 100'}</span>
                      </span>
                    ) : col.key === 'primary_channel' ? (
                      <span className="font-semibold text-slate-400">Split total →</span>
                    ) : null}
                  </td>
                ))}
                <td className="w-20" />
              </tr>
            </tfoot>
          )}
        </table>
        {skuRows.length > 0 && visibleGroups.has('channel') && (
          <p className="px-5 py-2 text-[11px] text-slate-400 border-t border-slate-100">
            <strong>What is channel split?</strong> Enter what % of this SKU&apos;s volume goes through each channel. The total across all your SKU rows should reach 100%.
          </p>
        )}
      </div>
    </div>
  );
}
