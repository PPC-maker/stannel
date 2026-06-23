import { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform, TouchableOpacity, Text, Linking } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WEB_URL = 'https://stannelclub.co.il';

const HIDE_NAV_JS = `
(function(){
  var s=document.createElement('style');
  s.textContent='#web-bottom-nav,.web-bottom-nav,nav[aria-label="ניווט תחתון"]{display:none!important;height:0!important}#splash-screen{display:none!important}.accessibility-widget,[class*="accessibility"],button[aria-label="פתח תפריט נגישות"]{display:none!important}.fixed.bottom-24,.fixed.z-50.w-14{display:none!important}body{padding-bottom:0!important}';
  document.head.appendChild(s);
  document.body.classList.add('stannel-mobile-app');
  true;
})();
`;

type TabItem = {
  key: string;
  path: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isCenter?: boolean;
};

const TABS: TabItem[] = [
  { key: 'rewards', path: '/rewards', label: 'הטבות', icon: 'gift' },
  { key: 'suppliers', path: '/suppliers', label: 'ספקים', icon: 'store' },
  { key: 'home', path: '/wallet', label: 'בית', icon: 'home', isCenter: true },
  { key: 'invoices', path: '/invoices', label: 'חשבוניות', icon: 'file-document-outline' },
  { key: 'profile', path: '/profile', label: 'פרופיל', icon: 'account-circle' },
];

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/terms', '/privacy', '/onboarding'];

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [showTabs, setShowTabs] = useState(false);

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

  const onTabPress = useCallback((tab: TabItem) => {
    if (activeTab === tab.key) {
      webViewRef.current?.reload();
      return;
    }
    setActiveTab(tab.key);
    // Find and click the Next.js Link on the page, or use pushState for SPA navigation
    const js = `
      (function(){
        try {
          var link = document.querySelector('a[href="${tab.path}"]');
          if (link) { link.click(); }
          else { window.location.assign('${WEB_URL}${tab.path}'); }
        } catch(e) {
          window.location.assign('${WEB_URL}${tab.path}');
        }
        true;
      })();
    `;
    webViewRef.current?.injectJavaScript(js);
  }, [activeTab]);

  const onNavChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    const url = navState.url || '';
    const path = url.replace(WEB_URL, '');

    const isAuth = !path || path === '/' || AUTH_PAGES.some(p => path.startsWith(p));
    setShowTabs(!isAuth);

    if (path.startsWith('/rewards')) setActiveTab('rewards');
    else if (path.startsWith('/suppliers')) setActiveTab('suppliers');
    else if (path.startsWith('/invoices')) setActiveTab('invoices');
    else if (path.startsWith('/profile') || path.startsWith('/settings')) setActiveTab('profile');
    else setActiveTab('home');
  }, []);

  const onLoadEnd = useCallback(() => {
    webViewRef.current?.injectJavaScript(HIDE_NAV_JS);
  }, []);

  const onRequest = useCallback((event: WebViewNavigation) => {
    if (event.url.startsWith(WEB_URL) || event.url.startsWith('about:')) return true;
    Linking.openURL(event.url).catch(() => {});
    return false;
  }, []);

  return (
    <View style={styles.root}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/login` }}
        style={styles.web}
        onNavigationStateChange={onNavChange}
        onLoadEnd={onLoadEnd}
        injectedJavaScript={HIDE_NAV_JS}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        userAgent="STANNEL-App/1.0"
        textZoom={100}
        onShouldStartLoadWithRequest={onRequest}
      />

      {showTabs && (
        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            if (tab.isCenter) {
              return (
                <TouchableOpacity key={tab.key} onPress={() => onTabPress(tab)} style={styles.centerWrap}>
                  <View style={styles.centerBtn}>
                    <MaterialCommunityIcons name={tab.icon} color="#fff" size={26} />
                  </View>
                  <Text style={[styles.lbl, { color: '#C9A961' }]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity key={tab.key} onPress={() => onTabPress(tab)} style={styles.tabBtn}>
                <MaterialCommunityIcons name={tab.icon} color={active ? '#C9A961' : '#666'} size={24} />
                <Text style={[styles.lbl, { color: active ? '#C9A961' : '#666' }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  web: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1d21',
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabBtn: { alignItems: 'center', flex: 1, paddingTop: 4 },
  centerWrap: { alignItems: 'center', flex: 1, marginTop: -16 },
  centerBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#C9A961',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  lbl: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
