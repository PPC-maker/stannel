'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSupplierGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useSupplierInvoices, useConfirmPayment } from '@/lib/api-hooks';
import Swal from 'sweetalert2';
import {
  Receipt,
  Loader2,
  ChevronDown,
  CheckCircle,
  User,
  ArrowRight,
  FileText,
  Calendar,
  CreditCard,
  X,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber?: string;
  amount: number;
  status: string;
  slaDeadline?: string;
  createdAt: string;
  paidAt?: string;
  architect: {
    user: { name: string; email: string };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_ADMIN: { label: 'ממתין לאישור', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  PENDING_SUPPLIER_PAY: { label: 'ממתין לתשלום', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  OVERDUE: { label: 'באיחור', color: 'text-red-400', bg: 'bg-red-500/20' },
  PAID: { label: 'שולם', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  CREDITED: { label: 'זוכה', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  REJECTED: { label: 'נדחה', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'PENDING_ADMIN', label: 'ממתין לאישור' },
  { value: 'PENDING_SUPPLIER_PAY', label: 'ממתין לתשלום' },
  { value: 'OVERDUE', label: 'באיחור' },
  { value: 'PAID', label: 'שולם' },
  { value: 'CREDITED', label: 'זוכה' },
];

export default function SupplierInvoicesPage() {
  const { isReady } = useSupplierGuard();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: invoicesData, isLoading } = useSupplierInvoices(statusFilter || undefined);
  const invoices = invoicesData?.data || [];
  const confirmPayment = useConfirmPayment();

  const handleConfirmPayment = async () => {
    if (!selectedInvoice || !paymentReference.trim()) return;

    try {
      await confirmPayment.mutateAsync({
        invoiceId: selectedInvoice.id,
        reference: paymentReference.trim(),
      });

      setIsModalOpen(false);
      setSelectedInvoice(null);
      setPaymentReference('');

      await Swal.fire({
        title: 'התשלום אושר בהצלחה!',
        html: '<p style="color: rgba(255,255,255,0.7);">הנקודות זוכו לארנק האדריכל</p>',
        icon: 'success',
        iconColor: '#10b981',
        confirmButtonText: 'סגור',
        confirmButtonColor: '#10b981',
        background: '#0a1f18',
        color: '#ffffff',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'לא ניתן לאשר את התשלום',
        icon: 'error',
        confirmButtonColor: '#10b981',
        background: '#0a1f18',
        color: '#ffffff',
      });
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentReference('');
    setIsModalOpen(true);
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section with Image */}
      <div className="relative h-80 overflow-hidden">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=2000&q=80"
          alt="Documents"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay with Fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/60 via-[#0f2620]/70 to-[#0f2620]" />
        {/* Emerald Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto -mt-48 relative z-10 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/supplier"
            className="inline-flex items-center gap-2 text-white/60 hover:text-emerald-400 mb-4 transition-colors font-medium"
          >
            <ArrowRight size={16} />
            חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <FileText className="text-emerald-400" />
            חשבוניות
          </h1>
          <p className="text-white/60 mt-1 font-medium">כל החשבוניות שהוגשו על ידי אדריכלים</p>
        </motion.div>

        {/* Filter & Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm font-semibold">
              {invoices.length} חשבוניות
            </span>
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition-colors min-w-[180px] justify-between"
            >
              <span>{STATUS_OPTIONS.find(s => s.value === statusFilter)?.label || 'כל הסטטוסים'}</span>
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full right-0 mt-1 w-full bg-[#0a1f18] border border-white/20 rounded-lg overflow-hidden z-10 shadow-xl"
              >
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-right hover:bg-white/10 transition-colors flex items-center justify-between ${
                      statusFilter === option.value ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-white/80'
                    }`}
                  >
                    <span>{option.label}</span>
                    {statusFilter === option.value && <CheckCircle size={14} />}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Invoices List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/60 font-medium">אין חשבוניות</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-white/60 text-sm font-semibold border-b border-white/10">
                      <th className="text-right py-3 px-4">אדריכל</th>
                      <th className="text-right py-3 px-4">תאריך</th>
                      <th className="text-right py-3 px-4">SLA</th>
                      <th className="text-right py-3 px-4">סכום</th>
                      <th className="text-right py-3 px-4">סטטוס</th>
                      <th className="text-right py-3 px-4">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((invoice: Invoice, index: number) => {
                      const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING_SUPPLIER_PAY;
                      const canConfirm = invoice.status === 'PENDING_SUPPLIER_PAY' || invoice.status === 'OVERDUE';
                      const isOverdue = invoice.status === 'OVERDUE';

                      return (
                        <motion.tr
                          key={invoice.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`hover:bg-white/5 transition-colors ${isOverdue ? 'bg-red-500/10' : ''}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <User size={18} className="text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-white font-semibold">{invoice.architect.user.name}</p>
                                <p className="text-white/40 text-xs">{invoice.architect.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-white/70 font-medium">
                              <Calendar size={14} className="text-white/40" />
                              {new Date(invoice.createdAt).toLocaleDateString('he-IL')}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {invoice.slaDeadline && canConfirm ? (
                              <div className={`flex items-center gap-2 text-sm font-semibold ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                                {isOverdue ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                {new Date(invoice.slaDeadline).toLocaleDateString('he-IL')}
                              </div>
                            ) : (
                              <span className="text-white/30">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-white font-bold text-lg">₪{invoice.amount.toLocaleString()}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {canConfirm ? (
                              <button
                                onClick={() => openPaymentModal(invoice)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                  isOverdue
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                                }`}
                              >
                                <CreditCard size={16} />
                                אשר תשלום
                              </button>
                            ) : invoice.status === 'PAID' ? (
                              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                                <CheckCircle size={14} />
                                שולם
                              </span>
                            ) : (
                              <span className="text-white/30 text-sm">-</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0a1f18] border border-white/20 rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="text-emerald-400" size={24} />
                  אישור תשלום
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/50" />
                </button>
              </div>

              {/* Invoice Details */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/50">אדריכל:</span>
                  <span className="text-white font-medium">{selectedInvoice.architect.user.name}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/50">סכום חשבונית:</span>
                  <span className="text-white font-bold text-lg">₪{selectedInvoice.amount.toLocaleString()}</span>
                </div>
                {selectedInvoice.slaDeadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/50">תאריך יעד:</span>
                    <span className={selectedInvoice.status === 'OVERDUE' ? 'text-red-400' : 'text-yellow-400'}>
                      {new Date(selectedInvoice.slaDeadline).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Reference Input */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm mb-2">
                  אסמכתא / מספר אישור העברה
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="הכנס מספר אסמכתא..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                  dir="ltr"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white/70 hover:bg-white/20 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={!paymentReference.trim() || confirmPayment.isPending}
                  className="flex-1 px-4 py-3 bg-emerald-500 rounded-xl text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {confirmPayment.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  אשר תשלום
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
