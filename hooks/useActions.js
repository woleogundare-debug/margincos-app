import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

const PILLAR_MAP = {
  'Pricing Intelligence': 'P1',
  'Cost Pass-Through':    'P2',
  'Channel Economics':    'P3',
  'Trade Execution':      'P4',
};

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

  const loadActions = useCallback(async () => {
    if (!teamId) { setLoading(false); return; }
    setLoading(true);
    try {
      const sb = getSupabaseClient();
      let query = sb
        .from('action_items')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (periodId) query = query.eq('period_id', periodId);

      const { data, error } = await query;
      if (error) throw error;
      setActions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId, periodId]);

  useEffect(() => { loadActions(); }, [loadActions]);

  const addAction = async (actionData) => {
    const sb = getSupabaseClient();
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

  const bulkAddFromAnalysis = async (engineActions, currentPeriodId) => {
    if (!engineActions?.length || !teamId) return;
    const sb = getSupabaseClient();
    const rows = engineActions.map(a => ({
      team_id: teamId,
      period_id: currentPeriodId || periodId,
      title: a.title,
      detail: a.detail,
      pillar: PILLAR_MAP[a.pillar] || a.pillar,
      urgency: URGENCY_MAP[a.timeline] || a.timeline || a.urgency,
      value: a.value || null,
      status: 'open',
    }));
    const { data, error } = await sb
      .from('action_items')
      .insert(rows)
      .select();
    if (error) throw error;
    setActions(prev => [...(data || []), ...prev]);
    return data;
  };

  // Summary stats
  const stats = {
    total: actions.length,
    open: actions.filter(a => a.status === 'open').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    resolved: actions.filter(a => a.status === 'resolved').length,
    totalValue: actions.reduce((sum, a) => sum + (a.value || 0), 0),
    resolvedValue: actions
      .filter(a => a.status === 'resolved')
      .reduce((sum, a) => sum + (a.value || 0), 0),
  };

  return {
    actions, loading, error, stats,
    loadActions, addAction, updateAction,
    resolveAction, dismissAction, bulkAddFromAnalysis,
  };
}
