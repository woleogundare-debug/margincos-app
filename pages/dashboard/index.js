import { useEffect } from 'react';
import { useRouter } from 'next/router';
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
