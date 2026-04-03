import { requireAuth, createSupabaseServiceClient } from '../../../lib/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  // Verify caller identity via cookie-based session
  const auth = await requireAuth(req, res);
  if (auth.redirect) return res.status(401).json({ error: 'Unauthorized' });

  // All admin operations use the service role client
  const serviceClient = createSupabaseServiceClient();

  // Verify superadmin status from DB
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('is_superadmin')
    .eq('user_id', auth.user.id)
    .single();
  if (!profile?.is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const { teamId } = req.body;
  if (!teamId) return res.status(400).json({ error: 'teamId required' });

  try {
    // Fetch user IDs and period IDs before any deletions
    const { data: members } = await serviceClient
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);
    const userIds = members?.map(m => m.user_id) || [];

    const { data: periodRows } = await serviceClient
      .from('periods')
      .select('id')
      .eq('team_id', teamId);
    const periodIds = periodRows?.map(p => p.id) || [];

    // ── Cascade through period-linked data ───────────────────────────────────
    if (periodIds.length > 0) {
      // Step 1 — action_items (has ON DELETE CASCADE on period_id, but be explicit)
      await serviceClient.from('action_items').delete().in('period_id', periodIds);

      // Step 2 — sku_rows
      await serviceClient.from('sku_rows').delete().in('period_id', periodIds);

      // Step 3 — logistics_rows (has ON DELETE CASCADE on period_id)
      await serviceClient.from('logistics_rows').delete().in('period_id', periodIds);

      // Step 4 — trade_investment
      await serviceClient.from('trade_investment').delete().in('period_id', periodIds);

      // Step 5 — logistics_commercial_investment (has ON DELETE CASCADE on period_id)
      await serviceClient.from('logistics_commercial_investment').delete().in('period_id', periodIds);
    }

    // Step 6 — Delete periods (unblocks the periods_team_id_fkey FK constraint)
    await serviceClient.from('periods').delete().eq('team_id', teamId);

    // Step 7 — Null out profiles.team_id (unblocks profiles FK before team delete)
    if (userIds.length > 0) {
      await serviceClient
        .from('profiles')
        .update({ team_id: null })
        .in('user_id', userIds);
    }

    // Step 8 — Delete team (cascades to: divisions, team_members, team_invitations)
    const { error: teamError } = await serviceClient
      .from('teams')
      .delete()
      .eq('id', teamId);
    if (teamError) throw teamError;

    // Step 9 — Delete profiles and auth users
    if (userIds.length > 0) {
      await serviceClient.from('profiles').delete().in('user_id', userIds);

      for (const userId of userIds) {
        await serviceClient.auth.admin.deleteUser(userId);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete client error:', err);
    return res.status(500).json({ error: err.message });
  }
}
