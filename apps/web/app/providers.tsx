'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { useWebSocket } from '@/lib/useWebSocket';

// Component that initializes WebSocket connection for real-time updates
function WebSocketProvider({ children }: { children: ReactNode }) {
  useWebSocket();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 שניות - נתונים מתעדכנים יותר מהר
            gcTime: 10 * 60 * 1000, // 10 דקות - cache
            refetchOnWindowFocus: true, // מרפרש בחזרה לחלון
            refetchOnMount: 'always', // תמיד מרפרש ב-mount
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
