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

    // Always unregister stale Service Workers and clear JS chunk caches on every load.
    // sessionStorage persists across Ctrl+Shift+R, so we must NOT gate this on a session flag —
    // otherwise stale SWs survive hard refreshes and serve 404 chunk files from old builds.
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

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('load', hideSplash);
      splash.remove();
    };
  }, []);

  return null;
}
