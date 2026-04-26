import { requireAuth, createSupabaseServiceClient } from '../../../lib/supabase/server';

/**
 * GET /api/team/activity
 *
 * Returns a merged, reverse-chronological activity feed for the
 * caller's team. Three source types:
 *   1. login  — last_sign_in_at per member (auth.users, service role)
 *   2. action — status changes on action_items (in_progress / resolved / dismissed)
 *   3. period — portfolio period creation (periods table)
 *
 * Returns at most 15 entries.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate caller
  const { redirect, user, supabase } = await requireAuth(req, res);
  if (redirect || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 2. Resolve team membership
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return res.status(200).json({ activities: [] });
    }

    const teamId = membership.team_id;

    // 3. Get all team member user IDs + profiles for name display
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    const userIds = (teamMembers || []).map(m => m.user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map(p => [p.user_id, p])
    );

    const activities = [];

    // ── Source 1: Last sign-in per team member (service role) ──
    const serviceClient = createSupabaseServiceClient();
    for (const uid of userIds) {
      try {
        const { data: { user: authUser } } = await serviceClient.auth.admin.getUserById(uid);
        if (authUser?.last_sign_in_at) {
          const p = profileMap[uid];
          activities.push({
            type: 'login',
            timestamp: authUser.last_sign_in_at,
            description: `${p?.full_name || p?.email || 'Team member'} signed in`,
            actor: p?.full_name || p?.email || null,
          });
        }
      } catch (_) {
        // Skip if individual user lookup fails
      }
    }

    // ── Source 2: Action status changes (last 30 days) ──
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentActions } = await supabase
      .from('action_items')
      .select('title, status, updated_at, resolved_at, pillar, owner_name')
      .eq('team_id', teamId)
      .in('status', ['in_progress', 'resolved', 'dismissed'])
      .gte('updated_at', thirtyDaysAgo)
      .order('updated_at', { ascending: false })
      .limit(20);

    for (const a of (recentActions || [])) {
      const statusLabel =
        a.status === 'resolved'    ? 'Marked resolved' :
        a.status === 'in_progress' ? 'Started' :
        'Dismissed';
      activities.push({
        type: 'action',
        timestamp: a.resolved_at || a.updated_at,
        description: `${statusLabel}: ${a.title}`,
        actor: a.owner_name || null,
        pillar: a.pillar,
      });
    }

    // ── Source 3: Portfolio period creation (last 60 days) ──
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentPeriods } = await supabase
      .from('periods')
      .select('label, user_id, created_at')
      .in('user_id', userIds)
      .gte('created_at', sixtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    for (const p of (recentPeriods || [])) {
      const profile = profileMap[p.user_id];
      activities.push({
        type: 'period',
        timestamp: p.created_at,
        description: `Portfolio period created: ${p.label}`,
        actor: profile?.full_name || profile?.email || 'Team member',
      });
    }

    // ── Merge, sort, cap at 15 ──
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({ activities: activities.slice(0, 15) });
  } catch (err) {
    console.error('[team/activity]', err.message);
    return res.status(500).json({ error: 'Failed to load activity feed' });
  }
}
