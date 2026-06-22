// Shared injected JavaScript for WebView
// Hides web bottom nav, accessibility widget, and splash screen
// Keeps top navbar visible (same as website experience)

export const HIDE_WEB_NAV_JS = `
(function() {
  // Prevent double injection
  if (window.__STANNEL_MOBILE_INJECTED) return true;
  window.__STANNEL_MOBILE_INJECTED = true;

  // Create persistent style element
  var style = document.createElement('style');
  style.id = 'stannel-mobile-overrides';
  style.textContent = [
    // Hide web bottom navigation
    '#web-bottom-nav, .web-bottom-nav, nav[aria-label="ניווט תחתון"] {',
    '  display: none !important;',
    '  visibility: hidden !important;',
    '  height: 0 !important;',
    '  overflow: hidden !important;',
    '  pointer-events: none !important;',
    '}',
    // Hide splash screen
    '#splash-screen { display: none !important; }',
    // Remove bottom padding that was for web nav
    'body { padding-bottom: 0 !important; margin-bottom: 0 !important; }',
    // Hide accessibility widget
    '.accessibility-widget, [class*="accessibility"], button[aria-label="פתח תפריט נגישות"] {',
    '  display: none !important;',
    '}',
    // Hide fixed accessibility buttons
    '.fixed.bottom-24, .fixed.z-50.w-14 { display: none !important; }',
    // Prevent text zoom issues
    'html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }',
    // Smoother scrolling
    'html, body { -webkit-overflow-scrolling: touch; overscroll-behavior: none; }',
    // Hide any install PWA prompts
    '[class*="install-prompt"], [class*="pwa-prompt"] { display: none !important; }',
  ].join(' ');

  // Remove old style if exists (for re-injection)
  var oldStyle = document.getElementById('stannel-mobile-overrides');
  if (oldStyle) oldStyle.remove();

  document.head.appendChild(style);

  // Force add mobile class to body
  document.body.classList.add('stannel-mobile-app');

  // Actively hide bottom nav elements
  function hideElements() {
    var selectors = [
      '#web-bottom-nav',
      '.web-bottom-nav',
      'nav[aria-label="ניווט תחתון"]',
      '#splash-screen'
    ];
    selectors.forEach(function(sel) {
      var el = document.querySelector(sel);
      if (el) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.height = '0';
      }
    });
  }
  hideElements();

  // Watch for DOM changes and keep elements hidden
  var observer = new MutationObserver(function() {
    hideElements();
    // Re-add mobile class in case it was removed
    if (!document.body.classList.contains('stannel-mobile-app')) {
      document.body.classList.add('stannel-mobile-app');
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Set mobile viewport
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

  // Handle SPA navigation - reset injection flag on popstate
  window.addEventListener('popstate', function() {
    hideElements();
  });

  // Intercept pushState/replaceState for SPA navigation detection
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  history.pushState = function() {
    origPush.apply(this, arguments);
    setTimeout(hideElements, 100);
  };
  history.replaceState = function() {
    origReplace.apply(this, arguments);
    setTimeout(hideElements, 100);
  };

  true;
})();
`;

export const WEB_URL = 'https://stannelclub.co.il';
