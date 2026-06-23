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

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [showTabs, setShowTabs] = useState(false);

  // Hide loader after 5s max
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const handleTabPress = useCallback((tab: typeof TABS[0]) => {
    if (activeTab === tab.key) {
      webViewRef.current?.reload();
      return;
    }
    setActiveTab(tab.key);
    setLoading(true);
    webViewRef.current?.injectJavaScript(`window.location.href='${WEB_URL}${tab.path}';true;`);
    setTimeout(() => setLoading(false), 4000);
  }, [activeTab]);

  const handleShouldStartLoad = useCallback((event: WebViewNavigation) => {
    const { url } = event;
    if (url.startsWith(WEB_URL) || url.startsWith('about:')) return true;
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  const handleNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    const url = navState.url || '';

    if (!navState.loading) setLoading(false);

    // Determine if tabs should show
    const path = url.replace(WEB_URL, '');
    const isAuth = !path || path === '/' || AUTH_PAGES.some(p => path.startsWith(p));
    setShowTabs(!isAuth);

    // Update active tab
    if (path.startsWith('/rewards')) setActiveTab('rewards');
    else if (path.startsWith('/suppliers')) setActiveTab('suppliers');
    else if (path.startsWith('/invoices')) setActiveTab('invoices');
    else if (path.startsWith('/profile') || path.startsWith('/settings')) setActiveTab('profile');
    else if (path.startsWith('/wallet') || path.startsWith('/supplier') || path.startsWith('/admin') || path.startsWith('/events') || path.startsWith('/goals') || path.startsWith('/tools') || path.startsWith('/notifications')) setActiveTab('home');
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    webViewRef.current?.injectJavaScript(HIDE_WEB_NAV_JS);
  }, []);

  return (
    <View style={styles.container}>
      {/* WebView takes all available space */}
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: `${WEB_URL}/login` }}
          style={{ flex: 1 }}
          onLoadEnd={handleLoadEnd}
          onNavigationStateChange={handleNavigationStateChange}
          onError={() => setTimeout(() => webViewRef.current?.reload(), 2000)}
          injectedJavaScript={HIDE_WEB_NAV_JS}
          onMessage={() => {}}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => <View style={styles.loader}><ActivityIndicator size="large" color="#C9A961" /></View>}
          allowsBackForwardNavigationGestures
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          cacheEnabled
          pullToRefreshEnabled
          allowsInlineMediaPlayback
          mixedContentMode="always"
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          userAgent="STANNEL-App/1.0"
          textZoom={100}
        />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#C9A961" />
        </View>
      )}

      {/* Tab Bar - simple flex child, NOT absolute positioned */}
      {showTabs && (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            if (tab.isCenter) {
              return (
                <TouchableOpacity key={tab.key} onPress={() => handleTabPress(tab)} style={styles.centerWrap} activeOpacity={0.7}>
                  <View style={[styles.centerBtn, isActive && { backgroundColor: '#b8952e' }]}>
                    <MaterialCommunityIcons name={tab.icon} color="#fff" size={26} />
                  </View>
                  <Text style={[styles.label, { color: '#C9A961' }]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity key={tab.key} onPress={() => handleTabPress(tab)} style={styles.tabItem} activeOpacity={0.7}>
                <MaterialCommunityIcons name={tab.icon} color={isActive ? '#C9A961' : 'rgba(255,255,255,0.4)'} size={24} />
                <Text style={[styles.label, { color: isActive ? '#C9A961' : 'rgba(255,255,255,0.4)' }]}>{tab.label}</Text>
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
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060f1f',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060f1f',
    zIndex: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1d21',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    flex: 1,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -18,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C9A961',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 3,
    borderColor: '#1a1d21',
    elevation: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
