'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section */}
      <div className="relative h-52 sm:h-72 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80"
          alt="Suppliers"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0f2620]" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3">ספקים מובחרים</h1>
            <p className="text-white/70 text-sm sm:text-lg">גלו את הספקים המובילים בתעשייה</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 -mt-8 relative z-10">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
            <input
              type="text"
              placeholder="חיפוש ספקים..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 pr-10 sm:pr-12 text-sm sm:text-base text-white placeholder:text-white/50 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-right"
            />
          </div>
        </motion.div>

        {/* Suppliers Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="text-emerald-400 animate-spin" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/60 text-base">לא נמצאו ספקים</p>
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
  const coverImage = supplier.businessImages?.[0] || supplier.profileImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/suppliers/${supplier.id}`}>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-emerald-500/30 hover:bg-white/10 transition-all group cursor-pointer">
          {/* Cover Image - Large */}
          <div className="relative" style={{ aspectRatio: '3/4' }}>
            <ImageWithLoader
              src={coverImage}
              alt={supplier.companyName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized={coverImage.includes('localhost')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Company Name Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-2xl font-bold text-white mb-2">{supplier.companyName}</h2>
              {/* Icons only */}
              <div className="flex items-center gap-3">
                {supplier.phone && (
                  <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Phone size={14} className="text-white" />
                  </div>
                )}
                {supplier.website && (
                  <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Globe size={14} className="text-white" />
                  </div>
                )}
                {supplier.address && (
                  <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <MapPin size={14} className="text-white" />
                  </div>
                )}
                <div className="mr-auto">
                  <ChevronLeft size={18} className="text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
