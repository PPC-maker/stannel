// Native push helper — asks the OS for notification permission and returns this device's FCM token.
// Everything is wrapped in try/catch and the native module is loaded lazily, so a push problem
// can never crash the app (the app is otherwise just a WebView of the website).

import { Platform, PermissionsAndroid } from 'react-native';

export type PushInfo = { token: string; platform: 'ios' | 'android' };

export async function getPushInfo(): Promise<PushInfo | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const messaging = require('@react-native-firebase/messaging').default;

    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return null;
    }

    if (Platform.OS === 'ios') {
      const status = await messaging().requestPermission();
      // 1 = AUTHORIZED, 2 = PROVISIONAL
      if (status !== 1 && status !== 2) return null;
      await messaging().registerDeviceForRemoteMessages();
    }

    const token: string | null = await messaging().getToken();
    if (!token) return null;
    return { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' };
  } catch {
    return null;
  }
}
