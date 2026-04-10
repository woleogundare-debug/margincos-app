import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSupabaseClient } from '../lib/supabase/client';
import { Button } from '../components/ui/Button';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    const sb = getSupabaseClient();

    // Subscribe BEFORE calling signInWithPassword so we never miss the
    // SIGNED_IN event that fires synchronously once the session is committed.
    // The `navigated` flag prevents double-navigation when both SIGNED_IN and
    // INITIAL_SESSION fire in rapid succession on the first login.
    let navigated = false;
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !navigated) {
        navigated = true;
        subscription.unsubscribe();
        router.replace('/dashboard/portfolio');
      }
    });

    const { error: authError } = await sb.auth.signInWithPassword({ email, password });
    if (authError) {
      subscription.unsubscribe();
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : authError.message);
      setLoading(false);
    }
    // On success: keep the loading spinner — navigation will unmount this page.
  };

  const handleResetRequest = async () => {
    if (!resetEmail) return;
    setLoading(true);
    const sb = getSupabaseClient();
    const { error } = await sb.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `https://margincos.com/reset-password`,
    });
    setLoading(false);
    if (!error) setResetSent(true);
  };

  return (
    <>
      <Head>
        <title>Sign In | MarginCOS</title>
        <meta name="description" content="Sign in to your MarginCOS account to access margin intelligence, pricing analysis, and commercial insights." />
      </Head>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              href="/"
              title="Return to MarginCOS home"
              className="inline-flex items-baseline gap-0.5 cursor-pointer transition-opacity duration-200 hover:opacity-80"
            >
              <span className="text-3xl font-black text-navy">Margin</span>
              <span className="text-3xl font-black" style={{ color: '#C0392B' }}>COS</span>
            </Link>
            <p className="text-sm text-slate-500 mt-2">Your commercial data is waiting. Sign in to continue.</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            {showReset ? (
              <div>
                <h2 className="text-lg font-bold text-navy mb-2">Reset your password</h2>
                <p className="text-sm text-slate-500 mb-4">
                  Enter your work email and we'll send you a reset link.
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal mb-3"
                />
                <button
                  onClick={handleResetRequest}
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-colors"
                  style={{ backgroundColor: '#C0392B' }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                {resetSent && (
                  <p className="text-sm text-emerald-600 mt-3 text-center">
                    Check your email for a reset link.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetSent(false); }}
                  className="text-sm text-slate-400 hover:text-navy mt-4 block mx-auto transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-bold text-navy mb-6">Sign in to your account</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Work email</label>
                    <input
                      type="email" autoComplete="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password" required
                        value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                        placeholder="••••••••"
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
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={() => setShowReset(true)}
                        className="text-xs text-teal hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2.5 rounded-lg">
                      {error}
                    </div>
                  )}
                  <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full justify-center !bg-red-brand hover:!bg-red-light">
                    Sign In
                  </Button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Need access?{' '}
            <Link href="/contact" className="text-teal font-semibold hover:text-teal-dark">
              Request a demo
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
