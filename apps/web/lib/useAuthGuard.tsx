'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

/**
 * Hook to protect pages from unauthenticated access.
 * Redirects to login page if user is not authenticated.
 * Returns { isReady } - true when auth check is complete and user is authenticated.
 */
export function useAuthGuard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return {
    isReady: !loading && !!user,
    user,
    loading,
  };
}

/**
 * Hook to protect admin pages.
 * Redirects to login if not authenticated, or to dashboard if not admin.
 */
export function useAdminGuard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'ADMIN') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  return {
    isReady: !loading && !!user && user.role === 'ADMIN',
    user,
    loading,
  };
}

/**
 * Loading spinner component for protected pages
 */
export function AuthGuardLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
