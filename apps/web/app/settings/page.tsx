'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  Bell,
  Shield,
  Globe,
  LogOut,
  ChevronLeft,
  Mail,
  Phone,
  Building2,
  Moon,
  Sun,
  Camera,
  Check,
  X,
  Key,
  FileText,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('he');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const currentUser = {
    name: user?.name || 'משתמש',
    email: user?.email || 'user@example.com',
    phone: user?.phone || '-',
    company: user?.supplierProfile?.companyName || '-',
    role: user?.role === 'ARCHITECT' ? 'אדריכל' : user?.role === 'SUPPLIER' ? 'ספק' : 'משתמש',
    avatar: user?.profileImage,
  };

  const settingSections = [
    {
      title: 'פרטי חשבון',
      icon: User,
      items: [
        { label: 'שם מלא', value: currentUser.name, icon: User },
        { label: 'אימייל', value: currentUser.email, icon: Mail },
        { label: 'טלפון', value: currentUser.phone, icon: Phone },
        { label: 'חברה', value: currentUser.company, icon: Building2 },
      ],
    },
  ];

  const languages = [
    { code: 'he', label: 'עברית', flag: '' },
    { code: 'en', label: 'English', flag: '' },
    { code: 'ar', label: 'العربية', flag: '' },
  ];

  return (
    <div className="relative">
      <PageSlider images={sliderImages.dashboard} />
      <div className="p-6 max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white">הגדרות</h1>
          <p className="text-white/60 mt-1">נהל את החשבון וההעדפות שלך</p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <GlassCard delay={0.1}>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center overflow-hidden">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary-900">
                      {currentUser.name.charAt(0)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => router.push('/profile?edit=photo')}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-gold-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={12} className="text-primary-900" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{currentUser.name}</h2>
                <p className="text-white/60">{currentUser.role} {currentUser.company !== '-' && `• ${currentUser.company}`}</p>
              </div>
            </div>

            <div className="space-y-4">
              {settingSections[0].items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-white/50" />
                    <span className="text-white/70">{item.label}</span>
                  </div>
                  <span className="text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/profile?edit=true')}
              className="mt-4 w-full py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <User size={18} />
              עריכת פרופיל
            </button>
          </GlassCard>

          {/* Notifications */}
          <GlassCard delay={0.2}>
            <div className="flex items-center gap-3 mb-6">
              <Bell size={24} className="text-gold-400" />
              <h2 className="text-xl font-semibold text-white">התראות</h2>
            </div>

            <div className="space-y-4">
              {[
                { key: 'email', label: 'התראות באימייל', desc: 'קבלת עדכונים על חשבוניות והטבות', icon: Mail },
                { key: 'push', label: 'התראות Push', desc: 'התראות בזמן אמת בדפדפן', icon: Bell },
                { key: 'sms', label: 'הודעות SMS', desc: 'עדכונים חשובים בהודעת טקסט', icon: Phone },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-white/50" />
                    <div>
                      <p className="text-white">{item.label}</p>
                      <p className="text-white/50 text-sm">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof prev],
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'bg-gold-400'
                        : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'right-1'
                          : 'right-7'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Appearance */}
          <GlassCard delay={0.3}>
            <div className="flex items-center gap-3 mb-6">
              <Globe size={24} className="text-gold-400" />
              <h2 className="text-xl font-semibold text-white">תצוגה ונגישות</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon size={18} className="text-white/50" /> : <Sun size={18} className="text-white/50" />}
                  <div>
                    <p className="text-white">מצב כהה</p>
                    <p className="text-white/50 text-sm">התאמת ערכת הצבעים</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    darkMode ? 'bg-gold-400' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      darkMode ? 'right-1' : 'right-7'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => setShowLanguageModal(true)}
                className="flex items-center justify-between py-3 w-full hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-white/50" />
                  <div className="text-right">
                    <p className="text-white">שפה</p>
                    <p className="text-white/50 text-sm">שפת הממשק</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <span>{languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.label}</span>
                  <ChevronLeft size={16} />
                </div>
              </button>
            </div>
          </GlassCard>

          {/* Privacy & Security */}
          <GlassCard delay={0.4}>
            <div className="flex items-center gap-3 mb-6">
              <Shield size={24} className="text-gold-400" />
              <h2 className="text-xl font-semibold text-white">פרטיות ואבטחה</h2>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Key size={18} className="text-white/50" />
                  <div className="text-right">
                    <p className="text-white">שינוי סיסמה</p>
                    <p className="text-white/50 text-sm">עדכון סיסמת החשבון</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white/50" />
              </button>

              <button
                onClick={() => setShow2FAModal(true)}
                className="w-full flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-white/50" />
                  <div className="text-right">
                    <p className="text-white">אימות דו-שלבי</p>
                    <p className="text-white/50 text-sm">הוספת שכבת אבטחה נוספת</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white/50" />
              </button>

              <a
                href="/privacy-policy"
                target="_blank"
                className="w-full flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-white/50" />
                  <div className="text-right">
                    <p className="text-white">מדיניות פרטיות</p>
                    <p className="text-white/50 text-sm">צפייה במדיניות הפרטיות</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white/50" />
              </a>

              <a
                href="/terms"
                target="_blank"
                className="w-full flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-white/50" />
                  <div className="text-right">
                    <p className="text-white">תנאי שימוש</p>
                    <p className="text-white/50 text-sm">צפייה בתנאי השימוש</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white/50" />
              </a>
            </div>
          </GlassCard>

          {/* Logout */}
          <GlassCard delay={0.5}>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-3 py-3 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">התנתקות מהחשבון</span>
            </button>
          </GlassCard>
        </div>
      </div>

      {/* Language Modal */}
      <AnimatePresence>
        {showLanguageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLanguageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">בחר שפה</h3>
                <button onClick={() => setShowLanguageModal(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                      language === lang.code ? 'bg-gold-400/20 border border-gold-400/50' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="text-white">{lang.label}</span>
                    </div>
                    {language === lang.code && <Check size={20} className="text-gold-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">שינוי סיסמה</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">סיסמה נוכחית</label>
                  <input
                    type="password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-gold-400 transition-all"
                    placeholder="הזן סיסמה נוכחית"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">סיסמה חדשה</label>
                  <input
                    type="password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-gold-400 transition-all"
                    placeholder="הזן סיסמה חדשה"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">אימות סיסמה חדשה</label>
                  <input
                    type="password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-gold-400 transition-all"
                    placeholder="הזן שוב סיסמה חדשה"
                  />
                </div>
                <button className="w-full btn-gold mt-4">
                  עדכן סיסמה
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShow2FAModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">אימות דו-שלבי</h3>
                <button onClick={() => setShow2FAModal(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="text-center py-8">
                <Smartphone size={48} className="mx-auto text-gold-400 mb-4" />
                <p className="text-white mb-2">אימות דו-שלבי יתווסף בקרוב</p>
                <p className="text-white/50 text-sm">
                  תכונה זו תאפשר לך להוסיף שכבת אבטחה נוספת לחשבונך
                </p>
              </div>
              <button
                onClick={() => setShow2FAModal(false)}
                className="w-full py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                סגור
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">התנתקות מהחשבון</h3>
                <p className="text-white/60">האם אתה בטוח שברצונך להתנתק?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? 'מתנתק...' : 'התנתק'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
