import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSupabaseClient } from '../lib/supabase/client';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const sb = getSupabaseClient();
      const { error: updateError } = await sb.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError('Unable to update password. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password | MarginCOS</title>
        <meta name="description" content="Set a new password for your MarginCOS account." />
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
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-navy mb-2">Set new password</h2>
            <p className="text-sm text-slate-500 mb-6">Choose a strong password for your account.</p>

            {success ? (
              <p className="text-emerald-600 text-sm text-center py-4">
                Password updated. Redirecting to login...
              </p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New password"
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
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm
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
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-colors"
                  style={{ backgroundColor: '#C0392B' }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            <Link href="/login" className="text-teal hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
