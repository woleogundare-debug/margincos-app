import { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useActions } from '../../hooks/useActions';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../hooks/useAuth';
import { useAnalysisContext } from '../../contexts/AnalysisContext';
import ExportButton from '../../components/ExportButton';
import { exportActions } from '../../lib/exportToExcel';
import { getFormatterSym } from '../../lib/formatters';
import { TIER_ACCESS } from '../../lib/constants';

const PILLAR_COLORS = {
  P1: '#D4A843', P2: '#C0392B', P3: '#0D8F8F', P4: '#8A6BBE',
  M1: '#1B2A4A', M2: '#C0392B', M3: '#0D8F8F', M4: '#D4A843',
};

const STATUS_CONFIG = {
  open:        { label: 'Open',        bg: '#FEF2F2', color: '#C0392B' },
  in_progress: { label: 'In Progress', bg: '#FFF9E6', color: '#D4A843' },
  resolved:    { label: 'Resolved',    bg: '#E8F5F5', color: '#0D8F8F' },
  dismissed:   { label: 'Dismissed',   bg: '#F4F6F8', color: '#8899AA' },
};

const fmtN = (v) => {
  const s = getFormatterSym();
  if (!v) return '—';
  if (Math.abs(v) >= 1e9) return `${s}${(v/1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `${s}${(v/1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${s}${(v/1e3).toFixed(0)}K`;
  return `${s}${v.toFixed(0)}`;
};

export default function ActionsPage() {
  const { tier } = useAuth();
  const { team, loading: teamLoading } = useTeam();
  // activePeriod + consolidation state from shared context
  const { activePeriod, isConsolidated, activeResults, activeDivision } = useAnalysisContext();
  const {
    actions, loading: actionsLoading, stats,
    updateAction, resolveAction, dismissAction, resetFetchKey,
  } = useActions(team?.id, isConsolidated ? undefined : activePeriod?.id, isConsolidated ? undefined : activeDivision?.id);

  // Combined loading: keep spinner up while team is still resolving.
  // Without this, useActions(null) fires early-return → loading=false before team loads,
  // causing a brief empty-state flash before the real fetch clicks off.
  const loading = teamLoading || actionsLoading;

  // Clear the dedup fetch key on unmount so navigating back always triggers a fresh load.
  // Without this, lastFetchKey still holds the old key and loadActions() returns immediately.
  useEffect(() => () => resetFetchKey(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // When consolidated, override with in-memory engine actions tagged with _division.
  // Normalise to the DB action shape so the existing render path works unchanged.
  const consolidatedActions = useMemo(() => {
    if (!isConsolidated) return [];
    const URGENCY_MAP = {
      'Immediate': 'IMMEDIATE', 'This week': 'THIS WEEK',
      'Within 14 days': 'WITHIN 14 DAYS', 'Within 30 days': 'WITHIN 30 DAYS',
    };
    return (activeResults?.actions || []).map((a, i) => ({
      ...a,
      id: `consolidated-${i}`,
      status: 'open',
      urgency: URGENCY_MAP[a.timeline] || a.timeline || '',
    }));
  }, [isConsolidated, activeResults]);

  // Source of truth for display: consolidated (in-memory) or DB-backed,
  // then filtered by tier entitlement so non-Enterprise users never see M1-M4.
  const allowedPillars = TIER_ACCESS[tier]?.allowedPillars || ['P1'];
  const displayActions = (isConsolidated ? consolidatedActions : actions)
    .filter(a => allowedPillars.includes(a.pillar));

  const [filter, setFilter] = useState('open');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'all' && pillarFilter === 'all' && filterUrgency === 'all') return displayActions;
    return displayActions.filter(a => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (pillarFilter !== 'all' && a.pillar !== pillarFilter) return false;
      if (filterUrgency !== 'all' && a.urgency !== filterUrgency) return false;
      return true;
    });
  }, [displayActions, filter, pillarFilter, filterUrgency]);

  const handleResolve = async () => {
    if (!resolveModal) return;
    await resolveAction(resolveModal.id, resolveNote);
    setResolveModal(null);
    setResolveNote('');
  };

  // Pillar tabs filtered by tier — non-Enterprise users never see M1-M4 tabs.
  const PILLAR_ORDER = ['all', 'P1', 'P2', 'P3', 'P4', 'M1', 'M2', 'M3', 'M4'];
  const visiblePillars = PILLAR_ORDER.filter(p => p === 'all' || allowedPillars.includes(p));

  // Compute summary stats for editorial cards
  const totalRecoverable = useMemo(() => {
    const positiveActions = displayActions.filter(a => a.value > 0);
    // Sum-distinct-by-pool: actions sharing a recoverable_pool_id contribute
    // their value once (the max within the pool, which is the pool's recoverable).
    // Actions with null pool_id contribute their full value.
    const seenPools = new Map(); // pool_id -> max value
    let standaloneTotal = 0;
    for (const a of positiveActions) {
      const v = a.value || 0;
      if (a.recoverable_pool_id) {
        const prev = seenPools.get(a.recoverable_pool_id) || 0;
        if (v > prev) seenPools.set(a.recoverable_pool_id, v);
      } else {
        standaloneTotal += v;
      }
    }
    const pooledTotal = Array.from(seenPools.values()).reduce((s, v) => s + v, 0);
    return standaloneTotal + pooledTotal;
  }, [displayActions]);
  const immediateCount = displayActions.filter(a => a.urgency === 'IMMEDIATE').length;
  const uniquePillars = [...new Set(displayActions.map(a => a.pillar).filter(Boolean))];

  return (
    <>
      <Head><title>Actions | MarginCOS</title></Head>
        <div className="max-w-5xl mx-auto">

          {/* ── Doc head ── */}
          <div className="doc-head">
            <div>
              <div className="doc-meta">Action queue</div>
              <h1 className="doc-title">Actions</h1>
              <div className="doc-period">
                {displayActions.length} prioritised actions across {uniquePillars.length} pillars
                {activePeriod?.label ? ` · ${activePeriod.label}` : ''}
              </div>
            </div>
            <div className="doc-actions">
              <ExportButton
                show={tier === 'professional' || tier === 'enterprise'}
                onExport={() => exportActions(filtered)}
                label="Export Actions"
              />
              <button className="btn-ed" style={{ background: 'var(--teal, #0D8F8F)', color: '#fff', borderColor: 'var(--teal, #0D8F8F)' }}>Assign owners</button>
            </div>
          </div>

          {/* Consolidated read-only banner */}
          {isConsolidated && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-teal-200 bg-teal-50 mb-6 text-sm">
              <span className="text-teal-600 font-semibold">Consolidated View</span>
              <span className="text-teal-500">·</span>
              <span className="text-teal-700">
                Viewing consolidated actions across all divisions. Switch to a division view to manage individual actions.
              </span>
            </div>
          )}

          {/* ── Summary cards ── */}
          {!isConsolidated && (
            <div className="summary-row">
              <div className="summary-card">
                <div className="lbl">Total recoverable</div>
                <div className="v gold">{fmtN(totalRecoverable)}</div>
                <div className="sub">Per month if all positive actions executed</div>
              </div>
              <div className="summary-card">
                <div className="lbl">Immediate (this fortnight)</div>
                <div className="v" style={{ color: 'var(--red-brand, #C0392B)' }}>{immediateCount}</div>
                <div className="sub">High urgency · margin protection</div>
              </div>
              <div className="summary-card">
                <div className="lbl">Pillar coverage</div>
                <div className="v">{uniquePillars.length} / {allowedPillars.length}</div>
                <div className="sub">Pillars represented in queue</div>
              </div>
            </div>
          )}

          {/* ── Exhibit 1 — Action queue ── */}
          <div className="exhibit-head">
            <div>
              <div className="exhibit-num">Exhibit 1</div>
              <div className="exhibit-title">Action queue</div>
              <div className="exhibit-sub">Sorted by recoverable margin impact · NGN/month</div>
            </div>
            <div className="exhibit-meta">
              <span className="count">{filtered.length} of {displayActions.length} shown</span>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {/* Status filter */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2, #F0F2F5)', borderRadius: 8, padding: 4 }}>
              {['all', 'open', 'in_progress', 'resolved', 'dismissed'].map(s => (
                <button key={s}
                  onClick={() => { setFilter(s); setPillarFilter('all'); }}
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif", border: 'none', cursor: 'pointer',
                    letterSpacing: '0.04em',
                    backgroundColor: filter === s ? 'var(--navy, #1B2A4A)' : 'transparent',
                    color: filter === s ? '#fff' : 'var(--text-light, #8899AA)',
                  }}>
                  {s === 'all' ? 'All Status' : STATUS_CONFIG[s]?.label}
                </button>
              ))}
            </div>

            {/* Pillar filter — tabs gated by tier */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2, #F0F2F5)', borderRadius: 8, padding: 4 }}>
              {visiblePillars.map(p => (
                <button key={p}
                  onClick={() => setPillarFilter(p)}
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace", border: 'none', cursor: 'pointer',
                    letterSpacing: '0.06em',
                    backgroundColor: pillarFilter === p ? (PILLAR_COLORS[p] || 'var(--navy, #1B2A4A)') : 'transparent',
                    color: pillarFilter === p ? '#fff' : 'var(--text-light, #8899AA)',
                  }}>
                  {p === 'all' ? 'All' : p}
                </button>
              ))}
            </div>

            {/* Urgency filter */}
            <select
              value={filterUrgency}
              onChange={e => setFilterUrgency(e.target.value)}
              style={{
                fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                color: filterUrgency === 'all' ? 'var(--text-light, #8899AA)' : 'var(--navy, #1B2A4A)',
                fontWeight: 600, padding: '6px 12px',
                border: '1px solid var(--rule-strong, #D1D9E0)', borderRadius: 8,
                background: '#fff', cursor: 'pointer', outline: 'none',
              }}>
              <option value="all">All urgency levels</option>
              <option value="IMMEDIATE">Immediate</option>
              <option value="THIS WEEK">This week</option>
              <option value="WITHIN 14 DAYS">Within 14 days</option>
              <option value="WITHIN 30 DAYS">Within 30 days</option>
            </select>
          </div>

          {/* Action list */}
          {loading ? (
            <div className="panel" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-light, #8899AA)', fontSize: 13 }}>
              Loading actions...
            </div>
          ) : filtered.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <p style={{ color: 'var(--text-light, #8899AA)', fontSize: 13, marginBottom: 4 }}>No actions found.</p>
              <p style={{ color: 'var(--rule-strong, #C4CAD4)', fontSize: 12 }}>
                Actions are created automatically when you run an analysis.
              </p>
            </div>
          ) : (() => {
            const sortedFiltered = [...filtered].sort((a, b) => Math.abs(b.value || 0) - Math.abs(a.value || 0));
            return (
            <div className="panel panel-tabular action-table">
              <div className="table-head">
                <div></div>
                <div>#</div>
                <div>Recommendation</div>
                <div style={{ textAlign: 'right' }}>Recoverable</div>
                <div></div>
              </div>
              {sortedFiltered.map((action, idx) => {
                const urgClass = action.urgency === 'IMMEDIATE' ? 'u-immediate'
                  : action.urgency === 'THIS WEEK' ? 'u-week' : 'u-30';
                const urgTagClass = action.urgency === 'IMMEDIATE' ? 'urg-imm'
                  : action.urgency === 'THIS WEEK' ? 'urg-wk' : 'urg-30';
                return (
                  <div key={action.id} className="action">
                    <div className={`urgency-bar ${urgClass}`}></div>
                    <div className="a-rank">{String(idx + 1).padStart(2, '0')}</div>
                    <div className="a-body">
                      <h4 className="a-title">{action.title}</h4>
                      {action.detail && <p className="a-detail">{action.detail}</p>}
                      <div className="a-tags">
                        <span className="a-tag"><span className="pill">{action.pillar}</span></span>
                        <span className={`a-tag ${urgTagClass}`}>● {action.urgency}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                          backgroundColor: STATUS_CONFIG[action.status]?.bg,
                          color: STATUS_CONFIG[action.status]?.color,
                          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
                        }}>
                          {STATUS_CONFIG[action.status]?.label}
                        </span>
                        {action._division && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 3, backgroundColor: '#EEF2FF', color: '#6366F1' }}>
                            {action._division}
                          </span>
                        )}
                      </div>
                      {/* Meta: owner, due, resolution */}
                      {(action.owner_name || action.due_date || action.resolution_note) && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-light, #8899AA)' }}>
                          {action.owner_name && <span>Owner: {action.owner_name}</span>}
                          {action.due_date && <span>Due: {new Date(action.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                          {action.resolution_note && <span style={{ color: 'var(--teal, #0D8F8F)', fontStyle: 'italic' }}>&ldquo;{action.resolution_note}&rdquo;</span>}
                        </div>
                      )}
                      {/* Action buttons — hidden in consolidated (read-only) mode */}
                      {!isConsolidated && action.status !== 'resolved' && action.status !== 'dismissed' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px dotted var(--rule, #E2E6EC)' }}>
                          {action.status === 'open' && (
                            <button onClick={() => updateAction(action.id, { status: 'in_progress' })}
                              className="btn-ed" style={{ fontSize: 11, padding: '4px 12px', borderColor: 'var(--gold, #D4A843)', color: 'var(--gold, #D4A843)' }}>
                              Mark In Progress
                            </button>
                          )}
                          <button onClick={() => { setResolveModal(action); setResolveNote(''); }}
                            className="btn-ed" style={{ fontSize: 11, padding: '4px 12px', background: 'var(--teal-50, #E6F5F5)', borderColor: 'rgba(13,143,143,0.25)', color: 'var(--teal, #0D8F8F)', fontWeight: 700 }}>
                            Mark Resolved
                          </button>
                          <button onClick={() => dismissAction(action.id)}
                            className="btn-ed" style={{ fontSize: 11, padding: '4px 12px', marginLeft: 'auto', color: 'var(--text-light, #8896A7)' }}>
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="a-recov">
                      {action.value > 0 ? (
                        <>
                          <div className="v">+{fmtN(action.value)}</div>
                          <div className="per">/month</div>
                        </>
                      ) : action.value < 0 ? (
                        <>
                          <div className="v v-neg">{fmtN(action.value)}</div>
                          <div className="per">/month</div>
                        </>
                      ) : (
                        <div className="v" style={{ color: 'var(--text-light)' }}>—</div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="source-line">
                <span><strong>Methodology:</strong> Net margin impact, holding volume constant</span>
                <span><strong>Source:</strong> P1 elasticity · P2 cost-floor · P3 trade-spend · P4 promo P&amp;L</span>
              </div>
            </div>
            );
          })()}

          {/* Commentary */}
          <div className="commentary">
            <div className="commentary-label">Queue status</div>
            <div className="commentary-text">
              {displayActions.length === 0
                ? 'No actions have been generated yet. Run an analysis to populate the action queue with prioritised margin recovery opportunities.'
                : <>
                    <strong>{displayActions.filter(a => a.status === 'open').length} open</strong> actions remain in queue.
                    {immediateCount > 0 && <> <strong style={{ color: 'var(--red-brand, #C0392B)' }}>{immediateCount} flagged immediate</strong> - address within this fortnight to protect margin.</>}
                    {stats.resolved > 0 && <> {stats.resolved} resolved to date with {fmtN(stats.resolvedValue)} recovered.</>}
                  </>
              }
            </div>
          </div>

          <div className="doc-footer">
            <span>MarginCOS · Action queue</span>
            <span>Rev 04·26·a</span>
          </div>

          {/* Resolve modal */}
          {resolveModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--navy, #1B2A4A)', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Mark as Resolved
                </h3>
                <p style={{ fontSize: 13, marginBottom: 16, color: 'var(--text-light, #8899AA)' }}>
                  {resolveModal.title}
                </p>
                <textarea
                  value={resolveNote}
                  onChange={e => setResolveNote(e.target.value)}
                  placeholder="Add a resolution note (optional) - e.g. 'Repriced Milo 400g +8%, effective April 2026'"
                  style={{ width: '100%', border: '1px solid var(--rule, #E2E6EC)', borderRadius: 12, padding: '12px 14px', fontSize: 13, resize: 'none', marginBottom: 16, outline: 'none', color: 'var(--navy, #1B2A4A)', fontFamily: "'DM Sans', sans-serif" }}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setResolveModal(null)}
                    className="btn-ed" style={{ padding: '8px 16px', fontSize: 13 }}>
                    Cancel
                  </button>
                  <button onClick={handleResolve}
                    className="btn-ed" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, backgroundColor: 'var(--teal, #0D8F8F)', color: '#fff', borderColor: 'var(--teal, #0D8F8F)' }}>
                    Confirm Resolved
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    </>
  );
}

ActionsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
