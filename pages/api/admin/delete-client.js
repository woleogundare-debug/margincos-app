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
    // Get all user_ids in this team before deleting
    const { data: members } = await serviceClient
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    const userIds = members?.map(m => m.user_id) || [];

    // Step 1 — Null out team_id on profiles FIRST (breaks FK constraint)
    if (userIds.length > 0) {
      await serviceClient
        .from('profiles')
        .update({ team_id: null })
        .in('user_id', userIds);
    }

    // Step 2 — Delete the team (cascades to team_members, team_invitations)
    const { error: teamError } = await serviceClient
      .from('teams')
      .delete()
      .eq('id', teamId);
    if (teamError) throw teamError;

    // Step 3 — Delete profiles
    if (userIds.length > 0) {
      await serviceClient
        .from('profiles')
        .delete()
        .in('user_id', userIds);

      // Step 4 — Delete auth users
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
