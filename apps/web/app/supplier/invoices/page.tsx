'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
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
  PAID: { label: 'שולם', color: 'text-green-400', bg: 'bg-green-500/20' },
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
        iconColor: '#d4af37',
        confirmButtonText: 'סגור',
        confirmButtonColor: '#d4af37',
        background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%)',
        color: '#ffffff',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'לא ניתן לאשר את התשלום',
        icon: 'error',
        confirmButtonColor: '#d4af37',
        background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%)',
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
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="p-6 max-w-6xl mx-auto relative z-10 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
        >
          <Link
            href="/supplier"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-700 mb-4 transition-colors font-medium"
          >
            <ArrowRight size={16} />
            חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-gold-500" />
            חשבוניות
          </h1>
          <p className="text-gray-600 mt-1 font-medium">כל החשבוניות שהוגשו על ידי אדריכלים</p>
        </motion.div>

        {/* Filter & Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-md"
        >
          <div className="flex items-center gap-4">
            <span className="text-gray-700 text-sm font-semibold">
              {invoices.length} חשבוניות
            </span>
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors min-w-[180px] justify-between"
            >
              <span>{STATUS_OPTIONS.find(s => s.value === statusFilter)?.label || 'כל הסטטוסים'}</span>
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg overflow-hidden z-10 shadow-xl"
              >
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-right hover:bg-gray-100 transition-colors flex items-center justify-between ${
                      statusFilter === option.value ? 'bg-gray-100 text-gold-600 font-semibold' : 'text-gray-700'
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
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-gold-500 animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">אין חשבוניות</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-sm font-semibold border-b-2 border-gray-200">
                      <th className="text-right py-3 px-4">אדריכל</th>
                      <th className="text-right py-3 px-4">תאריך</th>
                      <th className="text-right py-3 px-4">SLA</th>
                      <th className="text-right py-3 px-4">סכום</th>
                      <th className="text-right py-3 px-4">סטטוס</th>
                      <th className="text-right py-3 px-4">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
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
                          className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <User size={18} className="text-primary-600" />
                              </div>
                              <div>
                                <p className="text-gray-900 font-semibold">{invoice.architect.user.name}</p>
                                <p className="text-gray-500 text-xs">{invoice.architect.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                              <Calendar size={14} className="text-gray-400" />
                              {new Date(invoice.createdAt).toLocaleDateString('he-IL')}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {invoice.slaDeadline && canConfirm ? (
                              <div className={`flex items-center gap-2 text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                                {isOverdue ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                {new Date(invoice.slaDeadline).toLocaleDateString('he-IL')}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-gray-900 font-bold text-lg">₪{invoice.amount.toLocaleString()}</p>
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
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm ${
                                  isOverdue
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                                }`}
                              >
                                <CreditCard size={16} />
                                אשר תשלום
                              </button>
                            ) : invoice.status === 'PAID' ? (
                              <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                                <CheckCircle size={14} />
                                שולם
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
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
              className="w-full max-w-md bg-primary-900 border border-white/20 rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="text-gold-400" size={24} />
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold-400 transition-colors"
                  dir="ltr"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:bg-white/20 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={!paymentReference.trim() || confirmPayment.isPending}
                  className="flex-1 px-4 py-3 bg-gold-400 rounded-lg text-primary-900 font-medium hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
