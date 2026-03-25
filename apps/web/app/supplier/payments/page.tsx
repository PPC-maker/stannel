'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
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
            <CreditCard className="text-gold-500" />
            תשלומים
          </h1>
          <p className="text-gray-600 mt-1 font-medium">היסטוריית העברות שביצעת</p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-200">
            <div className="text-center">
              <p className="text-green-700 text-sm font-semibold mb-1">סה"כ שולם</p>
              <p className="text-3xl font-bold text-green-600">
                ₪{totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200">
            <div className="text-center">
              <p className="text-blue-700 text-sm font-semibold mb-1">מספר תשלומים</p>
              <p className="text-3xl font-bold text-blue-600">
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
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Receipt className="text-gold-500" size={20} />
              היסטוריית תשלומים
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-gold-500 animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-semibold">אין תשלומים</p>
                <p className="text-gray-500 text-sm mt-1">תשלומים יופיעו כאן לאחר ביצוע</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment: Payment, index: number) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold">
                            {payment.architect.user.name}
                          </p>
                          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                            <Calendar size={12} />
                            {payment.paidAt
                              ? new Date(payment.paidAt).toLocaleDateString('he-IL')
                              : new Date(payment.createdAt).toLocaleDateString('he-IL')
                            }
                            {payment.reference && (
                              <span className="text-gray-400">| אסמכתא: {payment.reference}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-green-600">
                          ₪{payment.amount.toLocaleString()}
                        </p>
                        <span className="text-xs text-green-600 font-semibold">שולם</span>
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
