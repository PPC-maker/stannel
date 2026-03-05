// Mobile Auth Context with Firebase

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { authApi, setAuthToken } from '@stannel/api-client';
import type { AuthUser } from '@stannel/types';

interface AuthContextType {
  firebaseUser: FirebaseAuthTypes.User | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
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

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const credential = await auth().signInWithEmailAndPassword(email, password);
      const token = await credential.user.getIdToken();
      setAuthToken(token);

      const response = await authApi.verifyToken(token);
      setUser(response.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    setLoading(true);

    try {
      const credential = await auth().createUserWithEmailAndPassword(data.email, data.password);
      const token = await credential.user.getIdToken();
      setAuthToken(token);

      // Register in backend
      const response = await authApi.register({
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        companyName: data.companyName,
        firebaseToken: token,
      });

      setUser(response.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
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
