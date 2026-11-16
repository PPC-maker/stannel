'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsApi } from '@stannel/api-client';

// Reports each page view (route change) for usage analytics. Renders nothing,
// never throws, and silently does nothing for anonymous visitors.
export default function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    let retry: ReturnType<typeof setTimeout> | undefined;
    try {
      const platform = navigator.userAgent.includes('STANNEL-App') ? 'mobile' : 'web';
      // Auth token may not be ready right after a hard load - retry once
      if (!analyticsApi.trackPageView(pathname, platform)) {
        retry = setTimeout(() => analyticsApi.trackPageView(pathname, platform), 3000);
      }
    } catch {
      // ignore
    }
    return () => {
      if (retry) clearTimeout(retry);
    };
  }, [pathname]);

  return null;
}
