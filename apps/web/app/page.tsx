'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GlassCard from '@/components/layout/GlassCard';
import { ArrowLeft, Building2, Users, Award, Zap } from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: 'לאדריכלים',
    description: 'צברו נקודות על כל רכישה מספקים מאומתים וממשו הטבות בלעדיות',
  },
  {
    icon: Users,
    title: 'לספקים',
    description: 'הגדילו מכירות, נהלו יעדים ובנו קשרים עם אדריכלים מובילים',
  },
  {
    icon: Award,
    title: 'הטבות VIP',
    description: 'גישה לאירועים בלעדיים, מוצרים פרימיום וחוויות יוקרתיות',
  },
  {
    icon: Zap,
    title: 'AI מתקדם',
    description: 'אימות חשבוניות אוטומטי ותובנות עסקיות בזמן אמת',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight">
              פלטפורמת הנאמנות
              <br />
              <span className="text-gradient-gold">לעולם האדריכלות</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed">
              חיברו בין אדריכלים לספקים מובילים, צברו נקודות על כל עסקה
              וממשו הטבות בלעדיות בפלטפורמה המתקדמת בישראל
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/register"
              className="btn-gold text-lg px-8 py-4 flex items-center justify-center gap-2 group"
            >
              <span>הצטרפו עכשיו</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="btn-primary text-lg px-8 py-4"
            >
              כניסה לחשבון
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              למה STANNEL?
            </h2>
            <p className="text-white/60 text-lg">
              הפלטפורמה המתקדמת ביותר לניהול מועדון לקוחות בתעשייה
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <GlassCard key={index} delay={index * 0.1} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/20 flex items-center justify-center">
                  <feature.icon size={28} className="text-gold-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <GlassCard gold className="p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '500+', label: 'אדריכלים פעילים' },
                { value: '150+', label: 'ספקים מאומתים' },
                { value: '₪10M+', label: 'נפח עסקאות' },
                { value: '98%', label: 'שביעות רצון' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-gold-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              מוכנים להצטרף?
            </h2>
            <p className="text-white/60 text-lg mb-8">
              הצטרפו לקהילת האדריכלים והספקים המובילים בישראל
            </p>
            <Link
              href="/register"
              className="btn-gold text-lg px-10 py-4 inline-flex items-center gap-2 group"
            >
              <span>התחילו עכשיו - חינם</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-primary-900 font-bold">S</span>
            </div>
            <span className="font-bold text-white">STANNEL</span>
          </div>
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} STANNEL. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
}
