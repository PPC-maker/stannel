'use client';

import { useEffect } from 'react';

export default function SplashScreen() {
  useEffect(() => {
    // Skip splash screen inside mobile app WebView
    if (navigator.userAgent.includes('STANNEL-App')) return;

    // Create splash screen element
    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.innerHTML = `
      <img src="/logoNew.png" alt="STANNEL" />
      <div class="splash-text">...אנחנו עוברים לדף המבוקש</div>
      <div class="splash-loader"></div>
    `;
    document.body.prepend(splash);

    // Hide splash when everything is loaded
    function hideSplash() {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 500);
    }

    if (document.readyState === 'complete') {
      // Already loaded, hide after a brief moment
      setTimeout(hideSplash, 300);
    } else {
      window.addEventListener('load', hideSplash);
    }

    // Safety timeout - remove after 4 seconds max
    const safetyTimer = setTimeout(hideSplash, 4000);

    // Service worker cleanup is handled by the build-version check in layout.tsx head script.
    // Only clean up stale SWs on first visit per session to avoid unnecessary work on every navigation.
    if (!sessionStorage.getItem('sw-cleaned')) {
      sessionStorage.setItem('sw-cleaned', '1');
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => reg.unregister());
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
    }

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('load', hideSplash);
      splash.remove();
    };
  }, []);

  return null;
}
