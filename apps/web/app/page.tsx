'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, ArrowLeft, Users, Gift, Building2, Star, ChevronLeft } from 'lucide-react';

// Why choose us features
const whyChooseUs = [
  {
    icon: Building2,
    title: 'ספקים מובחרים',
    description: 'רק הספקים הטובים ביותר בתעשייה',
  },
  {
    icon: Gift,
    title: 'תגמולים ובונוסים',
    description: 'הרוויחו מכל עסקה שתבצעו',
  },
  {
    icon: Users,
    title: 'קהילה חזקה',
    description: 'התחברו עם מעצבים ואדריכלים',
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#0f2620]" />;
  }

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section */}
      <section className="relative">
        {/* Background Image Container - Limited Height */}
        <div className="relative h-[60vh] min-h-[400px]">
          <Image
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
            alt="Modern architecture"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
          {/* Strong fade at bottom of image */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/20 via-transparent via-40% to-[#0f2620]" />
        </div>

        {/* Hero Content - Below the image */}
        <div className="bg-[#0f2620] px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              STANNEL CLUB
            </h1>
            <h2 className="text-2xl md:text-3xl text-white/90 font-light mb-6">
              קהילת הערך למעצבים ואדריכלים
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              פלטפורמה חדשנית המחברת אדריכלים ומעצבים עם ספקים מובחרים.
              הצטרפו והתחילו להרוויח מכל פרויקט.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0f2620] px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/90 transition-all group"
              >
                <span>הצטרפו עכשיו</span>
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all"
              >
                <span>התחברות</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-6 bg-[#0f2620]">
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
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-6 bg-[#0f2620]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              למה לבחור ב-STANNEL?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              אנחנו מציעים את הפלטפורמה המתקדמת ביותר לאדריכלים ומעצבים
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all group"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <item.icon size={32} className="text-white/80" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Suppliers Section */}
      <section className="py-20 px-6 bg-[#0a1f18]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              הספקים שלנו
            </h2>
            <p className="text-white/60">
              שותפויות עם המותגים המובילים בתעשייה
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
                className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
              >
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${supplier.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-xl">{supplier.initial}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{supplier.name}</h3>
                <p className="text-white/50 text-sm">{supplier.category}</p>
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
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <span>לכל הספקים</span>
              <ChevronLeft size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Projects Gallery */}
      <section className="py-20 px-6 bg-[#0f2620]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              פרויקטים מובחרים
            </h2>
            <p className="text-white/60">
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
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[#0f2620]/90 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white text-lg md:text-xl font-semibold tracking-wide">{project.title}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-[#0a1f18]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
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
                className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{testimonial.name}</h4>
                    <p className="text-white/50 text-sm">{testimonial.role}</p>
                  </div>
                  <div className="mr-auto flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-white/80 leading-relaxed">{testimonial.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#0f2620] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              מוכנים להצטרף?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              הירשמו היום וקבלו גישה מיידית לכל היתרונות של הקהילה
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#0f2620] px-10 py-5 rounded-2xl font-semibold text-lg hover:bg-white/90 transition-all group"
            >
              <span>הירשמו עכשיו - חינם</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#071510] py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl font-bold text-white mb-4">STANNEL</h3>
              <p className="text-white/50 text-sm">
                קהילת הערך המובילה למעצבים ואדריכלים בישראל
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">קישורים</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/" className="hover:text-white transition-colors">עמוד בית</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">התחברות</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">הרשמה</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">משפטי</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/privacy" className="hover:text-white transition-colors">תנאי שימוש</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">מדיניות פרטיות</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">יצירת קשר</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>info@stannel.club</li>
                <li>+972-1-234-5678</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-white/40 text-sm">
            © STANNEL CLUB 2026. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  );
}
