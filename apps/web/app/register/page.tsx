'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import { Mail, Lock, User, Phone, Building2, ArrowLeft, Check } from 'lucide-react';

type UserRole = 'ARCHITECT' | 'SUPPLIER';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Firebase auth + API registration will be implemented here
    setTimeout(() => {
      setIsLoading(false);
      setStep(3); // Success step
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <GlassCard className="p-8">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-gold-400'
                    : s < step
                    ? 'bg-gold-400'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Choose Role */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">הצטרפו ל-STANNEL</h1>
                <p className="text-white/60">בחרו את סוג החשבון שלכם</p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => {
                    setRole('ARCHITECT');
                    setStep(2);
                  }}
                  className="glass-card p-6 text-right hover:border-gold-400/50 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400/20 to-primary-600/20 flex items-center justify-center group-hover:from-gold-400/20 group-hover:to-gold-600/20 transition-all">
                      <User size={24} className="text-primary-400 group-hover:text-gold-400 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">אדריכל / מעצב</h3>
                      <p className="text-white/60 text-sm">
                        צברו נקודות על רכישות, ממשו הטבות ונהנו מאירועים בלעדיים
                      </p>
                    </div>
                    <ArrowLeft className="text-white/40 group-hover:text-gold-400 transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole('SUPPLIER');
                    setStep(2);
                  }}
                  className="glass-card p-6 text-right hover:border-gold-400/50 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400/20 to-primary-600/20 flex items-center justify-center group-hover:from-gold-400/20 group-hover:to-gold-600/20 transition-all">
                      <Building2 size={24} className="text-primary-400 group-hover:text-gold-400 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">ספק / יצרן</h3>
                      <p className="text-white/60 text-sm">
                        הגדילו מכירות, נהלו יעדים והתחברו לאדריכלים מובילים
                      </p>
                    </div>
                    <ArrowLeft className="text-white/40 group-hover:text-gold-400 transition-colors" />
                  </div>
                </button>
              </div>

              <p className="text-center mt-6 text-white/60">
                יש לכם חשבון?{' '}
                <Link href="/login" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
                  היכנסו כאן
                </Link>
              </p>
            </motion.div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {role === 'ARCHITECT' ? 'הרשמה כאדריכל' : 'הרשמה כספק'}
                </h1>
                <p className="text-white/60">מלאו את הפרטים שלכם</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">שם מלא</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white focus:border-gold-400 transition-all"
                      placeholder="ישראל ישראלי"
                      required
                    />
                  </div>
                </div>

                {role === 'SUPPLIER' && (
                  <div>
                    <label className="block text-white/70 text-sm mb-2">שם החברה</label>
                    <div className="relative">
                      <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white focus:border-gold-400 transition-all"
                        placeholder="שם החברה בע״מ"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-white/70 text-sm mb-2">אימייל</label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white focus:border-gold-400 transition-all"
                      placeholder="your@email.com"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">טלפון</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white focus:border-gold-400 transition-all"
                      placeholder="050-123-4567"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">סיסמה</label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white focus:border-gold-400 transition-all"
                      placeholder="••••••••"
                      required
                      minLength={8}
                      dir="ltr"
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-1">לפחות 8 תווים</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 text-white hover:bg-white/15 transition-colors"
                  >
                    חזרה
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-gold py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="spinner" />
                    ) : (
                      <>
                        <span>הרשמה</span>
                        <ArrowLeft size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Check size={40} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">נרשמת בהצלחה!</h1>
              <p className="text-white/60 mb-8">
                החשבון שלך ממתין לאישור מנהל. נעדכן אותך במייל ברגע שהחשבון יאושר.
              </p>
              <Link href="/" className="btn-primary px-8 py-3 inline-block">
                חזרה לעמוד הראשי
              </Link>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
