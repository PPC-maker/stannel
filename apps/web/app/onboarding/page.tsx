'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Shield,
  Gift,
} from 'lucide-react';
import Swal from 'sweetalert2';

const steps = [
  { id: 'welcome', title: 'ברוכים הבאים' },
  { id: 'profile', title: 'פרטים אישיים' },
  { id: 'complete', title: 'סיום' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isReady, user } = useAuthGuard();
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    company: '',
    phone: '',
    address: '',
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // In a real app, this would save the profile data
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshUser();

      Swal.fire({
        title: 'ההגדרה הושלמה!',
        html: '<p style="color: rgba(255,255,255,0.7);">ברוך הבא לתוכנית הנאמנות של STANNEL</p>',
        icon: 'success',
        confirmButtonText: 'בואו נתחיל!',
        background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%)',
        color: '#ffffff',
        iconColor: '#d4af37',
      });

      router.push('/wallet');
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה בשמירת הפרטים',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-gold-400 text-primary-900'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? <Check size={18} /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-1 rounded-full transition-all ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard hover={false}>
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold-400/20 flex items-center justify-center"
                    >
                      <Sparkles size={40} className="text-gold-400" />
                    </motion.div>

                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
                      ברוכים הבאים ל-STANNEL
                    </h1>
                    <p className="text-gray-700 mb-8">
                      שלום {user?.name}! אנחנו שמחים שהצטרפת לתוכנית הנאמנות שלנו.
                      <br />
                      בואו נשלים את ההרשמה בכמה צעדים פשוטים.
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Gift className="mx-auto text-gold-400 mb-2" size={24} />
                        <p className="text-gray-700 text-sm">צברו נקודות</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Shield className="mx-auto text-gold-400 mb-2" size={24} />
                        <p className="text-gray-700 text-sm">עלו בדרגות</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <Sparkles className="mx-auto text-gold-400 mb-2" size={24} />
                        <p className="text-gray-700 text-sm">ממשו הטבות</p>
                      </div>
                    </div>

                    <button
                      onClick={handleNext}
                      className="btn-gold w-full flex items-center justify-center gap-2"
                    >
                      בואו נתחיל
                      <ArrowLeft size={18} />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 2: Profile Details */}
            {currentStep === 1 && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard hover={false}>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-2 text-center">
                    פרטים נוספים
                  </h2>
                  <p className="text-gray-700 mb-6 text-center">
                    עזרו לנו להכיר אתכם טוב יותר (אופציונלי)
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-gray-700 text-sm mb-2 flex items-center gap-2">
                        <Building2 size={16} />
                        שם החברה / משרד
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-600"
                        placeholder="שם המשרד או החברה שלך"
                      />
                    </div>

                    <div>
                      <label className="text-gray-700 text-sm mb-2 flex items-center gap-2">
                        <Phone size={16} />
                        טלפון
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-600"
                        placeholder="מספר טלפון ליצירת קשר"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="text-gray-700 text-sm mb-2 flex items-center gap-2">
                        <MapPin size={16} />
                        כתובת
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-600"
                        placeholder="כתובת המשרד"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePrev}
                      className="flex-1 btn-secondary flex items-center justify-center gap-2"
                    >
                      <ArrowRight size={18} />
                      חזרה
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 btn-gold flex items-center justify-center gap-2"
                    >
                      המשך
                      <ArrowLeft size={18} />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 3: Complete */}
            {currentStep === 2 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard hover={false}>
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                      <Check size={40} className="text-green-500" />
                    </motion.div>

                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                      מעולה! הכל מוכן
                    </h2>
                    <p className="text-gray-700 mb-8">
                      החשבון שלך מוגדר ומוכן לשימוש.
                      <br />
                      התחל להעלות חשבוניות וצבור נקודות!
                    </p>

                    <div className="p-4 bg-gray-50 rounded-xl mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gold-400/20 flex items-center justify-center">
                          <User size={24} className="text-gold-400" />
                        </div>
                        <div className="text-right flex-1">
                          <p className="text-gray-900 font-bold">{user?.name}</p>
                          <p className="text-gray-700 text-sm">{user?.email}</p>
                        </div>
                      </div>
                      {formData.company && (
                        <div className="mt-3 pt-3 border-t border-gray-200 text-gray-700 text-sm">
                          {formData.company}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handlePrev}
                        className="flex-1 btn-secondary flex items-center justify-center gap-2"
                      >
                        <ArrowRight size={18} />
                        חזרה
                      </button>
                      <button
                        onClick={handleComplete}
                        disabled={loading}
                        className="flex-1 btn-gold flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            סיום
                            <Check size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
