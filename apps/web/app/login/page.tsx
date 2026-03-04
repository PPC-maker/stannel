'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Firebase auth will be implemented here
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-400/20">
              <span className="text-primary-900 font-bold text-2xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">ברוכים השבים</h1>
            <p className="text-white/60">היכנסו לחשבון STANNEL שלכם</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/70 text-sm mb-2">אימייל</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/40 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-all"
                  placeholder="your@email.com"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">סיסמה</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 pl-12 text-white placeholder:text-white/40 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-all"
                  placeholder="••••••••"
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-white/10 border-white/20 text-gold-400 focus:ring-gold-400"
                />
                <span className="text-white/60">זכור אותי</span>
              </label>
              <Link href="/forgot-password" className="text-gold-400 hover:text-gold-300 transition-colors">
                שכחתם סיסמה?
              </Link>
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
                  <span>כניסה</span>
                  <ArrowLeft size={20} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-sm">או</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            className="w-full bg-white/10 border border-white/20 rounded-xl py-3 text-white hover:bg-white/15 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>המשיכו עם Google</span>
          </button>

          {/* Register link */}
          <p className="text-center mt-6 text-white/60">
            אין לכם חשבון?{' '}
            <Link href="/register" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              הירשמו עכשיו
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
