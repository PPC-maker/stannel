'use client';

import dynamic from 'next/dynamic';
import { AuthGuardLoader } from '@/lib/useAuthGuard';

// Dynamic import with ssr: false — the rewards content renders ONLY on the client,
// AFTER hydration is complete. This prevents React error #310 which occurs when
// useSyncExternalStore (used by React Query in parent providers) triggers a state
// update during the SSR hydration render phase.
const RewardsContent = dynamic(() => import('./RewardsContent'), {
  ssr: false,
  loading: () => <AuthGuardLoader />,
});

export default function RewardsPage() {
  return <RewardsContent />;
}
