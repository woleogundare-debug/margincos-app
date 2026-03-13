import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { requireAuth } from '../../lib/supabase/server';
import { LoadingSpinner } from '../../components/ui/index';

export default function DashboardIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/portfolio'); }, [router]);
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  const auth = await requireAuth(req, res);
  if (auth.redirect) return auth;
  return { props: {} };
}
