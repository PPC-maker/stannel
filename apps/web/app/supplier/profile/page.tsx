'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useSupplierGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import {
  Building2,
  ArrowRight,
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Image as ImageIcon,
  Save,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function SupplierProfilePage() {
  const { isReady, user } = useSupplierGuard();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    businessName: user?.name || '',
    description: '',
    phone: '',
    email: user?.email || '',
    address: '',
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
  });

  const [images, setImages] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call to save profile
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard} opacity={0.15} />
      <div className="p-6 max-w-4xl mx-auto relative z-10 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/supplier"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight size={16} />
            חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Building2 className="text-gold-400" />
            פרטי העסק
          </h1>
          <p className="text-white/60 mt-1">המידע הזה יוצג לאדריכלים</p>
        </motion.div>

        {/* Business Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-gold-400" />
              פרטים כלליים
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-1">שם העסק</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors"
                  placeholder="הזן את שם העסק"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1">תיאור העסק</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors resize-none"
                  placeholder="ספר על העסק שלך, השירותים שאתה מציע..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">
                    <Phone size={14} className="inline ml-1" />
                    טלפון
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors"
                    placeholder="050-0000000"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">
                    <Mail size={14} className="inline ml-1" />
                    אימייל
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors"
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1">
                  <MapPin size={14} className="inline ml-1" />
                  כתובת
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors"
                  placeholder="רחוב, עיר"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExternalLink size={18} className="text-gold-400" />
              קישורים ורשתות חברתיות
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-1">
                  <Globe size={14} className="inline ml-1" />
                  אתר אינטרנט
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors"
                  placeholder="https://www.example.com"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">
                    <Facebook size={14} className="inline ml-1 text-blue-500" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors text-sm"
                    placeholder="קישור לפייסבוק"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">
                    <Instagram size={14} className="inline ml-1 text-pink-500" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors text-sm"
                    placeholder="קישור לאינסטגרם"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">
                    <Linkedin size={14} className="inline ml-1 text-blue-600" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors text-sm"
                    placeholder="קישור ללינקדאין"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Images Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassCard hover={false}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-gold-400" />
              תמונות העסק
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="aspect-video bg-white/5 border border-white/20 rounded-lg overflow-hidden"
                >
                  <img src={img} alt={`תמונה ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}

              {/* Add Image Button */}
              <button className="aspect-video bg-white/5 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gold-400 hover:bg-white/10 transition-colors group">
                <ImageIcon size={32} className="text-white/30 group-hover:text-gold-400 transition-colors" />
                <span className="text-white/40 text-sm group-hover:text-white transition-colors">הוסף תמונה</span>
              </button>
            </div>

            <p className="text-white/30 text-xs mt-4">
              * התמונות יוצגו באדריכלים כשהם צופים בפרופיל העסק שלך
            </p>
          </GlassCard>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gold-400 hover:bg-gold-500 text-primary-900 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            שמור שינויים
          </button>
        </motion.div>
      </div>
    </div>
  );
}
