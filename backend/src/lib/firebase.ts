// Firebase Admin SDK Initialization

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let app: App;
let auth: Auth;
let messaging: Messaging;

export function initializeFirebase(): void {
  if (getApps().length > 0) {
    app = getApps()[0];
    auth = getAuth(app);
    messaging = getMessaging(app);
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle both escaped \n and actual newlines in private key
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    // If the key has escaped newlines (\\n), replace them with actual newlines
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    console.log('[Firebase] Private key loaded, length:', privateKey.length);
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️  Firebase credentials not configured - running in DEV MODE (no auth)');
    console.warn('   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY for production');
    // Skip Firebase initialization for local development
    return;
  } else {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  auth = getAuth(app);

  try {
    messaging = getMessaging(app);
  } catch {
    console.warn('⚠️  Firebase Messaging not available');
  }

  console.log('✅ Firebase Admin SDK initialized');
}

export function getFirebaseAuth(): Auth | null {
  return auth || null;
}

export function isFirebaseConfigured(): boolean {
  return !!auth;
}

export function getFirebaseMessaging(): Messaging {
  if (!messaging) {
    throw new Error('Firebase Messaging not available');
  }
  return messaging;
}

export { app, auth, messaging };
