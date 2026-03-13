import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className={clsx('w-full bg-white rounded-2xl shadow-2xl overflow-hidden', widths[size])}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <Dialog.Title className="text-base font-bold text-navy">{title}</Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="px-6 py-5">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'slate', className }) {
  const colors = {
    green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    teal:   'bg-teal-50 text-teal-700 border-teal-200',
    slate:  'bg-slate-100 text-slate-600 border-slate-200',
    navy:   'bg-navy/5 text-navy border-navy/20',
  };
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
      colors[color] || colors.slate, className
    )}>
      {children}
    </span>
  );
}

// ── RAG Badge ─────────────────────────────────────────────────────────────
export function RagBadge({ status }) {
  const cfg = {
    green: { dot: 'bg-emerald-500', text: 'Healthy',         cls: 'bg-emerald-50 text-emerald-700' },
    amber: { dot: 'bg-amber-500',   text: 'Monitor',         cls: 'bg-amber-50  text-amber-700'   },
    red:   { dot: 'bg-red-500',     text: 'Action Required', cls: 'bg-red-50    text-red-700'      },
    grey:  { dot: 'bg-slate-400',   text: 'No Data',         cls: 'bg-slate-100 text-slate-500'   },
  }[status] || { dot: 'bg-slate-400', text: '—', cls: 'bg-slate-100 text-slate-500' };

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.cls)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.text}
    </span>
  );
}

// ── Tooltip ────────────────────────────────────────────────────────────────
export function Tooltip({ text, children }) {
  return (
    <span className="group relative inline-flex">
      {children || <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-navy px-3 py-2 text-xs text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 leading-relaxed">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy" />
      </span>
    </span>
  );
}

// ── LoadingSpinner ─────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <svg className={clsx('animate-spin text-teal', sizes[size], className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}
