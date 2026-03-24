import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon, CalendarDaysIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Modal } from '../ui/index';
import { Button } from '../ui/Button';
import { VERTICALS } from '../../lib/constants';
import clsx from 'clsx';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const CURRENT_YEAR  = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);
// e.g. [2025, 2026, 2027, 2028, 2029]

function formatPeriodDate(created_at) {
  if (!created_at) return null;
  return new Date(created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PeriodSelector({ periods, activePeriod, onSelect, onCreate, onDelete, loading }) {
  const [open,          setOpen]          = useState(false);
  const [showModal,     setShowModal]     = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear,  setSelectedYear]  = useState(CURRENT_YEAR);
  const [form,          setForm]          = useState({ vertical: 'FMCG', company_name: '' });
  const [creating,      setCreating]      = useState(false);
  const [error,         setError]         = useState('');
  const [deleting,      setDeleting]      = useState(null); // period id currently being deleted
  const [deleteError,   setDeleteError]   = useState('');
  const dropdownRef = useRef(null);

  // Auto-generated label — canonical format for sorting and display
  const periodLabel = `${selectedMonth} ${selectedYear}`;

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
    if (!form.vertical) { setError('Vertical is required'); return; }
    setCreating(true);
    await onCreate({ label: periodLabel, vertical: form.vertical, company_name: form.company_name });
    setCreating(false);
    setShowModal(false);
    // Reset to current month/year for next creation
    setSelectedMonth(MONTHS[new Date().getMonth()]);
    setSelectedYear(CURRENT_YEAR);
    setForm({ vertical: 'FMCG', company_name: '' });
    setError('');
  };

  const handleDelete = async (e, period) => {
    e.stopPropagation();
    const isActivePeriod = activePeriod?.id === period.id;
    const message = isActivePeriod
      ? `Delete "${period.label}"? This is your active period. All SKU data will be removed and the page will reset.`
      : `Delete "${period.label}"? This will permanently remove all SKU data for this period.`;
    if (!confirm(message)) return;
    setDeleting(period.id);
    try {
      await onDelete(period.id);
    } catch (err) {
      setDeleteError('Failed to delete period. Please try again.');
      setTimeout(() => setDeleteError(''), 4000);
    } finally {
      setDeleting(null);
    }
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
            ? <>
                <span>{activePeriod.label}</span>
                <span className="opacity-50 mx-0.5">·</span>
                <span className="opacity-70 text-xs">{activePeriod.vertical}</span>
                {formatPeriodDate(activePeriod.created_at) && (
                  <>
                    <span className="opacity-50 mx-0.5">·</span>
                    <span className="opacity-50 text-xs font-normal">{formatPeriodDate(activePeriod.created_at)}</span>
                  </>
                )}
              </>
            : <span>Select a period</span>
          }
          <ChevronDownIcon className={clsx('h-3.5 w-3.5 opacity-50 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
            {periods.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400">No periods yet</p>
            )}
            <div className="max-h-64 overflow-y-auto">
              {periods.map(p => {
                const dateLabel = formatPeriodDate(p.created_at);
                const isActive  = activePeriod?.id === p.id;
                const isDeleting = deleting === p.id;
                return (
                  <div key={p.id}
                    role="button"
                    onClick={() => { if (!isDeleting) { onSelect(p); setOpen(false); } }}
                    className={clsx(
                      'w-full text-left px-4 py-3 transition-colors border-b border-slate-50 last:border-0',
                      'flex items-center gap-3 group cursor-pointer',
                      isActive ? 'bg-teal-50 hover:bg-teal-50' : 'hover:bg-slate-50',
                      isDeleting && 'opacity-50 cursor-wait'
                    )}>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-navy">{p.label}</span>
                      <span className="text-xs text-slate-400">
                        {p.vertical}{p.company_name ? ` · ${p.company_name}` : ''}
                        {dateLabel && <> · {dateLabel}</>}
                      </span>
                    </div>

                    {/* Right-side controls: checkmark + delete button (or spinner) */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {isDeleting ? (
                        <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : (
                        <>
                          {isActive && (
                            <CheckIcon className="w-4 h-4 text-teal" />
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => handleDelete(e, p)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50"
                              title="Delete period">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke="#C0392B" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {deleteError && (
              <p style={{ fontSize: '11px', color: '#C0392B', padding: '6px 16px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif", borderTop: '1px solid #FEE2E2', backgroundColor: '#FFF5F5' }}>
                {deleteError}
              </p>
            )}
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

          {/* Month / Year picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Period <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
                style={{ color: '#1B2A4A' }}>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
                style={{ color: '#1B2A4A' }}>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="text-xs mt-1.5" style={{ color: '#8899AA' }}>
              Period label:{' '}
              <span className="font-semibold" style={{ color: '#1B2A4A' }}>{periodLabel}</span>
            </p>
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
