'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { pushApi } from '@stannel/api-client';

type PushInfo = { token: string; platform: 'ios' | 'android' };

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
    __STANNEL_PUSH?: PushInfo;
  }
}

// Inside the STANNEL mobile app only: once a user is logged in, ask the native shell for
// the device push token (it also shows the OS permission prompt) and register it with the
// backend. Renders nothing, never throws, and does nothing in a normal browser.
export default function PushRegistrar() {
  const { user } = useAuth();
  const registeredFor = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ReactNativeWebView || !user?.id) return;

    const register = async (info: PushInfo) => {
      const key = `${user.id}:${info.token}`;
      if (registeredFor.current === key) return;
      try {
        await pushApi.registerDevice(info.token, info.platform);
        registeredFor.current = key;
      } catch {
        // non-critical — will retry on next app start
      }
    };

    const onToken = (event: Event) => {
      const info = (event as CustomEvent<PushInfo>).detail;
      if (info?.token) register(info);
    };
    window.addEventListener('stannel-push-token', onToken);

    if (window.__STANNEL_PUSH?.token) {
      register(window.__STANNEL_PUSH);
    } else {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STANNEL_PUSH_INIT' }));
      } catch {
        // ignore
      }
    }

    return () => window.removeEventListener('stannel-push-token', onToken);
  }, [user?.id]);

  return null;
}
