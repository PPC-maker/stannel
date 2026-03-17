'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Gift,
} from 'lucide-react';
import { useWalletBalance, useWalletCard, useWalletTransactions } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Link from 'next/link';

const rankConfig = {
  BRONZE: { label: 'ברונזה', color: 'text-amber-600', bg: 'bg-amber-600/20', emoji: '' },
  SILVER: { label: 'כסף', color: 'text-gray-300', bg: 'bg-gray-300/20', emoji: '' },
  GOLD: { label: 'זהב', color: 'text-gold-400', bg: 'bg-gold-400/20', emoji: '' },
  PLATINUM: { label: 'פלטינה', color: 'text-cyan-400', bg: 'bg-cyan-400/20', emoji: '' },
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
    <div className="relative">
      <PageSlider images={sliderImages.wallet} />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Wallet className="text-gold-400" />
            הארנק שלי
          </h1>
          <p className="text-white/60 mt-1">ניהול נקודות, יתרות והטבות</p>
        </motion.div>

        {/* Main Balance Card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard gold className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">כרטיס דיגיטלי</h2>
                <div className={`px-3 py-1 rounded-full ${rank.bg}`}>
                  <span className={`text-sm font-medium ${rank.color}`}>
                    {rank.emoji} {rank.label}
                  </span>
                </div>
              </div>

              {/* Digital Card Visual */}
              <div className="relative aspect-[1.6/1] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-2xl p-6 overflow-hidden shadow-xl">
                {/* Card Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-20 h-20 border border-white/30 rounded-full" />
                  <div className="absolute top-8 right-8 w-20 h-20 border border-white/20 rounded-full" />
                </div>

                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <Award className="text-gold-400" size={32} />
                    <span className="text-white/60 text-sm">STANNEL</span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      {isLoading ? (
                        <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
                      ) : (
                        <p className="text-2xl font-mono text-white tracking-wider">
                          {card?.cardNumber || '**** **** **** ****'}
                        </p>
                      )}
                      <p className="text-white/60 text-sm mt-2">
                        {isSupplier ? (card as any)?.holderName : user?.name || 'משתמש'}
                      </p>
                      <p className="text-white/40 text-xs">
                        {isSupplier ? 'ספק' : 'אדריכל'}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-white/50 text-xs">נקודות</p>
                      <p className="text-gold-400 text-2xl font-bold">
                        {isLoading ? '...' : (balance?.points || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Award,
                label: 'נקודות זמינות',
                value: isLoading ? '...' : (balance?.points || 0).toLocaleString(),
                color: 'text-gold-400',
                suffix: 'נק׳',
                show: true,
              },
              {
                icon: CreditCard,
                label: 'יתרת מזומן',
                value: isLoading ? '...' : (balance?.cash || 0).toLocaleString(),
                color: 'text-green-400',
                prefix: '₪',
                show: !isSupplier, // Only show for architects
              },
              {
                icon: TrendingUp,
                label: 'סה"כ נצבר',
                value: isLoading ? '...' : (balance?.totalEarned || 0).toLocaleString(),
                color: 'text-blue-400',
                suffix: 'נק׳',
                show: true,
              },
              {
                icon: Gift,
                label: 'מומשו',
                value: isLoading ? '...' : (balance?.totalRedeemed || 0).toLocaleString(),
                color: 'text-purple-400',
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
                <GlassCard className="h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.prefix}
                        {stat.value}
                        {stat.suffix && <span className="text-lg mr-1">{stat.suffix}</span>}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/10`}>
                      <stat.icon size={24} className={stat.color} />
                    </div>
                  </div>
                </GlassCard>
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
          <GlassCard>
            <h2 className="text-lg font-semibold text-white mb-4">פעולות מהירות</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                href={user?.role === 'SUPPLIER' ? '/invoices' : '/invoices/upload'}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowUpRight className="text-green-400" size={24} />
                <span className="text-white/80 text-sm">
                  {user?.role === 'SUPPLIER' ? 'צפייה בחשבונית' : 'העלאת חשבונית'}
                </span>
              </Link>
              <Link
                href="/rewards"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Gift className="text-purple-400" size={24} />
                <span className="text-white/80 text-sm">מימוש הטבות</span>
              </Link>
              <Link
                href="/invoices"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Clock className="text-yellow-400" size={24} />
                <span className="text-white/80 text-sm">היסטוריית חשבוניות</span>
              </Link>
              <Link
                href="/events"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Award className="text-blue-400" size={24} />
                <span className="text-white/80 text-sm">אירועים</span>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Clock size={20} className="text-gold-400" />
                תנועות אחרונות
              </h2>
            </div>

            <div className="space-y-3">
              {transactionsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5 animate-pulse">
                    <div className="w-10 h-10 bg-white/10 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-white/10 rounded mb-2" />
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-white/10 rounded" />
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
                      className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0"
                    >
                      <div className={`p-2 rounded-lg ${isCredit ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                        {isCredit ? (
                          <ArrowUpRight className="text-green-400" size={20} />
                        ) : (
                          <ArrowDownRight className="text-red-400" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{tx.description || (isCredit ? 'זיכוי' : 'חיוב')}</p>
                        <p className="text-white/40 text-sm">
                          {txDate.toLocaleDateString('he-IL')} {txDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(tx.amount || 0).toLocaleString()} {tx.currency === 'ILS' ? '₪' : 'נק׳'}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Wallet size={48} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">אין תנועות להצגה</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
