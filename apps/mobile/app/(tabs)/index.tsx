import { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform, Linking } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

const WEB_URL = 'https://stannelclub.co.il';

const INJECT_JS = `
(function(){
  if(window.__STANNEL_INJECTED) return true;
  window.__STANNEL_INJECTED=true;
  var s=document.createElement('style');
  s.textContent='#splash-screen{display:none!important}.accessibility-widget,[class*="accessibility"],button[aria-label="פתח תפריט נגישות"]{display:none!important}#web-bottom-nav,.web-bottom-nav{display:none!important}';
  document.head.appendChild(s);
  true;
})();
`;

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

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

  const onNavChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
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
        source={{ uri: `${WEB_URL}/wallet` }}
        style={styles.web}
        onNavigationStateChange={onNavChange}
        onLoadEnd={() => webViewRef.current?.injectJavaScript(INJECT_JS)}
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
        userAgent="STANNEL-App/1.0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060f1f' },
  web: { flex: 1 },
});
