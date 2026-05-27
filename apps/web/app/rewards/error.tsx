'use client';

import { useEffect } from 'react';

/**
 * Rewards-specific error boundary.
 * React error #310 ("Cannot update a component while rendering a different component")
 * occurs on full page load due to React Query's useSyncExternalStore in providers
 * conflicting with the initial render cycle. The page always works on retry,
 * so we auto-reset silently without showing an error page.
 */
export default function RewardsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = error.message || '';
    // Auto-retry on React #310 — page always works on second render
    if (msg.includes('#310') || msg.includes('Minified React error #310')) {
      reset();
      return;
    }
    // For other errors, also try reset once
    const hasRetried = sessionStorage.getItem('rewards-error-retry');
    if (!hasRetried) {
      sessionStorage.setItem('rewards-error-retry', '1');
      reset();
    } else {
      sessionStorage.removeItem('rewards-error-retry');
    }
  }, [error, reset]);

  // Show nothing while auto-retrying (user won't see a flash)
  return null;
}
