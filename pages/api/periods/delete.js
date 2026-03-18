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
  const { data: period, error: fetchError } = await supabase
    .from('periods')
    .select('id, user_id')
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
