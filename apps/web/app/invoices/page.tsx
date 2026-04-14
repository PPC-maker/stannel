'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FileText, Upload, Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useInvoices } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useAuth } from '@/lib/auth-context';

const statusConfig = {
  PENDING_ADMIN: { label: 'ממתין לאישור', color: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: Clock },
  CLARIFICATION_NEEDED: { label: 'נדרש הבהרה', color: 'text-purple-400', bg: 'bg-purple-400/20', icon: AlertCircle },
  APPROVED: { label: 'אושר', color: 'text-green-400', bg: 'bg-green-400/20', icon: CheckCircle },
  REJECTED: { label: 'נדחה', color: 'text-red-400', bg: 'bg-red-400/20', icon: XCircle },
  PENDING_SUPPLIER_PAY: { label: 'ממתין לתשלום', color: 'text-blue-400', bg: 'bg-blue-400/20', icon: Clock },
  PAID: { label: 'שולם', color: 'text-green-400', bg: 'bg-green-400/20', icon: CheckCircle },
  OVERDUE: { label: 'באיחור', color: 'text-red-400', bg: 'bg-red-400/20', icon: AlertCircle },
};

export default function InvoicesPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const isArchitect = user?.role === 'ARCHITECT';

  const { data: invoices, isLoading } = useInvoices();
  const invoiceList = invoices || [];

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const filteredInvoices = invoiceList.filter((inv: any) => {
    if (filter !== 'all' && inv.status !== filter) return false;
    const supplierName = inv.supplier?.companyName || '';
    if (search && !supplierName.includes(search)) return false;
    return true;
  });

  const stats = {
    total: invoiceList.length,
    pending: invoiceList.filter((i: any) => i.status === 'PENDING_ADMIN' || i.status === 'PENDING_SUPPLIER_PAY').length,
    approved: invoiceList.filter((i: any) => ['APPROVED', 'PAID'].includes(i.status)).length,
    rejected: invoiceList.filter((i: any) => i.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[40vh]">
        <Image
          src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80"
          alt="Invoices"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">חשבוניות</h1>
              <p className="text-white/60 mt-1">
                {isArchitect ? 'ניהול והעלאת חשבוניות לצבירת נקודות' : 'צפייה בחשבוניות שהועלו'}
              </p>
            </div>
            {isArchitect && (
              <Link
                href="/invoices/upload"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 justify-center transition-colors"
              >
                <Upload size={20} />
                <span>העלאת חשבונית</span>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {[
            { label: 'סה״כ', value: stats.total, color: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
            { label: 'ממתינות', value: stats.pending, color: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
            { label: 'אושרו', value: stats.approved, color: 'text-green-400', borderColor: 'border-green-500/30' },
            { label: 'נדחו', value: stats.rejected, color: 'text-red-400', borderColor: 'border-red-500/30' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white/5 backdrop-blur-md border ${stat.borderColor} rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center`}
            >
              <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-white/60 text-[10px] sm:text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם, ספק או מספר..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/50 focus:border-emerald-500/50 focus:outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {[
                { key: 'all', label: 'כל המחזור' },
                { key: 'PENDING_ADMIN', label: 'ממתינות' },
                { key: 'APPROVED', label: 'אושרו' },
                { key: 'PAID', label: 'שולמו' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`px-3 py-1.5 rounded-xl text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                    filter === btn.key
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-24 bg-white/10 rounded mb-1.5" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-white/10 rounded" />
                </div>
              </div>
            ))
          ) : filteredInvoices.map((invoice: any, i: number) => {
            const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.PENDING_ADMIN;
            const StatusIcon = status.icon;
            const supplierName = invoice.supplier?.companyName || 'ספק';
            const invoiceDate = new Date(invoice.createdAt);
            const isAiVerified = invoice.aiVerified || invoice.aiValidationResult?.isValid;

            return (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link href={`/invoices/${invoice.id}`}>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 hover:bg-white/10 transition-all cursor-pointer">
                    {/* Top row: icon + name + amount */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={20} className="text-white/70 sm:hidden" />
                        <FileText size={24} className="text-white/70 hidden sm:block" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm sm:text-base truncate">{supplierName}</h3>
                        <p className="text-white/50 text-xs sm:text-sm">
                          {invoiceDate.toLocaleDateString('he-IL')} • #{invoice.id.slice(-6)}
                        </p>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <p className="text-white font-bold text-base sm:text-lg">₪{(invoice.amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    {/* Bottom row: status + AI badge */}
                    <div className="flex items-center gap-2 mt-2 mr-13 sm:mr-16">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                        <StatusIcon size={12} className={status.color} />
                        <span className={`text-xs ${status.color}`}>{status.label}</span>
                      </div>
                      {isAiVerified && (
                        <div className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle size={12} />
                          <span>AI מאומת</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {filteredInvoices.length === 0 && !isLoading && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
              <FileText size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/60">לא נמצאו חשבוניות</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
