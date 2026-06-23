import { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform, TouchableOpacity, Text, ActivityIndicator, Linking } from 'react-native';
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

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/terms', '/privacy', '/onboarding', '/about'];
const SUPPLIER_DASHBOARD_PATHS = ['/supplier/invoices', '/supplier/payments', '/supplier/profile'];

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [isAuthPage, setIsAuthPage] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Safety timeout - hide loader after 5 seconds no matter what
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 5000);
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

  const getActiveTabFromUrl = useCallback((url: string): string => {
    if (!url) return 'home';
    const path = url.replace(WEB_URL, '');
    if (path === '/supplier' || SUPPLIER_DASHBOARD_PATHS.some(p => path.startsWith(p))) return 'home';
    if (path.startsWith('/rewards')) return 'rewards';
    if (path.startsWith('/suppliers')) return 'suppliers';
    if (path.startsWith('/invoices')) return 'invoices';
    if (path.startsWith('/profile') || path.startsWith('/settings')) return 'profile';
    if (path.startsWith('/wallet') || path === '/' || path === '') return 'home';
    return 'home';
  }, []);

  const checkIsAuthPage = useCallback((url: string): boolean => {
    if (!url) return true;
    const path = url.replace(WEB_URL, '');
    if (path === '/' || path === '') return true; // Root redirects to login
    return AUTH_PAGES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'));
  }, []);

  const handleTabPress = useCallback((tab: typeof TABS[0]) => {
    if (activeTab === tab.key && !tabLoading) {
      webViewRef.current?.reload();
      return;
    }
    setActiveTab(tab.key);
    setTabLoading(true);
    // Simple, reliable navigation
    webViewRef.current?.injectJavaScript(`window.location.href = '${WEB_URL}${tab.path}'; true;`);
    setTimeout(() => setTabLoading(false), 3000);
  }, [activeTab, tabLoading]);

  const handleShouldStartLoad = useCallback((event: WebViewNavigation) => {
    const { url } = event;
    if (url.startsWith(WEB_URL) || url.startsWith('about:') || url === 'about:blank') {
      return true;
    }
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  const handleNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    const url = navState.url || '';

    if (!navState.loading) {
      setInitialLoad(false);
      setTabLoading(false);
    }

    setIsAuthPage(checkIsAuthPage(url));
    setActiveTab(getActiveTabFromUrl(url));
  }, [checkIsAuthPage, getActiveTabFromUrl]);

  const handleLoadEnd = useCallback(() => {
    setInitialLoad(false);
    setTabLoading(false);
    webViewRef.current?.injectJavaScript(HIDE_WEB_NAV_JS);
  }, []);

  const handleError = useCallback(() => {
    // On error, retry loading after a short delay
    setTimeout(() => {
      webViewRef.current?.reload();
    }, 2000);
  }, []);

  const TAB_BAR_HEIGHT = 60 + insets.bottom;
  const showTabBar = !isAuthPage;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/login` }}
        style={styles.webview}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onHttpError={handleError}
        injectedJavaScript={HIDE_WEB_NAV_JS}
        onMessage={() => {}}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingView}>
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
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        userAgent="STANNEL-App/1.0"
        textZoom={100}
      />

      {/* Loading overlay */}
      {(initialLoad || tabLoading) && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#C9A961" />
        </View>
      )}

      {/* Spacer to push content above tab bar */}
      {showTabBar && <View style={{ height: TAB_BAR_HEIGHT, backgroundColor: '#1a1d21' }} />}

      {/* Native Tab Bar */}
      {showTabBar && (
        <View style={[styles.tabBar, { height: TAB_BAR_HEIGHT, paddingBottom: insets.bottom }]}>
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
    backgroundColor: '#060f1f',
  },
  loadingView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060f1f',
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
