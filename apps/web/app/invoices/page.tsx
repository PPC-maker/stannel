'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import { FileText, Upload, Filter, Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Mock data
const mockInvoices = [
  { id: '1', supplier: 'אבני ירושלים בע״מ', amount: 15000, status: 'PENDING_ADMIN', date: new Date(), aiStatus: 'MATCH' },
  { id: '2', supplier: 'קרמיקה מודרנית', amount: 8500, status: 'APPROVED', date: new Date(Date.now() - 86400000), aiStatus: 'MATCH' },
  { id: '3', supplier: 'עץ ואבן', amount: 22000, status: 'PAID', date: new Date(Date.now() - 172800000), aiStatus: 'MATCH' },
  { id: '4', supplier: 'זכוכית בע״מ', amount: 5200, status: 'REJECTED', date: new Date(Date.now() - 259200000), aiStatus: 'MISMATCH' },
];

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
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredInvoices = mockInvoices.filter(inv => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (search && !inv.supplier.includes(search)) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">חשבוניות</h1>
          <p className="text-white/60 mt-1">ניהול והעלאת חשבוניות לצבירת נקודות</p>
        </div>
        <Link
          href="/invoices/upload"
          className="btn-gold flex items-center gap-2 justify-center"
        >
          <Upload size={20} />
          <span>העלאת חשבונית</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'סה״כ', value: mockInvoices.length, color: 'text-white' },
          { label: 'ממתינות', value: mockInvoices.filter(i => i.status === 'PENDING_ADMIN').length, color: 'text-yellow-400' },
          { label: 'אושרו', value: mockInvoices.filter(i => ['APPROVED', 'PAID'].includes(i.status)).length, color: 'text-green-400' },
          { label: 'נדחו', value: mockInvoices.filter(i => i.status === 'REJECTED').length, color: 'text-red-400' },
        ].map((stat, i) => (
          <GlassCard key={i} delay={i * 0.05} className="text-center py-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-white/50 text-sm">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם ספק..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white focus:border-gold-400 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'all' ? 'bg-gold-400 text-primary-900' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilter('PENDING_ADMIN')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'PENDING_ADMIN' ? 'bg-yellow-400 text-primary-900' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              ממתינות
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'PAID' ? 'bg-green-400 text-primary-900' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              שולמו
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.map((invoice, i) => {
          const status = statusConfig[invoice.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard hover className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <FileText size={24} className="text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{invoice.supplier}</h3>
                    <p className="text-white/50 text-sm">
                      {invoice.date.toLocaleDateString('he-IL')} • #{invoice.id.slice(-6)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* AI Status */}
                  {invoice.aiStatus === 'MATCH' && (
                    <div className="hidden md:flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle size={14} />
                      <span>AI מאומת</span>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="text-left">
                    <p className="text-white/50 text-xs">סכום</p>
                    <p className="text-white font-bold text-lg">₪{invoice.amount.toLocaleString()}</p>
                  </div>

                  {/* Status Badge */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg}`}>
                    <StatusIcon size={14} className={status.color} />
                    <span className={`text-sm ${status.color}`}>{status.label}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}

        {filteredInvoices.length === 0 && (
          <GlassCard className="text-center py-12">
            <FileText size={48} className="mx-auto text-white/30 mb-4" />
            <p className="text-white/60">לא נמצאו חשבוניות</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
