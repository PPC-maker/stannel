'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'SUPPLIER') {
        router.push('/supplier');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser?.role === 'ADMIN') {
        router.push('/admin');
      } else if (loggedInUser?.role === 'SUPPLIER') {
        router.push('/supplier');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'התחברות נכשלה';
      setError(translateFirebaseError(message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser?.role === 'ADMIN') {
        router.push('/admin');
      } else if (loggedInUser?.role === 'SUPPLIER') {
        router.push('/supplier');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'התחברות עם Google נכשלה';
      setError(translateFirebaseError(message));
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#0f2620]" />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f2620] -mt-16">
      {/* Background Image - positioned at top */}
      <div className="absolute inset-x-0 top-0 h-[50vh]">
        <Image
          src="/bg_top.jpg"
          alt="Modern architecture"
          fill
          className="object-cover object-top"
          priority
        />
        {/* Gradient fade to dark green */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f2620]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12 pt-[50vh]">
        {/* Logo + Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl md:text-2xl text-white/90 font-light leading-tight tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
            The leading platform
          </h2>
          <h2 className="text-xl md:text-2xl text-white/90 font-light leading-tight tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
            for architects & designers
          </h2>
          <p className="text-white/50 mt-3 text-sm tracking-widest">
            Connect. Create. Be part of the industry.
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 z-10" size={22} />
              <input
                type="email"
                placeholder="אימייל / טלפון"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-4 pr-14 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-base text-right"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 z-10" size={22} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-4 pr-14 pl-14 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-base text-right"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-white/70 hover:text-white text-sm transition-colors">
                שכחתם סיסמה?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1d5a45] hover:bg-[#2d6a55] text-white font-semibold py-4 rounded-2xl transition-colors disabled:opacity-50 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                'התחברות'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-sm">או</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 text-white py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>המשך עם Google</span>
          </button>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-white/70 text-sm">
            אין לכם חשבון?{' '}
            <Link href="/register" className="text-white hover:underline font-medium">
              הירשמו כאן
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function translateFirebaseError(error: string): string {
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'משתמש לא נמצא. אנא הירשמו תחילה',
    'auth/wrong-password': 'סיסמה שגויה',
    'auth/invalid-email': 'כתובת אימייל לא תקינה',
    'auth/user-disabled': 'החשבון מושבת',
    'auth/too-many-requests': 'יותר מדי ניסיונות. נסו שוב מאוחר יותר',
    'auth/network-request-failed': 'בעיית רשת. בדקו את החיבור לאינטרנט',
    'auth/popup-closed-by-user': 'החלון נסגר. נסו שוב',
    'auth/popup-blocked': 'החלון נחסם. אנא אפשרו חלונות קופצים',
    'auth/cancelled-popup-request': 'הבקשה בוטלה. נסו שוב',
    'auth/invalid-credential': 'פרטי התחברות שגויים',
    'auth/account-exists-with-different-credential': 'קיים חשבון עם אימייל זה. נסו להתחבר בדרך אחרת',
    'Google login failed': 'התחברות עם Google נכשלה. נסו שוב או הירשמו',
    'not found': 'משתמש לא נמצא. אנא הירשמו תחילה',
    '404': 'משתמש לא נמצא. אנא הירשמו תחילה',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  if (!error.match(/[\u0590-\u05FF]/)) {
    return 'התחברות נכשלה. נסו שוב או פנו לתמיכה';
  }

  return error;
}
