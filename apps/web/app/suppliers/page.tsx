'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import Link from 'next/link';
import { Search, Building2, MapPin, Phone, Globe, ChevronLeft, Loader2, MessageCircle, Calendar } from 'lucide-react';
import { useSuppliersDirectory } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { meetingsApi } from '@stannel/api-client';
import Swal from 'sweetalert2';

export default function SuppliersDirectoryPage() {
  const { isReady } = useAuthGuard();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useSuppliersDirectory({ search: debouncedSearch }, isReady);
  const suppliers = data?.data || [];

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="pt-8 pb-4 px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#2b241d] mb-2 sm:mb-3">ספקים מובחרים</h1>
          <p className="text-[#8b7c69] text-sm sm:text-lg">גלו את הספקים המובילים בתעשייה</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-24 relative z-10">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#a89b8a]" size={18} />
            <input
              type="text"
              placeholder="חיפוש ספקים..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white border border-[rgba(201,155,74,0.15)] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 pr-10 sm:pr-12 text-sm sm:text-base text-[#2b241d] placeholder:text-[#a89b8a] focus:border-[#c99b4a]/50 focus:outline-none focus:ring-2 focus:ring-[#c99b4a]/20 transition-all text-right"
            />
          </div>
        </motion.div>

        {/* Suppliers Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="text-[#c99b4a] animate-spin" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto text-[#a89b8a]/40 mb-4" />
            <p className="text-[#8b7c69] text-base">לא נמצאו ספקים</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {suppliers.map((supplier, index) => (
              <SupplierCard key={supplier.id} supplier={supplier} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SupplierCard({ supplier, index }: { supplier: any; index: number }) {
  const logoImage = supplier.profileImage || null;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!supplier.phone) return;
    const phone = supplier.phone.replace(/[^0-9+]/g, '');
    const phoneFormatted = phone.startsWith('0') ? `972${phone.slice(1)}` : phone;
    const message = `שלום, אני מתעניין/ת במוצרים שלכם דרך Stannel Club`;
    window.open(`https://wa.me/${phoneFormatted}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleScheduleMeeting = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
          await meetingsApi.create({ supplierId: supplier.id, date, time, subject, notes: notes || undefined });
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

  const handlePhone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `tel:${supplier.phone}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/suppliers/${supplier.id}`}>
        <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl sm:rounded-3xl overflow-hidden hover:border-[#c99b4a]/30 hover:bg-[#faf8f5] transition-all group cursor-pointer p-3 sm:p-5">
          {/* Logo */}
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            {logoImage ? (
              <div className="relative w-full aspect-square max-w-[140px] sm:max-w-[160px]">
                <ImageWithLoader
                  src={logoImage}
                  alt={supplier.companyName}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full aspect-square max-w-[140px] sm:max-w-[160px] rounded-2xl bg-gradient-to-br from-[#c99b4a]/20 to-[#c99b4a]/5 flex items-center justify-center border border-[#c99b4a]/15">
                <span className="text-5xl sm:text-6xl font-bold text-[#c99b4a]">{supplier.companyName?.charAt(0) || 'S'}</span>
              </div>
            )}
          </div>

          {/* Company Name */}
          <h2 className="text-sm sm:text-lg font-bold text-[#2b241d] text-center mb-0.5 sm:mb-1 line-clamp-1">{supplier.companyName}</h2>

          {/* Address */}
          {supplier.address && (
            <p className="text-[#a89b8a] text-[10px] sm:text-xs text-center flex items-center justify-center gap-1 mb-2 sm:mb-3 line-clamp-1">
              <MapPin size={10} className="flex-shrink-0" />
              {supplier.address}
            </p>
          )}

          {/* Action Buttons: WhatsApp + Schedule Meeting */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {supplier.phone && (
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-1 py-2 sm:py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                <MessageCircle size={14} className="sm:w-4 sm:h-4" />
                <span>וואטסאפ</span>
              </button>
            )}
            <button
              onClick={handleScheduleMeeting}
              className="flex-1 flex items-center justify-center gap-1 py-2 sm:py-2.5 bg-[#c99b4a]/10 hover:bg-[#c99b4a]/20 text-[#c99b4a] rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              <Calendar size={14} className="sm:w-4 sm:h-4" />
              <span>קבע פגישה</span>
            </button>
          </div>

          {/* Icons + Arrow */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-[rgba(201,155,74,0.08)]">
            {supplier.phone && (
              <button onClick={handleWhatsApp} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#c99b4a]/10 hover:bg-[#c99b4a]/20 flex items-center justify-center transition-colors">
                <MessageCircle size={12} className="text-[#c99b4a] sm:w-3.5 sm:h-3.5" />
              </button>
            )}
            {supplier.phone && (
              <button onClick={handlePhone} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#c99b4a]/10 hover:bg-[#c99b4a]/20 flex items-center justify-center transition-colors">
                <Phone size={12} className="text-[#c99b4a] sm:w-3.5 sm:h-3.5" />
              </button>
            )}
            {supplier.website && (
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#c99b4a]/10 hover:bg-[#c99b4a]/20 flex items-center justify-center transition-colors"
              >
                <Globe size={12} className="text-[#c99b4a] sm:w-3.5 sm:h-3.5" />
              </a>
            )}
            <div className="mr-auto">
              <ChevronLeft size={16} className="text-[#c99b4a] group-hover:-translate-x-1 transition-transform sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
