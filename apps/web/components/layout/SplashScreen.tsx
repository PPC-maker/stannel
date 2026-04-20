'use client';

import { useEffect } from 'react';

export default function SplashScreen() {
  useEffect(() => {
    // Create splash screen element
    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.innerHTML = `
      <img src="/logo-f.png" alt="STANNEL" />
      <div class="splash-text">...המערכת נטענת</div>
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

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('load', hideSplash);
      splash.remove();
    };
  }, []);

  return null;
}
