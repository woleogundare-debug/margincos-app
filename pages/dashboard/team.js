import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../hooks/useAuth';
import { requireAuth } from '../../lib/supabase/server';

export default function TeamPage() {
  const { team, members, isAdmin, loading } = useTeam();
  const { user, tier } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [error, setError] = useState('');

  const isEnterprise = tier === 'enterprise' || tier === 'admin';

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setError('');
    try {
      const { inviteMember } = useTeam;
      const supabase = (await import('../../lib/supabase/client')).getSupabaseClient();
      const { data, error: insertError } = await supabase
        .from('team_invitations')
        .insert([{ team_id: team.id, email: inviteEmail, role: inviteRole }])
        .select()
        .single();
      if (insertError) throw insertError;

      await fetch('/api/team/invite', {
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
      setInviteSent(true);
      setInviteEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <Head><title>Team Management | MarginCOS</title></Head>
      <DashboardLayout title="Team Management">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-navy mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Team Management
          </h1>
          <p className="text-slate-500 text-sm mb-8">{team?.name || 'Your team'} · {tier} plan</p>

          {!isEnterprise && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <LockIcon />
                <div>
                  <h3 className="font-semibold text-navy mb-1">Multi-user access is an Enterprise feature</h3>
                  <p className="text-sm text-slate-600">Upgrade to Enterprise to invite your CFO, Commercial Director, and Sales team to collaborate on the same portfolio data.</p>
                  <Link href="/pricing" className="inline-block mt-3 text-sm font-semibold" style={{ color: '#C0392B' }}>
                    View Enterprise plan &rarr;
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
                  No team members yet. {isEnterprise ? 'Invite your colleagues below.' : 'Upgrade to Enterprise to invite team members.'}
                </div>
              )}
              {members.map(m => (
                <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy">{m.profiles?.full_name || m.profiles?.email || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{m.profiles?.email}</p>
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

          {/* Invite form — Enterprise only */}
          {isAdmin && isEnterprise && (
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

export async function getServerSideProps({ req, res }) {
  const auth = await requireAuth(req, res);
  if (auth.redirect) return auth;
  return { props: {} };
}
