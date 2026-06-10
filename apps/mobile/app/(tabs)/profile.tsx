import { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { HIDE_WEB_NAV_JS, WEB_URL } from '../../lib/webview-inject';

export default function ProfileScreen() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

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

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/profile` }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        injectedJavaScript={HIDE_WEB_NAV_JS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        pullToRefreshEnabled={true}
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        userAgent="STANNEL-App/1.0"
      />
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#C9A961" />
        </View>
      )}
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
  },
});
