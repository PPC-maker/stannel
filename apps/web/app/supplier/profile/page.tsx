'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="p-6 max-w-4xl mx-auto relative z-10 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
        >
          <Link
            href="/supplier"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-700 mb-4 transition-colors font-medium"
          >
            <ArrowRight size={16} />
            חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="text-gold-500" />
            פרטי העסק
          </h1>
          <p className="text-gray-600 mt-1 font-medium">המידע הזה יוצג לאדריכלים</p>
        </motion.div>

        {/* Business Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-gold-500" />
              פרטים כלליים
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">שם העסק</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                  placeholder="הזן את שם העסק"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">תיאור העסק</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors resize-none"
                  placeholder="ספר על העסק שלך, השירותים שאתה מציע..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">
                    <Phone size={14} className="inline ml-1 text-gray-500" />
                    טלפון
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    placeholder="050-0000000"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">
                    <Mail size={14} className="inline ml-1 text-gray-500" />
                    אימייל
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">
                  <MapPin size={14} className="inline ml-1 text-gray-500" />
                  כתובת
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                  placeholder="רחוב, עיר"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ExternalLink size={18} className="text-gold-500" />
              קישורים ורשתות חברתיות
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">
                  <Globe size={14} className="inline ml-1 text-gray-500" />
                  אתר אינטרנט
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                  placeholder="https://www.example.com"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">
                    <Facebook size={14} className="inline ml-1 text-blue-600" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-sm"
                    placeholder="קישור לפייסבוק"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">
                    <Instagram size={14} className="inline ml-1 text-pink-600" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-sm"
                    placeholder="קישור לאינסטגרם"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">
                    <Linkedin size={14} className="inline ml-1 text-blue-700" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors text-sm"
                    placeholder="קישור ללינקדאין"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Images Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-gold-500" />
              תמונות העסק
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="aspect-video bg-gray-100 border border-gray-200 rounded-lg overflow-hidden"
                >
                  <img src={img} alt={`תמונה ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}

              {/* Add Image Button */}
              <button className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gold-500 hover:bg-gray-100 transition-colors group">
                <ImageIcon size={32} className="text-gray-400 group-hover:text-gold-500 transition-colors" />
                <span className="text-gray-500 text-sm font-medium group-hover:text-gray-700 transition-colors">הוסף תמונה</span>
              </button>
            </div>

            <p className="text-gray-500 text-xs mt-4 font-medium">
              * התמונות יוצגו באדריכלים כשהם צופים בפרופיל העסק שלך
            </p>
          </div>
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
            className="flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 shadow-lg"
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
