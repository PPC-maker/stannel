'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import Link from 'next/link';
import { Search, Building2, MapPin, Phone, Globe, ChevronLeft, Loader2 } from 'lucide-react';
import { useSuppliersDirectory } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/suppliers/${supplier.id}`}>
        <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl sm:rounded-3xl overflow-hidden hover:border-[#c99b4a]/30 hover:bg-[#faf8f5] transition-all group cursor-pointer p-5">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            {logoImage ? (
              <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                <ImageWithLoader
                  src={logoImage}
                  alt={supplier.companyName}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-[#c99b4a]/20 to-[#c99b4a]/5 flex items-center justify-center border border-[#c99b4a]/15">
                <span className="text-5xl font-bold text-[#c99b4a]">{supplier.companyName?.charAt(0) || 'S'}</span>
              </div>
            )}
          </div>

          {/* Company Name */}
          <h2 className="text-lg font-bold text-[#2b241d] text-center mb-1">{supplier.companyName}</h2>

          {/* Address */}
          {supplier.address && (
            <p className="text-[#a89b8a] text-xs text-center flex items-center justify-center gap-1 mb-3">
              <MapPin size={12} />
              {supplier.address}
            </p>
          )}

          {/* Icons + Arrow */}
          <div className="flex items-center justify-center gap-3 pt-3 border-t border-[rgba(201,155,74,0.08)]">
            {supplier.phone && (
              <div className="w-8 h-8 rounded-full bg-[#c99b4a]/10 flex items-center justify-center">
                <Phone size={14} className="text-[#c99b4a]" />
              </div>
            )}
            {supplier.website && (
              <div className="w-8 h-8 rounded-full bg-[#c99b4a]/10 flex items-center justify-center">
                <Globe size={14} className="text-[#c99b4a]" />
              </div>
            )}
            <div className="mr-auto">
              <ChevronLeft size={18} className="text-[#c99b4a] group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
