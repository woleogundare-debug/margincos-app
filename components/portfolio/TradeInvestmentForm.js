import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/index';
import clsx from 'clsx';

function nairaFormat(v) {
  if (!v) return '₦0';
  const n = parseFloat(v);
  if (n >= 1e6) return '₦' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '₦' + (n / 1e3).toFixed(0) + 'K';
  return '₦' + n.toFixed(0);
}

export function TradeInvestmentForm({ tradeInvestment, onSave, saving, periodId, cfg }) {
  const [matrix, setMatrix] = useState({});
  const [dirty,  setDirty]  = useState(false);

  // Derive channel/category config from sector config
  const ci           = cfg?.commercialInvestment;
  const channels     = ci?.channels     || [];
  const categories   = ci?.spendCategories || [];
  const channelField = ci?.channelField  || 'channel';
  const formTitle    = ci?.formTitle    || 'Monthly Trade Spend by Channel';
  const formSubtitle = ci?.formSubtitle || 'Enter spend in Naira (₦) per category per channel';

  useEffect(() => {
    const m = {};
    channels.forEach(ch => {
      const existing = (tradeInvestment || []).find(r => r[channelField] === ch.code);
      const row = { id: existing?.id ?? null };
      categories.forEach(cat => {
        row[cat.key] = existing?.[cat.key] ?? '';
      });
      m[ch.code] = row;
    });
    setMatrix(m);
    setDirty(false);
  }, [tradeInvestment, cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (ch, cat, val) => {
    setMatrix(prev => ({
      ...prev,
      [ch]: { ...prev[ch], [cat]: val === '' ? '' : parseFloat(val) || 0 },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    for (const [ch, data] of Object.entries(matrix)) {
      const total = categories.reduce((s, c) => s + (parseFloat(data[c.key]) || 0), 0);
      if (total > 0 || data.id) {
        const row = {
          id:           data.id || undefined,
          [channelField]: ch,
          period_id:    periodId,
        };
        categories.forEach(cat => {
          row[cat.key] = parseFloat(data[cat.key]) || 0;
        });
        await onSave(row);
      }
    }
    setDirty(false);
  };

  const catTotals = categories.reduce((acc, cat) => {
    acc[cat.key] = channels.reduce((s, ch) => s + (parseFloat(matrix[ch.code]?.[cat.key]) || 0), 0);
    return acc;
  }, {});

  const rowTotals = channels.reduce((acc, ch) => {
    acc[ch.code] = categories.reduce((s, cat) => s + (parseFloat(matrix[ch.code]?.[cat.key]) || 0), 0);
    return acc;
  }, {});

  const grandTotal = Object.values(rowTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-navy">{formTitle}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{formSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {grandTotal > 0 && (
            <span className="text-sm font-bold text-navy">
              Total: <span style={{ color: '#D4A843' }}>{nairaFormat(grandTotal)}</span>
              <span className="text-xs font-normal text-slate-400">/month</span>
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
            <tr style={{ backgroundColor: '#E8EBF0' }}>
              <th className="px-0 py-3 text-left w-56">
                <div className="bg-navy text-white px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-r-lg">
                  {channelField === 'contract_type' ? 'Contract Type' : 'Channel'}
                </div>
              </th>
              {categories.map(cat => (
                <th key={cat.key} className="px-3 py-3 text-right text-xs font-semibold text-navy/70 uppercase tracking-wide">
                  <span className="flex items-center justify-end gap-1">
                    {cat.label}
                    <Tooltip text={cat.tip} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-bold text-navy uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, ri) => {
              const rowTotal = rowTotals[ch.code] || 0;
              return (
                <tr key={ch.code} className={clsx(
                  'border-b border-gray-100 h-14 transition-colors hover:bg-teal-50',
                  ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                )}>
                  <td className="px-0 py-0 w-56">
                    <div className="bg-navy text-white px-4 py-3 font-semibold text-xs whitespace-nowrap">
                      {ch.label}
                    </div>
                  </td>
                  {categories.map(cat => (
                    <td key={cat.key} className="px-2 py-1">
                      <div className="flex items-center justify-end">
                        <span className="text-slate-300 mr-0.5 text-[10px]">₦</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={matrix[ch.code]?.[cat.key] ?? ''}
                          onChange={e => handleChange(ch.code, cat.key, e.target.value)}
                          placeholder="0"
                          className="w-32 text-right text-xs bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-teal rounded px-2 py-1.5 [appearance:textfield] transition-all"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-bold text-teal">
                    {rowTotal > 0 ? nairaFormat(rowTotal) : <span className="text-gray-300">₦0</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-navy">
              <td className="px-0 py-0">
                <div className="bg-navy text-white px-4 py-3 text-xs font-bold uppercase tracking-wide rounded-br-lg">
                  Total
                </div>
              </td>
              {categories.map(cat => (
                <td key={cat.key} className="px-3 py-3 text-right text-xs font-bold text-navy">
                  {catTotals[cat.key] > 0 ? nairaFormat(catTotals[cat.key]) : <span className="text-gray-400">₦0</span>}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-sm font-black" style={{ color: '#D4A843' }}>
                {nairaFormat(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
