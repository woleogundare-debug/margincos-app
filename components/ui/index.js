import { Fragment, useRef, useState, useCallback } from 'react';
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
// Uses position:fixed so the popup escapes ALL parent overflow containers
// (e.g. overflow-x-auto on the grid scroll wrapper).
export function Tooltip({ text, children }) {
  const triggerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [arrowLeft, setArrowLeft] = useState('50%');

  const handleMouseEnter = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const popupW = 320; // max-w-xs = 20rem = 320px
    // Center the popup above the trigger
    let left = rect.left + rect.width / 2 - popupW / 2;
    // Clamp to viewport edges with 8px padding
    if (left < 8) left = 8;
    if (left + popupW > vw - 8) left = vw - popupW - 8;
    const top = rect.top - 8; // 8px gap above trigger
    // Arrow points to the trigger center
    const triggerCenter = rect.left + rect.width / 2;
    const arrowOffset = Math.max(12, Math.min(popupW - 12, triggerCenter - left));
    setPos({ top, left });
    setArrowLeft(`${arrowOffset}px`);
    setVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => setVisible(false), []);

  return (
    <span
      className="inline-flex flex-shrink-0"
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children || <QuestionMarkCircleIcon className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help flex-shrink-0" />}
      {visible && (
        <span
          className="pointer-events-none rounded-lg bg-navy px-3 py-2 text-xs text-white shadow-xl leading-relaxed whitespace-normal break-words"
          style={{
            position: 'fixed',
            zIndex: 9999,
            maxWidth: 320,
            top: pos.top,
            left: pos.left,
            transform: 'translateY(-100%)',
          }}
        >
          {text}
          <span
            className="border-4 border-transparent border-t-navy"
            style={{ position: 'absolute', top: '100%', left: arrowLeft, transform: 'translateX(-50%)' }}
          />
        </span>
      )}
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
