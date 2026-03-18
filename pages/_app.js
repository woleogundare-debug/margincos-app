import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../lib/supabase/client';
import { AnalysisProvider } from '../contexts/AnalysisContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    // Refresh session on every route change — ensures the in-memory session
    // stays current and the browser client is hydrated before pages mount
    const handleRouteChange = async () => {
      await sb.auth.getSession();
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  const isDashboard = router.pathname.startsWith('/dashboard');

  return isDashboard ? (
    <AnalysisProvider>
      <Component {...pageProps} />
    </AnalysisProvider>
  ) : (
    <Component {...pageProps} />
  );
}
