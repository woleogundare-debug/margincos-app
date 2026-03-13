import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/index';
import { getTaxonomy } from '../../lib/taxonomy/index';
import { PRIMARY_CHANNELS, SEGMENTS, REGIONS } from '../../lib/constants';
import clsx from 'clsx';

const FIELD_GROUPS = [
  {
    label: 'Identity', color: 'text-navy', bg: 'bg-navy/5', fields: [
      { key: 'sku_id',        label: 'SKU ID',         type: 'text',   required: true,  tip: 'Unique identifier for this SKU. Must be unique within the period.' },
      { key: 'sku_name',      label: 'Product Name',   type: 'text',   required: true,  tip: 'Full product name as it appears on packaging.' },
      { key: 'category',      label: 'Category',       type: 'select', required: true,  tip: 'Product category from your vertical taxonomy.' },
      { key: 'segment',       label: 'Segment',        type: 'select', required: false, tip: 'Market positioning: Mass Market, Mid-Range, or Premium.' },
      { key: 'business_unit', label: 'Business Unit',  type: 'text',   required: false, tip: 'Internal business unit or division.' },
      { key: 'region',        label: 'Region',         type: 'select', required: false, tip: 'Primary geographic market for this SKU.' },
      { key: 'active',        label: 'Active in Analysis', type: 'bool', required: true, tip: 'Set to No to exclude from analysis without deleting.' },
    ]
  },
  {
    label: 'Pricing Intelligence (P1)', color: 'text-teal-700', bg: 'bg-teal-50', fields: [
      { key: 'rrp',                       label: 'RRP (₦/unit)',              type: 'number', required: true,  tip: 'Recommended Retail Price per unit in Naira.' },
      { key: 'competitor_price',          label: 'Competitor Price (₦/unit)', type: 'number', required: false, tip: 'Nearest direct competitor\'s shelf price. Powers competitor gap analysis.' },
      { key: 'target_margin_floor_pct',   label: 'Margin Floor (%)',          type: 'pct',    required: false, tip: 'Minimum acceptable gross margin. Enter as decimal: 0.35 = 35%. Triggers breach alert.' },
      { key: 'price_elasticity',          label: 'Price Elasticity',          type: 'number', required: false, tip: 'Demand sensitivity to price change. Negative number. Default: -0.7 if blank.' },
      { key: 'proposed_price_change_pct', label: 'Proposed Price Change (%)', type: 'pct',    required: false, tip: 'Your intended price move. Enter as decimal: 0.05 = 5% increase.' },
      { key: 'wtp_premium_pct',           label: 'WTP Premium (%)',           type: 'pct',    required: false, tip: 'Estimated consumer willingness-to-pay above current RRP. Enter as decimal.' },
    ]
  },
  {
    label: 'Cost Pass-Through (P2)', color: 'text-red-700', bg: 'bg-red-50', fields: [
      { key: 'cogs_per_unit',       label: 'COGS (₦/unit)',           type: 'number', required: true,  tip: 'Current cost of goods sold per unit in Naira.' },
      { key: 'cogs_prior_period',   label: 'Prior Period COGS (₦)',   type: 'number', required: false, tip: 'COGS per unit in the prior period. If provided, actual inflation is computed from this. Overrides self-reported inflation rate.' },
      { key: 'cogs_inflation_rate', label: 'COGS Inflation Rate (%)', type: 'pct',    required: false, tip: 'Self-reported input cost inflation rate. Ignored if Prior Period COGS is populated.' },
      { key: 'pass_through_rate',   label: 'Pass-Through Rate (%)',   type: 'pct',    required: false, tip: '% of cost inflation recovered via price increases. 1.0 = fully passed through to customer.' },
      { key: 'fx_exposure_pct',     label: 'FX Exposure (%)',         type: 'pct',    required: false, tip: '% of COGS sourced from imports or FX-linked inputs. Splits absorbed inflation into FX vs. domestic.' },
    ]
  },
  {
    label: 'Channel Economics (P3)', color: 'text-amber-700', bg: 'bg-amber-50', fields: [
      { key: 'primary_channel',        label: 'Primary Channel',            type: 'select', required: true,  tip: 'Main route to market for this SKU.' },
      { key: 'channel_revenue_split',  label: 'Channel Revenue Split',      type: 'text',   required: false, tip: 'Multi-channel breakdown. Format: MT:60,OM:30,OT:10 — codes must total 100.' },
      { key: 'distributor_name',       label: 'Distributor Name',           type: 'text',   required: false, tip: 'Named distributor or trade partner. Required to unlock M4 Distributor Scorecard.' },
      { key: 'distributor_margin_pct', label: 'Distributor Margin (%)',     type: 'pct',    required: false, tip: 'Distributor margin as % of RRP. Deducted in true net contribution calculation.' },
      { key: 'trade_rebate_pct',       label: 'Trade Rebate (%)',           type: 'pct',    required: false, tip: 'Separate rebate paid to distributor as % of RRP. Distinct from margin.' },
      { key: 'logistics_cost_per_unit',label: 'Logistics Cost (₦/unit)',    type: 'number', required: false, tip: 'Outbound delivery/logistics cost per unit. Deducted in net contribution calculation.' },
      { key: 'credit_days',            label: 'Credit Days',                type: 'number', required: false, tip: 'Standard payment terms extended to distributor. Used in working capital cost calculation in M4.' },
    ]
  },
  {
    label: 'Trade Execution (P4)', color: 'text-purple-700', bg: 'bg-purple-50', fields: [
      { key: 'monthly_volume_units', label: 'Monthly Volume (units)', type: 'number', required: true,  tip: 'Average monthly sales volume in units.' },
      { key: 'promo_depth_pct',      label: 'Promo Depth (%)',        type: 'pct',    required: false, tip: 'Average promotional discount as % of RRP. Enter as decimal: 0.15 = 15% off.' },
      { key: 'promo_lift_pct',       label: 'Promo Volume Lift (%)',  type: 'pct',    required: false, tip: 'Volume uplift achieved during promotions. Enter as decimal: 0.20 = 20% more units.' },
    ]
  },
];

