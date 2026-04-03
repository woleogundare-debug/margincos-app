import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../lib/supabase/client';
import { AnalysisProvider } from '../contexts/AnalysisContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
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

  // getLayout pattern: each page can export a static .getLayout function that
  // wraps its content in a persistent layout. DashboardLayout is mounted once
  // in _app.js and never unmounts during dashboard→dashboard navigation —
  // sidebar DOM, scroll position, and hamburger state all persist across routes.
  const getLayout = Component.getLayout || ((page) => page);

  const isDashboard = router.pathname.startsWith('/dashboard');

  return isDashboard ? (
    <CurrencyProvider>
      <AnalysisProvider>
        {getLayout(<Component {...pageProps} />)}
      </AnalysisProvider>
    </CurrencyProvider>
  ) : (
    <CurrencyProvider>
      {getLayout(<Component {...pageProps} />)}
    </CurrencyProvider>
  );
}
