'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Dynamically import the actual providers to avoid SSR/prerender hook errors
const ClientProviders = dynamic(() => import('./client-providers'), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
