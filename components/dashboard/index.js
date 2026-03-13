import clsx from 'clsx';
import { RagBadge } from '../ui/index';

// ── KPI Tile ───────────────────────────────────────────────────────────────
export function KpiTile({ label, value, pill, pillColor, icon, accent = 'teal' }) {
  const accents = {
    teal:   'border-teal/20 bg-teal-50/50',
    red:    'border-red/20 bg-red-50/50',
    amber:  'border-amber/20 bg-amber-50/50',
    purple: 'border-purple/20 bg-purple-50/50',
  };
  return (
    <div className={clsx('rounded-2xl border bg-white p-5 shadow-sm', accents[accent] || accents.teal)}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-navy leading-none mb-2">{value ?? '—'}</p>
      {pill && (
        <p className={clsx('text-xs font-semibold', pillColor || 'text-slate-400')}>{pill}</p>
      )}
    </div>
  );
}

// ── Pillar Card ────────────────────────────────────────────────────────────
export function PillarCard({ title, subtitle, accentColor, ragStatus, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
        style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}>
        <div>
          <h3 className="text-sm font-bold text-navy">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {ragStatus && <RagBadge status={ragStatus} />}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Analysis Table ─────────────────────────────────────────────────────────
export function AnalysisTable({ headers, rows, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-slate-400">
        {emptyMessage || 'No data available.'}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {headers.map((h, i) => (
              <th key={i} className={clsx(
                'pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider',
                i === 0 ? 'text-left' : 'text-right'
              )}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={clsx('border-b border-slate-50', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
              {row.map((cell, j) => (
                <td key={j} className={clsx(
                  'py-3 px-1',
                  j === 0 ? 'text-left font-medium text-navy' : 'text-right text-slate-600',
                  typeof cell === 'object' && cell?.className
                )}>
                  {typeof cell === 'object' && cell?.content ? cell.content : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Action Item ────────────────────────────────────────────────────────────
export function ActionItem({ action, index }) {
  const isPositive = action.value >= 0;
  return (
    <div className="flex items-start gap-4 p-4 border-b border-slate-50 last:border-0">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
        style={{ background: action.color + '20', color: action.color }}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy leading-snug">{action.title}</p>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{action.detail}</p>
        <p className="text-xs font-semibold mt-1.5 uppercase tracking-wide"
          style={{ color: action.color }}>
          {action.pillar} · {action.timeline}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={clsx('text-sm font-black', isPositive ? 'text-emerald-600' : 'text-red-500')}>
          {isPositive ? '+' : ''}{Math.abs(action.value) > 0 ? formatValue(Math.abs(action.value)) : '—'}
        </p>
        {action.value !== 0 && <p className="text-xs text-slate-400">/month</p>}
      </div>
    </div>
  );
}

function formatValue(v) {
  if (v >= 1e9) return '₦' + (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return '₦' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '₦' + (v / 1e3).toFixed(0) + 'K';
  return '₦' + v.toFixed(0);
}

// ── Narrative Box ──────────────────────────────────────────────────────────
export function NarrativeBox({ children, className }) {
  return (
    <div className={clsx(
      'mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600 leading-relaxed',
      className
    )}>
      {children}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h3 className="text-base font-bold text-navy mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">{description}</p>
      {action}
    </div>
  );
}
