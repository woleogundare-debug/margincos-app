import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSupabaseClient } from '../lib/supabase/client';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    const sb = getSupabaseClient();
    const { error: authError } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : authError.message);
    } else {
      router.replace('/dashboard/portfolio');
    }
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
            <Link href="/" className="inline-flex items-baseline gap-0.5">
              <span className="text-3xl font-black text-navy">Margin</span>
              <span className="text-3xl font-black" style={{ color: '#C0392B' }}>COS</span>
            </Link>
            <p className="text-sm text-slate-500 mt-2">Your commercial data is waiting. Sign in to continue.</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
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
                <input
                  type="password" autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  placeholder="••••••••"
                />
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
