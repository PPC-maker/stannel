'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Phone,
  Globe,
  Mail,
  Calendar,
  Loader2,
  Building2,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  MapPin,
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

  const galleryImages = supplier.businessImages || [];
  const logoImage = supplier.profileImage || null;

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
          <input id="swal-subject" type="text" placeholder="נושא הפגישה *" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; text-align: right; outline: none; box-sizing: border-box; -webkit-appearance: none; appearance: none;">
          <label style="display: block; font-size: 13px; color: #8b7c69; text-align: right; margin-bottom: -4px;">תאריך *</label>
          <input id="swal-date" type="date" min="${minDate}" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; text-align: right; outline: none; box-sizing: border-box; -webkit-appearance: none; appearance: none; direction: rtl;">
          <label style="display: block; font-size: 13px; color: #8b7c69; text-align: right; margin-bottom: -4px;">שעה</label>
          <input id="swal-time" type="time" value="10:00" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; text-align: right; outline: none; box-sizing: border-box; -webkit-appearance: none; appearance: none; direction: rtl;">
          <textarea id="swal-notes" placeholder="הערות (אופציונלי)" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; min-height: 80px; font-size: 16px; text-align: right; outline: none; resize: none; box-sizing: border-box; -webkit-appearance: none; appearance: none;"></textarea>
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

  return (
    <div className="min-h-screen pb-28">
      {/* Back button */}
      <div className="px-4 pt-2 pb-2">
        <Link href="/suppliers" className="w-10 h-10 rounded-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] flex items-center justify-center shadow-sm">
          <ArrowRight size={20} className="text-[#2b241d]" />
        </Link>
      </div>

      {/* ── 1. Logo + Name + Bio ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-4 mb-4">
        <div className="bg-[#f7f3f2] rounded-2xl border border-[rgba(201,155,74,0.08)] p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
            {/* Logo */}
            {logoImage ? (
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-[rgba(201,155,74,0.1)]">
                <ImageWithLoader src={logoImage} alt={supplier.companyName} fill className="object-contain" unoptimized />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c99b4a]/20 to-[#c99b4a]/5 flex items-center justify-center flex-shrink-0 border border-[#c99b4a]/15">
                <span className="text-3xl font-bold text-[#c99b4a]">{supplier.companyName?.charAt(0) || 'S'}</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-[#2b241d]">{supplier.companyName}</h1>
              {supplier.address && (
                <p className="text-[#a89b8a] text-sm flex items-center gap-1 mt-0.5">
                  <MapPin size={13} />
                  {supplier.address}
                </p>
              )}
            </div>
          </div>
          {/* Bio */}
          {supplier.description && (
            <p className="text-[#5a4f42] text-sm leading-relaxed">{supplier.description}</p>
          )}
        </div>
      </motion.div>

      {/* ── 2. Gallery ── */}
      {galleryImages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-4 mb-4">
          {galleryImages.length === 1 ? (
            <button onClick={() => openLightbox(0)} className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
              <ImageWithLoader src={galleryImages[0]} alt="תמונה" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                <ZoomIn size={24} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => openLightbox(0)} className="relative col-span-2 aspect-[16/9] rounded-2xl overflow-hidden shadow-lg group">
                <ImageWithLoader src={galleryImages[0]} alt="תמונה" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                  <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
              {galleryImages.slice(1, 5).map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => openLightbox(index + 1)}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <ImageWithLoader src={img} alt={`תמונה ${index + 2}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {index === 3 && galleryImages.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">+{galleryImages.length - 5}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── 3. Schedule Meeting Button ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mx-4 mb-4">
        <button
          onClick={handleScheduleMeeting}
          className="w-full py-4 bg-[#c99b4a] hover:bg-[#9e7746] text-white font-bold text-lg rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c99b4a]/25"
        >
          <Calendar size={22} />
          קבע פגישה
        </button>
      </motion.div>

      {/* ── 4. Contact Icons (icons only, no labels) ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-4 mb-4">
        <div className="flex items-center justify-center gap-4">
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`} className="w-14 h-14 rounded-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] flex items-center justify-center shadow-sm hover:bg-[#faf8f5] transition-colors">
              <Phone size={22} className="text-[#c99b4a]" />
            </a>
          )}
          {supplier.user?.email && (
            <a href={`mailto:${supplier.user.email}`} className="w-14 h-14 rounded-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] flex items-center justify-center shadow-sm hover:bg-[#faf8f5] transition-colors">
              <Mail size={22} className="text-[#c99b4a]" />
            </a>
          )}
          {supplier.website && (
            <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] flex items-center justify-center shadow-sm hover:bg-[#faf8f5] transition-colors">
              <Globe size={22} className="text-[#c99b4a]" />
            </a>
          )}
          <button onClick={handleShare} className="w-14 h-14 rounded-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] flex items-center justify-center shadow-sm hover:bg-[#faf8f5] transition-colors">
            <Share2 size={22} className="text-[#c99b4a]" />
          </button>
        </div>
      </motion.div>

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
