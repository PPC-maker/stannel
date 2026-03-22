'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
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

  // לא חוסמים - מציגים מיידית
  const stats = {
    total: invoiceList.length,
    pending: invoiceList.filter((i: any) => i.status === 'PENDING_ADMIN' || i.status === 'PENDING_SUPPLIER_PAY').length,
    approved: invoiceList.filter((i: any) => ['APPROVED', 'PAID'].includes(i.status)).length,
    rejected: invoiceList.filter((i: any) => i.status === 'REJECTED').length,
  };

  return (
    <div className="relative bg-[#F8FAFC] min-h-screen">
      <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">חשבוניות</h1>
          <p className="text-gray-600 mt-1">
            {isArchitect ? 'ניהול והעלאת חשבוניות לצבירת נקודות' : 'צפייה בחשבוניות שהועלו'}
          </p>
        </div>
{isArchitect && (
          <Link
            href="/invoices/upload"
            className="btn-gold flex items-center gap-2 justify-center"
          >
            <Upload size={20} />
            <span>העלאת חשבונית</span>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'סה״כ', value: stats.total, color: 'text-[#0066CC]' },
          { label: 'ממתינות', value: stats.pending, color: 'text-yellow-400' },
          { label: 'אושרו', value: stats.approved, color: 'text-green-400' },
          { label: 'נדחו', value: stats.rejected, color: 'text-red-400' },
        ].map((stat, i) => (
          <GlassCard key={i} delay={i * 0.05} className="text-center py-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם ספק..."
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-800 focus:border-[#0066CC] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'all' ? 'bg-gold-400 text-primary-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilter('PENDING_ADMIN')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'PENDING_ADMIN' ? 'bg-yellow-400 text-primary-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ממתינות
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'PAID' ? 'bg-green-400 text-primary-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              שולמו
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Invoices List */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton
          [...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-xl" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-50 rounded" />
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded" />
              <div className="h-8 w-24 bg-gray-100 rounded-full" />
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
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/invoices/${invoice.id}`}>
              <GlassCard hover className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <FileText size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-semibold">{supplierName}</h3>
                    <p className="text-gray-500 text-sm">
                      {invoiceDate.toLocaleDateString('he-IL')} • #{invoice.id.slice(-6)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* AI Status */}
                  {isAiVerified && (
                    <div className="hidden md:flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle size={14} />
                      <span>AI מאומת</span>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="text-left">
                    <p className="text-gray-500 text-xs">סכום</p>
                    <p className="text-gray-800 font-bold text-lg">₪{(invoice.amount || 0).toLocaleString()}</p>
                  </div>

                  {/* Status Badge */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg}`}>
                    <StatusIcon size={14} className={status.color} />
                    <span className={`text-sm ${status.color}`}>{status.label}</span>
                  </div>
                </div>
              </GlassCard>
              </Link>
            </motion.div>
          );
        })}

        {filteredInvoices.length === 0 && (
          <GlassCard className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">לא נמצאו חשבוניות</p>
          </GlassCard>
        )}
      </div>
      </div>
    </div>
  );
}
