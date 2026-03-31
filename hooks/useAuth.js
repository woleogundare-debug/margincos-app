import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';

export function useAuth() {
  const [session,  setSession]  = useState(null);
  const [user,     setUser]     = useState(null);
  const [tier,     setTier]     = useState('essentials');
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [teamId,   setTeamId]   = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const fetchProfile = useCallback(async (userId) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    try {
      const { data } = await sb
        .from('profiles')
        .select('tier, is_admin, company_name, team_id')
        .eq('user_id', userId)
        .single();
      if (data) {
        setTier(data.tier || 'essentials');
        setIsAdmin(data.is_admin || false);
        setCompanyName(data.company_name || '');

        if (data.team_id) {
          setTeamId(data.team_id);
        } else {
          // profiles.team_id may be null for admin/dev accounts not created via
          // create-client.js — fall back to team_members as the authoritative source.
          const { data: membership } = await sb
            .from('team_members')
            .select('team_id')
            .eq('user_id', userId)
            .single();
          setTeamId(membership?.team_id || null);
        }
      }
    } catch (_) {
      // Network error or missing profile row — silently fall back to 'essentials'
    } finally {
      setProfileLoaded(true); // tier is now known, one way or another
    }
  }, []);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }

    // Hydrate session immediately on mount — don't rely solely on INITIAL_SESSION
    // which can fire before the browser client has read the session from cookies.
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id); // fire-and-forget; setProfileLoaded(true) fires inside
      } else {
        setProfileLoaded(true); // no session — no profile to load, mark as resolved
      }
      setLoading(false); // always fires, regardless of session
    });

    // Keep the listener for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id); // fire-and-forget
      } else {
        setTier('essentials');
        setIsAdmin(false);
        setCompanyName('');
        setTeamId(null);
        setProfileLoaded(true); // no session — mark as resolved so nothing spins
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    // Force full-page navigation — clears all React state, hooks, and subscriptions.
    // Don't rely on the state chain (onAuthStateChange → user=null → redirect effect)
    // which can race across multiple useAuth instances.
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  return {
    session,
    user,
    tier,
    isAdmin,
    companyName,
    teamId,
    loading,
    profileLoaded,
    signOut,
    isEnterprise:        tier === 'enterprise',
    isProfessional:      tier === 'professional' || tier === 'enterprise',
    mustChangePassword:  session?.user?.user_metadata?.must_change_password === true,
  };
}
