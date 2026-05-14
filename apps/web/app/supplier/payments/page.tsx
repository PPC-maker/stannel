'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
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
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pt-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/supplier"
            className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#c99b4a] mb-4 transition-colors font-medium"
          >
            <ArrowRight size={16} />
            חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-display font-bold text-[#2b241d] flex items-center gap-3">
            <CreditCard className="text-[#c99b4a]" />
            תשלומים
          </h1>
          <p className="text-[#8b7c69] mt-1 font-medium">היסטוריית העברות שביצעת</p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-[#c99b4a]/10 to-[#c99b4a]/5 border border-[rgba(201,155,74,0.15)] rounded-2xl p-6">
            <div className="text-center">
              <p className="text-[#c99b4a] text-sm font-semibold mb-1">סה"כ שולם</p>
              <p className="text-3xl font-bold text-[#2b241d]">
                ₪{totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            <div className="text-center">
              <p className="text-[#8b7c69] text-sm font-semibold mb-1">מספר תשלומים</p>
              <p className="text-3xl font-bold text-[#2b241d]">
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
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-[#2b241d] mb-6 flex items-center gap-2">
              <Receipt className="text-[#c99b4a]" size={20} />
              היסטוריית תשלומים
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto text-[#c99b4a] animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto text-[#a89b8a]/40 mb-4" />
                <p className="text-[#8b7c69] font-semibold">אין תשלומים</p>
                <p className="text-[#a89b8a] text-sm mt-1">תשלומים יופיעו כאן לאחר ביצוע</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment: Payment, index: number) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 bg-white border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f7f3f2] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#c99b4a]/10 flex items-center justify-center">
                          <CheckCircle size={24} className="text-[#c99b4a]" />
                        </div>
                        <div>
                          <p className="text-[#2b241d] font-semibold">
                            {payment.architect.user.name}
                          </p>
                          <div className="flex items-center gap-2 text-[#a89b8a] text-sm mt-1">
                            <Calendar size={12} />
                            {payment.paidAt
                              ? new Date(payment.paidAt).toLocaleDateString('he-IL')
                              : new Date(payment.createdAt).toLocaleDateString('he-IL')
                            }
                            {payment.reference && (
                              <span className="text-[#a89b8a]">| אסמכתא: {payment.reference}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-[#c99b4a]">
                          ₪{payment.amount.toLocaleString()}
                        </p>
                        <span className="text-xs text-[#c99b4a] font-semibold">שולם</span>
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
