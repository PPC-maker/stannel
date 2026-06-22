import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#060f1f' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
