// Shared injected JavaScript for all WebView tabs
// Hides ALL web navigation elements since the mobile app has its own native tab bar

export const HIDE_WEB_NAV_JS = `
(function() {
  var style = document.createElement('style');
  style.id = 'stannel-mobile-overrides';
  style.textContent = [
    '#web-bottom-nav, .web-bottom-nav, nav[aria-label="ניווט תחתון"] { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; }',
    '#web-top-nav, .web-top-nav, nav.fixed.top-0 { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; }',
    '#splash-screen { display: none !important; }',
    'body { padding-bottom: 0 !important; padding-top: 0 !important; margin-top: 0 !important; }',
    'main, [class*="pt-16"], [class*="mt-16"] { padding-top: 0 !important; margin-top: 0 !important; }',
    '.accessibility-widget, [class*="accessibility"], button[aria-label="פתח תפריט נגישות"] { display: none !important; }',
    '.fixed.bottom-24, .fixed.z-50.w-14 { display: none !important; }',
    'nav.fixed { display: none !important; }',
  ].join(' ');
  document.head.appendChild(style);

  // Force add mobile class to body
  document.body.classList.add('stannel-mobile-app');

  // Aggressively remove nav elements
  function hideNavs() {
    var els = document.querySelectorAll('#web-bottom-nav, #web-top-nav, .web-top-nav, .web-bottom-nav, nav.fixed, #splash-screen');
    for (var i = 0; i < els.length; i++) {
      els[i].style.display = 'none';
      els[i].style.visibility = 'hidden';
    }
  }
  hideNavs();

  // Also observe DOM changes to re-hide if nav is added dynamically
  var observer = new MutationObserver(hideNavs);
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
