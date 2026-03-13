import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/index';
import { PRIMARY_CHANNELS, TRADE_SPEND_CATEGORIES } from '../../lib/constants';
import clsx from 'clsx';

function nairaFormat(v) {
  if (!v) return '₦0';
  const n = parseFloat(v);
  if (n >= 1e6) return '₦' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '₦' + (n / 1e3).toFixed(0) + 'K';
  return '₦' + n.toFixed(0);
}

export function TradeInvestmentForm({ tradeInvestment, onSave, saving, periodId }) {
  // Build a map: channelCode → { listing_fees, coop_spend, ... }
  const [matrix, setMatrix] = useState({});
  const [dirty,  setDirty]  = useState(false);

  useEffect(() => {
    const m = {};
    PRIMARY_CHANNELS.forEach(ch => {
      const existing = tradeInvestment.find(r => r.channel === ch.code);
      m[ch.code] = {
        id:                existing?.id ?? null,
        listing_fees:      existing?.listing_fees      ?? '',
        coop_spend:        existing?.coop_spend        ?? '',
        activation_budget: existing?.activation_budget ?? '',
        gondola_payments:  existing?.gondola_payments  ?? '',
        other_trade_spend: existing?.other_trade_spend ?? '',
      };
    });
    setMatrix(m);
    setDirty(false);
  }, [tradeInvestment]);

  const handleChange = (ch, cat, val) => {
    setMatrix(prev => ({
      ...prev,
      [ch]: { ...prev[ch], [cat]: val === '' ? '' : parseFloat(val) || 0 },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    for (const [ch, data] of Object.entries(matrix)) {
      const total = TRADE_SPEND_CATEGORIES.reduce((s, c) => s + (parseFloat(data[c.key]) || 0), 0);
      if (total > 0 || data.id) {
        await onSave({
          id:       data.id || undefined,
          channel:  ch,
          period_id: periodId,
          ...Object.fromEntries(TRADE_SPEND_CATEGORIES.map(c => [c.key, parseFloat(data[c.key]) || 0])),
        });
      }
    }
    setDirty(false);
  };

  // Column totals (per category)
  const catTotals = TRADE_SPEND_CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = PRIMARY_CHANNELS.reduce((s, ch) => s + (parseFloat(matrix[ch.code]?.[cat.key]) || 0), 0);
    return acc;
  }, {});

  // Row totals (per channel)
  const rowTotals = PRIMARY_CHANNELS.reduce((acc, ch) => {
    acc[ch.code] = TRADE_SPEND_CATEGORIES.reduce((s, cat) => s + (parseFloat(matrix[ch.code]?.[cat.key]) || 0), 0);
    return acc;
  }, {});

  const grandTotal = Object.values(rowTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-navy">Trade Investment</h3>
          <p className="text-xs text-slate-400 mt-0.5">Monthly spend by channel and category (₦)</p>
        </div>
        <div className="flex items-center gap-3">
          {grandTotal > 0 && (
            <span className="text-sm font-black text-navy">
              Total: {nairaFormat(grandTotal)}<span className="text-xs font-normal text-slate-400">/month</span>
            </span>
          )}
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving} disabled={!dirty}>
            {dirty ? 'Save' : 'Saved'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 w-56">Channel</th>
              {TRADE_SPEND_CATEGORIES.map(cat => (
                <th key={cat.key} className="px-3 py-3 text-right text-xs font-semibold text-slate-500">
                  <span className="flex items-center justify-end gap-1">
                    {cat.label}
                    <Tooltip text={cat.tip} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-bold text-navy">Total</th>
            </tr>
          </thead>
          <tbody>
            {PRIMARY_CHANNELS.map((ch, ri) => {
              const rowTotal = rowTotals[ch.code] || 0;
              return (
                <tr key={ch.code} className={clsx('border-b border-slate-50', ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')}>
                  <td className="px-4 py-2 font-semibold text-navy whitespace-nowrap">
                    {ch.label}
                  </td>
                  {TRADE_SPEND_CATEGORIES.map(cat => (
                    <td key={cat.key} className="px-2 py-1">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-400 mr-0.5 text-[11px]">₦</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={matrix[ch.code]?.[cat.key] ?? ''}
                          onChange={e => handleChange(ch.code, cat.key, e.target.value)}
                          placeholder="0"
                          className="w-24 text-right text-xs bg-transparent border border-transparent hover:border-slate-200 focus:border-teal focus:ring-1 focus:ring-teal/20 focus:outline-none rounded px-2 py-1 [appearance:textfield] transition-colors"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-bold text-navy">
                    {rowTotal > 0 ? nairaFormat(rowTotal) : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Total</td>
              {TRADE_SPEND_CATEGORIES.map(cat => (
                <td key={cat.key} className="px-3 py-2.5 text-right text-xs font-bold text-navy">
                  {catTotals[cat.key] > 0 ? nairaFormat(catTotals[cat.key]) : <span className="text-slate-300">—</span>}
                </td>
              ))}
              <td className="px-4 py-2.5 text-right text-sm font-black text-navy">
                {nairaFormat(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
