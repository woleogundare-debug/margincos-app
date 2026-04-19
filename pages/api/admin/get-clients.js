import { requireAuth, createSupabaseServiceClient } from '../../../lib/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

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
  if (!profile?.is_superadmin) {
    const srkPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const srkLength = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return res.status(403).json({
      error: 'Forbidden',
      _diag: {
        userId: auth?.user?.id,
        userEmail: auth?.user?.email,
        profileFound: !!profile,
        profileUserId: profile?.user_id,
        isSuperadmin: profile?.is_superadmin,
        srkPresent,
        srkLength,
        supabaseUrl,
      }
    });
  }

  // Separate queries to avoid nested join breaking after RLS changes
  const { data: teams } = await serviceClient
    .from('teams')
    .select('id, name, tier, status, created_at')
    .order('created_at', { ascending: false });

  const teamsWithMembers = await Promise.all(
    (teams || []).map(async (team) => {
      const { data: members } = await serviceClient
        .from('team_members')
        .select('id, role, user_id')
        .eq('team_id', team.id);

      const userIds = (members || []).map(m => m.user_id);
      let profiles = [];
      if (userIds.length > 0) {
        const { data: profileData } = await serviceClient
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);
        profiles = profileData || [];
      }

      const enrichedMembers = (members || []).map(m => ({
        ...m,
        profiles: profiles.find(p => p.user_id === m.user_id) || null,
      }));

      return { ...team, team_members: enrichedMembers };
    })
  );

  return res.status(200).json({ teams: teamsWithMembers });
}
