'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import GlassCard from '@/components/layout/GlassCard';
import HeroSlider from '@/components/layout/HeroSlider';
import { ArrowLeft } from 'lucide-react';

const features = [
  {
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    title: 'לאדריכלים',
    description: 'צברו נקודות על כל רכישה מספקים מאומתים וממשו הטבות בלעדיות',
  },
  {
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80',
    title: 'לספקים',
    description: 'הגדילו מכירות, נהלו יעדים ובנו קשרים עם אדריכלים מובילים',
  },
  {
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    title: 'הטבות VIP',
    description: 'גישה לאירועים בלעדיים, מוצרים פרימיום וחוויות יוקרתיות',
  },
  {
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    title: 'AI מתקדם',
    description: 'אימות חשבוניות אוטומטי ותובנות עסקיות בזמן אמת',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Slider Background */}
      <HeroSlider />

      {/* Hero Section */}
      <section className="relative pt-10 pb-32 px-6 w-full flex justify-center z-10">
        <div className="max-w-4xl w-full text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight text-center w-full">
              פלטפורמת הנאמנות
              <br />
              <span className="text-gradient-gold">לעולם האדריכלות</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mb-10 leading-relaxed text-center">
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
      <section className="relative py-20 px-6 z-10">
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
              <GlassCard key={index} delay={index * 0.1} className="text-center p-0 overflow-hidden">
                <div className="relative h-40 w-full">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060f1f] via-[#060f1f]/50 to-transparent" />
                </div>
                <div className="p-6 pt-4">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-6 z-10">
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
      <section className="relative py-20 px-6 z-10">
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
      <footer className="relative py-10 px-6 border-t border-white/10 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-primary-900 font-bold">S</span>
            </div>
            <span className="font-bold text-white">STANNEL</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/accessibility" className="text-white/60 hover:text-white transition-colors">
              נגישות
            </Link>
            <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
              מדיניות פרטיות
            </Link>
          </div>
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} STANNEL. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
}
