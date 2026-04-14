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
} from 'lucide-react';
import { useSupplierDetail } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Swal from 'sweetalert2';

export default function SupplierDetailPage() {
  const { isReady } = useAuthGuard();
  const params = useParams();
  const supplierId = params.id as string;

  const { data: supplier, isLoading, error } = useSupplierDetail(supplierId, isReady);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 size={40} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center">
        <Building2 size={64} className="text-white/20 mb-4" />
        <p className="text-white/60 text-lg mb-4">הספק לא נמצא</p>
        <Link href="/suppliers" className="text-emerald-400 hover:underline">
          חזרה לרשימת הספקים
        </Link>
      </div>
    );
  }

  // Profile image (logo) always takes priority when it exists
  const heroImage = supplier.profileImage || supplier.businessImages?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80';
  const galleryImages = supplier.businessImages || [];

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    if (galleryImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const prevImage = () => {
    if (galleryImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  const handleShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `היי! רציתי להמליץ לך על ${supplier.companyName} - ספק מוביל ב-Stannel Club 🏠✨\n\n${shareUrl}`;

    Swal.fire({
      title: 'שיתוף פרופיל הספק',
      html: `
        <p style="margin-bottom: 20px; color: #9ca3af; font-size: 14px;">בחר כיצד לשתף את ${supplier.companyName}</p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button id="share-contact" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 20px; background: #25D366; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            שליחה לאיש קשר
          </button>
          <button id="share-number" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 20px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/></svg>
            הזנת מספר טלפון
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'סגור',
      background: '#1a1a1a',
      color: '#ffffff',
      customClass: {
        popup: 'rounded-3xl',
        cancelButton: 'swal-cancel-dark',
      },
      didOpen: () => {
        // Share to existing contact - opens WhatsApp with message
        document.getElementById('share-contact')?.addEventListener('click', () => {
          Swal.close();
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        });

        // Share to new number
        document.getElementById('share-number')?.addEventListener('click', () => {
          Swal.close();
          Swal.fire({
            title: 'שליחה למספר טלפון',
            html: `
              <p style="margin-bottom: 16px; color: #9ca3af; font-size: 14px;">הזן מספר טלפון לשליחת ההמלצה</p>
              <input id="swal-whatsapp-phone" class="swal2-input" placeholder="למשל: 0501234567" dir="ltr" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 12px; text-align: center; font-size: 18px;">
            `,
            showCancelButton: true,
            confirmButtonText: 'שלח בוואטסאפ',
            cancelButtonText: 'ביטול',
            confirmButtonColor: '#25D366',
            background: '#1a1a1a',
            color: '#ffffff',
            customClass: {
              popup: 'rounded-3xl',
            },
            preConfirm: () => {
              const phoneInput = document.getElementById('swal-whatsapp-phone') as HTMLInputElement;
              let phone = phoneInput.value.replace(/\D/g, '');
              if (!phone || phone.length < 9) {
                Swal.showValidationMessage('נא להזין מספר טלפון תקין');
                return;
              }
              // Convert Israeli format to international
              if (phone.startsWith('0')) {
                phone = '972' + phone.substring(1);
              }
              return phone;
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              window.open(`https://wa.me/${result.value}?text=${encodeURIComponent(shareText)}`, '_blank');
            }
          });
        });
      },
    });
  };

  const handleScheduleMeeting = () => {
    Swal.fire({
      title: 'תיאום פגישה',
      html: `
        <p style="margin-bottom: 16px; color: #9ca3af; font-size: 14px; text-align: center;">נציג מ-${supplier.companyName} יצור איתך קשר בהקדם</p>
        <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 320px; margin: 0 auto;">
          <input id="swal-phone" type="tel" inputmode="numeric" pattern="[0-9]*" placeholder="מספר טלפון" dir="rtl" style="width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: white; border-radius: 12px; font-size: 16px; text-align: right; outline: none; box-sizing: border-box;">
          <textarea id="swal-message" placeholder="הודעה (אופציונלי)" dir="rtl" style="width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: white; border-radius: 12px; min-height: 90px; font-size: 14px; text-align: right; outline: none; resize: none; box-sizing: border-box;"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'שלח בקשה',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#0d7a5f',
      background: '#1a1a1a',
      color: '#ffffff',
      customClass: {
        popup: 'rounded-3xl',
      },
      preConfirm: async () => {
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
        if (!phone) {
          Swal.showValidationMessage('נא להזין מספר טלפון');
          return;
        }
        const message = (document.getElementById('swal-message') as HTMLTextAreaElement).value;

        // Send meeting request to backend
        try {
          const { fetchWithAuth, config: apiConfig, getHeaders } = await import('@stannel/api-client');
          await fetchWithAuth(`${apiConfig.baseUrl}/supplier/${supplierId}/meeting-request`, {
            method: 'POST',
            headers: getHeaders() as Record<string, string>,
            body: JSON.stringify({ phone, message, supplierName: supplier.companyName }),
          });
        } catch (err) {
          console.error('Meeting request error:', err);
        }

        return { phone, message };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'הבקשה נשלחה!',
          text: 'נציג יצור איתך קשר בהקדם',
          icon: 'success',
          confirmButtonColor: '#0d7a5f',
          background: '#1a1a1a',
          color: '#ffffff',
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/suppliers" className="w-10 h-10 flex items-center justify-center">
            <ArrowRight size={24} className="text-white" />
          </Link>
          <Image
            src="/logo1.png"
            alt="Stannel"
            width={281}
            height={84}
            className="h-20 w-auto object-contain"
          />
          <div className="w-10" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[320px]">
        <ImageWithLoader
          src={heroImage}
          alt={supplier.companyName || 'Supplier'}
          fill
          className="object-cover"
          priority
          unoptimized={heroImage.includes('localhost')}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1a1a1a]" />

        {/* Premium Supplier Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2"
        >
          <span className="px-4 py-1.5 bg-[#2a3a35]/80 backdrop-blur-sm text-white/80 text-xs tracking-wider rounded-full border border-white/10">
            ספק מוביל
          </span>
        </motion.div>
      </div>

      {/* Content Card */}
      <div className="relative -mt-8 mx-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#242424] rounded-3xl overflow-hidden border border-white/5"
        >
          {/* Company Info */}
          <div className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
              {supplier.companyName}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              {supplier.description || 'מוצרים איכותיים המשלבים עיצוב ואלגנטיות.'}
            </p>
          </div>

          {/* Section Header */}
          <div className="px-6 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">מידע</span>
              <span className="text-white/40 text-xs">פרויקטים &gt;</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="px-6 pb-6">
            <div className="space-y-3">
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <span dir="ltr" className="text-sm">{supplier.phone}</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-auto">
                    <Phone size={16} className="text-white/60" />
                  </div>
                </a>
              )}
              {supplier.user?.email && (
                <a href={`mailto:${supplier.user.email}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <span className="text-sm">{supplier.user.email}</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-auto">
                    <Mail size={16} className="text-white/60" />
                  </div>
                </a>
              )}
              {supplier.address && (
                <div className="flex items-center gap-3 text-white/70">
                  <span className="text-sm">{supplier.address}</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-auto">
                    <MapPin size={16} className="text-white/60" />
                  </div>
                </div>
              )}
              {supplier.website && (
                <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <span className="text-sm flex items-center gap-1">
                    אתר אינטרנט
                    <ExternalLink size={12} />
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-auto">
                    <Globe size={16} className="text-white/60" />
                  </div>
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 mb-6"
        >
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            גלריה
            <span className="text-white/40 text-xs">{galleryImages.length} תמונות</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {galleryImages.map((img: string, index: number) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => openLightbox(index)}
                className="relative aspect-square rounded-xl overflow-hidden group bg-white/5"
              >
                <ImageWithLoader
                  src={img}
                  alt={`תמונה ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Products Section (if available) */}
      {supplier.products && supplier.products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-4 mb-6"
        >
          <div className="bg-[#242424] rounded-2xl p-4 border border-white/5">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              מוצרים
              <span className="text-white/40 text-xs">{supplier.products.length} פריטים</span>
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {supplier.products.map((product: any) => (
                <div key={product.id} className="flex-shrink-0 w-28">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                    <ImageWithLoader
                      src={product.imageUrl || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-white text-xs font-medium truncate">{product.name}</p>
                  <p className="text-emerald-400 text-xs">{(product.pointCost || 0).toLocaleString()} נק׳</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="fixed bottom-6 left-4 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl transition-colors flex items-center justify-center shadow-lg shadow-green-900/30"
          >
            <Share2 size={22} />
          </button>

          {/* Schedule Meeting Button */}
          <button
            onClick={handleScheduleMeeting}
            className="flex-1 py-4 bg-[#0d7a5f] hover:bg-[#0a6650] text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
          >
            <Calendar size={20} />
            תיאום פגישה
          </button>
        </motion.div>
      </div>

      {/* Bottom Spacing for Fixed Button */}
      <div className="h-24" />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && galleryImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center z-10"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Navigation */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center z-10 hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={28} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center z-10 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={28} className="text-white" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full max-w-5xl max-h-[80vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithLoader
                src={galleryImages[currentImageIndex]}
                alt={`תמונה ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                unoptimized={galleryImages[currentImageIndex]?.includes('localhost')}
                spinnerSize={40}
              />
            </motion.div>

            {/* Counter */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-2 rounded-full">
                <span className="text-white text-sm">
                  {currentImageIndex + 1} / {galleryImages.length}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
