import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

export function useTeam() {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
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
        .select('user_id, full_name, email, division_id')
        .in('user_id', userIds);

      const enriched = memberRows.map(m => ({
        ...m,
        profile: profileRows?.find(p => p.user_id === m.user_id) || null,
      }));
      setMembers(enriched);
    } else {
      setMembers([]);
    }

    // Fetch pending invitations for seat-count accuracy
    try {
      const { data: pendingRows, error: inviteError } = await supabase
        .from('team_invitations')
        .select('id, email, role, created_at, expires_at')
        .eq('team_id', membership.team_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (!inviteError) setPendingInvitations(pendingRows || []);
      else setPendingInvitations([]);
    } catch (err) {
      setPendingInvitations([]);
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
    if (error) {
      // The enforce_last_admin trigger (migration 20260410) raises a
      // check_violation with a human-readable message. Propagate it
      // to the UI instead of the raw Postgres error.
      const msg = error.message || 'Failed to remove member';
      throw new Error(msg);
    }
    await loadTeam();
  };

  const changeMemberRole = async (memberId, newRole) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId);
    if (error) {
      const msg = error.message || 'Failed to change role';
      throw new Error(msg);
    }
    await loadTeam();
  };

  // Single-division model: each member has exactly one profiles.division_id.
  // Writing null clears the assignment (member falls back to the team's default view).
  const assignMemberDivision = async (userId, divisionId) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .update({ division_id: divisionId || null, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) {
      const msg = error.message || 'Failed to assign division';
      throw new Error(msg);
    }
    await loadTeam();
  };

  // Cancel a pending invitation (hard delete). Admins only in practice,
  // but RLS is the real gate. Refreshes the team on success so
  // pendingInvitations stays accurate for the seat indicator.
  const cancelInvitation = async (invitationId) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);
    if (error) {
      return { error: error.message || 'Failed to cancel invitation' };
    }
    await loadTeam();
    return { success: true };
  };

  const isAdmin = myRole === 'admin';

  return {
    team,
    members,
    pendingInvitations,
    myRole,
    isAdmin,
    loading,
    inviteMember,
    removeMember,
    changeMemberRole,
    assignMemberDivision,
    cancelInvitation,
    loadTeam,
  };
}
