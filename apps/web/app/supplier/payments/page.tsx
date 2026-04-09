'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSupplierGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useSupplierPaymentHistory } from '@/lib/api-hooks';
import {
  Loader2,
  CreditCard,
  ArrowRight,
  Calendar,
  CheckCircle,
  Receipt,
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: string;
  paidAt?: string;
  createdAt: string;
  reference?: string;
  architect: {
    user: { name: string; email: string };
  };
}

export default function SupplierPaymentsPage() {
  const { isReady } = useSupplierGuard();
  const { data: paymentsData, isLoading } = useSupplierPaymentHistory();

  const payments = paymentsData?.data || [];
  const totalPaid = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section with Image */}
      <div className="relative h-80 overflow-hidden">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2000&q=80"
          alt="Finance"
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
            <CreditCard className="text-emerald-400" />
            תשלומים
          </h1>
          <p className="text-white/60 mt-1 font-medium">היסטוריית העברות שביצעת</p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-6">
            <div className="text-center">
              <p className="text-emerald-400 text-sm font-semibold mb-1">סה"כ שולם</p>
              <p className="text-3xl font-bold text-white">
                ₪{totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="text-center">
              <p className="text-white/60 text-sm font-semibold mb-1">מספר תשלומים</p>
              <p className="text-3xl font-bold text-white">
                {payments.length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Receipt className="text-emerald-400" size={20} />
              היסטוריית תשלומים
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/60 font-semibold">אין תשלומים</p>
                <p className="text-white/40 text-sm mt-1">תשלומים יופיעו כאן לאחר ביצוע</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment: Payment, index: number) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle size={24} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {payment.architect.user.name}
                          </p>
                          <div className="flex items-center gap-2 text-white/50 text-sm mt-1">
                            <Calendar size={12} />
                            {payment.paidAt
                              ? new Date(payment.paidAt).toLocaleDateString('he-IL')
                              : new Date(payment.createdAt).toLocaleDateString('he-IL')
                            }
                            {payment.reference && (
                              <span className="text-white/40">| אסמכתא: {payment.reference}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-emerald-400">
                          ₪{payment.amount.toLocaleString()}
                        </p>
                        <span className="text-xs text-emerald-400 font-semibold">שולם</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
