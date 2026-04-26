import { useState, useEffect } from 'react';
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

/* ── Design tokens (inline, matching margincos.css handoff) ── */
const font = {
  playfair: "'Playfair Display', Georgia, serif",
  dm: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};
const c = {
  navy: '#1B2A4A', navyLight: '#2A3F66', navy50: '#E8EBF0',
  teal: '#0D8F8F', tealLight: '#11B3B3', teal50: '#E6F5F5',
  red: '#C0392B', red50: '#FBEAE8',
  gold: '#D4A843', gold50: '#FBF5E8',
  green: '#27AE60',
  text: '#1B2A4A', textLight: '#5A6B80', gray: '#8896A7', gray100: '#E8ECF0',
  rule: '#E2E6EC', ruleStrong: '#C9D0DA',
  paper: '#FBFBFC', paper2: '#F4F6F9',
};

/* ── Role definitions for permission cards ── */
const ROLE_DEFS = [
  { code: 'Admin',  perms: 'Full access · billing · invite · delete portfolios' },
  { code: 'Member', perms: 'Edit SKUs · run analyses · publish actions' },
  { code: 'Viewer', perms: 'Read-only · download reports · comment' },
];

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

  // Tier label
  const tierLabel = isEnterprise ? 'Enterprise' : tier === 'professional' ? 'Professional' : 'Essentials';

  // Activity feed state
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    if (!team?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/team/activity');
        if (!res.ok) throw new Error('Activity fetch failed');
        const { activities: data } = await res.json();
        if (!cancelled) setActivities(data || []);
      } catch (_) {
        // Silently degrade - empty feed is fine
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [team?.id]);

  // Last activity (most recent member by joined_at)
  const lastActivity = members.length > 0
    ? [...members].sort((a, b) => new Date(b.joined_at || 0) - new Date(a.joined_at || 0))[0]
    : null;
  const lastActivityLabel = lastActivity?.joined_at
    ? new Date(lastActivity.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  // Admin count for role cards
  const adminCount = members.filter(m => m.role === 'admin').length;
  const memberCount = members.filter(m => m.role === 'member').length;

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
      <h1 className="text-2xl font-bold text-navy mb-2" style={{ fontFamily: font.playfair }}>Team Management</h1>
      <p className="text-gray-500 text-sm">You are not currently assigned to a team. Contact your administrator.</p>
    </div>
  );

  return (
    <>
      <Head><title>Team Management | MarginCOS</title></Head>
      <div className="max-w-5xl mx-auto">

        {/* ── Doc Head (editorial) ── */}
        <div className="doc-head">
          <div>
            <div className="doc-meta">Account · Team management</div>
            <h1 className="doc-title">Team</h1>
            <div className="doc-period">
              {team?.name || 'Your team'} · {tierLabel} tier · {members.length} member{members.length !== 1 ? 's' : ''} · {divisions.length} division{divisions.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="doc-actions">
            <button
              className="btn-ed"
              onClick={() => document.getElementById('team-audit-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Audit log
            </button>
            {isAdmin && isProfessionalOrAbove && (
              <button
                className="btn-ed"
                onClick={() => document.getElementById('team-invite-section')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: c.teal, color: '#fff', borderColor: c.teal }}
              >
                + Invite member
              </button>
            )}
          </div>
        </div>

        {/* ── Summary Row (3 cards) ── */}
        <div className="summary-row">
          <div className="summary-card">
            <div className="lbl">Active seats</div>
            <div className="v">{members.length}<span style={{ fontSize: 14, color: 'var(--text-light)', fontWeight: 400, marginLeft: 6 }}>/ {seatCap === null ? 'unlimited' : seatCap}</span></div>
            <div className="sub">{tierLabel} tier{seatCap === null ? ' · no seat cap' : ''}</div>
          </div>
          <div className="summary-card">
            <div className="lbl">Pending invites</div>
            <div className={`v ${(pendingInvitations?.length || 0) > 0 ? 'gold' : ''}`}>{pendingInvitations?.length || 0}</div>
            <div className="sub">{pendingInvitations?.length > 0 ? pendingInvitations.map(inv => inv.email).join(', ') : 'No pending invitations'}</div>
          </div>
          <div className="summary-card">
            <div className="lbl">Last member joined</div>
            <div className="v" style={{ fontSize: 18 }}>{lastActivityLabel}</div>
            <div className="sub">{lastActivity?.profile?.full_name || lastActivity?.profile?.email || '—'}</div>
          </div>
        </div>

        {/* ── Essentials tier lock ── */}
        {!isProfessionalOrAbove && (
          <div className="mb-6 mt-4" style={{ background: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: 12, padding: 24 }}>
            <div className="flex items-start gap-3">
              <LockIcon />
              <div>
                <h3 className="font-semibold mb-1" style={{ color: c.navy, fontFamily: font.dm }}>Multi-user access requires Professional or Enterprise</h3>
                <p className="text-sm" style={{ color: c.textLight }}>Upgrade to invite your CFO, Commercial Director, and Sales team to collaborate on the same portfolio data.</p>
                <Link href="/pricing" className="inline-block mt-3 text-sm font-semibold" style={{ color: c.red }}>
                  View plans &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ Exhibit 1 — Team Members ━━━ */}
        <div className="exhibit-head">
          <div>
            <div className="exhibit-num">Exhibit 1</div>
            <div className="exhibit-title">Team members</div>
            <div className="exhibit-sub">People with access to your portfolio data and analysis tools</div>
          </div>
          <div className="exhibit-meta">
            <span className="count">{members.length} member{members.length !== 1 ? 's' : ''} · {pendingInvitations?.length || 0} pending</span>
          </div>
        </div>

        {/* Members table */}
        <div className="panel" style={{ overflow: 'hidden' }}>
          {loading && (
            <div className="px-6 py-8 text-center text-sm" style={{ color: c.gray }}>Loading…</div>
          )}

          {!loading && members.length === 0 && (
            <div className="px-6 py-8 text-center text-sm" style={{ color: c.gray }}>
              No team members yet. {isProfessionalOrAbove ? 'Invite your colleagues below.' : 'Upgrade to Professional or Enterprise to invite team members.'}
            </div>
          )}

          {!loading && members.length > 0 && (
            <div className="overflow-x-auto">
              <table className="dtable">
                <thead>
                  <tr>
                    <th style={thStyle}>Member</th>
                    <th style={thStyle}>Email</th>
                    {divisions.length >= 2 && <th style={thStyle} className="hidden md:table-cell">Division</th>}
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle} className="hidden lg:table-cell">Joined</th>
                    <th style={{ ...thStyle, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => {
                    const isSelf = m.user_id === user?.id;
                    const canEdit = isAdmin && !isSelf;
                    const canEditDivision = isAdmin;
                    const busy = busyMemberId === m.id;
                    const displayName = m.profile?.full_name || m.profile?.email || 'Team Member';
                    const initials = getInitials(m.profile?.full_name, m.profile?.email);
                    const joinedAt = m.joined_at ? new Date(m.joined_at) : null;
                    const joinedLabel = joinedAt ? joinedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                    const memberDivisionId = m.profile?.division_id || '';
                    const isEvenRow = idx % 2 === 1;

                    return (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${c.rule}` }}
                        onMouseEnter={e => { for (const td of e.currentTarget.children) td.style.background = c.teal50; }}
                        onMouseLeave={e => { const bg = isEvenRow ? c.paper : '#fff'; for (const td of e.currentTarget.children) td.style.background = bg; }}>
                        {/* Member */}
                        <td style={{ ...tdStyle, background: isEvenRow ? c.paper : '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              background: c.teal, color: '#fff',
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: c.navy }}>
                                {displayName}
                                {isSelf && <span style={{ fontSize: 10, color: c.textLight, fontWeight: 500, marginLeft: 4 }}>(you)</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ ...tdStyle, color: c.textLight, fontSize: 12, background: isEvenRow ? c.paper : '#fff' }}>
                          {m.profile?.email}
                        </td>

                        {/* Division */}
                        {divisions.length >= 2 && (
                          <td className="hidden md:table-cell" style={{ ...tdStyle, color: c.textLight, background: isEvenRow ? c.paper : '#fff' }}>
                            {canEditDivision ? (
                              <select
                                value={memberDivisionId}
                                disabled={busy}
                                onChange={e => handleAssignDivision(m.id, m.user_id, e.target.value || null)}
                                style={{ fontSize: 11, border: `1px solid ${c.rule}`, borderRadius: 6, padding: '2px 6px', background: '#fff' }}
                                title={isSelf ? 'Assign yourself to a division' : 'Assign to division'}
                              >
                                <option value="">—</option>
                                {divisions.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span>{divisions.find(d => d.id === memberDivisionId)?.name || '—'}</span>
                            )}
                          </td>
                        )}

                        {/* Role pill */}
                        <td style={{ ...tdStyle, background: isEvenRow ? c.paper : '#fff' }}>
                          {canEdit ? (
                            <select
                              value={m.role}
                              disabled={busy}
                              onChange={e => handleRoleChange(m.id, m.role, e.target.value)}
                              style={{
                                fontFamily: font.mono, fontSize: 11, fontWeight: 700,
                                padding: '2px 8px', border: `1px solid ${c.rule}`, borderRadius: 3,
                                background: '#fff', color: c.navy, letterSpacing: '0.06em',
                              }}
                              title="Change role"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span style={{
                              fontFamily: font.mono, fontSize: 11, fontWeight: 700,
                              padding: '2px 8px', letterSpacing: '0.06em', borderRadius: 3,
                              background: m.role === 'admin' ? c.navy : c.paper2,
                              color: m.role === 'admin' ? '#fff' : c.textLight,
                            }}>
                              {m.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                          )}
                        </td>

                        {/* Status pill */}
                        <td style={{ ...tdStyle, background: isEvenRow ? c.paper : '#fff' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                            letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font.dm,
                            background: c.teal50, color: c.green,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.green }} />
                            Active
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="hidden lg:table-cell" style={{ ...tdStyle, color: c.textLight, background: isEvenRow ? c.paper : '#fff' }}>
                          {joinedLabel}
                        </td>

                        {/* Actions */}
                        <td style={{ ...tdStyle, textAlign: 'right', width: 40, background: isEvenRow ? c.paper : '#fff' }}>
                          {canEdit && (
                            <button
                              onClick={() => handleRemoveMember(m.id, m.profile?.full_name || m.profile?.email)}
                              disabled={busy}
                              style={{
                                fontFamily: font.dm, fontSize: 12, fontWeight: 600,
                                padding: '4px 8px', border: `1px solid ${c.ruleStrong}`,
                                borderRadius: 8, background: '#fff', color: c.navy,
                                cursor: 'pointer', lineHeight: 1,
                              }}
                              title="More options"
                            >
                              ⋯
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Pending invitations as rows */}
                  {pendingInvitations && pendingInvitations.map((inv, idx) => {
                    const isEvenRow = (members.length + idx) % 2 === 1;
                    const sentAt = inv.created_at ? new Date(inv.created_at) : null;
                    const sentLabel = sentAt ? sentAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                    const expiresAt = inv.expires_at ? new Date(inv.expires_at) : null;
                    const isExpired = expiresAt && expiresAt < new Date();

                    return (
                      <tr key={inv.id} style={{ borderBottom: `1px solid ${c.rule}` }}
                        onMouseEnter={e => { for (const td of e.currentTarget.children) td.style.background = c.teal50; }}
                        onMouseLeave={e => { const bg = isEvenRow ? c.paper : '#fff'; for (const td of e.currentTarget.children) td.style.background = bg; }}>
                        <td style={{ ...tdStyle, background: isEvenRow ? c.paper : '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              background: c.gray100, color: c.textLight,
                            }}>
                              {inv.email.slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: c.textLight }}>
                              {inv.email.split('@')[0]}
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: c.textLight, fontSize: 12, background: isEvenRow ? c.paper : '#fff' }}>{inv.email}</td>
                        {divisions.length >= 2 && <td className="hidden md:table-cell" style={{ ...tdStyle, color: c.textLight, background: isEvenRow ? c.paper : '#fff' }}>—</td>}
                        <td style={{ ...tdStyle, background: isEvenRow ? c.paper : '#fff' }}>
                          <span style={{
                            fontFamily: font.mono, fontSize: 11, fontWeight: 700,
                            padding: '2px 8px', letterSpacing: '0.06em', borderRadius: 3,
                            background: c.paper2, color: c.textLight,
                          }}>
                            {inv.role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, background: isEvenRow ? c.paper : '#fff' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                            letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font.dm,
                            background: isExpired ? c.red50 : c.gold50, color: isExpired ? c.red : '#8C6A0A',
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isExpired ? c.red : c.gold }} />
                            {isExpired ? 'Expired' : 'Pending'}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell" style={{ ...tdStyle, color: c.textLight, background: isEvenRow ? c.paper : '#fff' }}>{sentLabel}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', width: 40, background: isEvenRow ? c.paper : '#fff' }}>
                          {isAdmin && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Cancel invitation to ${inv.email}?`)) return;
                                const result = await cancelInvitation(inv.id);
                                if (result?.error) setMemberError(result.error);
                              }}
                              style={{
                                fontFamily: font.dm, fontSize: 11, fontWeight: 600,
                                padding: '3px 8px', border: 'none', borderRadius: 4,
                                background: 'transparent', color: c.textLight, cursor: 'pointer',
                              }}
                              title="Cancel invitation"
                            >
                              Cancel
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

          {/* Source line */}
          <div className="source-line">
            <span><strong>Tier:</strong> {tierLabel}{seatCap === null ? ' · unlimited seats, unlimited divisions, full audit trail' : ` · ${seatCap} seats, ${maxDivisions} division${maxDivisions !== 1 ? 's' : ''}`}</span>
            <span><strong>Team:</strong> {team?.name}</span>
          </div>

          {memberError && (
            <div style={{ padding: '10px 18px', borderTop: `1px solid ${c.red50}`, background: c.red50 }}>
              <p style={{ fontSize: 12, color: c.red, fontWeight: 600, margin: 0 }}>{memberError}</p>
            </div>
          )}
        </div>

        {/* ━━━ Exhibit 2 — Invite a team member ━━━ */}
        {isAdmin && isProfessionalOrAbove && (
          <>
            <div id="team-invite-section" className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 2</div>
                <div className="exhibit-title">Invite a team member</div>
                <div className="exhibit-sub">Recipients create their own account and receive immediate access to shared portfolio data</div>
              </div>
            </div>

            <div className="panel" style={{ padding: 18 }}>
              {inviteSent && (
                <div style={{ padding: 12, marginBottom: 14, borderRadius: 8, fontSize: 13, border: `1px solid ${c.teal50}`, background: c.teal50, color: c.teal }}>
                  Invitation sent. They'll receive an email to set up their account.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => { setInviteEmail(e.target.value); setInviteSent(false); }}
                  style={{
                    flex: 1, padding: '10px 14px', border: `1px solid ${c.ruleStrong}`, borderRadius: 8,
                    fontFamily: font.dm, fontSize: 13, color: c.navy, outline: 'none',
                  }}
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  style={{
                    padding: '10px 14px', border: `1px solid ${c.ruleStrong}`, borderRadius: 8,
                    fontFamily: font.dm, fontSize: 13, color: c.navy, background: '#fff', minWidth: 130,
                  }}
                >
                  <option value="member">Member · Editor</option>
                  <option value="admin">Admin</option>
                </select>
                {divisions.length > 0 && (
                  <select
                    style={{
                      padding: '10px 14px', border: `1px solid ${c.ruleStrong}`, borderRadius: 8,
                      fontFamily: font.dm, fontSize: 13, color: c.navy, background: '#fff', minWidth: 180,
                    }}
                  >
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                    {canCreateDivision && <option value="">+ New division</option>}
                  </select>
                )}
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                  style={{
                    fontFamily: font.dm, fontSize: 12.5, fontWeight: 600,
                    padding: '10px 18px', borderRadius: 8,
                    border: 'none', background: c.red, color: '#fff',
                    cursor: inviting ? 'wait' : 'pointer', opacity: (!inviteEmail || inviting) ? 0.5 : 1,
                  }}
                >
                  {inviting ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
              {error && <p style={{ fontSize: 12, color: c.red, fontWeight: 600, marginTop: 10 }}>{error}</p>}

              {/* Role permission cards */}
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {ROLE_DEFS.map(r => {
                  const count = r.code === 'Admin' ? adminCount : r.code === 'Member' ? memberCount : (members.length - adminCount - memberCount);
                  return (
                    <div key={r.code} style={{ padding: '12px 14px', background: c.paper, border: `1px solid ${c.rule}`, borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ fontFamily: font.mono, fontSize: 11, color: c.navy, letterSpacing: '0.06em' }}>
                          {r.code.toUpperCase()}
                        </strong>
                        <span style={{ fontFamily: font.mono, fontSize: 10, color: c.textLight }}>
                          {count} active
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: c.textLight, lineHeight: 1.5, fontFamily: font.dm }}>
                        {r.perms}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ━━━ Exhibit 3 — Divisions ━━━ */}
        {isProfessionalOrAbove && (
          <>
            <div className="exhibit-head">
              <div>
                <div className="exhibit-num">Exhibit 3</div>
                <div className="exhibit-title">Divisions</div>
                <div className="exhibit-sub">Group portfolio data by business unit, region, or product line. Members can be scoped to a single division</div>
              </div>
              <div className="exhibit-meta">
                <span className="count">{divisions.length} of {maxDivisions === null ? 'unlimited' : maxDivisions}</span>
              </div>
            </div>

            {divisionError && !showCreateDivision && (
              <div style={{ marginBottom: 10, padding: 12, border: `1px solid ${c.red50}`, background: c.red50, borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: c.red, fontWeight: 600, margin: 0 }}>{divisionError}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              {divisions.map(div => (
                <div
                  key={div.id}
                  style={{
                    background: '#fff', border: `1px solid ${c.rule}`, borderRadius: 12,
                    padding: 18, position: 'relative',
                  }}
                >
                  {div.is_default && (
                    <span style={{
                      position: 'absolute', top: 14, right: 14, fontSize: 9, fontWeight: 800,
                      letterSpacing: '0.14em', padding: '3px 7px', background: c.teal50,
                      color: c.teal, borderRadius: 3, textTransform: 'uppercase',
                    }}>
                      Default
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 36, height: 36, fontSize: 12, fontWeight: 700,
                      background: c.navy50, color: c.navy, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {div.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      {renamingId === div.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameDivision(div.id);
                              if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                            }}
                            style={{ flex: 1, border: `1px solid ${c.rule}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, outline: 'none' }}
                            autoFocus
                          />
                          <button onClick={() => handleRenameDivision(div.id)} style={{ fontSize: 12, fontWeight: 700, color: c.teal, border: 'none', background: 'none', cursor: 'pointer' }}>Save</button>
                          <button onClick={() => { setRenamingId(null); setRenameValue(''); }} style={{ fontSize: 12, color: c.textLight, border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontFamily: font.playfair, fontSize: 16, fontWeight: 700, color: c.navy, letterSpacing: '-0.01em' }}>
                            {div.name}
                          </div>
                          {div.sector && (
                            <div style={{
                              display: 'inline-block', marginTop: 4, fontSize: 9, fontWeight: 800,
                              padding: '2px 7px', background: c.gold50, color: '#8C6A0A',
                              borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase',
                            }}>
                              {div.sector}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', gap: 16, paddingTop: 10,
                    borderTop: `1px dotted ${c.rule}`, fontSize: 11,
                    color: c.textLight, fontFamily: font.dm,
                  }}>
                    <span>
                      <strong style={{ color: c.navy, fontWeight: 700 }}>
                        {members.filter(m => m.profile?.division_id === div.id).length}
                      </strong> members
                    </span>
                    {isAdmin && renamingId !== div.id && (
                      <>
                        <span style={{ color: c.ruleStrong }}>·</span>
                        <button onClick={() => { setRenamingId(div.id); setRenameValue(div.name); }} style={{ fontSize: 11, color: c.textLight, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Rename</button>
                        {!div.is_default && (
                          <>
                            <span style={{ color: c.ruleStrong }}>·</span>
                            <button onClick={() => handleDeleteDivision(div.id)} style={{ fontSize: 11, color: c.red, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Delete</button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* New Division card */}
              {canCreateDivision && (
                <>
                  {showCreateDivision ? (
                    <div style={{ padding: 18, border: `1.5px dashed ${c.ruleStrong}`, borderRadius: 12, background: 'transparent' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: c.navy, marginBottom: 10, marginTop: 0 }}>Create new division</p>
                      <input
                        type="text"
                        placeholder="e.g. Sales, Operations, West Africa"
                        value={newDivisionName}
                        onChange={e => { setNewDivisionName(e.target.value); setDivisionError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleCreateDivision()}
                        style={{
                          width: '100%', border: `1px solid ${c.rule}`, borderRadius: 8,
                          padding: '8px 12px', fontSize: 13, outline: 'none', marginBottom: 10,
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleCreateDivision}
                          disabled={creatingDivision || !newDivisionName.trim()}
                          style={{
                            flex: 1, padding: '6px 12px', borderRadius: 8, fontSize: 12,
                            fontWeight: 600, border: 'none', background: c.teal, color: '#fff',
                            cursor: 'pointer', opacity: (creatingDivision || !newDivisionName.trim()) ? 0.5 : 1,
                          }}
                        >
                          {creatingDivision ? 'Creating…' : 'Create'}
                        </button>
                        <button
                          onClick={() => { setShowCreateDivision(false); setNewDivisionName(''); setDivisionError(''); }}
                          style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 12,
                            border: `1px solid ${c.rule}`, background: '#fff', color: c.textLight, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                      {divisionError && <p style={{ fontSize: 12, color: c.red, fontWeight: 600, marginTop: 8 }}>{divisionError}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCreateDivision(true)}
                      style={{
                        padding: 18, border: `1.5px dashed ${c.ruleStrong}`, borderRadius: 12,
                        background: 'transparent', color: c.textLight, fontFamily: font.dm,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 110,
                      }}
                    >
                      + New Division
                    </button>
                  )}
                </>
              )}

              {!canCreateDivision && isAdmin && maxDivisions !== null && divisions.length >= maxDivisions && (
                <Link
                  href="/pricing"
                  style={{
                    padding: 18, border: `1.5px dashed ${c.ruleStrong}`, borderRadius: 12,
                    background: 'transparent', color: c.textLight, fontFamily: font.dm,
                    fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 110,
                  }}
                >
                  Upgrade for more divisions →
                </Link>
              )}
            </div>
          </>
        )}

        {/* ━━━ Exhibit 4 — Recent Activity ━━━ */}
        <div id="team-audit-section" className="exhibit-head">
          <div>
            <div className="exhibit-num">Exhibit 4</div>
            <div className="exhibit-title">Recent activity</div>
            <div className="exhibit-sub">Audit trail - last actions across the workspace</div>
          </div>
          {activities.length > 0 && (
            <div className="exhibit-meta">
              <span className="count">{activities.length} event{activities.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div className="panel" style={{ overflow: 'hidden' }}>
          {activityLoading && (
            <div style={{ padding: '24px 18px', textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0D8F8F] border-t-transparent mx-auto" />
            </div>
          )}

          {!activityLoading && activities.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: c.gray, margin: 0 }}>
                No activity recorded yet. Activity will appear here as team members sign in, upload portfolio data, and resolve actions.
              </p>
            </div>
          )}

          {!activityLoading && activities.length > 0 && (
            <div>
              {activities.map((a, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 18px',
                    borderBottom: idx < activities.length - 1 ? `1px solid ${c.rule}` : 'none',
                    background: idx % 2 === 1 ? c.paper : '#fff',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, marginTop: 1,
                    background: a.type === 'login' ? c.teal50
                      : a.type === 'action' ? '#F5F3FF'
                      : c.gold50,
                    color: a.type === 'login' ? c.teal
                      : a.type === 'action' ? '#7C3AED'
                      : '#8C6A0A',
                  }}>
                    {a.type === 'login' ? '↗' : a.type === 'action' ? '✓' : '◈'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: c.navy, fontFamily: font.dm, lineHeight: 1.5 }}>
                      {a.description}
                    </div>
                    <div style={{ fontSize: 11, color: c.gray, fontFamily: font.dm, marginTop: 2 }}>
                      {a.actor && <span style={{ fontWeight: 600, color: c.textLight }}>{a.actor}</span>}
                      {a.actor && ' · '}
                      {formatRelativeTime(a.timestamp)}
                      {a.pillar && (
                        <span style={{
                          marginLeft: 8, fontSize: 9, fontWeight: 800,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '1px 5px', borderRadius: 2,
                          background: c.paper2, color: c.textLight,
                        }}>
                          {a.pillar}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Commentary callout ── */}
        <div className="commentary">
          <div className="commentary-label">Workspace status</div>
          <div className="commentary-text">
            Workspace is in good standing. <strong>{tierLabel} tier active</strong>.
            {pendingInvitations?.length > 0 && (
              <> {pendingInvitations.length} pending invite{pendingInvitations.length !== 1 ? 's' : ''} awaiting acceptance.</>
            )}
            {seatCap !== null && usedSeats >= seatCap && (
              <> <em style={{ fontStyle: 'normal', color: 'var(--red-brand, #C0392B)', fontWeight: 700 }}>Seat limit reached</em> - upgrade to add more members.</>
            )}
          </div>
        </div>

        {/* ── Doc Footer ── */}
        <div className="doc-footer">
          <span>MarginCOS · Team management</span>
          <span>Rev 04·26·a · {team?.name} · {tierLabel}</span>
        </div>

      </div>
    </>
  );
}

/* ── Table cell style helpers ── */
const thStyle = {
  background: '#FBFBFC',
  borderBottom: '1px solid #E2E6EC',
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 9.5, fontWeight: 800,
  color: '#5A6B80',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontFamily: "'DM Sans', system-ui, sans-serif",
};
const tdStyle = {
  padding: '11px 14px',
  borderBottom: '1px solid #E2E6EC',
  color: '#1B2A4A',
  verticalAlign: 'middle',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: 12.5,
};

TeamPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

function formatRelativeTime(iso) {
  if (!iso) return '';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const mins  = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days  = Math.floor(diffMs / 86400000);

  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hours < 24)  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1)  return 'yesterday';
  if (days < 7)    return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function LockIcon() {
  return (
    <svg className="w-6 h-6 text-purple-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
