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
 * Hook to protect supplier pages.
 * Redirects to login if not authenticated, or to dashboard if not supplier.
 */
export function useSupplierGuard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'SUPPLIER') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  return {
    isReady: !loading && !!user && user.role === 'SUPPLIER',
    user,
    loading,
  };
}

/**
 * Branded loading screen for protected pages
 */
export function AuthGuardLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#0a1f18] via-[#0f2620] to-[#142e24] flex flex-col items-center justify-center">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(45, 90, 61, 0.4) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(45, 90, 61, 0.3) 0%, transparent 50%)`,
      }} />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#d4af37]/20 blur-3xl animate-pulse" style={{ transform: 'scale(2)' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo1.png" alt="Stannel Club" className="h-20 w-auto relative z-10" style={{ animation: 'logoFadeIn 0.8s ease-out forwards' }} />
        </div>
        <p className="text-white/60 text-sm font-medium tracking-wider" style={{ animation: 'textFadeIn 1s ease-out 0.3s both' }}>
          אנחנו עוברים לדף המבוקש...
        </p>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden" style={{ animation: 'textFadeIn 1s ease-out 0.5s both' }}>
          <div className="h-full rounded-full" style={{
            background: 'linear-gradient(90deg, #2d5a3d, #d4af37, #2d5a3d)',
            backgroundSize: '200% 100%',
            animation: 'shimmerBar 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
      <style>{`
        @keyframes logoFadeIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes textFadeIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerBar { 0% { background-position: 200% 0; width: 30%; } 50% { width: 70%; } 100% { background-position: -200% 0; width: 30%; } }
      `}</style>
    </div>
  );
}
