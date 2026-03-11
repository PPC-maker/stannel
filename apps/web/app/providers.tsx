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
            staleTime: 5 * 60 * 1000, // 5 דקות - נתונים "טריים" יותר זמן
            gcTime: 30 * 60 * 1000, // 30 דקות - cache נשמר יותר
            refetchOnWindowFocus: false,
            refetchOnMount: false, // לא מביא מחדש בכל mount - מהירות!
            refetchOnReconnect: false,
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
