'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupplierGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import {
  useSupplierStats,
  useSupplierInvoices,
  useConfirmPayment,
  useUploadPaymentProof,
} from '@/lib/api-hooks';
import Link from 'next/link';
import Image from 'next/image';
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
  TrendingUp,
  ArrowUpRight,
  Sparkles,
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
  PAID: { label: 'שולם', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
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
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section with Image */}
      <div className="relative h-[420px] md:h-[480px] overflow-hidden">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
          alt="Modern Architecture"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/70 via-[#0f2620]/80 to-[#0f2620]" />
        {/* Emerald Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.15),transparent_50%)]" />

        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
              initial={{
                x: Math.random() * 100 + '%',
                y: '100%',
                opacity: 0
              }}
              animate={{
                y: '-20%',
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.8,
                ease: 'linear'
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full mb-5"
            >
              <Sparkles size={16} className="text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">פורטל ספקים</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              שלום, <span className="text-emerald-400">{user?.name || 'ספק'}</span>
            </h1>

            <p className="text-white/60 text-lg mb-8">{user?.email}</p>

            <div className="flex items-center justify-center gap-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full"
              >
                <Shield size={16} className="text-emerald-400" />
                <span className="text-white text-sm">ספק מאושר</span>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full"
              >
                <Star size={16} className="text-amber-400" />
                <span className="text-white text-sm">דירוג 5.0</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8 relative z-10 pb-12">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Paid Invoices */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="text-emerald-400" size={22} />
                </div>
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <p className="text-white/60 text-sm mb-1">חשבוניות ששולמו</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-white">
                    {stats?.paidThisMonth?.count || paidInvoices.length}
                  </p>
                  <p className="text-emerald-400 text-sm font-medium">
                    ₪{(stats?.paidThisMonth?.amount || totalPaid).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </motion.div>

          {/* Pending Invoices */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="text-amber-400" size={22} />
                </div>
                <span className="text-xs text-amber-400 font-medium">ממתין</span>
              </div>
              <p className="text-white/60 text-sm mb-1">ממתינות לתשלום</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-white">
                    {stats?.pendingPayments?.count || pendingInvoices.length}
                  </p>
                  <p className="text-amber-400 text-sm font-medium">
                    ₪{(stats?.pendingPayments?.amount || totalPending).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </motion.div>

          {/* Trust Score */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-blue-500/20 to-indigo-600/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Shield className="text-blue-400" size={22} />
                </div>
                <span className="text-xs text-blue-400 font-medium">מקסימלי</span>
              </div>
              <p className="text-white/60 text-sm mb-1">ציון אמינות</p>
              <p className="text-3xl font-bold text-white">100</p>
              <p className="text-blue-400 text-sm font-medium">מתוך 100</p>
            </div>
          </motion.div>

          {/* Rating */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-600/10 backdrop-blur-md border border-purple-500/30 rounded-2xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Star className="text-purple-400" size={22} />
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-white/60 text-sm mb-1">דירוג ממוצע</p>
              <p className="text-3xl font-bold text-white">5.0</p>
              <p className="text-purple-400 text-sm font-medium">0 ביקורות</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Link href="/supplier/profile" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 hover:border-emerald-500/30 transition-all text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all" />
              <div className="relative">
                <div className="w-14 h-14 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                  <Building2 className="text-white/60 group-hover:text-emerald-400 transition-colors" size={28} />
                </div>
                <span className="text-white/70 group-hover:text-white text-sm font-medium transition-colors">פרטי הספק</span>
                <ArrowUpRight size={14} className="inline-block mr-1 text-transparent group-hover:text-emerald-400 transition-colors" />
              </div>
            </motion.div>
          </Link>
          <Link href="/supplier/payments" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 hover:border-emerald-500/30 transition-all text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all" />
              <div className="relative">
                <div className="w-14 h-14 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                  <CreditCard className="text-white/60 group-hover:text-emerald-400 transition-colors" size={28} />
                </div>
                <span className="text-white/70 group-hover:text-white text-sm font-medium transition-colors">תשלומים</span>
                <ArrowUpRight size={14} className="inline-block mr-1 text-transparent group-hover:text-emerald-400 transition-colors" />
              </div>
            </motion.div>
          </Link>
          <Link href="/supplier/invoices" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 hover:border-emerald-500/30 transition-all text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all" />
              <div className="relative">
                <div className="w-14 h-14 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                  <FileText className="text-white/60 group-hover:text-emerald-400 transition-colors" size={28} />
                </div>
                <span className="text-white/70 group-hover:text-white text-sm font-medium transition-colors">חשבוניות</span>
                <ArrowUpRight size={14} className="inline-block mr-1 text-transparent group-hover:text-emerald-400 transition-colors" />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Invoices Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Receipt className="text-emerald-400" size={20} />
                חשבוניות אחרונות
              </h2>

              {/* Status Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors min-w-[160px] justify-between"
                >
                  <span>{STATUS_OPTIONS.find(s => s.value === statusFilter)?.label || 'כל הסטטוסים'}</span>
                  <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full right-0 mt-1 w-full bg-[#0a1f18] border border-white/20 rounded-xl overflow-hidden z-10 shadow-xl"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-right hover:bg-white/10 transition-colors flex items-center justify-between ${
                          statusFilter === option.value ? 'bg-white/10 text-emerald-400' : 'text-white/70'
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
                <Loader2 className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Receipt className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-white/50 text-lg">אין חשבוניות</p>
                <p className="text-white/30 text-sm mt-1">חשבוניות חדשות יופיעו כאן</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
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
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all ${isOverdue ? 'border-red-500/30 bg-red-500/5' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <User size={22} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {invoice.architect.user.name}
                            </p>
                            <p className="text-white/50 text-sm">
                              {new Date(invoice.createdAt).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="text-white font-bold text-lg">
                              ₪{invoice.amount.toLocaleString()}
                            </p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          {canConfirm && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openPaymentModal(invoice)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                isOverdue
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                              }`}
                            >
                              <CreditCard size={16} />
                              אשר תשלום
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
              className="w-full max-w-md bg-gradient-to-br from-[#0a1f18] to-[#0f2620] border border-white/10 rounded-2xl p-6 shadow-2xl"
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
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              {/* Invoice Details */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/60">אדריכל:</span>
                  <span className="text-white font-medium">{selectedInvoice.architect.user.name}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/60">סכום חשבונית:</span>
                  <span className="text-white font-bold text-lg">₪{selectedInvoice.amount.toLocaleString()}</span>
                </div>
                {selectedInvoice.slaDeadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">תאריך יעד:</span>
                    <span className={selectedInvoice.status === 'OVERDUE' ? 'text-red-400' : 'text-yellow-400'}>
                      {new Date(selectedInvoice.slaDeadline).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Reference Input */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">
                  אסמכתא / מספר אישור העברה
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="הכנס מספר אסמכתא..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 focus:bg-white/15 transition-colors"
                  dir="ltr"
                />
              </div>

              {/* Payment Proof Upload */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm mb-2">
                  העלאת מסמך אישור העברה <span className="text-red-400">*</span>
                </label>
                {paymentProofFile ? (
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <File className="text-emerald-400" size={24} />
                      <div>
                        <p className="text-white font-medium text-sm">{paymentProofFile.name}</p>
                        <p className="text-emerald-400/70 text-xs">
                          {(paymentProofFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentProofFile(null)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X size={18} className="text-white/60" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-colors">
                    <Upload className="text-white/40 mb-2" size={32} />
                    <span className="text-white/60 text-sm">לחץ להעלאת קובץ</span>
                    <span className="text-white/40 text-xs mt-1">PDF, תמונה או מסמך</span>
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
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
                >
                  ביטול
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmPayment}
                  disabled={!paymentReference.trim() || !paymentProofFile || confirmPayment.isPending || isUploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-medium hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
