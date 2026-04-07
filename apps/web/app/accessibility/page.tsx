'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { ArrowRight, Eye, Keyboard, Volume2, MousePointer, Monitor, Phone } from 'lucide-react';

const accessibilityFeatures = [
  {
    icon: Keyboard,
    title: 'ניווט מקלדת',
    description: 'האתר תומך בניווט מלא באמצעות מקלדת עבור משתמשים שאינם יכולים להשתמש בעכבר.',
  },
  {
    icon: Eye,
    title: 'תמיכה בקוראי מסך',
    description: 'כל התכנים באתר מותאמים לקוראי מסך עם תיאורים חלופיים לתמונות ותוויות ברורות.',
  },
  {
    icon: Volume2,
    title: 'תכנים טקסטואליים',
    description: 'מידע חשוב מוצג בטקסט ולא רק בצורה גרפית, לנוחיות משתמשי טכנולוגיות מסייעות.',
  },
  {
    icon: MousePointer,
    title: 'אזורי לחיצה גדולים',
    description: 'כפתורים וקישורים בעלי אזורי לחיצה מספיק גדולים לשימוש נוח.',
  },
  {
    icon: Monitor,
    title: 'ניגודיות צבעים',
    description: 'האתר עומד בתקני ניגודיות WCAG AA להבטחת קריאות מיטבית.',
  },
  {
    icon: Phone,
    title: 'תאימות למובייל',
    description: 'האתר מותאם לכל גדלי המסך ותומך במחוות מגע סטנדרטיות.',
  },
];

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen py-20 px-6 relative">
      <PageSlider images={sliderImages.accessibility} />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link
            href="/"
            className="text-gray-700 hover:text-gray-900 transition-colors inline-flex items-center gap-2 mb-6"
          >
            <ArrowRight size={20} />
            <span>חזרה לדף הבית</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
            הצהרת נגישות
          </h1>
          <p className="text-gray-700 text-lg">
            עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}
          </p>
        </motion.div>

        {/* Main Content */}
        <GlassCard hover={false} className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">מחויבות לנגישות</h2>
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <p>
              STANNEL מחויבת להנגשת האתר והשירותים שלה לכל המשתמשים, כולל אנשים עם מוגבלויות.
              אנו משקיעים מאמצים רבים כדי להבטיח שהאתר שלנו יהיה נגיש ושימושי לכולם.
            </p>
            <p>
              אנו פועלים בהתאם להנחיות הנגישות לתכני אינטרנט (WCAG) ברמה AA, ולתקנות שוויון זכויות
              לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013.
            </p>
          </div>
        </GlassCard>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {accessibilityFeatures.map((feature, index) => (
            <GlassCard key={index} hover={false} delay={index * 0.1}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="text-gold-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-700 text-sm">{feature.description}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Additional Info */}
        <GlassCard hover={false} className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">התאמות נגישות באתר</h2>
          <ul className="space-y-3 text-gray-800">
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>מבנה כותרות היררכי ברור</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>טקסט חלופי (alt) לכל התמונות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>טפסים עם תוויות ברורות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>הודעות שגיאה מפורטות</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>אפשרות להגדלת טקסט ללא פגיעה בפריסה</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>תמיכה בטכנולוגיות מסייעות נפוצות</span>
            </li>
          </ul>
        </GlassCard>

        {/* Contact */}
        <GlassCard hover={false} gold>
          <h2 className="text-2xl font-semibold text-white mb-4">נתקלתם בבעיית נגישות?</h2>
          <p className="text-white/80 mb-4">
            אם נתקלתם בבעיית נגישות באתר או שיש לכם הצעות לשיפור הנגישות, נשמח לשמוע מכם.
            אנא פנו אלינו ואנו נעשה כמיטב יכולתנו לסייע.
          </p>
          <div className="space-y-2 text-white/80">
            <p>
              <strong className="text-white">רכז/ת נגישות:</strong> צוות STANNEL
            </p>
            <p>
              <strong className="text-white">דוא&quot;ל:</strong>{' '}
              <a href="mailto:accessibility@stannel.co.il" className="text-gold-300 hover:underline">
                accessibility@stannel.co.il
              </a>
            </p>
            <p>
              <strong className="text-white">טלפון:</strong>{' '}
              <a href="tel:+972-3-000-0000" className="text-gold-300 hover:underline">
                03-000-0000
              </a>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
