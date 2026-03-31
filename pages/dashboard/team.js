import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../hooks/useAuth';
import useDivisions from '../../hooks/useDivisions';
import { TIER_LIMITS } from '../../lib/constants';

export default function TeamPage() {
  const { team, members, pendingInvitations, isAdmin, loading } = useTeam();
  const { user, tier } = useAuth();
  const {
    divisions,
    createDivision,
    renameDivision,
    archiveDivision,
    hasDivisions,
  } = useDivisions(team?.id);

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
    <DashboardLayout>
      <div className="p-8 text-gray-400 text-sm">Loading team...</div>
    </DashboardLayout>
  );

  if (!team) return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-navy mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Team Management</h1>
        <p className="text-gray-500 text-sm">You are not currently assigned to a team. Contact your administrator.</p>
      </div>
    </DashboardLayout>
  );

  return (
    <>
      <Head><title>Team Management | MarginCOS</title></Head>
      <DashboardLayout title="Team Management">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-navy mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Team Management
          </h1>
          <p className="text-slate-500 text-sm mb-8">{team?.name || 'Your team'} · {tier} plan</p>

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

          {/* Members list */}
          <div className="bg-white rounded-xl border border-slate-100 mb-6">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-navy">Team Members ({members.length})</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {loading && (
                <div className="px-6 py-8 text-center text-slate-400 text-sm">Loading...</div>
              )}
              {!loading && members.length === 0 && (
                <div className="px-6 py-8 text-center text-slate-400 text-sm">
                  No team members yet. {isProfessionalOrAbove ? 'Invite your colleagues below.' : 'Upgrade to Professional or Enterprise to invite team members.'}
                </div>
              )}
              {members.map(m => (
                <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{m.profile?.full_name || m.profile?.email || 'Team Member'}</p>
                    <p className="text-xs text-slate-400">{m.profile?.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                      m.role === 'admin'
                        ? 'bg-navy text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invite form — Professional + Enterprise */}
          {isAdmin && isProfessionalOrAbove && (
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <h2 className="font-semibold text-navy mb-4">Invite a team member</h2>
              {inviteSent && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-sm text-teal-800">
                  Invitation sent. They'll receive an email to set up their account.
                </div>
              )}
              <div className="flex gap-3">
                <input type="email" placeholder="colleague@company.com" value={inviteEmail}
                  onChange={e => { setInviteEmail(e.target.value); setInviteSent(false); }}
                  className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none bg-white">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={handleInvite} disabled={inviting || !inviteEmail}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all"
                  style={{ backgroundColor: '#C0392B' }}>
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
              <p className="text-xs text-slate-400 mt-3">
                Invitees will receive an email to create their account. They'll have immediate access to all shared portfolio data.
              </p>
            </div>
          )}

          {/* Divisions section — visible to admins on Professional/Enterprise */}
          {isProfessionalOrAbove && (
            <div className="bg-white rounded-xl border border-slate-100 mt-6">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-navy">Divisions ({divisions.length})</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {maxDivisions === null
                      ? 'Unlimited divisions on Enterprise'
                      : `Up to ${maxDivisions} division${maxDivisions !== 1 ? 's' : ''} on ${tier === 'professional' ? 'Professional' : tier} plan`}
                  </p>
                </div>
                {canCreateDivision && !showCreateDivision && (
                  <button
                    onClick={() => setShowCreateDivision(true)}
                    className="text-sm font-semibold px-4 py-2 rounded-lg border border-teal text-teal hover:bg-teal-50 transition-colors"
                    style={{ color: '#0D8F8F', borderColor: '#0D8F8F' }}>
                    + New Division
                  </button>
                )}
                {!canCreateDivision && isAdmin && maxDivisions !== null && divisions.length >= maxDivisions && (
                  <Link href="/pricing" className="text-xs font-semibold text-slate-400 hover:text-navy transition-colors">
                    Upgrade for more →
                  </Link>
                )}
              </div>

              {/* Create Division inline form */}
              {showCreateDivision && (
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex gap-3 items-start">
                    <input
                      type="text"
                      placeholder="Division name (e.g. Sales, Operations, West Africa)"
                      value={newDivisionName}
                      onChange={e => { setNewDivisionName(e.target.value); setDivisionError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleCreateDivision()}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateDivision}
                      disabled={creatingDivision || !newDivisionName.trim()}
                      className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-all whitespace-nowrap"
                      style={{ backgroundColor: '#0D8F8F' }}>
                      {creatingDivision ? 'Creating…' : 'Create'}
                    </button>
                    <button
                      onClick={() => { setShowCreateDivision(false); setNewDivisionName(''); setDivisionError(''); }}
                      className="px-3 py-2 rounded-lg text-sm text-slate-500 border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                      Cancel
                    </button>
                  </div>
                  {divisionError && <p className="text-xs text-red-600 font-medium mt-2">{divisionError}</p>}
                </div>
              )}

              {/* Division list */}
              <div className="divide-y divide-slate-50">
                {divisions.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm">
                    No divisions yet. Create one to segment your portfolio analysis.
                  </div>
                )}
                {divisions.map(div => (
                  <div key={div.id} className="px-6 py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {renamingId === div.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameDivision(div.id);
                              if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                            }}
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                            autoFocus
                          />
                          <button onClick={() => handleRenameDivision(div.id)} className="text-xs text-teal font-semibold" style={{ color: '#0D8F8F' }}>Save</button>
                          <button onClick={() => { setRenamingId(null); setRenameValue(''); }} className="text-xs text-slate-400">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-navy truncate">{div.name}</span>
                          {div.is_default && (
                            <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide bg-teal-50 text-teal-700">
                              Default
                            </span>
                          )}
                          {div.sector && (
                            <span className="flex-shrink-0 text-xs text-slate-400">{div.sector}</span>
                          )}
                        </>
                      )}
                    </div>
                    {isAdmin && renamingId !== div.id && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-3">
                        <button
                          onClick={() => { setRenamingId(div.id); setRenameValue(div.name); }}
                          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded transition-colors">
                          Rename
                        </button>
                        {!div.is_default && (
                          <button
                            onClick={() => handleArchiveDivision(div.id)}
                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded transition-colors">
                            Archive
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Division error (archive/rename errors) */}
              {divisionError && !showCreateDivision && (
                <div className="px-6 py-3 border-t border-red-100 bg-red-50">
                  <p className="text-xs text-red-600 font-medium">{divisionError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

function LockIcon() {
  return (
    <svg className="w-6 h-6 text-purple-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
