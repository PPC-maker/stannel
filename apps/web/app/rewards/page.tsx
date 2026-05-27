'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthGuardLoader } from '@/lib/useAuthGuard';

// Lazy-load rewards content — only renders AFTER component has mounted,
// guaranteeing hydration is fully complete before any hooks run.
const RewardsContent = lazy(() => import('./RewardsContent'));

export default function RewardsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <AuthGuardLoader />;

  return (
    <Suspense fallback={<AuthGuardLoader />}>
      <RewardsContent />
    </Suspense>
  );
}
