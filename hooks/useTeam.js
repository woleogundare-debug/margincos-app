import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

export function useTeam() {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTeam = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) { setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) { setLoading(false); return; }

    setMyRole(membership.role);

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', membership.team_id)
      .single();

    setTeam(teamData);

    // Get members then fetch their profiles separately
    const { data: memberRows } = await supabase
      .from('team_members')
      .select('id, role, joined_at, user_id')
      .eq('team_id', membership.team_id);

    if (memberRows && memberRows.length > 0) {
      const userIds = memberRows.map(m => m.user_id);
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const enriched = memberRows.map(m => ({
        ...m,
        profile: profileRows?.find(p => p.user_id === m.user_id) || null,
      }));
      setMembers(enriched);
    } else {
      setMembers([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const inviteMember = async (email, role = 'member') => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('team_invitations')
      .insert([{ team_id: team.id, email, role }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const removeMember = async (memberId) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
    if (error) throw error;
    await loadTeam();
  };

  const isAdmin = myRole === 'admin';

  return { team, members, myRole, isAdmin, loading, inviteMember, removeMember, loadTeam };
}
