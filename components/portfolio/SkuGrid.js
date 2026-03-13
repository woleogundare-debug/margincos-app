import { useState, useRef, useCallback } from 'react';
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
  { key: 'sku_id',        label: 'SKU ID',           group: 'identity', required: true,  type: 'text',   width: 'w-28',  tip: 'Unique identifier. No duplicates.' },
  { key: 'sku_name',      label: 'Product Name',     group: 'identity', required: true,  type: 'text',   width: 'w-40',  tip: 'Full product name as it appears on pack.' },
  { key: 'category',      label: 'Category',         group: 'identity', required: true,  type: 'select', width: 'w-44',  tip: 'Select from your vertical\'s category list.' },
  { key: 'segment',       label: 'Segment',          group: 'identity', required: false, type: 'select', width: 'w-32',  tip: 'Mass Market, Mid-Range, or Premium.' },
  { key: 'business_unit', label: 'Business Unit',    group: 'identity', required: false, type: 'text',   width: 'w-32',  tip: 'Internal BU or division name.' },
  // Pricing P1
  { key: 'rrp',                      label: 'RRP ₦',         group: 'pricing',  required: true,  type: 'number', width: 'w-24',  tip: 'Recommended retail price per unit in Naira.' },
  { key: 'competitor_price',         label: 'Comp. Price ₦', group: 'pricing',  required: false, type: 'number', width: 'w-28',  tip: 'Nearest competitor\'s price per unit. Powers competitor gap analysis.' },
  { key: 'target_margin_floor_pct',  label: 'Margin Floor %', group: 'pricing', required: false, type: 'pct',    width: 'w-28',  tip: 'Minimum acceptable gross margin %. Triggers breach alert if crossed.' },
  { key: 'price_elasticity',         label: 'Elasticity',    group: 'pricing',  required: false, type: 'number', width: 'w-24',  tip: 'Price elasticity coefficient. Default -0.7 if blank.' },
  { key: 'proposed_price_change_pct',label: 'Prop. Chg %',   group: 'pricing',  required: false, type: 'pct',    width: 'w-24',  tip: 'Proposed price change as a decimal (0.05 = 5%).' },
  { key: 'wtp_premium_pct',          label: 'WTP Premium %', group: 'pricing',  required: false, type: 'pct',    width: 'w-28',  tip: 'Estimated willingness-to-pay premium above current RRP.' },
  // Cost P2
  { key: 'cogs_per_unit',      label: 'COGS ₦',         group: 'cost', required: true,  type: 'number', width: 'w-24',  tip: 'Cost of goods sold per unit in Naira.' },
  { key: 'cogs_prior_period',  label: 'Prior COGS ₦',   group: 'cost', required: false, type: 'number', width: 'w-28',  tip: 'COGS per unit last period. Used to compute actual vs. self-reported inflation.' },
  { key: 'cogs_inflation_rate',label: 'COGS Infl. %',   group: 'cost', required: false, type: 'pct',    width: 'w-24',  tip: 'Input cost inflation rate. Overridden by Prior COGS if both present.' },
  { key: 'pass_through_rate',  label: 'Pass-Through %', group: 'cost', required: false, type: 'pct',    width: 'w-28',  tip: '% of cost inflation recovered via price. 1.0 = fully passed through.' },
  { key: 'fx_exposure_pct',    label: 'FX Exposure %',  group: 'cost', required: false, type: 'pct',    width: 'w-28',  tip: '% of COGS linked to FX/imported inputs. Decomposes absorbed inflation.' },
  // Channel P3
  { key: 'primary_channel',       label: 'Channel',       group: 'channel', required: true,  type: 'select', width: 'w-32',  tip: 'Primary route to market for this SKU.' },
  { key: 'channel_revenue_split', label: 'Channel Split', group: 'channel', required: false, type: 'text',   width: 'w-36',  tip: 'e.g. MT:60,OM:30,OT:10 — must total 100.' },
  { key: 'distributor_name',      label: 'Distributor',   group: 'channel', required: false, type: 'text',   width: 'w-36',  tip: 'Named distributor. Powers M4 Distributor Scorecard.' },
  { key: 'distributor_margin_pct',label: 'Dist. Margin %',group: 'channel', required: false, type: 'pct',    width: 'w-28',  tip: 'Distributor margin as % of RRP.' },
  { key: 'trade_rebate_pct',      label: 'Rebate %',      group: 'channel', required: false, type: 'pct',    width: 'w-24',  tip: 'Distributor rebate % separate from margin. Used in net contribution calc.' },
  { key: 'logistics_cost_per_unit',label: 'Logistics ₦',  group: 'channel', required: false, type: 'number', width: 'w-28',  tip: 'Delivery/logistics cost per unit. Included in true net contribution margin.' },
  { key: 'credit_days',           label: 'Credit Days',   group: 'channel', required: false, type: 'number', width: 'w-24',  tip: 'Standard credit days extended. Used in working capital cost calculation.' },
  // Trade P4
  { key: 'monthly_volume_units', label: 'Volume',       group: 'trade', required: true,  type: 'number', width: 'w-24',  tip: 'Monthly sales volume in units.' },
  { key: 'promo_depth_pct',      label: 'Promo Depth %',group: 'trade', required: false, type: 'pct',    width: 'w-28',  tip: 'Average promotional discount as % of RRP (0.15 = 15%).' },
  { key: 'promo_lift_pct',       label: 'Promo Lift %', group: 'trade', required: false, type: 'pct',    width: 'w-28',  tip: 'Volume uplift % during promotional period.' },
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
  const { categories } = getTaxonomy(vertical || 'FMCG');

  if (col.type === 'select') {
    let options = [];
    if (col.key === 'category')        options = categories;
    else if (col.key === 'segment')    options = SEGMENTS;
    else if (col.key === 'primary_channel') options = PRIMARY_CHANNELS.map(c => c.code);
    else if (col.key === 'region')     options = REGIONS;

    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} onBlur={onBlur}
        className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal/40 rounded px-1 py-0.5">
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (col.type === 'bool') {
    return (
      <select value={value === true || value === 'Y' ? 'true' : 'false'}
        onChange={e => onChange(e.target.value === 'true')} onBlur={onBlur}
        className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal/40 rounded px-1 py-0.5">
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  return (
    <input type={col.type === 'number' || col.type === 'pct' ? 'number' : 'text'}
      value={value ?? ''}
      step={col.type === 'pct' ? '0.01' : col.type === 'number' ? '1' : undefined}
      onChange={e => onChange(col.type === 'number' || col.type === 'pct' ? parseFloat(e.target.value) || '' : e.target.value)}
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

  const vertical = activePeriod?.vertical || 'FMCG';
  const visibleCols = COLUMNS.filter(c => visibleGroups.has(c.group));

  const handleCellChange = useCallback((rowId, colKey, value) => {
    if (!pendingEdits.current[rowId]) pendingEdits.current[rowId] = {};
    pendingEdits.current[rowId][colKey] = value;
  }, []);

  const handleCellBlur = useCallback((row, colKey) => {
    const edits = pendingEdits.current[row.id || row._tempId];
    if (edits && Object.keys(edits).length > 0) {
      onSave({ ...row, ...edits });
      pendingEdits.current[row.id || row._tempId] = {};
    }
    setEditingCell(null);
  }, [onSave]);

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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
              <th className="w-16 border-r-0" />
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
              <th className="w-16" />
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
                  <td className="px-2 py-1 w-16">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
