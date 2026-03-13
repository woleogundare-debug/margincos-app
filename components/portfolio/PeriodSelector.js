import { useState } from 'react';
import { ChevronDownIcon, PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Modal } from '../ui/index';
import { Button } from '../ui/Button';
import { VERTICALS } from '../../lib/constants';
import clsx from 'clsx';

export function PeriodSelector({ periods, activePeriod, onSelect, onCreate, loading }) {
  const [open,        setOpen]        = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState({ label: '', vertical: 'FMCG', company_name: '' });
  const [creating,    setCreating]    = useState(false);
  const [error,       setError]       = useState('');

  const handleCreate = async () => {
    if (!form.label.trim()) { setError('Period label is required'); return; }
    if (!form.vertical)     { setError('Vertical is required'); return; }
    setCreating(true);
    await onCreate(form);
    setCreating(false);
    setShowModal(false);
    setForm({ label: '', vertical: 'FMCG', company_name: '' });
    setError('');
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Period switcher */}
        <div className="relative">
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-navy hover:border-teal transition-colors shadow-sm">
            <CalendarDaysIcon className="h-4 w-4 text-teal" />
            {activePeriod
              ? <><span>{activePeriod.label}</span><span className="text-xs text-slate-400">·</span><span className="text-xs text-slate-400">{activePeriod.vertical}</span></>
              : <span className="text-slate-400">Select a period</span>
            }
            <ChevronDownIcon className={clsx('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
              {periods.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">No periods yet</p>
              )}
              {periods.map(p => (
                <button key={p.id}
                  onClick={() => { onSelect(p); setOpen(false); }}
                  className={clsx(
                    'w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0',
                    activePeriod?.id === p.id ? 'bg-teal-50 text-teal font-semibold' : 'text-navy'
                  )}>
                  <span className="block font-semibold">{p.label}</span>
                  <span className="text-xs text-slate-400">{p.vertical}{p.company_name ? ` · ${p.company_name}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New period */}
        <Button variant="secondary" size="md" onClick={() => setShowModal(true)}>
          <PlusIcon className="h-4 w-4" />
          New Period
        </Button>
      </div>

      {/* New Period Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Period">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Period Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. March 2026"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Vertical <span className="text-red-500">*</span>
            </label>
            <select
              value={form.vertical}
              onChange={e => setForm(f => ({ ...f, vertical: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white">
              {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Company / Division <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Flour Mills of Nigeria"
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleCreate} loading={creating}>
              Create Period
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
