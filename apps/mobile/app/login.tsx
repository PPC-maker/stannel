import { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';

const WEB_URL = 'https://stannelclub.co.il';

export default function LoginScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_URL}/login` }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => {
          // If navigated away from login (user logged in), go to tabs
          if (navState.url && !navState.url.includes('/login') && !navState.url.includes('/register') && !navState.url.includes('/forgot-password')) {
            router.replace('/(tabs)');
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        mixedContentMode="compatibility"
        originWhitelist={['*']}
        userAgent="STANNEL-App/1.0 Android"
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#C9A961" />
          </View>
        )}
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
  container: { flex: 1, backgroundColor: '#0a0f0d' },
  webview: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f0d' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f0d' },
});
