'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      if (user?.role === 'ADMIN') {
        router.push('/admin');
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
      const user = await loginWithGoogle();
      if (user?.role === 'ADMIN') {
        router.push('/admin');
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
          alt="Modern architecture"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC]/80 to-[#003377]/90" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-3xl">S</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">STANNEL</h2>
            <p className="text-white/80 text-lg max-w-md">
              פלטפורמת הנאמנות המובילה לאדריכלים וספקים בישראל
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0066CC] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#1E293B] mb-2">ברוכים השבים</h1>
              <p className="text-[#64748B]">היכנסו לחשבון STANNEL שלכם</p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[#1E293B] text-sm font-medium mb-2">אימייל</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 pr-12 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all"
                    placeholder="your@email.com"
                    required
                    dir="ltr"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1E293B] text-sm font-medium mb-2">סיסמה</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3.5 pr-12 pl-12 text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all"
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-[#F8FAFC] border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <span className="text-[#64748B]">זכור אותי</span>
                </label>
                <Link href="/forgot-password" className="text-[#0066CC] hover:text-[#0055AA] transition-colors font-medium">
                  שכחתם סיסמה?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading || authLoading}
                className="w-full btn-gold py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <span>כניסה</span>
                    <ArrowLeft size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[#94A3B8] text-sm">או</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || authLoading}
              className="w-full bg-white border-2 border-gray-200 rounded-xl py-3.5 text-[#1E293B] hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>המשיכו עם Google</span>
            </button>

            {/* Register link */}
            <p className="text-center mt-6 text-[#64748B]">
              אין לכם חשבון?{' '}
              <Link href="/register" className="text-[#0066CC] hover:text-[#0055AA] transition-colors font-semibold">
                הירשמו עכשיו
              </Link>
            </p>
          </div>
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
    'auth/operation-not-supported-in-this-environment': 'הפעולה לא נתמכת בסביבה זו',
    'auth/unauthorized-domain': 'הדומיין לא מורשה. פנו לתמיכה',
    'Google login failed': 'התחברות עם Google נכשלה. נסו שוב או הירשמו',
    'Google authentication failed': 'התחברות עם Google נכשלה. נסו שוב או הירשמו',
    'not found': 'משתמש לא נמצא. אנא הירשמו תחילה',
    '404': 'משתמש לא נמצא. אנא הירשמו תחילה',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default Hebrew message for unknown errors
  if (!error.match(/[\u0590-\u05FF]/)) {
    return 'התחברות נכשלה. נסו שוב או פנו לתמיכה';
  }

  return error;
}
