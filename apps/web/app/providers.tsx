'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Loading fallback - prevents white/empty flash while providers load
function ProvidersLoader({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#f7f3f2] flex flex-col items-center justify-center">
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#c99b4a]/15 blur-3xl animate-pulse" style={{ transform: 'scale(2)' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoNew.png" alt="Stannel Club" className="h-20 w-auto relative z-10" />
        </div>
        <div className="w-48 h-1 bg-[#c99b4a]/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{
            background: 'linear-gradient(90deg, #c99b4a, #d4af37, #c99b4a)',
            backgroundSize: '200% 100%',
            animation: 'shimmerBar 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
      <style>{`
        @keyframes shimmerBar { 0% { background-position: 200% 0; width: 30%; } 50% { width: 70%; } 100% { background-position: -200% 0; width: 30%; } }
      `}</style>
    </div>
  );
}

// Dynamically import the actual providers to avoid SSR/prerender hook errors
const ClientProviders = dynamic(() => import('./client-providers'), {
  ssr: false,
  loading: () => <ProvidersLoader>{null}</ProvidersLoader>,
});

export function Providers({ children }: { children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
