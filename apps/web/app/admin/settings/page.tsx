'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { adminApi } from '@stannel/api-client';
import {
  ArrowRight,
  Loader2,
  Settings,
  Phone,
  Save,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { isReady } = useAdminGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [whatsappDefault, setWhatsappDefault] = useState('0508817788');
  const [whatsappArchitects, setWhatsappArchitects] = useState('');
  const [whatsappSuppliers, setWhatsappSuppliers] = useState('');

  useEffect(() => {
    adminApi.getConfig()
      .then((config) => {
        if (config.whatsapp_default) setWhatsappDefault(config.whatsapp_default);
        if (config.whatsapp_architects) setWhatsappArchitects(config.whatsapp_architects);
        if (config.whatsapp_suppliers) setWhatsappSuppliers(config.whatsapp_suppliers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await adminApi.updateConfig({
        whatsapp_default: whatsappDefault,
        whatsapp_architects: whatsappArchitects,
        whatsapp_suppliers: whatsappSuppliers,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  if (!isReady) return <AuthGuardLoader />;

  return (
    <div className="min-h-screen pt-8 pb-24">
      <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#2b241d] mb-4 transition-colors">
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-[#2b241d] flex items-center gap-3">
              <Settings className="text-[#c99b4a]" />
              הגדרות מערכת
            </h1>
            <p className="text-[#8b7c69] mt-1">ניהול מספרי וואטסאפ ליצירת קשר</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 mx-auto text-[#c99b4a] animate-spin" />
            <p className="text-[#8b7c69] mt-4">טוען הגדרות...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="text-[#c99b4a]" size={20} />
                <h2 className="text-xl font-semibold text-[#2b241d]">מספרי וואטסאפ</h2>
              </div>

              <p className="text-[#8b7c69] text-sm">
                הגדר מספרי וואטסאפ שונים לאדריכלים ולספקים. אם לא מוגדר מספר ספציפי, המערכת תשתמש במספר ברירת המחדל.
              </p>

              {/* Default */}
              <div>
                <label className="block text-[#2b241d] text-sm font-medium mb-2">
                  מספר ברירת מחדל
                </label>
                <input
                  type="tel"
                  value={whatsappDefault}
                  onChange={(e) => setWhatsappDefault(e.target.value)}
                  placeholder="0508817788"
                  dir="ltr"
                  className="w-full bg-white border border-[rgba(201,155,74,0.15)] rounded-xl px-4 py-3 text-[#2b241d] placeholder:text-[#a89b8a]"
                />
                <p className="text-[#a89b8a] text-xs mt-1">משמש כברירת מחדל לכל המשתמשים</p>
              </div>

              {/* Architects */}
              <div>
                <label className="block text-[#2b241d] text-sm font-medium mb-2">
                  מספר לאדריכלים
                  <span className="text-[#a89b8a] font-normal mr-2">(אופציונלי)</span>
                </label>
                <input
                  type="tel"
                  value={whatsappArchitects}
                  onChange={(e) => setWhatsappArchitects(e.target.value)}
                  placeholder="השאר ריק לשימוש במספר ברירת המחדל"
                  dir="ltr"
                  className="w-full bg-white border border-[rgba(201,155,74,0.15)] rounded-xl px-4 py-3 text-[#2b241d] placeholder:text-[#a89b8a]"
                />
                <p className="text-[#a89b8a] text-xs mt-1">אם ריק, ישתמש במספר ברירת המחדל</p>
              </div>

              {/* Suppliers */}
              <div>
                <label className="block text-[#2b241d] text-sm font-medium mb-2">
                  מספר לספקים
                  <span className="text-[#a89b8a] font-normal mr-2">(אופציונלי)</span>
                </label>
                <input
                  type="tel"
                  value={whatsappSuppliers}
                  onChange={(e) => setWhatsappSuppliers(e.target.value)}
                  placeholder="השאר ריק לשימוש במספר ברירת המחדל"
                  dir="ltr"
                  className="w-full bg-white border border-[rgba(201,155,74,0.15)] rounded-xl px-4 py-3 text-[#2b241d] placeholder:text-[#a89b8a]"
                />
                <p className="text-[#a89b8a] text-xs mt-1">אם ריק, ישתמש במספר ברירת המחדל</p>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#c99b4a] hover:bg-[#9e7746] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : saved ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמירת הגדרות'}
                </button>
                {saved && (
                  <span className="text-green-600 text-sm">ההגדרות נשמרו בהצלחה</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
