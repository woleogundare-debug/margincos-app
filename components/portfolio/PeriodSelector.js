import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon, CalendarDaysIcon, CheckIcon } from '@heroicons/react/24/outline';
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
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setOpen(o => !o)}
          className={clsx(
            'flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full text-sm font-semibold transition-all border',
            activePeriod
              ? 'bg-navy text-white border-navy hover:bg-navy-light'
              : 'bg-white text-slate-400 border-slate-200 hover:border-teal'
          )}>
          <CalendarDaysIcon className="h-4 w-4 opacity-70" />
          {activePeriod
            ? <><span>{activePeriod.label}</span><span className="opacity-50 mx-0.5">·</span><span className="opacity-70 text-xs">{activePeriod.vertical}</span></>
            : <span>Select a period</span>
          }
          <ChevronDownIcon className={clsx('h-3.5 w-3.5 opacity-50 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
            {periods.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400">No periods yet</p>
            )}
            <div className="max-h-64 overflow-y-auto">
              {periods.map(p => (
                <button key={p.id}
                  onClick={() => { onSelect(p); setOpen(false); }}
                  className={clsx(
                    'w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-3',
                    activePeriod?.id === p.id ? 'bg-teal-50' : ''
                  )}>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-navy">{p.label}</span>
                    <span className="text-xs text-slate-400">{p.vertical}{p.company_name ? ` · ${p.company_name}` : ''}</span>
                  </div>
                  {activePeriod?.id === p.id && (
                    <CheckIcon className="w-4 h-4 text-teal flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setOpen(false); setShowModal(true); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-teal hover:bg-teal-50 transition-colors border-t border-slate-100">
              <PlusIcon className="h-4 w-4" />
              New period
            </button>
          </div>
        )}
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
