import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSupabaseClient } from '../lib/supabase/client';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function JoinPage() {
  const router = useRouter();
  const { token } = router.query;
  const [invitation, setInvitation] = useState(null);
  const [step, setStep] = useState('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) validateToken();
  }, [token]);

  const validateToken = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) { setStep('error'); return; }

    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, teams(name)')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) { setStep('error'); return; }
    setInvitation(data);
    setEmail(data.email);
    setStep('signup');
  };

  const handleAccept = async () => {
    setSubmitting(true);
    setError('');
    const supabase = getSupabaseClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });

    if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }

    await supabase.from('team_members').insert([{
      team_id: invitation.team_id,
      user_id: authData.user.id,
      role: invitation.role,
      invited_by: invitation.invited_by,
    }]);

    await supabase.from('profiles').upsert({
      id: authData.user.id,
      team_id: invitation.team_id,
      full_name: name,
    });

    await supabase.from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('token', token);

    setStep('success');
    setTimeout(() => router.push('/dashboard/portfolio'), 2000);
  };

  return (
    <>
      <Head>
        <title>Join Team | MarginCOS</title>
        <meta name="description" content="Accept your team invitation and join MarginCOS." />
      </Head>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-baseline gap-0.5">
              <span className="text-3xl font-black text-navy">Margin</span>
              <span className="text-3xl font-black" style={{ color: '#C0392B' }}>COS</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            {step === 'loading' && (
              <p className="text-center text-slate-400">Validating invitation...</p>
            )}

            {step === 'error' && (
              <div className="text-center">
                <p className="text-red-600 font-medium mb-2">Invalid or expired invitation</p>
                <p className="text-slate-500 text-sm">This link may have already been used or has expired. Contact your team admin for a new invitation.</p>
              </div>
            )}

            {step === 'signup' && invitation && (
              <>
                <h2 className="text-lg font-bold text-navy mb-1">Join {invitation.teams?.name}</h2>
                <p className="text-sm text-slate-500 mb-6">
                  You've been invited as a <strong>{invitation.role}</strong>. Create your account to get started.
                </p>
                <div className="space-y-3 mb-4">
                  <input type="text" placeholder="Full name" value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                  <input type="email" placeholder="Work email" value={email} readOnly
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none" />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password (min. 8 characters)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword
                        ? <EyeSlashIcon className="w-4 h-4" />
                        : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2.5 rounded-lg mb-3">
                    {error}
                  </div>
                )}
                <button onClick={handleAccept} disabled={submitting || !name || !password}
                  className="w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#C0392B' }}>
                  {submitting ? 'Setting up your account...' : 'Accept & Join Team'}
                </button>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-emerald-600 font-semibold">Welcome to the team!</p>
                <p className="text-slate-500 text-sm mt-2">Redirecting to your dashboard...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
