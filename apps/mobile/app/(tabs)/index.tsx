import { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform, Linking, TouchableOpacity, Text, ScrollView } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const WEB_URL = 'https://stannelclub.co.il';

// Don't hide web BottomNav! Let the website handle its own navigation.
// Only hide splash screen and accessibility widget.
const INJECT_JS = `
(function(){
  if(window.__STANNEL_INJECTED) return true;
  window.__STANNEL_INJECTED=true;

  var s=document.createElement('style');
  s.textContent='#splash-screen{display:none!important}.accessibility-widget,[class*="accessibility"],button[aria-label="פתח תפריט נגישות"]{display:none!important}.fixed.bottom-24,.fixed.z-50.w-14{display:none!important}';
  document.head.appendChild(s);

  // Debug logger
  function send(type,msg){
    try{window.ReactNativeWebView.postMessage(JSON.stringify({type:type,msg:String(msg).substring(0,300),url:location.pathname,time:new Date().toLocaleTimeString()}));}catch(e){}
  }

  var origLog=console.log,origError=console.error,origWarn=console.warn;
  console.log=function(){origLog.apply(console,arguments);send('log',Array.from(arguments).join(' '));};
  console.error=function(){origError.apply(console,arguments);send('error',Array.from(arguments).join(' '));};
  console.warn=function(){origWarn.apply(console,arguments);send('warn',Array.from(arguments).join(' '));};

  window.addEventListener('error',function(e){send('error',e.message+' at '+e.filename+':'+e.lineno);});
  window.addEventListener('unhandledrejection',function(e){send('error','Promise: '+String(e.reason).substring(0,200));});

  send('nav','Page loaded: '+location.pathname);

  document.addEventListener('click',function(e){
    var t=e.target.closest('a,button');
    if(t){send('click',t.tagName+' '+(t.getAttribute('href')||'')+' '+(t.textContent||'').substring(0,30));}
  },true);

  // Track SPA navigation
  var origPush=history.pushState,origReplace=history.replaceState;
  history.pushState=function(){origPush.apply(this,arguments);setTimeout(function(){send('nav','SPA navigate: '+location.pathname);},100);};
  history.replaceState=function(){origReplace.apply(this,arguments);setTimeout(function(){send('nav','SPA replace: '+location.pathname);},100);};
  window.addEventListener('popstate',function(){send('nav','Popstate: '+location.pathname);});

  true;
})();
`;

type DebugLog = { type: string; msg: string; url: string; time: string };

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

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

  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as DebugLog;
      setDebugLogs(prev => [...prev.slice(-100), data]);
    } catch {}
  }, []);

  const onNavChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const onRequest = useCallback((event: WebViewNavigation) => {
    if (event.url.startsWith(WEB_URL) || event.url.startsWith('about:')) return true;
    Linking.openURL(event.url).catch(() => {});
    return false;
  }, []);

  const onError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setDebugLogs(prev => [...prev.slice(-100), {
      type: 'error',
      msg: `WebView error: ${nativeEvent.description || nativeEvent.code || 'unknown'}`,
      url: nativeEvent.url || '',
      time: new Date().toLocaleTimeString()
    }]);
  }, []);

  const copyLogs = useCallback(async () => {
    const text = debugLogs.map(l => `[${l.time}] [${l.type}] ${l.url} - ${l.msg}`).join('\n');
    await Clipboard.setStringAsync(text);
  }, [debugLogs]);

  return (
    <View style={styles.root}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/login` }}
        style={styles.web}
        onNavigationStateChange={onNavChange}
        onLoadEnd={() => webViewRef.current?.injectJavaScript(INJECT_JS)}
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
        textZoom={100}
        onShouldStartLoadWithRequest={onRequest}
        androidLayerType="hardware"
        userAgent="StannelMobile/1.0"
      />

      {/* Debug toggle */}
      <TouchableOpacity style={styles.debugToggle} onPress={() => setShowDebug(!showDebug)}>
        <MaterialCommunityIcons name="bug" color={showDebug ? '#C9A961' : '#fff'} size={18} />
      </TouchableOpacity>

      {/* Debug panel */}
      {showDebug && (
        <View style={styles.debugPanel}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Debug ({debugLogs.length})</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={copyLogs}>
                <Text style={styles.debugBtn}>📋 העתק</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDebugLogs([])}>
                <Text style={styles.debugBtn}>🗑 נקה</Text>
              </TouchableOpacity>
            </View>
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
            {debugLogs.length === 0 && <Text style={styles.debugLine}>No logs yet...</Text>}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060f1f' },
  web: { flex: 1 },
  debugToggle: {
    position: 'absolute', top: 40, left: 8,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  debugPanel: {
    position: 'absolute', top: 80, left: 8, right: 8,
    maxHeight: 350, backgroundColor: 'rgba(0,0,0,0.92)',
    borderRadius: 12, padding: 10, zIndex: 99,
  },
  debugHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  debugTitle: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  debugBtn: { color: '#C9A961', fontSize: 12 },
  debugScroll: { maxHeight: 300 },
  debugLine: {
    color: '#aaa', fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
});
