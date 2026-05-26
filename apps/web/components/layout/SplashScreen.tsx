'use client';

import { useEffect } from 'react';

export default function SplashScreen() {
  useEffect(() => {
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

    // Force update Service Worker and clear old caches
    if ('serviceWorker' in navigator) {
      // Clear all old caches first
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key !== 'stannel-v2') caches.delete(key);
          });
        });
      }
      // Register/update SW
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => { reg.update(); })
        .catch(() => {});
    }

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('load', hideSplash);
      splash.remove();
    };
  }, []);

  return null;
}
