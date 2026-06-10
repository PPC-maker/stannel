// Shared injected JavaScript for all WebView tabs
// Hides web navigation elements since the mobile app has its own native tab bar

export const HIDE_WEB_NAV_JS = `
(function() {
  var style = document.createElement('style');
  style.id = 'stannel-mobile-overrides';
  style.textContent = [
    '#web-bottom-nav, .web-bottom-nav, nav[aria-label="ניווט תחתון"] { display: none !important; }',
    '#web-top-nav, .web-top-nav { display: none !important; }',
    'body { padding-bottom: 0 !important; padding-top: 0 !important; margin-top: 0 !important; }',
    'main, [class*="pt-16"], [class*="mt-16"] { padding-top: 0 !important; margin-top: 0 !important; }',
    '.accessibility-widget, [class*="accessibility"] { display: none !important; }',
  ].join(' ');
  document.head.appendChild(style);

  // Also observe DOM changes to re-hide if nav is added dynamically
  var observer = new MutationObserver(function() {
    var bottomNav = document.getElementById('web-bottom-nav') || document.querySelector('nav[aria-label="ניווט תחתון"]');
    if (bottomNav) bottomNav.style.display = 'none';
    var topNav = document.getElementById('web-top-nav') || document.querySelector('.web-top-nav');
    if (topNav) topNav.style.display = 'none';
  });
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

export const WEB_URL = 'https://stannel-web-1094694418275.me-west1.run.app';
