import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSupabaseClient } from '../../lib/supabase/client';

const TIERS = ['essentials', 'professional', 'enterprise'];

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminPanel() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    tier: 'professional',
    adminName: '',
    adminEmail: '',
    tempPassword: generatePassword(),
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) { router.push('/login'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    setToken(session.access_token);

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_superadmin) { router.push('/dashboard/portfolio'); return; }

    loadClients(session.access_token);
  };

  const loadClients = async (accessToken) => {
    const res = await fetch('/api/admin/get-clients', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setClients(data.teams || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.companyName || !form.adminEmail || !form.adminName) {
      setError('All fields are required'); return;
    }
    setCreating(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/admin/create-client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.success) {
      setSuccess(`${form.companyName} created. Welcome email sent to ${form.adminEmail}.`);
      setForm({ companyName: '', tier: 'professional', adminName: '', adminEmail: '', tempPassword: generatePassword() });
      setShowForm(false);
      loadClients(token);
    } else {
      setError(data.error || 'Something went wrong');
    }
    setCreating(false);
  };

  const tierColour = (tier) => {
    if (tier === 'enterprise') return { background: '#1B2A4A', color: 'white' };
    if (tier === 'professional') return { background: '#0D8F8F', color: 'white' };
    return { background: '#E8ECF0', color: '#5A6B80' };
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading admin panel...</p>
    </div>
  );

  return (
    <>
      <Head><title>Admin Panel | MarginCOS</title></Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div style={{ background: '#1B2A4A' }} className="px-8 py-4 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="text-white">Margin</span>
              <span style={{ color: '#C0392B' }}>COS</span>
            </span>
            <span className="text-gray-400 text-sm ml-3">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard/portfolio" className="text-gray-400 hover:text-white text-sm">
              ← Back to Dashboard
            </a>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-10">
          {/* Page title + action */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', serif" }}>
                Client Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">{clients.length} active client{clients.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: '#C0392B' }}
            >
              {showForm ? 'Cancel' : '+ New Client'}
            </button>
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-sm text-teal-800">
              {success}
            </div>
          )}

          {/* Create client form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
              <h2 className="font-semibold text-navy mb-5">New Client Account</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flour Mills of Nigeria"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Subscription Tier *
                  </label>
                  <select
                    value={form.tier}
                    onChange={e => setForm({ ...form, tier: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none bg-white"
                  >
                    {TIERS.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Admin Contact Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adebayo Okonkwo"
                    value={form.adminName}
                    onChange={e => setForm({ ...form, adminName: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Admin Work Email *
                  </label>
                  <input
                    type="email"
                    placeholder="cfo@flourmills.com"
                    value={form.adminEmail}
                    onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Temporary Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.tempPassword}
                    onChange={e => setForm({ ...form, tempPassword: e.target.value })}
                    className="flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none font-mono focus:ring-1 focus:ring-teal"
                  />
                  <button
                    onClick={() => setForm({ ...form, tempPassword: generatePassword() })}
                    className="px-4 py-2.5 border rounded-lg text-sm text-gray-500 hover:text-navy hover:border-navy transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  This will be included in the welcome email. Client should reset on first login.
                </p>
              </div>
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-6 py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#C0392B' }}
              >
                {creating ? 'Creating account & sending welcome email...' : 'Create Client Account →'}
              </button>
            </div>
          )}

          {/* Client list */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-navy">Active Clients</h2>
            </div>
            {clients.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">
                No clients yet. Create your first client account above.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {clients.map(team => (
                  <div key={team.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: '#E8EBF0', color: '#1B2A4A' }}
                      >
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{team.name}</p>
                        <p className="text-xs text-gray-400">
                          {team.team_members?.length || 0} user{team.team_members?.length !== 1 ? 's' : ''} · Created {new Date(team.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                        style={tierColour(team.tier)}
                      >
                        {team.tier}
                      </span>
                      <div className="text-right">
                        {team.team_members?.slice(0, 2).map(m => (
                          <p key={m.id} className="text-xs text-gray-400">
                            {m.profiles?.email}
                          </p>
                        ))}
                        {team.team_members?.length > 2 && (
                          <p className="text-xs text-gray-300">+{team.team_members.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
