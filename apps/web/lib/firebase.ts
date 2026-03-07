// Firebase Client SDK for Web App

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your-api-key'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function initializeFirebaseClient(): FirebaseApp | null {
  if (!isFirebaseConfigured) {
    console.warn('Firebase not configured. Auth features disabled. Set NEXT_PUBLIC_FIREBASE_* env vars.');
    return null;
  }

  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    app = initializeApp(firebaseConfig);
  }
  auth = getAuth(app);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) {
    return null;
  }
  if (!auth) {
    initializeFirebaseClient();
  }
  return auth;
}

export function isAuthEnabled(): boolean {
  return isFirebaseConfigured;
}

// Auth functions
export async function loginWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  const result = await signInWithEmailAndPassword(auth, email, password);
  const token = await result.user.getIdToken();
  return { user: result.user, token };
}

export async function registerWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');

  // Sign out any existing user first to ensure clean state
  if (auth.currentUser) {
    await signOut(auth);
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    return { user: result.user, token, isNewUser: true };
  } catch (error: unknown) {
    // If email already exists in Firebase, try to sign in instead
    // This handles the case where Firebase user exists but DB record doesn't
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use') {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const token = await result.user.getIdToken();
        return { user: result.user, token, isNewUser: false };
      } catch (signInError: unknown) {
        // If sign-in fails (wrong password), provide clear error message
        if (signInError && typeof signInError === 'object' && 'code' in signInError) {
          const code = (signInError as { code: string }).code;
          if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            throw new Error('auth/email-already-in-use-wrong-password');
          }
        }
        throw signInError;
      }
    }
    throw error;
  }
}

export async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const token = await result.user.getIdToken();
  return { user: result.user, token };
}

export async function logout() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export async function getCurrentUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getIdToken(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.getIdToken();
}

export { auth, app };
