'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, ArrowLeft, Users, Gift, Building2, Star, ChevronLeft, Instagram, Facebook, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Why choose us features - with unique colors
const whyChooseUs = [
  {
    icon: Building2,
    title: 'ספקים מובחרים',
    color: 'bg-[#c99b4a]/20',
    iconColor: 'text-[#c99b4a]',
    borderColor: 'border-[#c99b4a]/30',
  },
  {
    icon: Gift,
    title: 'תגמולים ובונוסים',
    color: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  {
    icon: Users,
    title: 'קהילה חזקה',
    color: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
  },
];

// Suppliers
const suppliers = [
  { name: 'Samsung', category: 'אלקטרוניקה', initial: 'S', color: 'bg-blue-600' },
  { name: 'Bezeq', category: 'תקשורת', initial: 'B', color: 'bg-cyan-500' },
  { name: 'דברת', category: 'ריהוט', initial: 'ד', color: 'bg-emerald-600' },
  { name: 'ACE', category: 'חומרי בניין', initial: 'A', color: 'bg-orange-500' },
];

// Testimonials
const testimonials = [
  {
    name: 'ארתור משפחתי',
    role: 'אדריכל',
    text: '"STANNEL שינתה את דרך עבודתי עם ספקים. השירות מצוין והתגמולים משתלמים!"',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'מיכל סילבר',
    role: 'מעצבת פנים',
    text: '"הפלטפורמה הכי מקצועית שנתקלתי בה. ממליצה בחום לכל קולגה!"',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
];

// Stats
const stats = [
  { value: '+100', label: 'אדריכלים' },
  { value: '+50', label: 'ספקים' },
  { value: '+250', label: 'פרויקטים' },
  { value: '+5M', label: 'תגמולים' },
];

// Featured projects
const projects = [
  { image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&q=80', title: 'סלון מודרני' },
  { image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', title: 'מטבח מעוצב' },
  { image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&q=80', title: 'חדר שינה' },
  { image: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400&q=80', title: 'אמבטיה יוקרתית' },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (!mounted || loading || !user) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Content */}
      <section className="px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-[#2b241d] mb-4">
            STANNEL CLUB
          </h1>
          <h2 className="text-2xl md:text-3xl text-[#2b241d] font-light mb-6">
            קהילת הערך למעצבים ואדריכלים
          </h2>
          <p className="text-[#8b7c69] text-lg mb-8 max-w-xl mx-auto">
            פלטפורמה חדשנית המחברת אדריכלים ומעצבים עם ספקים מובחרים.
            הצטרפו והתחילו להרוויח מכל פרויקט.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#c99b4a] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#9e7746] transition-all group"
            >
              <span>הצטרפו עכשיו</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white border border-[rgba(201,155,74,0.2)] text-[#2b241d] px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#f7f3f2] transition-all"
            >
              <span>התחברות</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-[#2b241d] mb-2">
                  {stat.value}
                </div>
                <div className="text-[#8b7c69] text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#2b241d]">
              למה לבחור ב-STANNEL?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white border ${item.borderColor} rounded-3xl p-8 text-center hover:scale-105 transition-all group`}
                style={{ boxShadow: '0 8px 24px rgba(64,38,18,0.08)' }}
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${item.color} flex items-center justify-center`}>
                  <item.icon size={32} className={item.iconColor} />
                </div>
                <h3 className="text-xl font-bold text-[#2b241d]">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Suppliers Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#2b241d] mb-4">
              ספקים מובחרים
            </h2>
            <p className="text-[#8b7c69]">
              חיבור לספקים האיכותיים ביותר בתעשייה
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suppliers.map((supplier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 text-center hover:bg-[#f7f3f2] transition-all"
                style={{ boxShadow: '0 8px 24px rgba(64,38,18,0.08)' }}
              >
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${supplier.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-xl">{supplier.initial}</span>
                </div>
                <h3 className="text-lg font-bold text-[#2b241d] mb-1">{supplier.name}</h3>
                <p className="text-[#a89b8a] text-sm">{supplier.category}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#2b241d] transition-colors"
            >
              <span>לכל הספקים</span>
              <ChevronLeft size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Projects Gallery */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#2b241d] mb-4">
              פרויקטים מובחרים
            </h2>
            <p className="text-[#8b7c69]">
              עבודות של חברי הקהילה שלנו
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {/* Bottom third green overlay with centered text */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-[#2b241d] text-lg md:text-xl font-semibold tracking-wide">{project.title}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#2b241d] mb-4">
              מה אומרים עלינו
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-[rgba(201,155,74,0.08)] rounded-3xl p-8"
                style={{ boxShadow: '0 8px 24px rgba(64,38,18,0.08)' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[rgba(201,155,74,0.2)]">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-[#2b241d] font-bold">{testimonial.name}</h4>
                    <p className="text-[#a89b8a] text-sm">{testimonial.role}</p>
                  </div>
                  <div className="mr-auto flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[#8b7c69] leading-relaxed">{testimonial.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 border-t border-[rgba(201,155,74,0.08)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl font-bold text-[#2b241d] mb-4">STANNEL</h3>
              <p className="text-[#a89b8a] text-sm">
                קהילת הערך המובילה למעצבים ואדריכלים בישראל
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-[#2b241d] mb-4">קישורים</h4>
              <ul className="space-y-2 text-sm text-[#a89b8a]">
                <li><Link href="/" className="hover:text-[#2b241d] transition-colors">עמוד בית</Link></li>
                <li><Link href="/login" className="hover:text-[#2b241d] transition-colors">התחברות</Link></li>
                <li><Link href="/register" className="hover:text-[#2b241d] transition-colors">הרשמה</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-[#2b241d] mb-4">משפטי</h4>
              <ul className="space-y-2 text-sm text-[#a89b8a]">
                <li><Link href="/terms" className="hover:text-[#2b241d] transition-colors">תקנון ותנאי שימוש</Link></li>
                <li><Link href="/privacy" className="hover:text-[#2b241d] transition-colors">מדיניות פרטיות</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-[#2b241d] mb-4">יצירת קשר</h4>
              <ul className="space-y-2 text-sm text-[#a89b8a]">
                <li>info@stannel.club</li>
                <li>+972-1-234-5678</li>
              </ul>
              {/* Social Links */}
              <div className="flex gap-4 mt-4">
                <a
                  href="https://www.instagram.com/stannel_magazine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#f7f3f2] flex items-center justify-center hover:bg-[#ece5e1] transition-colors"
                >
                  <Instagram size={20} className="text-[#2b241d]" />
                </a>
                <a
                  href="https://www.facebook.com/share/18WhmXsTgu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#f7f3f2] flex items-center justify-center hover:bg-[#ece5e1] transition-colors"
                >
                  <Facebook size={20} className="text-[#2b241d]" />
                </a>
                <a
                  href="https://stannelmarketplace.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#f7f3f2] flex items-center justify-center hover:bg-[#ece5e1] transition-colors"
                >
                  <Globe size={20} className="text-[#2b241d]" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[rgba(201,155,74,0.08)] pt-8 text-center text-[#a89b8a] text-sm">
            © STANNEL CLUB 2026. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  );
}
