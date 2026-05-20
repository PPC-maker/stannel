'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show auth alert if redirected from protected page
    if (searchParams.get('reason') === 'auth') {
      Swal.fire({
        title: 'שים לב',
        text: 'אתה לא מחובר למערכת. התחבר כדי לצפות בדף.',
        icon: 'info',
        confirmButtonText: 'הבנתי',
        confirmButtonColor: '#d4af37',
        background: '#0f2620',
        color: '#fff',
      });
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'SUPPLIER') {
        router.push('/supplier');
      } else {
        router.push('/wallet');
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
        router.push('/wallet');
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
        router.push('/wallet');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'התחברות עם Google נכשלה';
      setError(translateFirebaseError(message));
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#0a0f0d]" />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0f0d] -mt-16">
      {/* Background Image */}
      <div className="absolute inset-x-0 top-0 h-[42vh]">
        <Image
          src="/bg_top.jpg"
          alt="Modern architecture"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0f0d]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-6 pt-[40vh]">
        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-5"
        >
          <h2 className="text-2xl md:text-3xl text-white font-semibold leading-snug tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
            The leading platform
          </h2>
          <h2 className="text-2xl md:text-3xl text-white font-semibold leading-snug tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
            for architects & designers
          </h2>
          <p className="text-[#C9A961]/70 mt-3 text-base font-medium tracking-widest">
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
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-[#C9A961]/70 text-sm font-medium mb-1">אימייל <span className="text-red-400/70 text-xs font-normal">(שדה חובה)</span></label>
            <div className="relative">
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-[#C9A961]/60 z-10" size={24} />
              <input
                type="email"
                placeholder="אימייל / טלפון"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                style={{ backgroundColor: '#ffffff', color: '#1a1a1a', WebkitTextFillColor: '#1a1a1a' }}
                className="login-input w-full border border-[#C9A961]/25 rounded-2xl px-5 py-5 pr-14 focus:border-[#C9A961]/60 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/15 transition-all text-lg font-medium text-right"
              />
            </div>

            <label className="block text-[#C9A961]/70 text-sm font-medium mb-1">סיסמה <span className="text-red-400/70 text-xs font-normal">(שדה חובה)</span></label>
            <div className="relative">
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-[#C9A961]/60 z-10" size={24} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{ backgroundColor: '#ffffff', color: '#1a1a1a', WebkitTextFillColor: '#1a1a1a' }}
                className="login-input w-full border border-[#C9A961]/25 rounded-2xl px-5 py-5 pr-14 pl-14 focus:border-[#C9A961]/60 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/15 transition-all text-lg font-medium text-right"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#C9A961] transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-[#C9A961]/60 hover:text-[#C9A961] text-base font-medium transition-colors">
                שכחתם סיסמה?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-50 text-xl tracking-wide hover:translate-y-[-2px]"
              style={{ background: 'linear-gradient(135deg, #E8C97D 0%, #C9A961 40%, #8B6F3A 100%)', boxShadow: '0 6px 24px rgba(201,169,97,0.25)' }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                'התחברות'
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-[#C9A961]/20" />
            <span className="text-[#C9A961]/50 text-base font-medium">או</span>
            <div className="flex-1 h-px bg-[#C9A961]/20" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white/10 backdrop-blur border border-[#C9A961]/25 hover:border-[#C9A961]/50 text-white py-5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg font-semibold"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>המשך עם Google</span>
          </button>

          <p className="text-center mt-5 text-white/50 text-base font-medium">
            אין לכם חשבון?{' '}
            <Link href="/register" className="text-[#C9A961] hover:underline font-bold">
              הירשמו כאן
            </Link>
          </p>

          <p className="text-center mt-3">
            <Link href="/terms" className="text-white/30 hover:text-[#C9A961]/60 text-xs transition-colors">
              תקנון ותנאי שימוש
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
