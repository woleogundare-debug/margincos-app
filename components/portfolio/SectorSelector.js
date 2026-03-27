/**
 * SectorSelector — visual card grid for vertical/sector selection.
 * Used in the "New Period" modal instead of a plain <select>.
 *
 * Props:
 *   value          {string}  — currently selected vertical ('FMCG' | 'Manufacturing' | 'Retail' | '')
 *   onChange       {fn}      — called with the new vertical string when a live card is clicked
 *   showComingSoon {bool}    — if true, renders coming-soon sector tiles with waitlist mailto links
 *                             (default: false — PeriodSelector only needs the 3 live sectors)
 */

import clsx from 'clsx';

/* ── Live sectors (selectable) ── */
const LIVE_SECTORS = [
  {
    key: 'FMCG',
    label: 'FMCG',
    icon: '🛒',
    desc: 'Product-level pricing intelligence across your portfolio — pricing gaps, cost pass-through, channel economics, and promotional ROI.',
  },
  {
    key: 'Manufacturing',
    label: 'Manufacturing',
    icon: '🏭',
    desc: 'Margin visibility across complex multi-input cost structures, FX exposure, and multi-channel distribution networks.',
  },
  {
    key: 'Retail',
    label: 'Retail',
    icon: '🏪',
    desc: 'Category margin analysis, supplier cost pass-through tracking, and store-level or channel margin decomposition.',
  },
];

/* ── Coming-soon sectors (non-selectable — show waitlist CTA) ── */
const SOON_SECTORS = [
  { key: 'Logistics',          label: 'Logistics',          icon: '🚚' },
  { key: 'IT Services',        label: 'IT Services',         icon: '💻' },
  { key: 'Telecoms',           label: 'Telecoms',            icon: '📡' },
  { key: 'Aviation',           label: 'Aviation',            icon: '✈️' },
  { key: 'Healthcare',         label: 'Healthcare',          icon: '🏥' },
  { key: 'Financial Services', label: 'Financial Services',  icon: '🏦' },
];

function waitlistHref(sector) {
  const subject = encodeURIComponent(`MarginCOS Waitlist — ${sector}`);
  const body = encodeURIComponent(
    `Hi,\n\nI'd like to join the waitlist for MarginCOS ${sector} support.\n\nCompany:\nRole:\n`
  );
  return `mailto:info@carthenaadvisory.com?subject=${subject}&body=${body}`;
}

export function SectorSelector({ value, onChange, showComingSoon = false }) {
  return (
    <div>
      {/* Live sectors */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        {LIVE_SECTORS.map((s) => {
          const selected = value === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 focus:outline-none',
                selected
                  ? 'border-teal bg-teal/5 ring-2 ring-teal/20'
                  : 'border-slate-200 hover:border-teal/40 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl leading-none flex-shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'text-sm font-bold',
                      selected ? 'text-teal' : 'text-navy'
                    )}>
                      {s.label}
                    </span>
                    {selected && (
                      <span className="inline-flex w-4 h-4 rounded-full bg-teal items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Coming-soon — only rendered when showComingSoon={true} (e.g. onboarding gate) */}
      {showComingSoon && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 border-t border-slate-100" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Coming Soon</span>
            <div className="flex-1 border-t border-slate-100" />
          </div>

          {/* Coming-soon sector tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SOON_SECTORS.map((s) => (
              <a
                key={s.key}
                href={waitlistHref(s.label)}
                className={clsx(
                  'group flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl',
                  'border border-dashed border-slate-200 text-center',
                  'hover:border-teal/30 hover:bg-slate-50 transition-all duration-150'
                )}
              >
                <span className="text-lg leading-none opacity-50 group-hover:opacity-70 transition-opacity">
                  {s.icon}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors leading-tight">
                  {s.label}
                </span>
                <span className="text-[9px] font-bold text-teal uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  Join Waitlist
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
