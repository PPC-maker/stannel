import { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform, TouchableOpacity, Text, Linking, ScrollView } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WEB_URL = 'https://stannelclub.co.il';

// Minimal CSS injection - hide web bottom nav and accessibility only
const INJECT_JS = `
(function(){
  if(window.__STANNEL_INJECTED) return true;
  window.__STANNEL_INJECTED=true;

  // Add style to hide web nav
  var s=document.createElement('style');
  s.textContent='#web-bottom-nav,.web-bottom-nav,nav[aria-label="ניווט תחתון"]{display:none!important;height:0!important;overflow:hidden!important}#splash-screen{display:none!important}.accessibility-widget,[class*="accessibility"],button[aria-label="פתח תפריט נגישות"]{display:none!important}.fixed.bottom-24,.fixed.z-50.w-14{display:none!important}body{padding-bottom:0!important}';
  document.head.appendChild(s);
  document.body.classList.add('stannel-mobile-app');

  // Debug logger - sends logs to React Native
  var origLog = console.log;
  var origError = console.error;
  var origWarn = console.warn;
  function send(type, msg) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({type:type, msg:String(msg).substring(0,200), url:location.pathname, time:new Date().toLocaleTimeString()}));
    } catch(e){}
  }
  console.log = function(){origLog.apply(console,arguments); send('log',Array.from(arguments).join(' '));};
  console.error = function(){origError.apply(console,arguments); send('error',Array.from(arguments).join(' '));};
  console.warn = function(){origWarn.apply(console,arguments); send('warn',Array.from(arguments).join(' '));};

  // Catch unhandled errors
  window.addEventListener('error', function(e){ send('error', e.message + ' at ' + e.filename + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', function(e){ send('error', 'Promise: ' + String(e.reason).substring(0,150)); });

  // Track navigation
  send('nav', 'Page loaded: ' + location.pathname);

  // Track clicks for debug
  document.addEventListener('click', function(e){
    var target = e.target.closest('a,button');
    if(target){
      var info = target.tagName + ' ' + (target.getAttribute('href')||'') + ' ' + (target.textContent||'').substring(0,30);
      send('click', info);
    }
  }, true);

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

type DebugLog = { type: string; msg: string; url: string; time: string };

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [canGoBack, setCanGoBack] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const lastUrlRef = useRef('');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showDebug) { setShowDebug(false); return true; }
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack, showDebug]);

  // Handle messages from WebView debug logger
  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as DebugLog;
      setDebugLogs(prev => [...prev.slice(-50), data]); // Keep last 50 logs
    } catch {}
  }, []);

  const onTabPress = useCallback((tab: TabItem) => {
    const addLog = (msg: string) => {
      setDebugLogs(prev => [...prev.slice(-50), { type: 'app', msg, url: tab.path, time: new Date().toLocaleTimeString() }]);
    };

    if (activeTab === tab.key) {
      addLog('Tab refresh: ' + tab.key);
      webViewRef.current?.reload();
      return;
    }

    addLog('Tab navigate: ' + tab.key + ' -> ' + tab.path);
    setActiveTab(tab.key);

    // Navigate using full URL - most reliable method
    webViewRef.current?.injectJavaScript(`
      (function(){
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'nav',msg:'Tab press -> ${tab.path}',url:location.pathname,time:new Date().toLocaleTimeString()}));
          window.location.href = '${WEB_URL}${tab.path}';
        } catch(e) {
          window.location.href = '${WEB_URL}${tab.path}';
        }
        true;
      })();
    `);
  }, [activeTab]);

  const onNavChange = useCallback((navState: WebViewNavigation) => {
    const url = navState.url || '';

    // Debounce - don't process same URL twice
    if (url === lastUrlRef.current && !navState.loading) return;
    lastUrlRef.current = url;

    setCanGoBack(navState.canGoBack);
    const path = url.replace(WEB_URL, '');

    const isAuth = !path || path === '/' || AUTH_PAGES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'));
    setShowTabs(!isAuth);

    if (path.startsWith('/rewards')) setActiveTab('rewards');
    else if (path.startsWith('/suppliers')) setActiveTab('suppliers');
    else if (path.startsWith('/invoices')) setActiveTab('invoices');
    else if (path.startsWith('/profile') || path.startsWith('/settings')) setActiveTab('profile');
    else if (!isAuth) setActiveTab('home');
  }, []);

  const onLoadEnd = useCallback(() => {
    webViewRef.current?.injectJavaScript(INJECT_JS);
  }, []);

  const onRequest = useCallback((event: WebViewNavigation) => {
    if (event.url.startsWith(WEB_URL) || event.url.startsWith('about:')) return true;
    Linking.openURL(event.url).catch(() => {});
    return false;
  }, []);

  const onError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setDebugLogs(prev => [...prev.slice(-50), {
      type: 'error',
      msg: `WebView error: ${nativeEvent.description || nativeEvent.code || 'unknown'}`,
      url: nativeEvent.url || '',
      time: new Date().toLocaleTimeString()
    }]);
  }, []);

  return (
    <View style={styles.root}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/login` }}
        style={styles.web}
        onNavigationStateChange={onNavChange}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onMessage={onMessage}
        injectedJavaScript={INJECT_JS}
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
        androidLayerType="hardware"
      />

      {/* Tab Bar */}
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

      {/* Debug toggle button - small bug icon in top-left */}
      <TouchableOpacity
        style={styles.debugToggle}
        onPress={() => setShowDebug(!showDebug)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="bug" color={showDebug ? '#C9A961' : '#fff'} size={18} />
      </TouchableOpacity>

      {/* Debug panel */}
      {showDebug && (
        <View style={styles.debugPanel}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Debug Log ({debugLogs.length})</Text>
            <TouchableOpacity onPress={() => setDebugLogs([])}>
              <Text style={styles.debugClear}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.debugScroll}>
            {debugLogs.map((log, i) => (
              <Text key={i} style={[
                styles.debugLine,
                log.type === 'error' && { color: '#ff6b6b' },
                log.type === 'warn' && { color: '#ffd93d' },
                log.type === 'nav' && { color: '#6bcb77' },
                log.type === 'click' && { color: '#4d96ff' },
                log.type === 'app' && { color: '#C9A961' },
              ]}>
                [{log.time}] [{log.type}] {log.url} - {log.msg}
              </Text>
            ))}
            {debugLogs.length === 0 && (
              <Text style={styles.debugLine}>No logs yet. Navigate around the app...</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060f1f' },
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
  // Debug UI
  debugToggle: {
    position: 'absolute',
    top: 40,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  debugPanel: {
    position: 'absolute',
    top: 80,
    left: 8,
    right: 8,
    maxHeight: 300,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    padding: 10,
    zIndex: 99,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  debugTitle: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  debugClear: { color: '#C9A961', fontSize: 12 },
  debugScroll: { maxHeight: 250 },
  debugLine: { color: '#aaa', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 2 },
});
