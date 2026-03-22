'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { ArrowRight, Shield, Database, Eye, Lock, Share2, Trash2 } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: 'מידע שאנו אוספים',
    content: [
      'פרטים אישיים: שם, כתובת דוא"ל, מספר טלפון',
      'פרטי עסק: שם החברה, מספר ע.מ/ח.פ, כתובת',
      'מידע פיננסי: פרטי חשבוניות לצורך צבירת נקודות',
      'נתוני שימוש: פעילות באתר, העדפות משתמש',
      'מידע טכני: כתובת IP, סוג דפדפן, מכשיר',
    ],
  },
  {
    icon: Eye,
    title: 'כיצד אנו משתמשים במידע',
    content: [
      'ניהול חשבון המשתמש ומתן השירותים',
      'עיבוד חשבוניות וחישוב נקודות נאמנות',
      'שליחת עדכונים, התראות והטבות',
      'שיפור השירותים וחווית המשתמש',
      'ציות לדרישות חוקיות ורגולטוריות',
    ],
  },
  {
    icon: Share2,
    title: 'שיתוף מידע עם צדדים שלישיים',
    content: [
      'ספקים משתתפים: מידע הכרחי לאימות עסקאות',
      'ספקי שירות: עיבוד תשלומים, אחסון ענן, אנליטיקה',
      'רשויות חוק: כאשר נדרש על פי דין',
      'לא נמכור את המידע האישי שלכם לצדדים שלישיים',
    ],
  },
  {
    icon: Lock,
    title: 'אבטחת מידע',
    content: [
      'הצפנת SSL/TLS לכל התקשורת',
      'אחסון מאובטח בענן Google Cloud',
      'גישה מוגבלת למידע על בסיס צורך',
      'סקירות אבטחה תקופתיות',
      'הסמכת אבטחת מידע ISO 27001',
    ],
  },
  {
    icon: Trash2,
    title: 'שמירה ומחיקת מידע',
    content: [
      'מידע נשמר כל עוד החשבון פעיל',
      'לאחר סגירת חשבון: שמירה עד 7 שנים לצרכי חוק',
      'ניתן לבקש מחיקת מידע בכל עת',
      'מידע סטטיסטי אנונימי נשמר ללא הגבלת זמן',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-20 px-6 relative">
      <PageSlider images={sliderImages.privacy} />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-2 mb-6"
          >
            <ArrowRight size={20} />
            <span>חזרה לדף הבית</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
            מדיניות פרטיות
          </h1>
          <p className="text-gray-500 text-lg">
            עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}
          </p>
        </motion.div>

        {/* Introduction */}
        <GlassCard hover={false} className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <Shield className="text-gold-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">מחויבות לפרטיותכם</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  ב-STANNEL אנו מייחסים חשיבות עליונה לפרטיות המשתמשים שלנו. מדיניות פרטיות זו
                  מתארת כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלכם בעת השימוש בפלטפורמה.
                </p>
                <p>
                  אנו פועלים בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981 ותקנות הגנת הפרטיות
                  (אבטחת מידע), התשע&quot;ז-2017, וכן לתקנות ה-GDPR האירופאיות.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Main Sections */}
        {sections.map((section, index) => (
          <GlassCard key={index} hover={false} delay={index * 0.1} className="mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                <section.icon className="text-gold-400" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                <ul className="space-y-2 text-gray-600">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="text-gold-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        ))}

        {/* Cookies */}
        <GlassCard hover={false} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">שימוש בעוגיות (Cookies)</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              האתר משתמש בעוגיות לצורך שיפור חווית המשתמש ותפקוד תקין של השירותים:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span><strong className="text-gray-900">עוגיות הכרחיות:</strong> לתפעול בסיסי של האתר והתחברות</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span><strong className="text-gray-900">עוגיות אנליטיות:</strong> לניתוח שימוש ושיפור השירות</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span><strong className="text-gray-900">עוגיות פונקציונליות:</strong> לשמירת העדפות משתמש</span>
              </li>
            </ul>
            <p>
              ניתן לנהל את הגדרות העוגיות דרך הדפדפן שלכם.
            </p>
          </div>
        </GlassCard>

        {/* User Rights */}
        <GlassCard hover={false} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">הזכויות שלכם</h2>
          <div className="space-y-4 text-gray-600">
            <p>על פי חוק, עומדות לכם הזכויות הבאות:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span>זכות לעיין במידע שנאסף עליכם</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span>זכות לתקן מידע שגוי</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span>זכות למחוק את המידע (&quot;הזכות להישכח&quot;)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span>זכות להגביל את עיבוד המידע</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span>זכות להעביר את המידע לשירות אחר</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold-400 mt-1">•</span>
                <span>זכות להתנגד לדיוור ישיר</span>
              </li>
            </ul>
          </div>
        </GlassCard>

        {/* Contact */}
        <GlassCard hover={false} gold>
          <h2 className="text-2xl font-semibold text-white mb-4">יצירת קשר בנושא פרטיות</h2>
          <p className="text-white/80 mb-4">
            לכל שאלה, בקשה או תלונה בנושא פרטיות, אתם מוזמנים לפנות אלינו:
          </p>
          <div className="space-y-2 text-white/80">
            <p>
              <strong className="text-white">ממונה הגנת הפרטיות:</strong> צוות STANNEL
            </p>
            <p>
              <strong className="text-white">דוא&quot;ל:</strong>{' '}
              <a href="mailto:privacy@stannel.co.il" className="text-gold-300 hover:underline">
                privacy@stannel.co.il
              </a>
            </p>
            <p>
              <strong className="text-white">כתובת:</strong> תל אביב, ישראל
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
