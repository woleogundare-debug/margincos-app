import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  UsersIcon,
  UserPlusIcon,
  RectangleGroupIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../hooks/useAuth';
import useDivisions from '../../hooks/useDivisions';
import { TIER_LIMITS } from '../../lib/constants';
import { getInitials } from '../../lib/initials';

export default function TeamPage() {
  const {
    team,
    members,
    pendingInvitations,
    isAdmin,
    loading,
    removeMember,
    changeMemberRole,
    assignMemberDivision,
    cancelInvitation,
  } = useTeam();
  const { user, tier } = useAuth();
  const {
    divisions,
    createDivision,
    renameDivision,
    archiveDivision,
    deleteDivision,
  } = useDivisions(team?.id, { isAdmin });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [error, setError] = useState('');

  // Division management state
  const [showCreateDivision, setShowCreateDivision] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState('');
  const [creatingDivision, setCreatingDivision] = useState(false);
  const [divisionError, setDivisionError] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Member management state (role change, division assignment, removal)
  const [memberError, setMemberError] = useState('');
  const [busyMemberId, setBusyMemberId] = useState(null);

  const isEnterprise = tier === 'enterprise' || tier === 'admin';
  const isProfessionalOrAbove = tier === 'professional' || isEnterprise;
  const seatCap = TIER_LIMITS[tier]?.maxMembers ?? null;
  const usedSeats = members.length + (pendingInvitations?.length || 0);
  const seatsRemaining = seatCap === null ? Infinity : seatCap - usedSeats;

  // Division limit enforcement
  const maxDivisions = TIER_LIMITS[tier]?.maxDivisions ?? null;
  const canCreateDivision = isAdmin && isProfessionalOrAbove && (maxDivisions === null || divisions.length < maxDivisions);

  const handleCreateDivision = async () => {
    if (!newDivisionName.trim()) { setDivisionError('Name is required'); return; }
    setCreatingDivision(true);
    setDivisionError('');
    const { error: err } = await createDivision(newDivisionName.trim());
    setCreatingDivision(false);
    if (err) {
      setDivisionError(err.message || 'Failed to create division');
    } else {
      setNewDivisionName('');
      setShowCreateDivision(false);
    }
  };

  const handleRenameDivision = async (divisionId) => {
    if (!renameValue.trim()) return;
    await renameDivision(divisionId, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
  };

  const handleArchiveDivision = async (divisionId) => {
    const div = divisions.find(d => d.id === divisionId);
    if (!confirm(`Archive "${div?.name}"? Its periods will remain but it won't appear in menus.`)) return;
    const { error: err } = await archiveDivision(divisionId);
    if (err) setDivisionError(err.message || 'Failed to archive division');
  };

  const handleDeleteDivision = async (divisionId) => {
    const div = divisions.find(d => d.id === divisionId);
    if (!confirm(`Delete "${div?.name}"? This permanently removes the division. Its periods and data will remain but lose their division assignment. This cannot be undone.`)) return;
    const { error: err } = await deleteDivision(divisionId);
    if (err) setDivisionError(err.message || 'Failed to delete division');
  };

  const handleRoleChange = async (memberId, currentRole, newRole) => {
    if (currentRole === newRole) return;
    setMemberError('');
    setBusyMemberId(memberId);
    try {
      await changeMemberRole(memberId, newRole);
    } catch (err) {
      setMemberError(err.message || 'Failed to change role');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleAssignDivision = async (memberId, userId, divisionId) => {
    setMemberError('');
    setBusyMemberId(memberId);
    try {
      await assignMemberDivision(userId, divisionId);
    } catch (err) {
      setMemberError(err.message || 'Failed to assign division');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName || 'this member'} from the team? They will lose access immediately.`)) return;
    setMemberError('');
    setBusyMemberId(memberId);
    try {
      await removeMember(memberId);
    } catch (err) {
      // The enforce_last_admin trigger surfaces a friendly message here.
      setMemberError(err.message || 'Failed to remove member');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    if (seatsRemaining <= 0) {
      setError(`Seat limit reached (${seatCap} on ${tier} plan). Upgrade to add more members.`);
      return;
    }
    setInviting(true);
    setError('');
    try {
      const supabase = (await import('../../lib/supabase/client')).getSupabaseClient();
      const { data, error: insertError } = await supabase
        .from('team_invitations')
        .insert([{ team_id: team.id, email: inviteEmail, role: inviteRole }])
        .select()
        .single();
      if (insertError) throw insertError;

      const apiRes = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          teamId: team.id,
          teamName: team.name,
          inviterName: user?.user_metadata?.full_name || user?.email || 'Your team admin',
        }),
      });
      if (!apiRes.ok) {
        const body = await apiRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to send invitation');
      }
      setInviteSent(true);
      setInviteEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (loading) return (
    <div className="p-8 text-gray-400 text-sm">Loading team...</div>
  );

  if (!team) return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Team Management</h1>
      <p className="text-gray-500 text-sm">You are not currently assigned to a team. Contact your administrator.</p>
    </div>
  );

  return (
    <>
      <Head><title>Team Management | MarginCOS</title></Head>
      <div className="max-w-5xl mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', serif" }}>
              Team Management
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-slate-600">{team?.name || 'Your team'}</span>
              <span className="text-slate-300">·</span>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide"
                style={{ backgroundColor: 'rgba(13, 143, 143, 0.1)', color: '#0D8F8F' }}
              >
                {tier === 'enterprise' ? 'Enterprise' : tier === 'professional' ? 'Professional' : 'Essentials'}
              </span>
            </div>
          </div>

          {/* Seat usage indicator */}
          {isProfessionalOrAbove && seatCap !== null && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-navy">Seats used</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {usedSeats} of {seatCap} ({members.length} active{(pendingInvitations?.length || 0) > 0 ? ` + ${pendingInvitations.length} pending` : ''})
                </p>
              </div>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, (usedSeats / seatCap) * 100)}%`,
                  backgroundColor: usedSeats >= seatCap ? '#C0392B' : '#0D8F8F',
                }} />
              </div>
            </div>
          )}

          {!isProfessionalOrAbove && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <LockIcon />
                <div>
                  <h3 className="font-semibold text-navy mb-1">Multi-user access requires Professional or Enterprise</h3>
                  <p className="text-sm text-slate-600">Upgrade to invite your CFO, Commercial Director, and Sales team to collaborate on the same portfolio data.</p>
                  <Link href="/pricing" className="inline-block mt-3 text-sm font-semibold" style={{ color: '#C0392B' }}>
                    View plans &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Pending Invitations (only when any exist) */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 mb-6">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <ClockIcon className="w-5 h-5 text-slate-400" />
                  <h2 className="font-semibold text-navy">Pending Invitations ({pendingInvitations.length})</h2>
                </div>
                <p className="text-xs text-slate-500">Invitations that have been sent but not yet accepted.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingInvitations.map(inv => {
                  const sentAt = inv.created_at ? new Date(inv.created_at) : null;
                  const sentLabel = sentAt ? sentAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                  const expiresAt = inv.expires_at ? new Date(inv.expires_at) : null;
                  const isExpired = expiresAt && expiresAt < new Date();
                  return (
                    <div key={inv.id} className="px-6 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <ClockIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{inv.email}</p>
                          <p className="text-xs text-slate-400">
                            {sentLabel && <>Invited {sentLabel} as {inv.role}</>}
                            {!sentLabel && <>Invited as {inv.role}</>}
                            {isExpired && <span className="ml-2 text-red-500 font-medium">· Expired</span>}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Cancel invitation to ${inv.email}?`)) return;
                            const result = await cancelInvitation(inv.id);
                            if (result?.error) {
                              setMemberError(result.error);
                            }
                          }}
                          className="text-xs text-slate-400 hover:text-red-600 px-3 py-1 rounded transition-colors flex-shrink-0"
                          title="Cancel invitation"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members table */}
          <div className="bg-white rounded-xl border border-slate-100 mb-6">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <UsersIcon className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-navy">Team Members ({members.length})</h2>
              </div>
              <p className="text-xs text-slate-500">People with access to your portfolio data and analysis tools.</p>
            </div>

            {loading && (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">Loading…</div>
            )}

            {!loading && members.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">
                No team members yet. {isProfessionalOrAbove ? 'Invite your colleagues below.' : 'Upgrade to Professional or Enterprise to invite team members.'}
              </div>
            )}

            {!loading && members.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Member</th>
                      <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 hidden md:table-cell">Role</th>
                      {divisions.length >= 2 && (
                        <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 hidden md:table-cell">Division</th>
                      )}
                      <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 hidden lg:table-cell">Joined</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => {
                      const isSelf = m.user_id === user?.id;
                      const canEdit = isAdmin && !isSelf;
                      // Gap 2: admins can self-assign their own division (RLS allows it).
                      // Keep `canEdit` for Role / Remove to prevent self-demotion / self-removal.
                      const canEditDivision = isAdmin;
                      const busy = busyMemberId === m.id;
                      const displayName = m.profile?.full_name || m.profile?.email || 'Team Member';
                      const initials = getInitials(m.profile?.full_name, m.profile?.email);
                      const joinedAt = m.joined_at ? new Date(m.joined_at) : null;
                      const joinedLabel = joinedAt ? joinedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                      const memberDivisionId = m.profile?.division_id || '';

                      return (
                        <tr key={m.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors group">
                          {/* Member: avatar + name + email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: '#0D8F8F' }}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-navy truncate">
                                  {displayName}
                                  {isSelf && <span className="text-xs text-slate-400 font-normal ml-1">(you)</span>}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{m.profile?.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-3 py-4 hidden md:table-cell">
                            {canEdit ? (
                              <select
                                value={m.role}
                                disabled={busy}
                                onChange={e => handleRoleChange(m.id, m.role, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-semibold disabled:opacity-50"
                                title="Change role"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                                m.role === 'admin'
                                  ? 'bg-navy text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {m.role}
                              </span>
                            )}
                          </td>

                          {/* Division (only when 2+ divisions exist) */}
                          {divisions.length >= 2 && (
                            <td className="px-3 py-4 hidden md:table-cell">
                              {canEditDivision ? (
                                <select
                                  value={memberDivisionId}
                                  disabled={busy}
                                  onChange={e => handleAssignDivision(m.id, m.user_id, e.target.value || null)}
                                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white disabled:opacity-50"
                                  title={isSelf ? "Assign yourself to a division" : "Assign to division"}
                                >
                                  <option value="">— No division —</option>
                                  {divisions.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  {divisions.find(d => d.id === memberDivisionId)?.name || '—'}
                                </span>
                              )}
                            </td>
                          )}

                          {/* Joined */}
                          <td className="px-3 py-4 hidden lg:table-cell">
                            <span className="text-xs text-slate-500">{joinedLabel}</span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {canEdit && (
                              <button
                                onClick={() => handleRemoveMember(m.id, m.profile?.full_name || m.profile?.email)}
                                disabled={busy}
                                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors disabled:opacity-50 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                title="Remove from team"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {memberError && (
              <div className="px-6 py-3 border-t border-red-100 bg-red-50">
                <p className="text-xs text-red-600 font-medium">{memberError}</p>
              </div>
            )}
          </div>

          {/* Invite form — Professional + Enterprise */}
          {isAdmin && isProfessionalOrAbove && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <UserPlusIcon className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-navy">Invite a team member</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">Send an email invitation. Recipients create their own account and get immediate access to shared portfolio data.</p>

              {inviteSent && (
                <div
                  className="rounded-lg p-3 mb-4 text-sm border"
                  style={{ backgroundColor: 'rgba(13, 143, 143, 0.05)', borderColor: 'rgba(13, 143, 143, 0.2)', color: '#0D8F8F' }}
                >
                  Invitation sent. They'll receive an email to set up their account.
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => { setInviteEmail(e.target.value); setInviteSent(false); }}
                  className="w-full sm:flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
                <div className="flex gap-3 w-full sm:w-auto">
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="flex-1 sm:flex-none border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none bg-white"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={handleInvite}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#C0392B' }}
                  >
                    {inviting ? 'Sending…' : 'Send Invite'}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          )}

          {/* Divisions section — card grid, visible to admins on Professional/Enterprise */}
          {isProfessionalOrAbove && (
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <RectangleGroupIcon className="w-5 h-5 text-slate-400" />
                    <h2 className="font-semibold text-navy">Divisions ({divisions.length})</h2>
                  </div>
                  <p className="text-xs text-slate-500">Group your portfolio data by business unit, region, or product line. Members can be assigned to a single division to scope their access.</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 flex-shrink-0">
                  {maxDivisions === null ? 'Unlimited' : `${divisions.length} of ${maxDivisions}`}
                </span>
              </div>

              {divisionError && !showCreateDivision && (
                <div className="mt-4 p-3 border border-red-100 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">{divisionError}</p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {divisions.map(div => (
                  <div
                    key={div.id}
                    className={`group relative rounded-xl p-4 transition-all ${
                      div.is_default ? 'border-2 bg-white' : 'border bg-white hover:border-slate-300'
                    }`}
                    style={div.is_default ? { borderColor: 'rgba(13, 143, 143, 0.3)' } : { borderColor: '#e2e8f0' }}
                  >
                    {div.is_default && (
                      <span
                        className="absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: 'rgba(13, 143, 143, 0.1)', color: '#0D8F8F' }}
                      >
                        Default
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: '#1B2A4A' }}
                      >
                        {div.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 pr-12">
                        {renamingId === div.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameDivision(div.id);
                                if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                              }}
                              className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameDivision(div.id)}
                              className="text-xs font-semibold"
                              style={{ color: '#0D8F8F' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setRenamingId(null); setRenameValue(''); }}
                              className="text-xs text-slate-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-navy truncate">{div.name}</p>
                            {div.sector && (
                              <span
                                className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
                                style={{ backgroundColor: 'rgba(13, 143, 143, 0.1)', color: '#0D8F8F' }}
                              >
                                {div.sector}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {isAdmin && renamingId !== div.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setRenamingId(div.id); setRenameValue(div.name); }}
                          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          Rename
                        </button>
                        {!div.is_default && (
                          <button
                            onClick={() => handleDeleteDivision(div.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* New Division placeholder card */}
                {canCreateDivision && (
                  <>
                    {showCreateDivision ? (
                      <div
                        className="rounded-xl border-2 border-dashed p-4"
                        style={{ borderColor: 'rgba(13, 143, 143, 0.4)' }}
                      >
                        <p className="text-xs font-semibold text-navy mb-3">Create new division</p>
                        <input
                          type="text"
                          placeholder="e.g. Sales, Operations, West Africa"
                          value={newDivisionName}
                          onChange={e => { setNewDivisionName(e.target.value); setDivisionError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handleCreateDivision()}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white mb-3"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCreateDivision}
                            disabled={creatingDivision || !newDivisionName.trim()}
                            className="flex-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50 transition-all"
                            style={{ backgroundColor: '#0D8F8F' }}
                          >
                            {creatingDivision ? 'Creating…' : 'Create'}
                          </button>
                          <button
                            onClick={() => { setShowCreateDivision(false); setNewDivisionName(''); setDivisionError(''); }}
                            className="px-3 py-1.5 rounded-lg text-xs text-slate-500 border border-slate-200 hover:border-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        {divisionError && <p className="text-xs text-red-600 font-medium mt-2">{divisionError}</p>}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCreateDivision(true)}
                        className="rounded-xl border-2 border-dashed border-slate-200 p-4 flex items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all min-h-[100px]"
                      >
                        <PlusIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">New Division</span>
                      </button>
                    )}
                  </>
                )}

                {!canCreateDivision && isAdmin && maxDivisions !== null && divisions.length >= maxDivisions && (
                  <Link
                    href="/pricing"
                    className="rounded-xl border-2 border-dashed border-slate-200 p-4 flex items-center justify-center text-xs font-semibold text-slate-400 hover:text-navy transition-colors min-h-[100px]"
                  >
                    Upgrade for more divisions →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
    </>
  );
}

TeamPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

function LockIcon() {
  return (
    <svg className="w-6 h-6 text-purple-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
