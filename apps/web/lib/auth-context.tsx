'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth, logout as firebaseLogout, isAuthEnabled } from './firebase';
import { authApi, setAuthToken } from '@stannel/api-client';
import type { AuthUser } from '@stannel/types';
import { UserRole } from '@stannel/types';

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
  const isRegistering = useRef(false);

  useEffect(() => {
    const auth = getFirebaseAuth();

    // If Firebase is not configured, just mark as not loading
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Skip verification during registration - the register function handles it
        if (isRegistering.current) {
          setLoading(false);
          return;
        }

        try {
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);

          // Get user from backend
          const response = await authApi.verifyToken(token);
          setUser(response.user);
        } catch (err) {
          console.error('Error fetching user:', err);
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

  const login = async (email: string, password: string): Promise<AuthUser | null> => {
    setError(null);
    setLoading(true);

    try {
      const { loginWithEmail } = await import('./firebase');
      const { token } = await loginWithEmail(email, password);
      setAuthToken(token);

      const response = await authApi.verifyToken(token);
      setUser(response.user);
      return response.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<AuthUser | null> => {
    setError(null);
    setLoading(true);

    try {
      const { loginWithGoogle: googleLogin } = await import('./firebase');
      const { token } = await googleLogin();
      setAuthToken(token);

      const response = await authApi.verifyToken(token);
      setUser(response.user);
      return response.user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    setLoading(true);
    isRegistering.current = true;

    try {
      const { registerWithEmail } = await import('./firebase');
      const { token, isNewUser } = await registerWithEmail(data.email, data.password);
      setAuthToken(token);

      // If user already existed in Firebase, check if they exist in DB
      if (!isNewUser) {
        try {
          const verifyResponse = await authApi.verifyToken(token);
          // User exists in both Firebase and DB - they should login instead
          setUser(verifyResponse.user);
          return;
        } catch {
          // User exists in Firebase but not in DB - continue with registration
        }
      }

      // Build registration payload - only include defined values
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

      if (data.phone) {
        payload.phone = data.phone;
      }
      if (data.companyName) {
        payload.companyName = data.companyName;
      }

      // Register in backend
      const response = await authApi.register(payload);
      setUser(response.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      isRegistering.current = false;
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
