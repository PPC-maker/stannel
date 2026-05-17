'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  MapPin,
  Phone,
  Globe,
  Mail,
  Calendar,
  ExternalLink,
  Loader2,
  Building2,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Star,
  Award,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useSupplierDetail } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { meetingsApi } from '@stannel/api-client';
import Swal from 'sweetalert2';

export default function SupplierDetailPage() {
  const { isReady } = useAuthGuard();
  const params = useParams();
  const supplierId = params.id as string;

  const { data: supplier, isLoading, error } = useSupplierDetail(supplierId, isReady);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isReady) return <AuthGuardLoader />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="text-[#c99b4a] animate-spin" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Building2 size={64} className="text-[#a89b8a]/40 mb-4" />
        <p className="text-[#8b7c69] text-lg mb-4">הספק לא נמצא</p>
        <Link href="/suppliers" className="text-[#c99b4a] hover:underline">חזרה לרשימת הספקים</Link>
      </div>
    );
  }

  const heroImage = supplier.profileImage || supplier.businessImages?.[0] || null;
  const galleryImages = supplier.businessImages || [];

  const openLightbox = (index: number) => { setCurrentImageIndex(index); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const nextImage = () => { if (galleryImages.length > 0) setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length); };
  const prevImage = () => { if (galleryImages.length > 0) setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); };

  const handleShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `${supplier.companyName} - ספק מוביל ב-Stannel Club\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleScheduleMeeting = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    Swal.fire({
      title: 'קביעת פגישה',
      html: `
        <p style="margin-bottom: 16px; color: #8b7c69; font-size: 14px; text-align: center;">קביעת פגישה עם ${supplier.companyName}</p>
        <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 320px; margin: 0 auto;" dir="rtl">
          <input id="swal-subject" type="text" placeholder="נושא הפגישה *" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; text-align: right; outline: none; box-sizing: border-box;">
          <input id="swal-date" type="date" min="${minDate}" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; outline: none; box-sizing: border-box;" dir="ltr">
          <input id="swal-time" type="time" value="10:00" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; outline: none; box-sizing: border-box;" dir="ltr">
          <textarea id="swal-notes" placeholder="הערות (אופציונלי)" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; min-height: 80px; font-size: 14px; text-align: right; outline: none; resize: none; box-sizing: border-box;"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'שלח בקשה',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#c99b4a',
      background: '#f7f3f2',
      color: '#2b241d',
      preConfirm: async () => {
        const subject = (document.getElementById('swal-subject') as HTMLInputElement).value;
        const date = (document.getElementById('swal-date') as HTMLInputElement).value;
        const time = (document.getElementById('swal-time') as HTMLInputElement).value;
        const notes = (document.getElementById('swal-notes') as HTMLTextAreaElement).value;
        if (!subject) { Swal.showValidationMessage('נא להזין נושא'); return; }
        if (!date) { Swal.showValidationMessage('נא לבחור תאריך'); return; }
        try {
          await meetingsApi.create({ supplierId, date, time, subject, notes: notes || undefined });
          return true;
        } catch (err: any) {
          Swal.showValidationMessage(err.message || 'שגיאה בשליחת הבקשה');
          return false;
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'הבקשה נשלחה!', text: 'הספק יקבל הודעה ויאשר את הפגישה', icon: 'success', confirmButtonColor: '#c99b4a', background: '#f7f3f2', color: '#2b241d' });
      }
    });
  };

  // Extract features from description or use defaults
  const features = [
    { icon: Star, label: 'איכות פרימיום' },
    { icon: Award, label: 'מותג מוביל' },
    { icon: Sparkles, label: 'חדשנות ועיצוב' },
    { icon: Clock, label: 'מוניטין ארוך' },
  ];

  return (
    <div className="min-h-screen pb-28">
      {/* Top bar - below global navbar */}
      <div className="px-4 pt-2 pb-2 flex items-center justify-between">
        <Link href="/suppliers" className="w-10 h-10 rounded-full bg-white border border-[rgba(201,155,74,0.08)] flex items-center justify-center shadow-sm">
          <ArrowRight size={20} className="text-[#2b241d]" />
        </Link>
        <span className="px-4 py-1.5 bg-[#c99b4a] text-white text-sm font-bold rounded-full shadow-md">
          ספק מוביל
        </span>
      </div>

      {/* ── Hero Card: Logo + Company Info ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mb-4">
        <div className="bg-white rounded-3xl overflow-hidden border border-[rgba(201,155,74,0.08)] shadow-lg">
          <div className="flex flex-col md:flex-row">
            {/* Left: Logo / Image */}
            <div className="md:w-1/2 p-6 flex items-center justify-center bg-[#faf8f5]">
              {heroImage ? (
                <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden">
                  <ImageWithLoader src={heroImage} alt={supplier.companyName} fill className="object-contain" unoptimized />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-[#c99b4a]/20 to-[#c99b4a]/5 flex items-center justify-center border border-[#c99b4a]/15">
                  <span className="text-6xl font-bold text-[#c99b4a]">{supplier.companyName?.charAt(0) || 'S'}</span>
                </div>
              )}
            </div>

            {/* Right: Company Details Cards */}
            <div className="md:w-1/2 p-5 flex flex-col gap-3">
              <h1 className="text-2xl font-bold text-[#2b241d] mb-1">{supplier.companyName}</h1>
              <p className="text-[#8b7c69] text-sm leading-relaxed mb-2">
                {supplier.description || 'מותג פרימיום המציע מוצרים איכותיים בתחום העיצוב והבנייה.'}
              </p>

              {/* Info cards */}
              <div className="space-y-2">
                {supplier.companyName && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#faf8f5] border border-[rgba(201,155,74,0.06)]">
                    <div className="w-9 h-9 rounded-full bg-[#c99b4a]/15 flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-[#c99b4a]" />
                    </div>
                    <div>
                      <p className="text-[#a89b8a] text-[10px] font-medium uppercase tracking-wider">COMPANY NAME</p>
                      <p className="text-[#2b241d] text-sm font-semibold">{supplier.companyName}</p>
                    </div>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#faf8f5] border border-[rgba(201,155,74,0.06)]">
                    <div className="w-9 h-9 rounded-full bg-[#c99b4a]/15 flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-[#c99b4a]" />
                    </div>
                    <div>
                      <p className="text-[#a89b8a] text-[10px] font-medium uppercase tracking-wider">ORIGIN</p>
                      <p className="text-[#2b241d] text-sm font-semibold">{supplier.address}</p>
                    </div>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#faf8f5] border border-[rgba(201,155,74,0.06)]">
                    <div className="w-9 h-9 rounded-full bg-[#c99b4a]/15 flex items-center justify-center flex-shrink-0">
                      <Globe size={16} className="text-[#c99b4a]" />
                    </div>
                    <div>
                      <p className="text-[#a89b8a] text-[10px] font-medium uppercase tracking-wider">WEBSITE</p>
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-[#c99b4a] text-sm font-semibold hover:underline flex items-center gap-1">
                        {supplier.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features row */}
          <div className="border-t border-[rgba(201,155,74,0.06)] px-6 py-4">
            <div className="flex justify-around">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-[#faf8f5] flex items-center justify-center">
                      <Icon size={18} className="text-[#c99b4a]" />
                    </div>
                    <span className="text-[10px] text-[#8b7c69] font-medium text-center">{f.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleScheduleMeeting}
              className="w-full py-4 bg-[#c99b4a] hover:bg-[#9e7746] text-white font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c99b4a]/20"
            >
              <Calendar size={20} />
              קבע פגישה
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Contact Details ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {supplier.user?.email && (
            <a href={`mailto:${supplier.user.email}`} className="bg-white rounded-2xl border border-[rgba(201,155,74,0.08)] p-4 flex items-center gap-3 hover:bg-[#faf8f5] transition-colors shadow-sm">
              <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[#a89b8a] text-[10px] font-medium">מייל</p>
                <p className="text-[#2b241d] text-sm font-semibold truncate">{supplier.user.email}</p>
              </div>
            </a>
          )}
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`} className="bg-white rounded-2xl border border-[rgba(201,155,74,0.08)] p-4 flex items-center gap-3 hover:bg-[#faf8f5] transition-colors shadow-sm">
              <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-green-500" />
              </div>
              <div>
                <p className="text-[#a89b8a] text-[10px] font-medium">טלפון</p>
                <p className="text-[#2b241d] text-sm font-semibold" dir="ltr">{supplier.phone}</p>
              </div>
            </a>
          )}
          {supplier.website && (
            <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl border border-[rgba(201,155,74,0.08)] p-4 flex items-center gap-3 hover:bg-[#faf8f5] transition-colors shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#c99b4a]/10 flex items-center justify-center flex-shrink-0">
                <Globe size={18} className="text-[#c99b4a]" />
              </div>
              <div>
                <p className="text-[#a89b8a] text-[10px] font-medium">אתר</p>
                <p className="text-[#c99b4a] text-sm font-semibold flex items-center gap-1">אתר אינטרנט <ExternalLink size={10} /></p>
              </div>
            </a>
          )}
          {supplier.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(supplier.address)}`} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl border border-[rgba(201,155,74,0.08)] p-4 flex items-center gap-3 hover:bg-[#faf8f5] transition-colors shadow-sm">
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[#a89b8a] text-[10px] font-medium">כתובת</p>
                <p className="text-[#2b241d] text-sm font-semibold truncate">{supplier.address}</p>
              </div>
            </a>
          )}
        </div>
        {/* Share button */}
        <button onClick={handleShare} className="w-full mt-3 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md">
          <Share2 size={18} />
          שיתוף בוואטסאפ
        </button>
      </motion.div>

      {/* ── About Section ── */}
      {supplier.description && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mx-4 mb-4">
          <div className="bg-white rounded-2xl border border-[rgba(201,155,74,0.08)] p-5 shadow-sm">
            <h3 className="text-xs font-bold text-[#a89b8a] uppercase tracking-wider mb-3">ABOUT THE COMPANY</h3>
            <p className="text-[#2b241d] text-sm leading-relaxed">{supplier.description}</p>
          </div>
        </motion.div>
      )}

      {/* ── Product Range ── */}
      {supplier.products && supplier.products.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-4 mb-4">
          <div className="bg-white rounded-2xl border border-[rgba(201,155,74,0.08)] p-5 shadow-sm">
            <h3 className="text-xs font-bold text-[#a89b8a] uppercase tracking-wider mb-4">PRODUCT RANGE</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {supplier.products.map((product: any) => (
                <div key={product.id} className="text-center">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-[#1a1a1a]">
                    <ImageWithLoader
                      src={product.imageUrl || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-[#2b241d] text-[11px] font-medium uppercase tracking-wide">{product.name}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Gallery ── */}
      {galleryImages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mx-4 mb-4">
          <div className="bg-white rounded-2xl border border-[rgba(201,155,74,0.08)] p-5 shadow-sm">
            <h3 className="text-xs font-bold text-[#a89b8a] uppercase tracking-wider mb-4">GALLERY</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryImages.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden group bg-[#f7f3f2]"
                >
                  <ImageWithLoader src={img} alt={`תמונה ${index + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && galleryImages.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
            <button onClick={closeLightbox} className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center z-10">
              <X size={24} className="text-white" />
            </button>
            {galleryImages.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center z-10 hover:bg-white/20 transition-colors">
                  <ChevronRight size={28} className="text-white" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-16 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center z-10 hover:bg-white/20 transition-colors">
                  <ChevronLeft size={28} className="text-white" />
                </button>
              </>
            )}
            <div className="relative w-full max-w-4xl aspect-video mx-8" onClick={(e) => e.stopPropagation()}>
              <ImageWithLoader src={galleryImages[currentImageIndex]} alt="Gallery" fill className="object-contain" unoptimized />
            </div>
            <div className="absolute bottom-4 text-white/60 text-sm">{currentImageIndex + 1} / {galleryImages.length}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
