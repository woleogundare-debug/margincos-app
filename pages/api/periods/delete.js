import { requireAuth } from '../../../lib/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const auth = await requireAuth(req, res);
  if (auth.redirect) return res.status(401).json({ error: 'Unauthorized' });

  const { periodId } = req.body;
  if (!periodId) return res.status(400).json({ error: 'periodId required' });

  const { supabase, session } = auth;
  const userId = session.user.id;

  // Verify ownership: confirm this period belongs to the requesting user
  // Also fetch team_id so we can sweep orphaned null-period action_items below.
  const { data: period, error: fetchError } = await supabase
    .from('periods')
    .select('id, user_id, team_id')
    .eq('id', periodId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !period) {
    return res.status(404).json({ error: 'Period not found or access denied' });
  }

  // Delete child rows first (no guaranteed ON DELETE CASCADE in schema)
  const { error: skuError } = await supabase
    .from('sku_rows')
    .delete()
    .eq('period_id', periodId);

  if (skuError) {
    return res.status(500).json({ error: `Failed to delete SKU rows: ${skuError.message}` });
  }

  const { error: tradeError } = await supabase
    .from('trade_investment')
    .delete()
    .eq('period_id', periodId);

  if (tradeError) {
    return res.status(500).json({ error: `Failed to delete trade investment rows: ${tradeError.message}` });
  }

  // Delete action_items for this period (rows with a proper period_id).
  const { error: actionsError } = await supabase
    .from('action_items')
    .delete()
    .eq('period_id', periodId);

  if (actionsError) {
    return res.status(500).json({ error: `Failed to delete action items: ${actionsError.message}` });
  }

  // Sweep legacy orphans: rows saved before period tracking existed have period_id = NULL.
  // These are scoped to the team and are truly unattributed — safe to delete on any
  // period removal. Without this, orphaned null-period rows persist forever, appear in
  // consolidated-mode queries, and block the bulkAddFromAnalysis dedup guard.
  if (period.team_id) {
    const { error: orphanError } = await supabase
      .from('action_items')
      .delete()
      .eq('team_id', period.team_id)
      .is('period_id', null);

    if (orphanError) {
      // Non-fatal: log but don't block the response — the primary period is already deleted.
      console.error('[deletePeriod] Failed to sweep null-period orphan actions:', orphanError.message);
    }
  }

  // Delete the period itself
  const { error: periodError } = await supabase
    .from('periods')
    .delete()
    .eq('id', periodId)
    .eq('user_id', userId);

  if (periodError) {
    return res.status(500).json({ error: periodError.message });
  }

  return res.status(200).json({ success: true });
}
