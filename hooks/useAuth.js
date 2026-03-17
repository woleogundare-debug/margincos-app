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
  }, []);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { setLoading(false); return; }

    // Use onAuthStateChange as the single source of truth.
    // INITIAL_SESSION fires once the client has read cookies/storage,
    // so loading stays true until we have a definitive answer.
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setTier('essentials'); setIsAdmin(false); setCompanyName(''); }
      setLoading(false);
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
    isEnterprise:   tier === 'enterprise',
    isProfessional: tier === 'professional' || tier === 'enterprise',
  };
}
