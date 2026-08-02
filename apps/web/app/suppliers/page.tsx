'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import Link from 'next/link';
import { Search, Building2, MapPin, Phone, Globe, Loader2, MessageCircle, Calendar, Bookmark, SlidersHorizontal } from 'lucide-react';
import { useSuppliersDirectory } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { meetingsApi } from '@stannel/api-client';
import Swal from 'sweetalert2';

export default function SuppliersDirectoryPage() {
  const { user, loading: authLoading } = useAuth();
  const isReady = !authLoading;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useSuppliersDirectory({ search: debouncedSearch }, isReady);
  const suppliers = data?.data || [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  if (authLoading) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-[#f7f3f2]">
      {/* Header */}
      <div className="pt-10 pb-5 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#2b241d] tracking-widest uppercase mb-2">
            Suppliers
          </h1>
          <p className="text-[#a89b8a] text-[11px] tracking-[0.2em] uppercase">
            Curated Partners&nbsp;•&nbsp;Exceptional Standards&nbsp;•&nbsp;Timeless Design
          </p>
        </motion.div>
      </div>

      {/* Search + Filter */}
      <div className="max-w-lg mx-auto px-4 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a89b8a]" size={17} />
            <input
              type="text"
              placeholder="Search suppliers, categories..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white border border-[rgba(201,155,74,0.15)] rounded-2xl px-4 py-3.5 pr-11 text-sm text-[#2b241d] placeholder:text-[#c0b5a8] focus:border-[#c99b4a]/40 focus:outline-none focus:ring-2 focus:ring-[#c99b4a]/15 transition-all text-right shadow-sm"
            />
          </div>
          <button className="w-12 h-12 rounded-2xl bg-[#2b241d] flex items-center justify-center flex-shrink-0 shadow-sm active:scale-95 transition-transform">
            <SlidersHorizontal size={18} className="text-white" />
          </button>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="max-w-lg mx-auto px-4 pb-40">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={36} className="text-[#c99b4a] animate-spin" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto text-[#a89b8a]/40 mb-4" />
            <p className="text-[#8b7c69] text-base">לא נמצאו ספקים</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
  const [bookmarked, setBookmarked] = useState(false);

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
          <input id="swal-subject" type="text" placeholder="נושא הפגישה *" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; text-align: right; outline: none; box-sizing: border-box;">
          <label style="display: block; font-size: 13px; color: #8b7c69; text-align: right; margin-bottom: -4px;">תאריך *</label>
          <input id="swal-date" type="date" min="${minDate}" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; outline: none; box-sizing: border-box; direction: rtl;">
          <label style="display: block; font-size: 13px; color: #8b7c69; text-align: right; margin-bottom: -4px;">שעה</label>
          <input id="swal-time" type="time" value="10:00" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; font-size: 16px; outline: none; box-sizing: border-box; direction: rtl;">
          <textarea id="swal-notes" placeholder="הערות (אופציונלי)" style="width: 100%; padding: 14px 16px; background: #ffffff; border: 1px solid rgba(201,155,74,0.15); color: #2b241d; border-radius: 12px; min-height: 80px; font-size: 16px; text-align: right; outline: none; resize: none; box-sizing: border-box;"></textarea>
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
      transition={{ delay: index * 0.08 }}
    >
      <Link href={`/suppliers/${supplier.id}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer border border-[rgba(201,155,74,0.08)]">

          {/* Image area */}
          <div className="relative w-full aspect-[4/3] bg-[#f0ebe4]">
            {logoImage ? (
              <ImageWithLoader
                src={logoImage}
                alt={supplier.companyName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f0ebe4] to-[#e8e0d5]">
                <span className="text-5xl font-bold text-[#c99b4a]/40">{supplier.companyName?.charAt(0) || 'S'}</span>
              </div>
            )}
            {/* Bookmark */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBookmarked(!bookmarked); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            >
              <Bookmark
                size={13}
                className={bookmarked ? 'text-[#c99b4a] fill-[#c99b4a]' : 'text-[#a89b8a]'}
              />
            </button>
          </div>

          {/* Content */}
          <div className="p-3">
            {/* Name */}
            <h2 className="text-sm font-bold text-[#2b241d] text-right mb-0.5 line-clamp-1">
              {supplier.companyName}
            </h2>

            {/* Category + address */}
            <p className="text-[#a89b8a] text-[10px] text-right flex items-center justify-end gap-1 mb-2.5 line-clamp-1">
              {supplier.address && (
                <>
                  <MapPin size={9} className="flex-shrink-0" />
                  {supplier.address}
                </>
              )}
            </p>

            {/* Schedule Meeting Button - solid gold */}
            <button
              onClick={handleScheduleMeeting}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#c99b4a] hover:bg-[#b8893d] active:scale-95 text-white rounded-xl text-[11px] font-semibold transition-all mb-2.5"
            >
              <Calendar size={11} />
              קבע פגישה
            </button>

            {/* Icons row */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-[rgba(201,155,74,0.08)]">
              {supplier.website && (
                <a
                  href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-7 h-7 rounded-full bg-[#f7f3f2] hover:bg-[#c99b4a]/10 flex items-center justify-center transition-colors"
                >
                  <Globe size={12} className="text-[#a89b8a]" />
                </a>
              )}
              {supplier.phone && (
                <button onClick={handlePhone} className="w-7 h-7 rounded-full bg-[#f7f3f2] hover:bg-[#c99b4a]/10 flex items-center justify-center transition-colors">
                  <Phone size={12} className="text-[#a89b8a]" />
                </button>
              )}
              {supplier.phone && (
                <button onClick={handleWhatsApp} className="w-7 h-7 rounded-full bg-[#f7f3f2] hover:bg-[#c99b4a]/10 flex items-center justify-center transition-colors">
                  <MessageCircle size={12} className="text-[#a89b8a]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
