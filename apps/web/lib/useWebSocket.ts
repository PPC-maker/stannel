// WebSocket hook for real-time updates

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type WebSocketMessage = {
  type: 'invoice:created' | 'invoice:updated' | 'invoice:approved' | 'invoice:rejected' | 'invoice:deleted' | 'invoice:restored' | 'user:activated' | 'notification:new' | 'auth:ok' | 'auth:error' | 'pong';
  data?: any;
  timestamp: string;
};

const WS_URL = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7070';
  if (apiUrl.startsWith('https://')) return apiUrl.replace('https://', 'wss://');
  return apiUrl.replace('http://', 'ws://');
})();

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(`${WS_URL}/ws`);
      wsRef.current = ws;

      ws.onopen = async () => {
        // Authenticate WebSocket connection
        try {
          const { getIdToken } = await import('@/lib/firebase');
          const token = await getIdToken();
          if (token && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'auth', token }));
          }
        } catch {}

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Defer query invalidation to avoid React error #310:
          // "Cannot update a component while rendering a different component".
          // invalidateQueries triggers useSyncExternalStore updates which conflict
          // with in-progress renders if called synchronously from a WebSocket handler.
          const invalidate = (...keys: string[]) => {
            setTimeout(() => {
              keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
            }, 0);
          };

          switch (message.type) {
            case 'invoice:created':
            case 'invoice:updated':
            case 'invoice:approved':
            case 'invoice:rejected':
            case 'invoice:deleted':
            case 'invoice:restored':
              invalidate('invoices', 'invoice', 'supplier', 'dashboard', 'wallet', 'architect');
              break;

            case 'user:activated':
              invalidate('users', 'admin');
              break;

            case 'notification:new':
              invalidate('notifications', 'unreadNotificationsCount');
              window.dispatchEvent(new Event('notification-read'));
              break;

            case 'pong':
            case 'auth:ok':
            case 'auth:error':
              break;
          }
        } catch {
          // Silent parse error
        }
      };

      ws.onclose = () => {
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect after 5 seconds (silent)
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = () => {
        // Silent error - WebSocket will reconnect automatically
      };
    } catch {
      // Silent connection error - will retry
    }
  }, [queryClient]);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
