import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

const URGENCY_MAP = {
  'Immediate':       'IMMEDIATE',
  'This week':       'THIS WEEK',
  'Within 14 days':  'WITHIN 14 DAYS',
  'Within 30 days':  'WITHIN 30 DAYS',
};

export function useActions(teamId, periodId) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent redundant fetches when hook re-renders with identical args
  const lastFetchKey = useRef(null);

  const loadActions = useCallback(async () => {
    if (!teamId) { setLoading(false); return; }

    // Skip if we already loaded this exact teamId:periodId combination
    const fetchKey = `${teamId}:${periodId ?? 'all'}`;
    if (lastFetchKey.current === fetchKey) return;
    lastFetchKey.current = fetchKey;

    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }
    setLoading(true);
    try {
      let query = sb
        .from('action_items')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (periodId) query = query.eq('period_id', periodId);

      const { data, error } = await query;
      if (error) throw error;

      // Stabilise array reference — only update state when data actually changed.
      // Prevents useMemo consumers from recomputing on identical payloads.
      setActions(prev => {
        if (!data || data.length === 0) return [];
        if (
          prev.length === data.length &&
          prev[0]?.id === data[0]?.id &&
          prev[prev.length - 1]?.id === data[data.length - 1]?.id
        ) return prev; // same data — reuse reference, skip re-render cascade
        return data;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId, periodId]);

  useEffect(() => { loadActions(); }, [loadActions]);

  const addAction = async (actionData) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from('action_items')
      .insert([{ ...actionData, team_id: teamId, period_id: periodId }])
      .select()
      .single();
    if (error) throw error;
    setActions(prev => [data, ...prev]);
    return data;
  };

  const updateAction = async (id, updates) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data, error } = await sb
      .from('action_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setActions(prev => prev.map(a => a.id === id ? data : a));
    return data;
  };

  const resolveAction = async (id, note = '') => {
    return updateAction(id, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_note: note,
    });
  };

  const dismissAction = async (id) => {
    return updateAction(id, { status: 'dismissed' });
  };

  const bulkAddFromAnalysis = useCallback(async (engineActions, currentPeriodId) => {
    if (!engineActions?.length || !teamId) return;
    const sb = getSupabaseClient();
    if (!sb) return;

    const effectivePeriodId = currentPeriodId || periodId || null;

    // Dedup guard — only check for rows that match the exact period being written.
    // No longer includes `period_id IS NULL` in the match: legacy orphaned rows
    // (saved before period tracking existed) must not block inserts for a real period.
    // Those orphans are swept by the period-delete API when a period is removed.
    let countQuery = sb
      .from('action_items')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);
    if (effectivePeriodId) {
      countQuery = countQuery.eq('period_id', effectivePeriodId);
    } else {
      countQuery = countQuery.is('period_id', null);
    }
    const { count } = await countQuery;

    if (count > 0) {
      // Actions already persisted for this exact team + period — refresh display only.
      lastFetchKey.current = null;
      await loadActions();
      return;
    }

    // No existing rows for this exact team + period — safe to insert.
    const rows = engineActions.map(a => ({
      team_id: teamId,
      period_id: effectivePeriodId,
      title: a.title,
      detail: a.detail,
      pillar: a.pillar,
      urgency: URGENCY_MAP[a.timeline] || a.timeline || a.urgency,
      value: a.value || null,
      status: 'open',
    }));
    const { data, error } = await sb
      .from('action_items')
      .insert(rows)
      .select();
    if (error) throw error;
    lastFetchKey.current = null;
    setActions(prev => [...(data || []), ...prev]);
    return data;
  }, [teamId, periodId, loadActions]);

  // Force a re-fetch regardless of the dedup guard.
  // Used by the Actions page visibilitychange listener to pick up actions
  // that were inserted by bulkAddFromAnalysis on the Overview page.
  const refresh = useCallback(() => {
    lastFetchKey.current = null;
    return loadActions();
  }, [loadActions]);

  // Memoized stats — only recomputes when actions array reference changes
  const stats = useMemo(() => ({
    total:         actions.length,
    open:          actions.filter(a => a.status === 'open').length,
    inProgress:    actions.filter(a => a.status === 'in_progress').length,
    resolved:      actions.filter(a => a.status === 'resolved').length,
    dismissed:     actions.filter(a => a.status === 'dismissed').length,
    totalValue:    actions.reduce((sum, a) => sum + (a.value || 0), 0),
    resolvedValue: actions
      .filter(a => a.status === 'resolved')
      .reduce((sum, a) => sum + (a.value || 0), 0),
  }), [actions]);

  return {
    actions, loading, error, stats,
    loadActions, refresh, addAction, updateAction,
    resolveAction, dismissAction, bulkAddFromAnalysis,
    resetFetchKey: () => { lastFetchKey.current = null; },
  };
}
