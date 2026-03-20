import clsx from 'clsx';
import { RagBadge } from '../ui/index';

// ── KPI Tile ───────────────────────────────────────────────────────────────
export function KpiTile({ label, value, pill, pillColor, icon, accent = 'teal' }) {
  const ACCENT_COLORS = {
    teal:   '#0D8F8F',
    red:    '#C0392B',
    amber:  '#D4A843',
    green:  '#27AE60',
    navy:   '#1B2A4A',
    purple: '#8A6BBE',  // P4 Trade Execution pillar colour
  };
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:shadow-md"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F7FA 100%)',
        border: '1px solid #E8ECF0',
        borderLeft: `4px solid ${ACCENT_COLORS[accent] || ACCENT_COLORS.teal}`,
        boxShadow: '0 2px 8px rgba(27, 42, 74, 0.06)',
      }}>
      <p className="text-[11px] font-bold text-[#8896A7] uppercase tracking-[0.1em] mb-1">{label}</p>
      <p className="text-2xl font-black leading-none mb-2"
        style={{ color: '#1B2A4A', fontFamily: "'Playfair Display', Georgia, serif" }}>
        {value ?? '—'}
      </p>
      {pill && (
        <p className={clsx('text-xs font-semibold', pillColor || 'text-[#5A6B80]')}>{pill}</p>
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
          <h3 className="text-sm font-bold text-navy"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h3>
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
    <div className="overflow-x-auto scrollbar-hide">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b-2 border-[#E8ECF0]">
            {headers.map((h, i) => (
              <th key={i} className={clsx(
                'pb-3 text-[11px] font-bold text-[#8896A7] uppercase tracking-[0.08em] whitespace-nowrap',
                i === 0 ? 'text-left sticky left-0 bg-white z-10 pr-3' : 'text-right px-2'
              )}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              className={clsx(
                'border-b border-[#F5F7FA] transition-colors duration-100 hover:bg-[#E6F5F5]/30',
                i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FA]'
              )}>
              {row.map((cell, j) => (
                <td key={j} className={clsx(
                  'py-3 whitespace-nowrap',
                  j === 0 ? 'text-left font-semibold text-[#1B2A4A] sticky left-0 z-10 pr-3' : 'text-right text-[#5A6B80] px-2 tabular-nums',
                  typeof cell === 'object' && cell?.className
                )}
                style={j === 0 ? { backgroundColor: 'inherit' } : undefined}>
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
    <div className="flex items-start gap-4 p-4 border-b border-[#E8ECF0] last:border-0 transition-all duration-150 hover:bg-[#F5F7FA] rounded-lg">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
        style={{ background: action.color + '15', color: action.color, border: `1.5px solid ${action.color}30` }}>
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
        <p className="text-base font-black whitespace-nowrap"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: isPositive ? '#27AE60' : '#C0392B' }}>
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
