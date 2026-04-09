'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useSuppliers } from '@/lib/api-hooks';
import {
  Building2,
  Mail,
  Loader2,
  ArrowRight,
  Search,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Supplier {
  id: string;
  companyName: string;
  email?: string;
  phone?: string;
  status?: string;
}

export default function ManageSuppliersPage() {
  const { isReady } = useAdminGuard();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: suppliersData, isLoading } = useSuppliers();

  const suppliers = (suppliersData?.data || []) as Supplier[];

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = !searchTerm ||
      s.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard} />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="text-[#0066CC]" />
                ניהול ספקים
              </h1>
              <p className="text-gray-600 mt-1">צפייה בכל הספקים הרשומים במערכת</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard hover={false}>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם או אימייל..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-10 py-2 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <GlassCard hover={false}>
            <div className="text-center">
              <p className="text-gray-500 text-sm">סה״כ ספקים</p>
              <p className="text-3xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <p className="text-green-600 text-sm">מאושרים</p>
              <p className="text-3xl font-bold text-green-600">
                {suppliers.length}
              </p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-blue-500/10">
            <div className="text-center">
              <p className="text-blue-600 text-sm">תוצאות חיפוש</p>
              <p className="text-3xl font-bold text-blue-600">
                {filteredSuppliers.length}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Suppliers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-blue-500 animate-spin" />
                <p className="text-gray-600 mt-4">טוען ספקים...</p>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">אין ספקים להצגה</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">ספק</th>
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">אימייל</th>
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier, index) => (
                      <motion.tr
                        key={supplier.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building2 size={18} className="text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">{supplier.companyName || 'ספק'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail size={14} />
                              {supplier.email}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            <CheckCircle size={12} />
                            פעיל
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
