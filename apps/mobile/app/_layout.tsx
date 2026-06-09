import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f7f3f2' },
          animation: 'slide_from_left',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="register" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="forgot-password" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="terms" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="about" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3f2',
  },
});
