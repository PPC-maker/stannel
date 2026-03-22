'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Gift,
  Building2,
} from 'lucide-react';
import { useWalletBalance, useWalletCard, useWalletTransactions } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Link from 'next/link';

const rankConfig = {
  BRONZE: { label: 'ברונזה', color: 'text-amber-600', bg: 'bg-amber-100', emoji: '🥉' },
  SILVER: { label: 'כסף', color: 'text-gray-500', bg: 'bg-gray-100', emoji: '🥈' },
  GOLD: { label: 'זהב', color: 'text-amber-500', bg: 'bg-amber-50', emoji: '🥇' },
  PLATINUM: { label: 'פלטינה', color: 'text-cyan-600', bg: 'bg-cyan-50', emoji: '💎' },
};

export default function WalletPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const { data: balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: card, isLoading: cardLoading } = useWalletCard();
  const { data: transactions, isLoading: transactionsLoading } = useWalletTransactions();

  const rank = rankConfig[(card?.rank as keyof typeof rankConfig) || 'BRONZE'];
  const isLoading = balanceLoading || cardLoading;
  const isSupplier = user?.role === 'SUPPLIER';

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section with Background */}
      <div className="relative">
        {/* Background extends to top of viewport behind navbar */}
        <div className="absolute inset-x-0 top-0 h-80">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
            alt="Modern Architecture"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0066CC]/80 via-[#0066CC]/60 to-[#F8FAFC]" />
        </div>

        <div className="relative z-10 pt-20 pb-6 px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold text-white drop-shadow-lg flex items-center justify-center gap-3">
              <Wallet className="text-white" />
              הארנק שלי
            </h1>
            <p className="text-white/80 mt-1">ניהול נקודות, יתרות והטבות</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 px-6 pb-8 max-w-7xl mx-auto -mt-8">
        {/* Main Balance Card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1E293B]">כרטיס דיגיטלי</h2>
                <div className={`px-3 py-1 rounded-full ${rank.bg}`}>
                  <span className={`text-sm font-semibold ${rank.color}`}>
                    {rank.emoji} {rank.label}
                  </span>
                </div>
              </div>

              {/* Digital Card Visual - El Al Style */}
              <div className="relative aspect-[1.6/1] bg-gradient-to-br from-[#0066CC] via-[#0055AA] to-[#003377] rounded-2xl p-5 overflow-hidden shadow-xl">
                {/* Card Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
                </div>

                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <span className="text-white/80 text-sm font-semibold">STANNEL CLUB</span>
                  </div>

                  <div>
                    {isLoading ? (
                      <div className="h-6 w-40 bg-white/20 rounded animate-pulse mb-3" />
                    ) : (
                      <p className="text-lg font-mono text-white tracking-wider mb-3">
                        {card?.cardNumber
                          ? `•••• •••• •••• ${card.cardNumber.slice(-4).toUpperCase()}`
                          : '**** **** **** ****'}
                      </p>
                    )}

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/60 text-xs">שם</p>
                        <p className="text-white font-semibold">
                          {isSupplier ? (card as any)?.holderName : user?.name || 'משתמש'}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-white/60 text-xs">נקודות</p>
                        <p className="text-white text-2xl font-bold">
                          {isLoading ? '...' : (balance?.points || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Award,
                label: 'נקודות זמינות',
                value: isLoading ? '...' : (balance?.points || 0).toLocaleString(),
                color: 'text-[#0066CC]',
                bgColor: 'bg-blue-50',
                suffix: 'נק׳',
                show: true,
              },
              {
                icon: CreditCard,
                label: 'יתרת מזומן',
                value: isLoading ? '...' : (balance?.cash || 0).toLocaleString(),
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                prefix: '₪',
                show: !isSupplier,
              },
              {
                icon: TrendingUp,
                label: 'סה"כ נצבר',
                value: isLoading ? '...' : (balance?.totalEarned || 0).toLocaleString(),
                color: 'text-purple-600',
                bgColor: 'bg-purple-50',
                suffix: 'נק׳',
                show: true,
              },
              {
                icon: Gift,
                label: 'מומשו',
                value: isLoading ? '...' : (balance?.totalRedeemed || 0).toLocaleString(),
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                suffix: 'נק׳',
                show: true,
              },
            ].filter(stat => stat.show).map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="bg-white rounded-2xl p-5 shadow-lg h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm mb-1">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.prefix}
                        {stat.value}
                        {stat.suffix && <span className="text-lg mr-1">{stat.suffix}</span>}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon size={24} className={stat.color} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4">פעולות מהירות</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                href={user?.role === 'SUPPLIER' ? '/invoices' : '/invoices/upload'}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
              >
                <ArrowUpRight className="text-green-600" size={24} />
                <span className="text-[#1E293B] text-sm font-medium">
                  {user?.role === 'SUPPLIER' ? 'צפייה בחשבונית' : 'העלאת חשבונית'}
                </span>
              </Link>
              <Link
                href="/rewards"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Gift className="text-purple-600" size={24} />
                <span className="text-[#1E293B] text-sm font-medium">מימוש הטבות</span>
              </Link>
              <Link
                href="/invoices"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <Clock className="text-amber-600" size={24} />
                <span className="text-[#1E293B] text-sm font-medium">היסטוריית חשבוניות</span>
              </Link>
              <Link
                href="/events"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Award className="text-[#0066CC]" size={24} />
                <span className="text-[#1E293B] text-sm font-medium">אירועים</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
                <Clock size={20} className="text-[#0066CC]" />
                תנועות אחרונות
              </h2>
            </div>

            <div className="space-y-3">
              {transactionsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 animate-pulse">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-gray-100 rounded mb-2" />
                      <div className="h-3 w-24 bg-gray-50 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-gray-100 rounded" />
                  </div>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 10).map((tx: any, index: number) => {
                  const isCredit = tx.type === 'CREDIT';
                  const txDate = new Date(tx.createdAt);

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className={`p-3 rounded-xl ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                        {isCredit ? (
                          <ArrowUpRight className="text-green-600" size={20} />
                        ) : (
                          <ArrowDownRight className="text-red-500" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[#1E293B] font-medium">{tx.description || (isCredit ? 'זיכוי' : 'חיוב')}</p>
                        <p className="text-[#94A3B8] text-sm">
                          {txDate.toLocaleDateString('he-IL')} {txDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(tx.amount || 0).toLocaleString()} {tx.currency === 'ILS' ? '₪' : 'נק׳'}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Wallet size={32} className="text-gray-400" />
                  </div>
                  <p className="text-[#64748B]">אין תנועות להצגה</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
