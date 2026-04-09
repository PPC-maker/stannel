'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
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
  Server,
  Cloud,
  Database,
  Lock,
  RefreshCw,
  FileCode,
  CheckCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function SettingsPage() {
  const { isReady } = useAuthGuard();
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

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutConfirm(false);
      await Swal.fire({
        title: 'התנתקת מהמערכת',
        html: '<p style="color: rgba(255,255,255,0.7); font-size: 1.1rem;">נשמח לראותך שוב בקרוב!</p>',
        icon: 'success',
        iconColor: '#10b981',
        confirmButtonText: 'להתראות',
        confirmButtonColor: '#10b981',
        background: '#0a1f18',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.8)',
        customClass: {
          popup: 'glass-swal-popup',
          title: 'swal-title-rtl',
          confirmButton: 'swal-confirm-gold',
        },
        showClass: {
          popup: 'animate__animated animate__fadeInDown animate__faster'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp animate__faster'
        }
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
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
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background - Gradient with Better Fade */}
      <div className="relative h-72 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2620] via-[#1a4a3a] to-[#0f2620]" />
        {/* Radial emerald glow at top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.2),transparent_60%)]" />
        {/* Enhanced bottom fade - multiple layers for smooth transition */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0f2620] via-[#0f2620]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f2620] to-transparent" />
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto -mt-32 relative z-10 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">הגדרות</h1>
          <p className="text-white/60 mt-1">נהל את החשבון וההעדפות שלך</p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {currentUser.name.charAt(0)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => router.push('/profile?edit=photo')}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={12} className="text-white" />
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
                    <item.icon size={18} className="text-emerald-400" />
                    <span className="text-white/60">{item.label}</span>
                  </div>
                  <span className="text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/profile?edit=true')}
              className="mt-4 w-full py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/10"
            >
              <User size={18} />
              עריכת פרופיל
            </button>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell size={24} className="text-emerald-400" />
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
                    <item.icon size={18} className="text-emerald-400" />
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
                        ? 'bg-emerald-500'
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
          </motion.div>

          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Globe size={24} className="text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">תצוגה ונגישות</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon size={18} className="text-emerald-400" /> : <Sun size={18} className="text-emerald-400" />}
                  <div>
                    <p className="text-white">מצב כהה</p>
                    <p className="text-white/50 text-sm">התאמת ערכת הצבעים</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    darkMode ? 'bg-emerald-500' : 'bg-white/20'
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
                className="flex items-center justify-between py-3 w-full hover:bg-white/5 rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-emerald-400" />
                  <div className="text-right">
                    <p className="text-white">שפה</p>
                    <p className="text-white/50 text-sm">שפת הממשק</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <span>{languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.label}</span>
                  <ChevronLeft size={16} />
                </div>
              </button>
            </div>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield size={24} className="text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">פרטיות ואבטחה</h2>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between py-4 px-4 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Key size={18} className="text-emerald-400" />
                  <div className="text-right">
                    <p className="text-white">שינוי סיסמה</p>
                    <p className="text-white/50 text-sm">עדכון סיסמת החשבון</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white/40" />
              </button>

              <button
                onClick={() => setShow2FAModal(true)}
                className="w-full flex items-center justify-between py-4 px-4 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-emerald-400" />
                  <div className="text-right">
                    <p className="text-white">אימות דו-שלבי</p>
                    <p className="text-white/50 text-sm">הוספת שכבת אבטחה נוספת</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white/40" />
              </button>

              <a
                href="/privacy"
                className="w-full flex items-center justify-between py-4 px-4 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-emerald-400" />
                  <div className="text-right">
                    <p className="text-white">מדיניות פרטיות ותנאי שימוש</p>
                    <p className="text-white/50 text-sm">צפייה במדיניות ובתנאים</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white/40" />
              </a>
            </div>
          </motion.div>

          {/* Service Terms & Infrastructure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Server size={24} className="text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">אחסון המערכת</h2>
            </div>

            <p className="text-white/60 mb-4">
              המערכת מאוחסנת בשרתים תחת חשבון ענן בבעלות STANNEL CLUB:
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { name: 'Google Cloud', icon: Cloud },
                { name: 'AWS', icon: Cloud },
                { name: 'Azure', icon: Cloud },
              ].map((provider) => (
                <div
                  key={provider.name}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <provider.icon size={24} className="text-emerald-400" />
                  <span className="text-white text-sm">{provider.name}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-white/60 text-sm flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                המפתח יקבל גישה טכנית בלבד
              </p>
              <p className="text-white/60 text-sm">החברה תהיה בעלת השליטה המלאה ב:</p>
              <ul className="space-y-2 mr-4">
                {['קוד מקור', 'בסיס נתונים', 'שירותי ענן', 'שירותי AI', 'מערכת גיבויים'].map((item) => (
                  <li key={item} className="text-white/70 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Backups & Data Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Database size={24} className="text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">גיבויים ואבטחת מידע</h2>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-white/60 font-medium">גיבויים שוטפים:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <RefreshCw size={20} className="text-emerald-400" />
                  <div>
                    <p className="text-white text-sm">גיבוי אוטומטי</p>
                    <p className="text-white/50 text-xs">יומי לכמות מתגלגלת</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <Database size={20} className="text-blue-400" />
                  <div>
                    <p className="text-white text-sm">גיבוי שבועי</p>
                    <p className="text-white/50 text-xs">מלא למערכת</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Lock size={16} className="text-emerald-400" />
                <span className="text-white/80 text-sm">שמירת גיבויים ל-30 יום לפחות</span>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-white/60 font-medium">אבטחה:</p>
              <div className="space-y-2">
                {[
                  { text: 'כל החיבורים למערכת יהיו מאובטחים (HTTPS)', icon: Lock },
                  { text: 'הרשאות משתמשים יזהו באמרה מאובטחת', icon: Shield },
                  { text: 'כל הפעולות במערכת יתועדו בלוגים', icon: FileText },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                    <item.icon size={16} className="text-emerald-400 shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Code Escrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileCode size={24} className="text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Escrow לקוד</h2>
            </div>

            <p className="text-white/60 text-sm leading-relaxed">
              בפרידה והפסקה מספק פיתוח, החברה תהיה זכאית לקבל:
            </p>
            <ul className="space-y-2 mt-3 mr-4">
              {['קוד מקור מלא ומעודכן', 'תיעוד טכני מלא', 'הרשאות גישה לכל השירותים'].map((item) => (
                <li key={item} className="text-white/70 text-sm flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-3 py-3 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">התנתקות מהחשבון</span>
            </button>
          </motion.div>
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
              className="bg-[#0a1f18] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">בחר שפה</h3>
                <button onClick={() => setShowLanguageModal(false)} className="text-white/60 hover:text-white">
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
                      language === lang.code ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="text-white">{lang.label}</span>
                    </div>
                    {language === lang.code && <Check size={20} className="text-emerald-400" />}
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
              className="bg-[#0a1f18] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">שינוי סיסמה</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-white/60 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">סיסמה נוכחית</label>
                  <input
                    type="password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                    placeholder="הזן סיסמה נוכחית"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">סיסמה חדשה</label>
                  <input
                    type="password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                    placeholder="הזן סיסמה חדשה"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">אימות סיסמה חדשה</label>
                  <input
                    type="password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                    placeholder="הזן שוב סיסמה חדשה"
                  />
                </div>
                <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all mt-4">
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
              className="bg-[#0a1f18] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">אימות דו-שלבי</h3>
                <button onClick={() => setShow2FAModal(false)} className="text-white/60 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="text-center py-8">
                <Smartphone size={48} className="mx-auto text-emerald-400 mb-4" />
                <p className="text-white mb-2">אימות דו-שלבי יתווסף בקרוב</p>
                <p className="text-white/50 text-sm">
                  תכונה זו תאפשר לך להוסיף שכבת אבטחה נוספת לחשבונך
                </p>
              </div>
              <button
                onClick={() => setShow2FAModal(false)}
                className="w-full py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
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
              className="bg-[#0a1f18] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">התנתקות מהחשבון</h3>
                <p className="text-white/60">האם אתה בטוח שברצונך להתנתק?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10"
                >
                  ביטול
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
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
