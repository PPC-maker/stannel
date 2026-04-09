'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Building2, ArrowLeft, Check, AlertCircle, Camera, X } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

type UserRole = 'ARCHITECT' | 'SUPPLIER';

export default function RegisterPage() {
  const { register, loading: authLoading, logout } = useAuth();

  // Sign out any existing user when entering register page
  // This prevents race conditions with existing Firebase sessions
  useEffect(() => {
    logout();
  }, [logout]);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('הקובץ גדול מדי. גודל מקסימלי 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setIsLoading(true);
    setError(null);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined,
        role: role,
        companyName: role === 'SUPPLIER' ? formData.companyName : undefined,
      });
      setStep(3); // Success step
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ההרשמה נכשלה';
      setError(translateFirebaseError(message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16 relative overflow-hidden">
      {/* Hero Background - Gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2620] via-[#1a4a3a] to-[#0f2620]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_60%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-8 bg-emerald-500'
                      : s < step
                      ? 'w-2.5 bg-emerald-500'
                      : 'w-2.5 bg-white/20'
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
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-right hover:border-emerald-500/50 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all">
                        <User size={24} className="text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">אדריכל / מעצב</h3>
                        <p className="text-white/60 text-sm">
                          צברו נקודות על רכישות, ממשו הטבות ונהנו מאירועים בלעדיים
                        </p>
                      </div>
                      <ArrowLeft className="text-white/40 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setRole('SUPPLIER');
                      setStep(2);
                    }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-right hover:border-emerald-500/50 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all">
                        <Building2 size={24} className="text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">ספק / יצרן</h3>
                        <p className="text-white/60 text-sm">
                          הגדילו מכירות, נהלו יעדים והתחברו לאדריכלים מובילים
                        </p>
                      </div>
                      <ArrowLeft className="text-white/40 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </button>
                </div>

                <p className="text-center mt-6 text-white/60">
                  יש לכם חשבון?{' '}
                  <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
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
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {role === 'ARCHITECT' ? 'הרשמה כאדריכל' : 'הרשמה כספק'}
                  </h1>
                  <p className="text-white/60">מלאו את הפרטים שלכם</p>
                </div>

                {/* Profile Image Upload */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-emerald-500 shadow-lg bg-white/10">
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt="תמונת פרופיל"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500/30 to-teal-600/30 flex items-center justify-center">
                          <User size={40} className="text-white/40" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-colors">
                      <Camera size={16} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                    {profileImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-0 left-0 w-6 h-6 bg-red-500 rounded-full shadow flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-center text-white/40 text-xs mb-4">תמונת פרופיל (אופציונלי)</p>

                {/* Error Alert */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3"
                  >
                    <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">שם מלא</label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                        placeholder="ישראל ישראלי"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {role === 'SUPPLIER' && (
                    <div>
                      <label className="block text-white/60 text-sm mb-2">שם החברה</label>
                      <div className="relative">
                        <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                          placeholder="שם החברה בע״מ"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-white/60 text-sm mb-2">אימייל</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                        placeholder="your@email.com"
                        required
                        dir="ltr"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">טלפון</label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                        placeholder="050-123-4567"
                        dir="ltr"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">סיסמה</label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={8}
                        dir="ltr"
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-white/40 text-xs mt-1">לפחות 8 תווים</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                      חזרה
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || authLoading}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Check size={40} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">נרשמת בהצלחה!</h1>
                <p className="text-white/60 mb-8">
                  החשבון שלך ממתין לאישור מנהל. נעדכן אותך במייל ברגע שהחשבון יאושר.
                </p>
                <Link href="/" className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all">
                  חזרה לעמוד הראשי
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Helper function to translate Firebase error messages to Hebrew
function translateFirebaseError(error: string): string {
  const errorMap: Record<string, string> = {
    'auth/email-already-in-use-wrong-password': 'כתובת האימייל כבר רשומה. נסו להתחבר עם הסיסמה הנכונה או השתמשו בכפתור "היכנסו כאן"',
    'auth/email-already-in-use': 'כתובת האימייל כבר בשימוש',
    'auth/invalid-email': 'כתובת אימייל לא תקינה',
    'auth/weak-password': 'הסיסמה חלשה מדי. השתמשו בלפחות 8 תווים',
    'auth/wrong-password': 'סיסמה שגויה',
    'auth/invalid-credential': 'פרטי התחברות שגויים',
    'auth/user-not-found': 'משתמש לא נמצא',
    'auth/operation-not-allowed': 'הרשמה לא מופעלת כרגע',
    'auth/network-request-failed': 'בעיית רשת. בדקו את החיבור לאינטרנט',
    'auth/too-many-requests': 'יותר מדי ניסיונות. נסו שוב מאוחר יותר',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return value;
    }
  }

  return error;
}
