import { requireAuth, createSupabaseServiceClient } from '../../../lib/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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

  const { teamId, action } = req.body;
  if (!teamId || !['suspend', 'reactivate'].includes(action)) {
    return res.status(400).json({ error: 'teamId and action (suspend|reactivate) required' });
  }

  const newStatus = action === 'suspend' ? 'suspended' : 'active';

  const { error } = await serviceClient
    .from('teams')
    .update({ status: newStatus })
    .eq('id', teamId);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true, status: newStatus });
}
