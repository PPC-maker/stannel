'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import VideoIntro from '@/components/layout/VideoIntro';

// Hero images grid
const heroImages = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80',
];

// Why choose us features
const whyChooseUs = [
  {
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80',
    title: 'ספקים מובחרים',
    description: 'רק הספקים הטובים ביותר',
  },
  {
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&q=80',
    title: 'תגמולים ובונוסים',
    description: 'הרוויחו מכל עסקה',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
    title: 'קהילה חזקה',
    description: 'התחברו עם מעצבים אחרים',
  },
];

// Suppliers
const suppliers = [
  { name: 'Samsung', category: 'אלקטרוניקה', initial: 'S', color: 'bg-[#1428a0]' },
  { name: 'Bezeq', category: 'תקשורת', initial: 'B', color: 'bg-[#00a6e0]' },
  { name: 'דברת', category: 'ריהוט', initial: 'ד', color: 'bg-[#0a6847]' },
];

// Testimonials
const testimonials = [
  {
    name: 'ארתור משפחתי',
    role: 'אדריכל',
    text: '"STANNEL שינתה את דרך עבודתי עם ספקים. מאוד מרשים!"',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    name: 'מיכל סילבר',
    role: 'מעצבת פנים',
    text: '"STANNEL שינתה את דרך עבודתי עם ספקים. מאוד מרשים!"',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
];

// Featured projects
const projects = [
  { image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&q=80', title: 'סלון מודרני' },
  { image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', title: 'מטבח מעוצב' },
  { image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&q=80', title: 'חדר שינה' },
  { image: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400&q=80', title: 'אמבטיה יוקרתית' },
  { image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', title: 'חלל עבודה' },
  { image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&q=80', title: 'בניה מודרנית' },
];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to register with pre-filled data
    window.location.href = `/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
  };

  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <>
      {/* Video Intro - Only on home page */}
      <VideoIntro />

      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#0a6847] min-h-[70vh] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-12">
          {/* Images Grid */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 gap-3 w-full lg:w-1/2"
          >
            {heroImages.map((img, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg"
              >
                <Image
                  src={img}
                  alt={`Interior design ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </motion.div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-right lg:w-1/2"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              STANNEL CLUB
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              קהילת ערך למעצבים
            </h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              פלטפורמה חדשנית המחברת אדריכלים ומעצבים עם ספקים מובחרים
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#0a6847] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors group"
            >
              <span>התחל עכשיו</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Join Community Form Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row"
          >
            {/* Form Image */}
            <div className="relative w-full lg:w-1/2 h-64 lg:h-auto">
              <Image
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80"
                alt="Join us"
                fill
                className="object-cover"
              />
            </div>

            {/* Form */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-right">הצטרפו לקהילה</h3>
              <p className="text-gray-600 mb-6 text-right">השאירו את פרטיכם ונציג יחזור אליכם בקרוב</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="כתובת אימייל"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0a6847] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0a6847] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="w-full bg-[#d4af37] hover:bg-[#c9a432] text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  שלח
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose STANNEL Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            למה לבחור ב-STANNEL?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#0a6847]/10 flex items-center justify-center">
                    <CheckCircle size={24} className="text-[#0a6847]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Suppliers Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            ספקים שלנו
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {suppliers.map((supplier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl ${supplier.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-2xl">{supplier.initial}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{supplier.name}</h3>
                <p className="text-gray-500 text-sm">{supplier.category}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            מה אומרים עלינו
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#0a6847] rounded-2xl p-6 text-right"
              >
                <div className="flex items-center gap-4 mb-4 flex-row-reverse">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{testimonial.name}</h4>
                    <p className="text-white/70 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed">{testimonial.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 bg-[#0a6847]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '+100', label: 'אדריכלים' },
              { value: '+50', label: 'ספקים' },
              { value: '+250', label: 'פרויקטים' },
              { value: '+5M', label: 'תגמולים שחולקו' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            פרויקטים מובחרים
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-[4/3] rounded-xl overflow-hidden group"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-4 right-4">
                    <span className="text-white font-semibold">{project.title}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#0a6847]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              מוכנים להצטרף?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              הירשמו כיום וקבלו גישה מיידית לקהילה שלנו
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#0a6847] px-10 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors group"
            >
              <span>הירשמו עכשיו</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a2e] py-12 px-6 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl font-bold mb-4">STANNEL</h3>
              <p className="text-gray-400 text-sm">
                קהילת ערך למעצבים ואדריכלים
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">קישורים</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">עמוד בית</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">אודות</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">ספקים</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">משפטי</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">תנאי שימוש</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">מדיניות פרטיות</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">יצירת קשר</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>info@stannel.club</li>
                <li>+972-1-234-5678</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            © STANNEL CLUB 2026. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
