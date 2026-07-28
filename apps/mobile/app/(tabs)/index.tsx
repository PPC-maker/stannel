import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, BackHandler, Platform, Linking, ActivityIndicator, Image } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';

const WEB_URL = 'https://stannelclub.co.il';

const INJECT_JS = `
(function(){
  if(window.__STANNEL_INJECTED) return true;
  window.__STANNEL_INJECTED=true;
  var s=document.createElement('style');
  s.textContent='#splash-screen{display:none!important}.accessibility-widget,[class*="accessibility"],button[aria-label="פתח תפריט נגישות"]{display:none!important}';
  document.head.appendChild(s);
  true;
})();
`;

export default function MainScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [isWebLoading, setIsWebLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

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

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (message.type === 'STANNEL_LOGOUT') {
        setCanGoBack(false);
        setLoadProgress(0);
        setIsWebLoading(true);
        // Destroy the authenticated WebView and create a clean instance at login.
        // This avoids a Next.js/Firebase navigation race after sign-out on Android.
        setWebViewKey((current) => current + 1);
      }
    } catch {
      // Ignore messages that are not part of the STANNEL native bridge.
    }
  }, []);

  const renderLoadError = useCallback(() => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>לא הצלחנו לטעון את STANNEL</Text>
      <Text style={styles.errorText}>בדקו את החיבור לאינטרנט ונסו שוב.</Text>
      <Pressable style={styles.retryButton} onPress={() => webViewRef.current?.reload()}>
        <Text style={styles.retryButtonText}>טעינה מחדש</Text>
      </Pressable>
    </View>
  ), []);

  return (
    <View style={styles.root}>
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/login` }}
        style={styles.web}
        onNavigationStateChange={onNavChange}
        onLoadProgress={({ nativeEvent }) => {
          if (isWebLoading) setLoadProgress(nativeEvent.progress);
        }}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(INJECT_JS);
          setLoadProgress(1);
          setIsWebLoading(false);
        }}
        onError={() => setIsWebLoading(false)}
        injectedJavaScript={INJECT_JS}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        textZoom={100}
        onShouldStartLoadWithRequest={onRequest}
        onMessage={onMessage}
        renderError={renderLoadError}
        onContentProcessDidTerminate={() => {
          setLoadProgress(0);
          setIsWebLoading(true);
          webViewRef.current?.reload();
        }}
        androidLayerType="hardware"
        userAgent="STANNEL-App/1.0"
      />
      {isWebLoading && (
        <View style={styles.loadingOverlay} accessibilityRole="progressbar">
          <View style={styles.logoGlow}>
            <Image source={require('../../assets/icon.png')} style={styles.loadingLogo} resizeMode="contain" />
          </View>
          <Text style={styles.loadingBrand}>STANNEL</Text>
          <Text style={styles.loadingSubtitle}>BUSINESS CLUB</Text>
          <ActivityIndicator size="large" color="#d8ba72" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>מכינים עבורך את האפליקציה...</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(6, Math.round(loadProgress * 100))}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(loadProgress * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060f1f' },
  web: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor: '#060f1f',
  },
  logoGlow: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(216, 186, 114, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(216, 186, 114, 0.22)',
  },
  loadingLogo: {
    width: 98,
    height: 98,
  },
  loadingBrand: {
    marginTop: 22,
    color: '#f4dfaa',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 5,
  },
  loadingSubtitle: {
    marginTop: 4,
    color: '#c9a961',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
  },
  loadingSpinner: {
    marginTop: 34,
  },
  loadingText: {
    marginTop: 18,
    color: '#f7f3f2',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressTrack: {
    width: '78%',
    height: 5,
    marginTop: 22,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: 'rgba(216, 186, 114, 0.16)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#d8ba72',
  },
  progressText: {
    marginTop: 9,
    color: 'rgba(247, 243, 242, 0.62)',
    fontSize: 13,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#f7f3f2',
  },
  errorTitle: {
    color: '#173b31',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#c99b4a',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});
