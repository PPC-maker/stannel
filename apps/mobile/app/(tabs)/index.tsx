import { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, BackHandler, Platform, StatusBar, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HIDE_WEB_NAV_JS, WEB_URL } from '../../lib/webview-inject';

const TABS = [
  { key: 'rewards', path: '/rewards', label: 'הטבות', icon: 'gift' as const },
  { key: 'invoices', path: '/invoices', label: 'חשבוניות', icon: 'file-document-outline' as const },
  { key: 'home', path: '/wallet', label: 'בית', icon: 'home' as const, isCenter: true },
  { key: 'wallet', path: '/wallet', label: 'ארנק', icon: 'wallet-outline' as const },
  { key: 'profile', path: '/profile', label: 'פרופיל', icon: 'account-circle' as const },
];

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(`${WEB_URL}/wallet`);

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
    const targetUrl = `${WEB_URL}${tab.path}`;
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.location.href = '${targetUrl}'; true;`);
    }
  }, []);

  const handleNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url || '');

    // Update active tab based on URL
    const url = navState.url || '';
    if (url.includes('/rewards')) setActiveTab('rewards');
    else if (url.includes('/invoices')) setActiveTab('invoices');
    else if (url.includes('/profile')) setActiveTab('profile');
    else if (url.includes('/wallet')) setActiveTab('home');

    // If redirected to login, navigate to login
    if (url.includes('/login') && !url.includes('stannelclub.co.il/login')) {
      // Stay in WebView - let the user login within the same WebView
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/wallet` }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
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
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        userAgent="STANNEL-App/1.0"
      />
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#C9A961" />
        </View>
      )}

      {/* Native Tab Bar */}
      <View style={styles.tabBar}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f3f2' },
  webview: { flex: 1 },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
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
