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

    // Nuke all Service Workers and caches to prevent stale chunks
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
