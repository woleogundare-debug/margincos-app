import { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { requireAuth } from '../../lib/supabase/server';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useActions } from '../../hooks/useActions';
import { useTeam } from '../../hooks/useTeam';
import { useAnalysisContext } from '../../contexts/AnalysisContext';

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
  if (!v) return '—';
  if (Math.abs(v) >= 1e9) return `NGN ${(v/1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `NGN ${(v/1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `NGN ${(v/1e3).toFixed(0)}K`;
  return `NGN ${v.toFixed(0)}`;
};

export default function ActionsPage() {
  const { team, loading: teamLoading } = useTeam();
  // activePeriod from shared context — no separate usePortfolio instance needed
  const { activePeriod } = useAnalysisContext();
  const {
    actions, loading: actionsLoading, stats,
    updateAction, resolveAction, dismissAction, resetFetchKey,
  } = useActions(team?.id); // no periodId — show all actions across all periods

  // Combined loading: keep spinner up while team is still resolving.
  // Without this, useActions(null) fires early-return → loading=false before team loads,
  // causing a brief empty-state flash before the real fetch kicks off.
  const loading = teamLoading || actionsLoading;

  // Clear the dedup fetch key on unmount so navigating back always triggers a fresh load.
  // Without this, lastFetchKey still holds the old key and loadActions() returns immediately.
  useEffect(() => () => resetFetchKey(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [filter, setFilter] = useState('open');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNote, setResolveNote] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'all' && pillarFilter === 'all' && filterUrgency === 'all') return actions;
    return actions.filter(a => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (pillarFilter !== 'all' && a.pillar !== pillarFilter) return false;
      if (filterUrgency !== 'all' && a.urgency !== filterUrgency) return false;
      return true;
    });
  }, [actions, filter, pillarFilter, filterUrgency]);

  const handleResolve = async () => {
    if (!resolveModal) return;
    await resolveAction(resolveModal.id, resolveNote);
    setResolveModal(null);
    setResolveNote('');
  };

  // Static list — always render all tabs immediately, regardless of load state.
  // A tab with no matching actions simply shows the empty state; that's fine.
  const PILLAR_ORDER = ['all', 'P1', 'P2', 'P3', 'P4', 'M1', 'M2', 'M3', 'M4'];

  return (
    <>
      <Head><title>Actions | MarginCOS</title></Head>
      <DashboardLayout title="Actions" activePeriod={activePeriod}>
        <div className="max-w-5xl mx-auto">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1B2A4A' }}>
              Action Tracker
            </h1>
            <p className="text-sm" style={{ color: '#8899AA' }}>
              Priority actions from your margin analysis — tracked from identification to resolution.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Open Actions',    value: stats.open,          color: '#C0392B' },
              { label: 'In Progress',     value: stats.inProgress,    color: '#D4A843' },
              { label: 'Resolved',        value: stats.resolved,      color: '#0D8F8F' },
              { label: 'Value Recovered', value: fmtN(stats.resolvedValue), color: '#0D8F8F' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl px-4 py-3 transition-all duration-150"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F7FA 100%)',
                  border: '1px solid #E8ECF0',
                  boxShadow: '0 1px 4px rgba(27, 42, 74, 0.04)',
                }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1"
                  style={{ color: '#8896A7' }}>{s.label}</p>
                <p className="text-xl font-bold"
                  style={{ color: s.color, fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {/* Status filter */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {['all', 'open', 'in_progress', 'resolved', 'dismissed'].map(s => (
                <button key={s}
                  onClick={() => {
                    setFilter(s);
                    // Switching status = intent to see ALL items of that status.
                    // Reset pillar filter so users don't get trapped seeing 1 item
                    // because a pillar sub-filter was still active from a previous click.
                    setPillarFilter('all');
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: filter === s ? '#1B2A4A' : 'transparent',
                    color: filter === s ? '#FFFFFF' : '#8899AA',
                  }}>
                  {s === 'all' ? 'All Status' : STATUS_CONFIG[s]?.label}
                </button>
              ))}
            </div>

            {/* Pillar filter */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {PILLAR_ORDER.map(p => (
                <button key={p}
                  onClick={() => setPillarFilter(p)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: pillarFilter === p ? (PILLAR_COLORS[p] || '#1B2A4A') : 'transparent',
                    color: pillarFilter === p ? '#FFFFFF' : '#8899AA',
                  }}>
                  {p === 'all' ? 'All Pillars' : p}
                </button>
              ))}
            </div>

            {/* Urgency filter */}
            <select
              value={filterUrgency}
              onChange={e => setFilterUrgency(e.target.value)}
              style={{
                fontSize: '13px', fontFamily: "'DM Sans', system-ui, sans-serif",
                color: filterUrgency === 'all' ? '#8899AA' : '#1B2A4A',
                fontWeight: 600, padding: '6px 12px',
                border: '1px solid #D1D9E0', borderRadius: '8px',
                background: '#FFFFFF', cursor: 'pointer',
                outline: 'none',
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
            <div className="text-center py-16 text-gray-400 text-sm">Loading actions...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-400 text-sm mb-1">No actions found.</p>
              <p className="text-gray-300 text-xs">
                Actions are created automatically when you run an analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(action => (
                <div key={action.id}
                  className="bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
                  style={{ border: '1px solid #E8ECF0', boxShadow: '0 2px 8px rgba(27, 42, 74, 0.04)' }}>

                  {/* Left accent bar */}
                  <div className="flex">
                    <div className="w-[3px] flex-shrink-0"
                      style={{ backgroundColor: PILLAR_COLORS[action.pillar] || '#1B2A4A' }} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Pillar + urgency badges */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide"
                              style={{
                                backgroundColor: `${PILLAR_COLORS[action.pillar] || '#1B2A4A'}12`,
                                color: PILLAR_COLORS[action.pillar] || '#1B2A4A',
                                border: `1px solid ${PILLAR_COLORS[action.pillar] || '#1B2A4A'}25`,
                              }}>
                              {action.pillar}
                            </span>
                            {action.urgency && (
                              <span className="text-xs font-semibold uppercase tracking-wide"
                                style={{ color: '#C0392B' }}>
                                {action.urgency}
                              </span>
                            )}
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                backgroundColor: STATUS_CONFIG[action.status]?.bg,
                                color: STATUS_CONFIG[action.status]?.color,
                              }}>
                              {STATUS_CONFIG[action.status]?.label}
                            </span>
                          </div>

                          {/* Title */}
                          <p className="text-sm font-semibold mb-1"
                            style={{ color: '#1B2A4A' }}>
                            {action.title}
                          </p>
                          {action.detail && (
                            <p className="text-xs leading-relaxed mb-2"
                              style={{ color: '#8899AA' }}>
                              {action.detail}
                            </p>
                          )}

                          {/* Meta row */}
                          <div className="flex items-center gap-4 flex-wrap">
                            {action.value > 0 && (
                              <span className="text-xs font-bold"
                                style={{ color: '#0D8F8F' }}>
                                {fmtN(action.value)} /month
                              </span>
                            )}
                            {action.owner_name && (
                              <span className="text-xs" style={{ color: '#8899AA' }}>
                                Owner: {action.owner_name}
                              </span>
                            )}
                            {action.due_date && (
                              <span className="text-xs" style={{ color: '#8899AA' }}>
                                Due: {new Date(action.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            {action.resolution_note && (
                              <span className="text-xs italic"
                                style={{ color: '#0D8F8F' }}>
                                &ldquo;{action.resolution_note}&rdquo;
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {action.status !== 'resolved' && action.status !== 'dismissed' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                          {action.status === 'open' && (
                            <button
                              onClick={() => updateAction(action.id, { status: 'in_progress' })}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                              style={{ borderColor: '#D4A843', color: '#D4A843' }}>
                              Mark In Progress
                            </button>
                          )}
                          <button
                            onClick={() => { setResolveModal(action); setResolveNote(''); }}
                            className="rounded-lg transition-colors"
                            style={{
                              backgroundColor: '#E6F5F5', color: '#0D8F8F',
                              border: '1px solid rgba(13, 143, 143, 0.25)',
                              fontWeight: 600, fontSize: '12px',
                              padding: '6px 14px',
                            }}>
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => dismissAction(action.id)}
                            className="rounded-lg transition-colors ml-auto"
                            style={{
                              backgroundColor: 'transparent', color: '#8896A7',
                              border: '1px solid #E8ECF0',
                              fontWeight: 500, fontSize: '12px',
                              padding: '6px 14px',
                            }}>
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolve modal */}
          {resolveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="bg-white rounded-2xl p-6 max-w-md w-full"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <h3 className="text-base font-bold mb-1"
                  style={{ color: '#1B2A4A', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Mark as Resolved
                </h3>
                <p className="text-sm mb-4" style={{ color: '#8899AA' }}>
                  {resolveModal.title}
                </p>
                <textarea
                  value={resolveNote}
                  onChange={e => setResolveNote(e.target.value)}
                  placeholder="Add a resolution note (optional) — e.g. 'Repriced Milo 400g +8%, effective April 2026'"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none mb-4 outline-none"
                  style={{ color: '#1B2A4A' }}
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setResolveModal(null)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200"
                    style={{ color: '#8899AA' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
                    style={{ backgroundColor: '#0D8F8F' }}>
                    Confirm Resolved
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  const auth = await requireAuth(req, res);
  if (auth.redirect) return { redirect: { destination: '/login', permanent: false } };
  return { props: {} };
}
