import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

export function useAuth() {
  const [session,  setSession]  = useState(null);
  const [user,     setUser]     = useState(null);
  const [tier,     setTier]     = useState('essentials');
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [loading,  setLoading]  = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    try {
      const { data } = await sb
        .from('profiles')
        .select('tier, is_admin, company_name')
        .eq('user_id', userId)
        .single();
      if (data) {
        setTier(data.tier || 'essentials');
        setIsAdmin(data.is_admin || false);
        setCompanyName(data.company_name || '');
      }
    } catch (_) {
      // Network error or missing profile row — silently fall back to 'essentials'
    }
  }, []);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }

    // Hydrate session immediately on mount — don't rely solely on INITIAL_SESSION
    // which can fire before the browser client has read the session from cookies.
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        try {
          await fetchProfile(session.user.id);
        } finally {
          setLoading(false);   // always fires — even if fetchProfile errors
        }
      } else {
        setLoading(false);     // no session — don't leave spinner running forever
      }
    });

    // Keep the listener for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          await fetchProfile(session.user.id);
        } finally {
          setLoading(false);   // always fires — even if fetchProfile errors
        }
      } else {
        setTier('essentials');
        setIsAdmin(false);
        setCompanyName('');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
  }, []);

  return {
    session,
    user,
    tier,
    isAdmin,
    companyName,
    loading,
    signOut,
    isEnterprise:        tier === 'enterprise',
    isProfessional:      tier === 'professional' || tier === 'enterprise',
    mustChangePassword:  session?.user?.user_metadata?.must_change_password === true,
  };
}
