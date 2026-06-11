// Shared injected JavaScript for all WebView tabs
// Hides ONLY bottom nav and accessibility - keeps top navbar visible (same as website)

export const HIDE_WEB_NAV_JS = `
(function() {
  var style = document.createElement('style');
  style.id = 'stannel-mobile-overrides';
  style.textContent = [
    '#web-bottom-nav, .web-bottom-nav, nav[aria-label="ניווט תחתון"] { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; }',
    '#splash-screen { display: none !important; }',
    'body { padding-bottom: 0 !important; }',
    '.accessibility-widget, [class*="accessibility"], button[aria-label="פתח תפריט נגישות"] { display: none !important; }',
    '.fixed.bottom-24, .fixed.z-50.w-14 { display: none !important; }',
  ].join(' ');
  document.head.appendChild(style);

  // Force add mobile class to body
  document.body.classList.add('stannel-mobile-app');

  // Only hide bottom nav, not top nav
  function hideBottomNav() {
    var bottomNav = document.getElementById('web-bottom-nav') || document.querySelector('nav[aria-label="ניווט תחתון"]');
    if (bottomNav) {
      bottomNav.style.display = 'none';
      bottomNav.style.visibility = 'hidden';
    }
    var splash = document.getElementById('splash-screen');
    if (splash) splash.style.display = 'none';
  }
  hideBottomNav();

  var observer = new MutationObserver(hideBottomNav);
  observer.observe(document.body, { childList: true, subtree: true });

  // Set mobile viewport
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

  true;
})();
`;

export const WEB_URL = 'https://stannelclub.co.il';
