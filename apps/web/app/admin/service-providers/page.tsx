'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1556761175-4b46a572b786"
          alt="Business meeting"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/60 via-[#0f2620]/70 to-[#0f2620]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f2620] to-transparent" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-40 relative z-10 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                <Building2 className="text-emerald-400" />
                ניהול ספקים
              </h1>
              <p className="text-white/60 mt-1">צפייה בכל הספקים הרשומים במערכת</p>
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
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם או אימייל..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="text-center">
              <p className="text-white/40 text-sm">סה״כ ספקים</p>
              <p className="text-3xl font-bold text-white">{suppliers.length}</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 bg-green-500/10">
            <div className="text-center">
              <p className="text-green-400/70 text-sm">מאושרים</p>
              <p className="text-3xl font-bold text-green-400">
                {suppliers.length}
              </p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 bg-blue-500/10">
            <div className="text-center">
              <p className="text-blue-400/70 text-sm">תוצאות חיפוש</p>
              <p className="text-3xl font-bold text-blue-400">
                {filteredSuppliers.length}
              </p>
            </div>
          </div>
        </div>

        {/* Suppliers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-emerald-400 animate-spin" />
                <p className="text-white/60 mt-4">טוען ספקים...</p>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/60">אין ספקים להצגה</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 px-4 text-right text-white/60 font-medium">ספק</th>
                      <th className="py-3 px-4 text-right text-white/60 font-medium">אימייל</th>
                      <th className="py-3 px-4 text-right text-white/60 font-medium">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier, index) => (
                      <motion.tr
                        key={supplier.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <Building2 size={18} className="text-emerald-400" />
                            </div>
                            <span className="font-medium text-white">{supplier.companyName || 'ספק'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-white/60">
                              <Mail size={14} />
                              {supplier.email}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
