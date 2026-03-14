import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('user_id', user.id)
    .single();
  if (!profile?.is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  // Separate queries to avoid nested join breaking after RLS changes
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, tier, created_at')
    .order('created_at', { ascending: false });

  const teamsWithMembers = await Promise.all(
    (teams || []).map(async (team) => {
      const { data: members } = await supabase
        .from('team_members')
        .select('id, role, user_id')
        .eq('team_id', team.id);

      const userIds = (members || []).map(m => m.user_id);
      let profiles = [];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
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
