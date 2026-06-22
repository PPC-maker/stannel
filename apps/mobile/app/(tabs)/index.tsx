import { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform, TouchableOpacity, Text, ActivityIndicator, Linking, Dimensions } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HIDE_WEB_NAV_JS, WEB_URL } from '../../lib/webview-inject';

const TABS = [
  { key: 'rewards', path: '/rewards', label: 'הטבות', icon: 'gift' as const },
  { key: 'suppliers', path: '/suppliers', label: 'ספקים', icon: 'store' as const },
  { key: 'home', path: '/wallet', label: 'בית', icon: 'home' as const, isCenter: true },
  { key: 'invoices', path: '/invoices', label: 'חשבוניות', icon: 'file-document-outline' as const },
  { key: 'profile', path: '/profile', label: 'פרופיל', icon: 'account-circle' as const },
];

// Pages where native tab bar should be hidden
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/terms', '/privacy', '/onboarding', '/about'];

// Pages that belong to supplier dashboard (not the suppliers directory)
const SUPPLIER_DASHBOARD_PATHS = ['/supplier/invoices', '/supplier/payments', '/supplier/profile'];

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [isAuthPage, setIsAuthPage] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Safety timeout - hide loader after 4 seconds max
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [canGoBack]);

  // Determine active tab from URL
  const getActiveTabFromUrl = useCallback((url: string): string => {
    if (!url) return 'home';
    const path = url.replace(WEB_URL, '');

    // Supplier dashboard pages - not the suppliers directory
    if (path === '/supplier' || SUPPLIER_DASHBOARD_PATHS.some(p => path.startsWith(p))) {
      return 'home'; // No specific tab for supplier dashboard
    }
    if (path.startsWith('/rewards')) return 'rewards';
    if (path.startsWith('/suppliers')) return 'suppliers';
    if (path.startsWith('/invoices')) return 'invoices';
    if (path.startsWith('/profile') || path.startsWith('/settings')) return 'profile';
    if (path.startsWith('/wallet') || path === '/') return 'home';
    return activeTab; // Keep current tab for other pages (events, goals, tools, etc.)
  }, [activeTab]);

  // Check if current page is an auth page (tab bar should be hidden)
  const checkIsAuthPage = useCallback((url: string): boolean => {
    if (!url) return true;
    const path = url.replace(WEB_URL, '');
    // Check if path starts with any auth page
    return AUTH_PAGES.some(authPage => path === authPage || path.startsWith(authPage + '/') || path.startsWith(authPage + '?'));
  }, []);

  const handleTabPress = useCallback((tab: typeof TABS[0]) => {
    if (activeTab === tab.key && !tabLoading) {
      // Already on this tab - refresh
      webViewRef.current?.reload();
      return;
    }
    setActiveTab(tab.key);
    setTabLoading(true);

    // Use Next.js client-side navigation for faster transitions
    const navScript = `
      (function() {
        try {
          // Try Next.js router first for instant navigation
          if (window.__NEXT_DATA__ && window.next && window.next.router) {
            window.next.router.push('${tab.path}');
          } else {
            window.location.href = '${WEB_URL}${tab.path}';
          }
        } catch(e) {
          window.location.href = '${WEB_URL}${tab.path}';
        }
        true;
      })();
    `;
    webViewRef.current?.injectJavaScript(navScript);

    // Safety timeout for tab loading
    setTimeout(() => setTabLoading(false), 3000);
  }, [activeTab, tabLoading]);

  // Handle external links
  const handleShouldStartLoad = useCallback((event: WebViewNavigation) => {
    const { url } = event;

    // Allow internal URLs
    if (url.startsWith(WEB_URL) || url.startsWith('about:') || url === 'about:blank') {
      return true;
    }

    // Open external links natively
    if (url.startsWith('https://wa.me') || url.startsWith('whatsapp://') ||
        url.startsWith('tel:') || url.startsWith('mailto:') ||
        url.startsWith('intent:') || url.startsWith('market:')) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    // Any other external URL
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  const handleNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    const url = navState.url || '';
    setCurrentUrl(url);

    // Hide initial loader once page loads
    if (!navState.loading) {
      setInitialLoad(false);
      setTabLoading(false);
    }

    // Update auth page state
    setIsAuthPage(checkIsAuthPage(url));

    // Update active tab
    setActiveTab(getActiveTabFromUrl(url));
  }, [checkIsAuthPage, getActiveTabFromUrl]);

  // Re-inject CSS on every page load to ensure web nav stays hidden
  const handleLoadEnd = useCallback(() => {
    setInitialLoad(false);
    setTabLoading(false);
    // Re-inject the hiding script after every page load
    webViewRef.current?.injectJavaScript(HIDE_WEB_NAV_JS);
  }, []);

  const tabBarHeight = 65 + insets.bottom;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={[
          styles.webview,
          // Add bottom padding when tab bar is visible so content isn't hidden behind it
          !isAuthPage && { marginBottom: tabBarHeight }
        ]}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={HIDE_WEB_NAV_JS}
        onMessage={() => {}} // Required for injectedJavaScript to work on some devices
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loaderOverlay, { backgroundColor: '#060f1f' }]}>
            <ActivityIndicator size="large" color="#C9A961" />
          </View>
        )}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        pullToRefreshEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        userAgent="STANNEL-App/1.0"
        decelerationRate="normal"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        textZoom={100}
      />

      {/* Loading overlay */}
      {(initialLoad || tabLoading) && (
        <View style={[styles.loaderOverlay, { bottom: isAuthPage ? 0 : tabBarHeight }]}>
          <ActivityIndicator size="large" color="#C9A961" />
        </View>
      )}

      {/* Native Tab Bar - hidden on auth pages */}
      {!isAuthPage && (
        <View style={[styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            if (tab.isCenter) {
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabPress(tab)}
                  style={styles.centerTabWrapper}
                  activeOpacity={0.7}
                >
                  <View style={[styles.centerTab, isActive && styles.centerTabActive]}>
                    <MaterialCommunityIcons name={tab.icon} color="#fff" size={26} />
                  </View>
                  <Text style={[styles.tabLabel, { color: '#C9A961' }]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabPress(tab)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  color={isActive ? '#C9A961' : 'rgba(255,255,255,0.4)'}
                  size={24}
                />
                <Text style={[styles.tabLabel, { color: isActive ? '#C9A961' : 'rgba(255,255,255,0.4)' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060f1f',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060f1f',
    zIndex: 10,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1a1d21',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    flex: 1,
  },
  centerTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -18,
  },
  centerTab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C9A961',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 3,
    borderColor: '#1a1d21',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerTabActive: {
    backgroundColor: '#b8952e',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
