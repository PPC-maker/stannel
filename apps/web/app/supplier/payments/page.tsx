'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useSupplierGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useSupplierPaymentHistory } from '@/lib/api-hooks';
import {
  Loader2,
  CreditCard,
  User,
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
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="p-6 max-w-6xl mx-auto relative z-10 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/supplier"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight size={16} />
            חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <CreditCard className="text-gold-400" />
            תשלומים
          </h1>
          <p className="text-white/60 mt-1">היסטוריית העברות שביצעת</p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <p className="text-green-400/70 text-sm mb-1">סה"כ שולם</p>
              <p className="text-3xl font-bold text-green-400">
                ₪{totalPaid.toLocaleString()}
              </p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-blue-500/10">
            <div className="text-center">
              <p className="text-blue-400/70 text-sm mb-1">מספר תשלומים</p>
              <p className="text-3xl font-bold text-blue-400">
                {payments.length}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Payments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Receipt className="text-gold-400" size={20} />
              היסטוריית תשלומים
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-gold-400 animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">אין תשלומים</p>
                <p className="text-white/30 text-sm mt-1">תשלומים יופיעו כאן לאחר ביצוע</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment: Payment, index: number) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle size={24} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {payment.architect.user.name}
                          </p>
                          <div className="flex items-center gap-2 text-white/40 text-sm mt-1">
                            <Calendar size={12} />
                            {payment.paidAt
                              ? new Date(payment.paidAt).toLocaleDateString('he-IL')
                              : new Date(payment.createdAt).toLocaleDateString('he-IL')
                            }
                            {payment.reference && (
                              <span className="text-white/30">| אסמכתא: {payment.reference}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-green-400">
                          ₪{payment.amount.toLocaleString()}
                        </p>
                        <span className="text-xs text-green-400/70">שולם</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
