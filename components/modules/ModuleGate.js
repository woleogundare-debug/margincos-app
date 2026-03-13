import { LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import Link from 'next/link';

export function ModuleGate({ tier, moduleName, description, children }) {
  const isEnterprise = tier === 'enterprise';

  if (isEnterprise) return <>{children}</>;

  return (
    <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
        <LockClosedIcon className="h-6 w-6 text-purple-600" />
      </div>
      <h3 className="text-base font-bold text-navy mb-2">{moduleName}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">{description}</p>
      <Link href="/pricing">
        <Button variant="navy" size="md">Upgrade to Enterprise</Button>
      </Link>
    </div>
  );
}
