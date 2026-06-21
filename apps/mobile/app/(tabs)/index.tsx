import { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform, StatusBar, TouchableOpacity, Text, ActivityIndicator, Linking } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HIDE_WEB_NAV_JS, WEB_URL } from '../../lib/webview-inject';

const TABS = [
  { key: 'rewards', path: '/rewards', label: 'הטבות', icon: 'gift' as const },
  { key: 'suppliers', path: '/suppliers', label: 'ספקים', icon: 'magnify' as const },
  { key: 'home', path: '/wallet', label: 'בית', icon: 'home' as const, isCenter: true },
  { key: 'invoices', path: '/invoices', label: 'חשבוניות', icon: 'file-document-outline' as const },
  { key: 'profile', path: '/profile', label: 'פרופיל', icon: 'account-circle' as const },
];

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [isAuthPage, setIsAuthPage] = useState(true);

  // Safety timeout - hide loader after 3 seconds no matter what
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [canGoBack]);

  const handleTabPress = useCallback((tab: typeof TABS[0]) => {
    setActiveTab(tab.key);
    if (webViewRef.current) {
      // Navigate using existing Next.js Link in the page (client-side, no white flash)
      // Search navbar links which are always present
      webViewRef.current.injectJavaScript(`
        (function() {
          var links = document.querySelectorAll('a');
          for (var i = 0; i < links.length; i++) {
            var href = links[i].getAttribute('href');
            if (href === '${tab.path}') {
              links[i].click();
              return;
            }
          }
          window.location.href = '${tab.path}';
        })();
        true;
      `);
    }
  }, []);

  // Keep internal links inside WebView, open external links in browser
  const handleShouldStartLoad = useCallback((event: WebViewNavigation) => {
    const { url } = event;
    // Allow internal stannelclub.co.il URLs and about:blank
    if (url.startsWith(WEB_URL) || url.startsWith('about:') || url === 'about:blank') {
      return true;
    }
    // WhatsApp, phone, email - open externally
    if (url.startsWith('https://wa.me') || url.startsWith('tel:') || url.startsWith('mailto:')) {
      Linking.openURL(url);
      return false;
    }
    // Any other external URL - open in browser
    Linking.openURL(url);
    return false;
  }, []);

  const handleNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    const url = navState.url || '';

    // Hide initial loader once any page loads
    if (!navState.loading) setInitialLoad(false);

    // Hide footer on auth pages
    const authPages = ['/login', '/register', '/forgot-password', '/terms', '/about'];
    setIsAuthPage(authPages.some(p => url.includes(p)));

    // Update active tab based on URL
    if (url.includes('/rewards')) setActiveTab('rewards');
    else if (url.includes('/suppliers')) setActiveTab('suppliers');
    else if (url.includes('/invoices')) setActiveTab('invoices');
    else if (url.includes('/profile')) setActiveTab('profile');
    else if (url.includes('/wallet')) setActiveTab('home');
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/login` }}
        style={styles.webview}
        onLoadEnd={() => setInitialLoad(false)}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={HIDE_WEB_NAV_JS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
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
      />

      {/* Initial load spinner - only on first load, auto-hides after 3s */}
      {initialLoad && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#C9A961" />
        </View>
      )}

      {/* Native Tab Bar - hidden on auth pages */}
      {!isAuthPage && <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          if (tab.isCenter) {
            return (
              <TouchableOpacity key={tab.key} onPress={() => handleTabPress(tab)} style={styles.centerTabWrapper}>
                <View style={styles.centerTab}>
                  <MaterialCommunityIcons name={tab.icon} color="#fff" size={26} />
                </View>
                <Text style={[styles.tabLabel, { color: '#C9A961' }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={tab.key} onPress={() => handleTabPress(tab)} style={styles.tabItem}>
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
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f3f2' },
  webview: { flex: 1 },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 85,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f3f2',
    zIndex: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1f2024',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: 25,
    paddingTop: 10,
    height: 85,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    flex: 1,
  },
  centerTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerTab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C9A961',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: -20,
    borderWidth: 3,
    borderColor: '#1f2024',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
