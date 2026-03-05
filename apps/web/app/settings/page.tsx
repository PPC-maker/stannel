'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
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
} from 'lucide-react';

// Mock user data
const mockUser = {
  name: 'ישראל ישראלי',
  email: 'israel@example.com',
  phone: '050-1234567',
  company: 'משרד אדריכלים ישראלי',
  role: 'אדריכל',
};

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });
  const [darkMode, setDarkMode] = useState(true);

  const settingSections = [
    {
      title: 'פרטי חשבון',
      icon: User,
      items: [
        { label: 'שם מלא', value: mockUser.name, icon: User },
        { label: 'אימייל', value: mockUser.email, icon: Mail },
        { label: 'טלפון', value: mockUser.phone, icon: Phone },
        { label: 'חברה', value: mockUser.company, icon: Building2 },
      ],
    },
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-900">
                  {mockUser.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{mockUser.name}</h2>
                <p className="text-white/60">{mockUser.role} • {mockUser.company}</p>
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

            <button className="mt-4 w-full py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
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

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-white/50" />
                  <div>
                    <p className="text-white">שפה</p>
                    <p className="text-white/50 text-sm">שפת הממשק</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <span>עברית</span>
                  <ChevronLeft size={16} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Privacy & Security */}
          <GlassCard delay={0.4}>
            <div className="flex items-center gap-3 mb-6">
              <Shield size={24} className="text-gold-400" />
              <h2 className="text-xl font-semibold text-white">פרטיות ואבטחה</h2>
            </div>

            <div className="space-y-2">
              {[
                { label: 'שינוי סיסמה', desc: 'עדכון סיסמת החשבון' },
                { label: 'אימות דו-שלבי', desc: 'הוספת שכבת אבטחה נוספת' },
                { label: 'מדיניות פרטיות', desc: 'צפייה במדיניות הפרטיות' },
                { label: 'תנאי שימוש', desc: 'צפייה בתנאי השימוש' },
              ].map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between py-4 px-4 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="text-right">
                    <p className="text-white">{item.label}</p>
                    <p className="text-white/50 text-sm">{item.desc}</p>
                  </div>
                  <ChevronLeft size={20} className="text-white/50" />
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Logout */}
          <GlassCard delay={0.5}>
            <button className="w-full flex items-center justify-center gap-3 py-3 text-red-400 hover:text-red-300 transition-colors">
              <LogOut size={20} />
              <span className="font-medium">התנתקות מהחשבון</span>
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