function FieldInput({ field, value, onChange, vertical }) {
  const { categories } = getTaxonomy(vertical || 'FMCG');

  const baseClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors';

  if (field.type === 'select') {
    let options = [];
    if (field.key === 'category')         options = categories;
    else if (field.key === 'segment')     options = SEGMENTS;
    else if (field.key === 'primary_channel') options = PRIMARY_CHANNELS.map(c => ({ value: c.code, label: `${c.code} — ${c.label}` }));
    else if (field.key === 'region')      options = REGIONS;

    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={clsx(baseClass, 'bg-white')}>
        <option value="">— Select —</option>
        {options.map(o => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    );
  }

  if (field.type === 'bool') {
    return (
      <select value={value === true || value === 'Y' ? 'true' : 'false'}
        onChange={e => onChange(e.target.value === 'true')}
        className={clsx(baseClass, 'bg-white')}>
        <option value="true">Yes — include in analysis</option>
        <option value="false">No — exclude from analysis</option>
      </select>
    );
  }

  return (
    <input
      type={field.type === 'number' || field.type === 'pct' ? 'number' : 'text'}
      step={field.type === 'pct' ? '0.01' : field.type === 'number' ? '1' : undefined}
      min={0}
      value={value ?? ''}
      onChange={e => {
        const v = e.target.value;
        onChange(field.type === 'number' || field.type === 'pct' ? (v === '' ? null : parseFloat(v)) : v);
      }}
      placeholder={field.required ? 'Required' : 'Optional'}
      className={baseClass}
    />
  );
}

// Completeness bar — optional fields only
function CompletenessBar({ row, vertical }) {
  const { categories } = getTaxonomy(vertical || 'FMCG');
  const optionalFields = FIELD_GROUPS.flatMap(g => g.fields).filter(f => !f.required);
  const filled = optionalFields.filter(f => {
    const v = row[f.key];
    return v !== null && v !== undefined && v !== '';
  }).length;
  const pct = Math.round((filled / optionalFields.length) * 100);
  const color = pct >= 70 ? 'bg-teal' : pct >= 40 ? 'bg-amber' : 'bg-slate-300';

  return (
    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-500">Optional field completion</span>
        <span className="text-xs font-bold text-navy">{filled}/{optionalFields.length} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-300', color)} style={{ width: `${pct}%` }} />
      </div>
      {pct < 40 && (
        <p className="text-xs text-slate-400 mt-1">More fields → more accurate analysis</p>
      )}
    </div>
  );
}

export function SkuDetailPanel({ row, onClose, onSave, saving, vertical }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (row) setForm({ ...row });
  }, [row]);

  if (!row) return null;

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = () => onSave(form);

  const isDirty = JSON.stringify(form) !== JSON.stringify(row);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-navy">
              {form.sku_name || form.sku_id || 'New SKU'}
            </h2>
            {form.category && (
              <p className="text-xs text-slate-400 mt-0.5">{form.category}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Completeness */}
        <CompletenessBar row={form} vertical={vertical} />

        {/* Fields */}
        <div className="flex-1 overflow-y-auto">
          {FIELD_GROUPS.map(group => (
            <div key={group.label} className="border-b border-slate-100 last:border-0">
              <div className={clsx('px-6 py-2.5 flex items-center gap-2', group.bg)}>
                <h3 className={clsx('text-xs font-bold uppercase tracking-wider', group.color)}>
                  {group.label}
                </h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                {group.fields.map(field => (
                  <div key={field.key}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                      <Tooltip text={field.tip} />
                    </label>
                    <FieldInput
                      field={field}
                      value={form[field.key]}
                      onChange={v => setField(field.key, v)}
                      vertical={vertical}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary" size="md" onClick={handleSave}
            loading={saving} disabled={!isDirty}
            className="flex-1">
            {saving ? 'Saving…' : isDirty ? 'Save Changes' : (
              <><CheckCircleIcon className="h-4 w-4" /> Saved</>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
