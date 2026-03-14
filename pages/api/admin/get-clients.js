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
    .eq('id', user.id)
    .single();
  if (!profile?.is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id, name, tier, created_at,
      team_members (
        id, role,
        profiles:user_id (id, email, full_name)
      )
    `)
    .order('created_at', { ascending: false });

  return res.status(200).json({ teams: teams || [] });
}
