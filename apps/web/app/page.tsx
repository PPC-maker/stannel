'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star, Users, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

const features = [
  {
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    title: 'לאדריכלים',
    description: 'צברו נקודות על כל רכישה מספקים מאומתים וממשו הטבות בלעדיות',
    icon: Award,
  },
  {
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80',
    title: 'לספקים',
    description: 'הגדילו מכירות, נהלו יעדים ובנו קשרים עם אדריכלים מובילים',
    icon: TrendingUp,
  },
  {
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    title: 'הטבות VIP',
    description: 'גישה לאירועים בלעדיים, מוצרים פרימיום וחוויות יוקרתיות',
    icon: Star,
  },
  {
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    title: 'AI מתקדם',
    description: 'אימות חשבוניות אוטומטי ותובנות עסקיות בזמן אמת',
    icon: CheckCircle2,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
            alt="Beautiful beach destination"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/60 to-[#F8FAFC]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 pt-32 pb-20 px-6 w-full flex justify-center">
          <div className="max-w-4xl w-full text-center flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Logo Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto mb-8 rounded-full bg-white shadow-xl flex items-center justify-center"
              >
                <span className="text-[#0066CC] font-bold text-3xl">S</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1E293B] mb-6 leading-tight">
                פלטפורמת הנאמנות
                <br />
                <span className="text-gradient-gold">לעולם האדריכלות</span>
              </h1>
              <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
                חיברו בין אדריכלים לספקים מובילים, צברו נקודות על כל עסקה
                וממשו הטבות בלעדיות
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
                className="btn-secondary text-lg px-8 py-4"
              >
                כניסה לחשבון
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Floating Cards */}
      <section className="relative -mt-20 z-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '500+', label: 'אדריכלים פעילים', icon: Users },
                { value: '150+', label: 'ספקים מאומתים', icon: CheckCircle2 },
                { value: '₪10M+', label: 'נפח עסקאות', icon: TrendingUp },
                { value: '98%', label: 'שביעות רצון', icon: Star },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[#E8F4FD] flex items-center justify-center mb-3">
                    <stat.icon size={24} className="text-[#0066CC]" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-[#0066CC]">
                    {stat.value}
                  </div>
                  <div className="text-[#64748B] text-sm mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
              למה STANNEL?
            </h2>
            <p className="text-[#64748B] text-lg">
              הפלטפורמה המתקדמת ביותר לניהול מועדון לקוחות בתעשייה
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <feature.icon size={24} className="text-[#0066CC]" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#1E293B] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#64748B] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Second Hero Section with Different Background */}
      <section className="relative py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920&q=80"
            alt="Tropical destination"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0066CC]/90 to-[#0088FF]/80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              מוכנים להצטרף?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              הצטרפו לקהילת האדריכלים והספקים המובילים בישראל
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#0066CC] px-10 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <span>התחילו עכשיו - חינם</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-10 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0066CC] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-[#1E293B] text-lg">STANNEL</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/accessibility" className="text-[#64748B] hover:text-[#0066CC] transition-colors">
              נגישות
            </Link>
            <Link href="/privacy" className="text-[#64748B] hover:text-[#0066CC] transition-colors">
              מדיניות פרטיות
            </Link>
          </div>
          <p className="text-[#94A3B8] text-sm">
            © {new Date().getFullYear()} STANNEL. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
}
