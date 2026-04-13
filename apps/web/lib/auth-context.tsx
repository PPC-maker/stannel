'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { getFirebaseAuth, logout as firebaseLogout } from './firebase';
import { authApi, setAuthToken } from '@stannel/api-client';
import type { AuthUser } from '@stannel/types';
import { UserRole } from '@stannel/types';
import Swal from 'sweetalert2';

interface AuthContextType {
  firebaseUser: User | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  loginWithGoogle: () => Promise<AuthUser | null>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'ARCHITECT' | 'SUPPLIER';
  companyName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticating = useRef(false);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Skip if we're in the middle of login/register - those functions handle it
        if (isAuthenticating.current) {
          return;
        }

        try {
          const token = await fbUser.getIdToken();
          setAuthToken(token);

          // Try to verify existing user
          try {
            const response = await authApi.verifyToken(token);
            setUser(response.user);
          } catch (verifyErr) {
            // User not in DB - try auto-register via Google endpoint
            const errMsg = verifyErr instanceof Error ? verifyErr.message : '';

            // Check if pending approval error
            if (errMsg.includes('ממתין לאישור') || errMsg.includes('pending-approval')) {
              await firebaseLogout();
              setAuthToken(null);
              setUser(null);
              Swal.fire({
                title: 'ממתין לאישור',
                text: 'החשבון שלך ממתין לאישור מנהל. נודיע לך כשהחשבון יאושר.',
                icon: 'info',
                confirmButtonText: 'הבנתי',
                background: '#1a1a2e',
                color: '#fff',
              });
            } else if (errMsg.includes('not found') || errMsg.includes('404')) {
              try {
                const response = await authApi.googleAuth(token);
                // Check if new user needs approval
                if (!response.user.isActive && response.user.role !== 'ADMIN') {
                  await firebaseLogout();
                  setAuthToken(null);
                  setUser(null);
                  Swal.fire({
                    title: response.isNewUser ? 'נרשמת בהצלחה!' : 'ממתין לאישור',
                    text: 'החשבון שלך ממתין לאישור מנהל. נודיע לך כשהחשבון יאושר.',
                    icon: 'info',
                    confirmButtonText: 'הבנתי',
                    background: '#1a1a2e',
                    color: '#fff',
                  });
                } else {
                  setUser(response.user);
                }
              } catch {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setUser(null);
        }
      } else {
        setAuthToken(null);
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-refresh token when Firebase refreshes it (every ~55 min)
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      if (fbUser) {
        const token = await fbUser.getIdToken();
        setAuthToken(token);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser | null> => {
    setError(null);
    setLoading(true);
    isAuthenticating.current = true;

    try {
      const { loginWithEmail } = await import('./firebase');
      const { token } = await loginWithEmail(email, password);
      setAuthToken(token);

      const response = await authApi.verifyToken(token);
      setUser(response.user);
      return response.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';

      // Check if pending approval error
      if (message.includes('ממתין לאישור') || message.includes('pending-approval')) {
        await firebaseLogout();
        setAuthToken(null);
        setUser(null);
        Swal.fire({
          title: 'ממתין לאישור',
          text: 'החשבון שלך ממתין לאישור מנהל. נודיע לך כשהחשבון יאושר.',
          icon: 'info',
          confirmButtonText: 'הבנתי',
          background: '#1a1a2e',
          color: '#fff',
        });
        return null;
      }

      setError(message);
      throw err;
    } finally {
      isAuthenticating.current = false;
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<AuthUser | null> => {
    setError(null);
    setLoading(true);
    isAuthenticating.current = true;

    try {
      const { loginWithGoogle: googleLogin } = await import('./firebase');
      const { token } = await googleLogin();
      setAuthToken(token);

      // Use googleAuth which auto-registers if user doesn't exist
      const response = await authApi.googleAuth(token);

      // Check if user needs approval (new user or existing inactive)
      if (!response.user.isActive && response.user.role !== 'ADMIN') {
        await firebaseLogout();
        setAuthToken(null);
        setUser(null);
        Swal.fire({
          title: response.isNewUser ? 'נרשמת בהצלחה!' : 'ממתין לאישור',
          text: 'החשבון שלך ממתין לאישור מנהל. נודיע לך כשהחשבון יאושר.',
          icon: 'info',
          confirmButtonText: 'הבנתי',
          background: '#1a1a2e',
          color: '#fff',
        });
        return null;
      }

      setUser(response.user);
      return response.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';

      // Check if pending approval error
      if (message.includes('ממתין לאישור') || message.includes('pending-approval')) {
        await firebaseLogout();
        setAuthToken(null);
        setUser(null);
        Swal.fire({
          title: 'ממתין לאישור',
          text: 'החשבון שלך ממתין לאישור מנהל. נודיע לך כשהחשבון יאושר.',
          icon: 'info',
          confirmButtonText: 'הבנתי',
          background: '#1a1a2e',
          color: '#fff',
        });
        return null;
      }

      setError(message);
      throw err;
    } finally {
      isAuthenticating.current = false;
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    setLoading(true);
    isAuthenticating.current = true;

    try {
      const { registerWithEmail } = await import('./firebase');
      const { token, isNewUser } = await registerWithEmail(data.email, data.password);
      setAuthToken(token);

      // If user already existed in Firebase, check if they exist in DB
      if (!isNewUser) {
        try {
          const verifyResponse = await authApi.verifyToken(token);
          setUser(verifyResponse.user);
          return;
        } catch {
          // User exists in Firebase but not in DB - continue with registration
        }
      }

      // Build registration payload
      const payload: {
        email: string;
        name: string;
        role: UserRole;
        firebaseToken: string;
        phone?: string;
        companyName?: string;
      } = {
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        firebaseToken: token,
      };

      if (data.phone && data.phone.trim() !== '') {
        payload.phone = data.phone;
      }
      if (data.companyName && data.companyName.trim() !== '') {
        payload.companyName = data.companyName;
      }

      const response = await authApi.register(payload);

      // New user needs admin approval - show message and logout
      if (!response.user.isActive && response.user.role !== 'ADMIN') {
        await firebaseLogout();
        setAuthToken(null);
        setUser(null);
        Swal.fire({
          title: 'נרשמת בהצלחה!',
          text: 'החשבון שלך ממתין לאישור מנהל. נודיע לך כשהחשבון יאושר.',
          icon: 'success',
          confirmButtonText: 'הבנתי',
          background: '#1a1a2e',
          color: '#fff',
        });
        return;
      }

      setUser(response.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      isAuthenticating.current = false;
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      setAuthToken(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken(true);
      setAuthToken(token);
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
