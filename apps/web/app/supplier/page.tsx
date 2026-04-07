'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useSupplierGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import {
  useSupplierStats,
  useSupplierInvoices,
  useConfirmPayment,
  useUploadPaymentProof,
} from '@/lib/api-hooks';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  Receipt,
  Loader2,
  Clock,
  CheckCircle,
  Building2,
  FileText,
  CreditCard,
  Star,
  Shield,
  ChevronDown,
  User,
  X,
  Upload,
  File,
} from 'lucide-react';

interface Invoice {
  id: string;
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
  { value: 'PENDING_SUPPLIER_PAY', label: 'ממתין לתשלום' },
  { value: 'OVERDUE', label: 'באיחור' },
  { value: 'PAID', label: 'שולם' },
  { value: 'CREDITED', label: 'זוכה' },
];

export default function SupplierDashboardPage() {
  const { isReady, user } = useSupplierGuard();
  const { data: stats, isLoading: statsLoading } = useSupplierStats();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<globalThis.File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: invoicesData, isLoading: invoicesLoading } = useSupplierInvoices(statusFilter || undefined);
  const confirmPayment = useConfirmPayment();
  const uploadPaymentProof = useUploadPaymentProof();

  const invoices = invoicesData?.data || [];

  // Calculate stats
  const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'PAID');
  const pendingInvoices = invoices.filter((inv: Invoice) =>
    inv.status === 'PENDING_SUPPLIER_PAY' || inv.status === 'OVERDUE'
  );
  const totalPaid = paidInvoices.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0);
  const totalPending = pendingInvoices.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0);

  const handleConfirmPayment = async () => {
    if (!selectedInvoice || !paymentReference.trim() || !paymentProofFile) return;

    try {
      setIsUploading(true);

      // First upload the payment proof file
      const uploadResult = await uploadPaymentProof.mutateAsync(paymentProofFile);

      // Then confirm payment with the uploaded file URL
      await confirmPayment.mutateAsync({
        invoiceId: selectedInvoice.id,
        reference: paymentReference.trim(),
        paymentProofUrl: uploadResult.url,
      });

      setIsModalOpen(false);
      setSelectedInvoice(null);
      setPaymentReference('');
      setPaymentProofFile(null);

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
    } finally {
      setIsUploading(false);
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentReference('');
    setPaymentProofFile(null);
    setIsModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
    }
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <PageSlider images={sliderImages.supplier} />
      <div className="p-6 max-w-7xl mx-auto pt-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm"
        >
          <p className="text-gray-700 text-sm mb-2">פורטל ספק</p>
          <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center justify-center gap-3">
            <Building2 className="text-gold-400" />
            {user?.name || 'ספק'}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-gray-700 text-sm">{user?.email}</span>
            <span className="flex items-center gap-1 text-green-500 text-sm">
              <Shield size={14} />
              מאושר
            </span>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Paid Invoices */}
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-400 mb-2" size={28} />
              <p className="text-green-400/70 text-sm">חשבוניות ששולמו</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-green-400" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-green-400">
                    {stats?.paidThisMonth?.count || paidInvoices.length}
                  </p>
                  <p className="text-green-400/50 text-sm">
                    ₪{(stats?.paidThisMonth?.amount || totalPaid).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </GlassCard>

          {/* Pending Invoices */}
          <GlassCard hover={false} className="bg-yellow-500/10">
            <div className="text-center">
              <Clock className="mx-auto text-yellow-400 mb-2" size={28} />
              <p className="text-yellow-400/70 text-sm">חשבוניות ממתינות לתשלום</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-yellow-400" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-yellow-400">
                    {stats?.pendingPayments?.count || pendingInvoices.length}
                  </p>
                  <p className="text-yellow-400/50 text-sm">
                    ₪{(stats?.pendingPayments?.amount || totalPending).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </GlassCard>

          {/* Trust Score */}
          <GlassCard hover={false} className="bg-blue-500/10">
            <div className="text-center">
              <Shield className="mx-auto text-blue-400 mb-2" size={28} />
              <p className="text-blue-400/70 text-sm">ציון אמינות</p>
              <p className="text-3xl font-bold text-blue-400">100</p>
              <p className="text-blue-400/50 text-sm">מתוך 100</p>
            </div>
          </GlassCard>

          {/* Rating */}
          <GlassCard hover={false} className="bg-gold-500/10">
            <div className="text-center">
              <Star className="mx-auto text-gold-400 mb-2" size={28} />
              <p className="text-gold-400/70 text-sm">דירוג</p>
              <p className="text-3xl font-bold text-gold-400">5.0</p>
              <p className="text-gold-400/50 text-sm">0 ביקורות</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Link href="/supplier/profile" className="p-6 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-center group">
            <Building2 className="mx-auto text-gray-600 group-hover:text-gold-400 mb-2 transition-colors" size={32} />
            <span className="text-gray-600 text-sm">פרטי הספק</span>
          </Link>
          <Link href="/supplier/payments" className="p-6 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-center group">
            <CreditCard className="mx-auto text-gray-600 group-hover:text-gold-400 mb-2 transition-colors" size={32} />
            <span className="text-gray-600 text-sm">תשלומים</span>
          </Link>
          <Link href="/supplier/invoices" className="p-6 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-center group">
            <FileText className="mx-auto text-gray-600 group-hover:text-gold-400 mb-2 transition-colors" size={32} />
            <span className="text-gray-600 text-sm">חשבוניות</span>
          </Link>
        </motion.div>

        {/* Invoices Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Receipt className="text-gold-400" size={20} />
                חשבוניות
              </h2>

              {/* Status Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors min-w-[160px] justify-between"
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
                          statusFilter === option.value ? 'bg-gray-100 text-gold-400' : 'text-gray-600'
                        }`}
                      >
                        <span>{option.label}</span>
                        {statusFilter === option.value && <CheckCircle size={14} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {invoicesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-gold-400 animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-700">אין חשבוניות</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {invoices.map((invoice: Invoice, index: number) => {
                  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING_SUPPLIER_PAY;
                  const canConfirm = invoice.status === 'PENDING_SUPPLIER_PAY' || invoice.status === 'OVERDUE';
                  const isOverdue = invoice.status === 'OVERDUE';

                  return (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors ${isOverdue ? 'border-red-500/30' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User size={20} className="text-gray-700" />
                          </div>
                          <div>
                            <p className="text-gray-800 font-medium">
                              {invoice.architect.user.name}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {new Date(invoice.createdAt).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="text-gray-800 font-bold text-lg">
                              ₪{invoice.amount.toLocaleString()}
                            </p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          {canConfirm && (
                            <button
                              onClick={() => openPaymentModal(invoice)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isOverdue
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-gold-400/20 text-gold-400 hover:bg-gold-400/30'
                              }`}
                            >
                              <CreditCard size={16} />
                              אשר תשלום
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </GlassCard>
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
              className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard className="text-gold-400" size={24} />
                  אישור תשלום
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Invoice Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-700">אדריכל:</span>
                  <span className="text-gray-800 font-medium">{selectedInvoice.architect.user.name}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-700">סכום חשבונית:</span>
                  <span className="text-gray-800 font-bold text-lg">₪{selectedInvoice.amount.toLocaleString()}</span>
                </div>
                {selectedInvoice.slaDeadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">תאריך יעד:</span>
                    <span className={selectedInvoice.status === 'OVERDUE' ? 'text-red-400' : 'text-yellow-400'}>
                      {new Date(selectedInvoice.slaDeadline).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Reference Input */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm mb-2">
                  אסמכתא / מספר אישור העברה
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="הכנס מספר אסמכתא..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0066CC] transition-colors"
                  dir="ltr"
                />
              </div>

              {/* Payment Proof Upload */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm mb-2">
                  העלאת מסמך אישור העברה <span className="text-red-400">*</span>
                </label>
                {paymentProofFile ? (
                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="text-green-400" size={24} />
                      <div>
                        <p className="text-gray-800 font-medium text-sm">{paymentProofFile.name}</p>
                        <p className="text-green-400/70 text-xs">
                          {(paymentProofFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentProofFile(null)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X size={18} className="text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0066CC]/50 hover:bg-gray-50 transition-colors">
                    <Upload className="text-gray-600 mb-2" size={32} />
                    <span className="text-gray-700 text-sm">לחץ להעלאת קובץ</span>
                    <span className="text-gray-600 text-xs mt-1">PDF, תמונה או מסמך</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={!paymentReference.trim() || !paymentProofFile || confirmPayment.isPending || isUploading}
                  className="flex-1 px-4 py-3 bg-gold-400 rounded-lg text-primary-900 font-medium hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {confirmPayment.isPending || isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {isUploading ? 'מעלה מסמך...' : 'מאשר...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      אשר תשלום
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
