'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Database, Eye, Lock, Share2, Trash2, Cookie, UserCheck, Mail } from 'lucide-react';

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
    <div className="min-h-screen -mt-16">
      {/* Hero */}
      <div className="relative pt-24 pb-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c99b4a]/5 to-[#f7f3f2]" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 mx-auto bg-[#c99b4a]/10 rounded-2xl flex items-center justify-center mb-4">
              <Shield size={32} className="text-[#c99b4a]" />
            </div>
            <h1 className="text-3xl font-bold text-[#2b241d] mb-2">מדיניות פרטיות</h1>
            <p className="text-[#8b7c69]">עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#c99b4a]/10 flex items-center justify-center flex-shrink-0">
              <Shield className="text-[#c99b4a]" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2b241d] mb-3">מחויבות לפרטיותכם</h2>
              <div className="space-y-3 text-[#5a4e41] leading-relaxed">
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
        </motion.div>

        {/* Main Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 mb-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c99b4a]/10 flex items-center justify-center flex-shrink-0">
                <section.icon className="text-[#c99b4a]" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#2b241d] mb-3">{section.title}</h2>
                <ul className="space-y-2 text-[#5a4e41]">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="text-[#c99b4a] mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 mb-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Cookie className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2b241d] mb-3">שימוש בעוגיות (Cookies)</h2>
              <p className="text-[#5a4e41] mb-3">האתר משתמש בעוגיות לצורך שיפור חווית המשתמש:</p>
              <ul className="space-y-2 text-[#5a4e41]">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong className="text-[#2b241d]">עוגיות הכרחיות:</strong> לתפעול בסיסי של האתר והתחברות</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong className="text-[#2b241d]">עוגיות אנליטיות:</strong> לניתוח שימוש ושיפור השירות</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  <span><strong className="text-[#2b241d]">עוגיות פונקציונליות:</strong> לשמירת העדפות משתמש</span>
                </li>
              </ul>
              <p className="text-[#a89b8a] text-sm mt-3">ניתן לנהל את הגדרות העוגיות דרך הדפדפן שלכם.</p>
            </div>
          </div>
        </motion.div>

        {/* User Rights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 mb-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <UserCheck className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2b241d] mb-3">הזכויות שלכם</h2>
              <p className="text-[#5a4e41] mb-3">על פי חוק, עומדות לכם הזכויות הבאות:</p>
              <ul className="space-y-2 text-[#5a4e41]">
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>זכות לעיין במידע שנאסף עליכם</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>זכות לתקן מידע שגוי</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>זכות למחוק את המידע (&quot;הזכות להישכח&quot;)</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>זכות להגביל את עיבוד המידע</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>זכות להעביר את המידע לשירות אחר</span></li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-1">•</span><span>זכות להתנגד לדיוור ישיר</span></li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-[#c99b4a]/10 to-[#c99b4a]/5 border border-[#c99b4a]/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#c99b4a]/15 flex items-center justify-center flex-shrink-0">
              <Mail className="text-[#c99b4a]" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2b241d] mb-3">יצירת קשר בנושא פרטיות</h2>
              <p className="text-[#5a4e41] mb-3">לכל שאלה, בקשה או תלונה בנושא פרטיות:</p>
              <div className="space-y-2 text-[#5a4e41]">
                <p><strong className="text-[#2b241d]">ממונה הגנת הפרטיות:</strong> צוות STANNEL</p>
                <p><strong className="text-[#2b241d]">דוא&quot;ל:</strong>{' '}
                  <a href="mailto:privacy@stannel.co.il" className="text-[#c99b4a] hover:underline">privacy@stannel.co.il</a>
                </p>
                <p><strong className="text-[#2b241d]">כתובת:</strong> תל אביב, ישראל</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-[#a89b8a] hover:text-[#2b241d] transition-colors text-sm">
            <ArrowRight size={16} />
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}
