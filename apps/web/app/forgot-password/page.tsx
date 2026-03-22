'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שליחת האימייל נכשלה';
      setError(translateFirebaseError(message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <PageSlider images={sliderImages.login} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-400/20">
              <span className="text-primary-900 font-bold text-2xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">שכחתם סיסמה?</h1>
            <p className="text-gray-500">הזינו את האימייל שלכם ונשלח לכם קישור לאיפוס</p>
          </div>

          {/* Success Message */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">האימייל נשלח!</h2>
              <p className="text-gray-500 mb-6">
                בדקו את תיבת הדואר שלכם ({email}) ולחצו על הקישור לאיפוס הסיסמה.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                לא קיבלתם? בדקו בתיקיית הספאם או נסו שוב.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  שליחה חוזרת
                </button>
                <Link
                  href="/login"
                  className="block w-full btn-gold py-3 text-center"
                >
                  חזרה להתחברות
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-600 text-sm mb-2">אימייל</label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-all"
                      placeholder="your@email.com"
                      required
                      dir="ltr"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-gold py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <span>שליחת קישור לאיפוס</span>
                      <ArrowLeft size={20} />
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <p className="text-center mt-6 text-gray-500">
                נזכרתם בסיסמה?{' '}
                <Link href="/login" className="text-gold-500 hover:text-gold-600 transition-colors font-medium">
                  חזרה להתחברות
                </Link>
              </p>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

// Helper function to translate Firebase error messages to Hebrew
function translateFirebaseError(error: string): string {
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'לא נמצא משתמש עם אימייל זה',
    'auth/invalid-email': 'כתובת אימייל לא תקינה',
    'auth/too-many-requests': 'יותר מדי ניסיונות. נסו שוב מאוחר יותר',
    'auth/network-request-failed': 'בעיית רשת. בדקו את החיבור לאינטרנט',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return value;
    }
  }

  return error;
}
